import {useMemo, useState} from 'react';
import type {Entity, Snapshot} from '../../lib/engi/types';
import {
  getDeckEntities,
  getDeckTypes,
  filterDeckEntities,
  getEntityMasterySummary,
  UNTAGGED_TAG_ID,
} from '../../lib/engi/knowledge/decks';
import {indexes} from '../../lib/engi/indexes';
import {entityTypes} from '../../lib/engi/knowledge/properties';
import {KnowledgeImage} from './KnowledgeImage';
import {pluralObjects} from './DeckCard';
import {
  archiveTag,
  attachEntityTag,
  detachEntityTag,
  saveTag,
} from '../../services/knowledge-service';
import './decks.css';

export type DeckDetailViewProps = {
  deckId: string;
  snapshot: Snapshot;
  onBack: () => void;
  onStudy: (tagId: string) => void;
  onSelectEntity: (entity: Entity) => void;
  onCreateEntity: (tagId?: string) => void;
  onReload: () => Promise<void>;
  onSelectDeck?: (deckId: string) => void;
};

export function DeckDetailView({
  deckId,
  snapshot,
  onBack,
  onStudy,
  onSelectEntity,
  onCreateEntity,
  onReload,
  onSelectDeck,
}: DeckDetailViewProps) {
  const isUntagged = deckId === UNTAGGED_TAG_ID;
  const tag = isUntagged ? undefined : snapshot.bundle.tags.find(t => t.id === deckId);
  const deckTitle = isUntagged ? 'Неразобранное' : tag?.name ?? 'Колода';
  const parentTag = tag?.parentId ? snapshot.bundle.tags.find(t => t.id === tag.parentId) : undefined;

  const [query, setQuery] = useState('');
  const [subtagFilter, setSubtagFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState<'name' | 'type'>('name');
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState(tag?.name ?? '');
  const [editParent, setEditParent] = useState(tag?.parentId ?? '');
  const [showAddExisting, setShowAddExisting] = useState(false);
  const [existingQuery, setExistingQuery] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());

  const entities = useMemo(() => getDeckEntities(snapshot.bundle, deckId), [snapshot.bundle, deckId]);
  const types = useMemo(() => getDeckTypes(entities, snapshot.bundle), [entities, snapshot.bundle]);
  const ix = useMemo(() => indexes(snapshot.bundle), [snapshot.bundle]);

  const childTags = useMemo(
    () => snapshot.bundle.tags.filter(t => !t.archived && t.parentId === deckId),
    [snapshot.bundle.tags, deckId]
  );

  const filteredEntities = useMemo(() => {
    let list = entities;
    if (subtagFilter !== 'all') {
      list = list.filter(e => ix.tagsByEntity.get(e.id)?.has(subtagFilter));
    }
    list = filterDeckEntities(list, snapshot.bundle, query, typeFilter);
    return [...list].sort((a, b) => {
      if (sort === 'type') {
        const typeComp = a.type.localeCompare(b.type);
        if (typeComp !== 0) return typeComp;
      }
      return a.name.localeCompare(b.name, 'ru');
    });
  }, [entities, subtagFilter, snapshot.bundle, query, typeFilter, sort, ix]);
  const typeMap = useMemo(
    () => new Map(entityTypes(snapshot.bundle).map(t => [t.id, t.name])),
    [snapshot.bundle]
  );

  const candidateEntities = useMemo(() => {
    if (!showAddExisting) return [];
    const currentIds = new Set(entities.map(e => e.id));
    const unselected = snapshot.bundle.entities.filter(e => !e.archived && !currentIds.has(e.id));
    const q = existingQuery.trim().toLowerCase().replace(/ё/g, 'е');
    if (!q) return unselected;
    return unselected.filter(e =>
      [e.name, ...(e.aliases ?? [])].some(n => n.toLowerCase().replace(/ё/g, 'е').includes(q))
    );
  }, [showAddExisting, entities, snapshot.bundle, existingQuery]);

  async function handleSaveTag() {
    if (isUntagged || !tag || !editName.trim()) return;
    setBusy(true);
    try {
      await saveTag({
        ...tag,
        name: editName.trim(),
        parentId: editParent || undefined,
      });
      await onReload();
      setShowSettings(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteTag() {
    if (isUntagged || !tag) return;
    if (!window.confirm(`Удалить колоду «${tag.name}»? Объекты сохранятся в базе знаний.`)) return;
    setBusy(true);
    try {
      await archiveTag(tag.id);
      await onReload();
      onBack();
    } finally {
      setBusy(false);
    }
  }

  async function handleDetach(entityId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (isUntagged) return;
    if (!window.confirm('Убрать объект из этой колоды?')) return;
    setBusy(true);
    try {
      await detachEntityTag(entityId, deckId);
      await onReload();
    } finally {
      setBusy(false);
    }
  }

  async function handleAddExisting() {
    if (isUntagged || selectedToAdd.size === 0) return;
    setBusy(true);
    try {
      for (const entityId of selectedToAdd) {
        await attachEntityTag(entityId, deckId);
      }
      setSelectedToAdd(new Set());
      setShowAddExisting(false);
      await onReload();
    } finally {
      setBusy(false);
    }
  }

  const otherTags = useMemo(
    () => snapshot.bundle.tags.filter(t => !t.archived && t.id !== deckId),
    [snapshot.bundle.tags, deckId]
  );

  function getEntityEyebrow(e: Entity): string {
    const matchingSubtags = childTags.filter(ct => ix.tagsByEntity.get(e.id)?.has(ct.id));
    if (matchingSubtags.length > 0) {
      return matchingSubtags.map(t => t.name).join(', ');
    }
    return typeMap.get(e.type) ?? e.type;
  }

  return (
    <div className="deck-detail">
      <div className="deck-detail-nav">
        <button type="button" className="deck-detail-back" onClick={onBack}>
          {parentTag ? `← ${parentTag.name}` : '← Все колоды'}
        </button>
        {!isUntagged && (
          <button
            type="button"
            className="button outline"
            onClick={() => {
              setEditName(tag?.name ?? '');
              setEditParent(tag?.parentId ?? '');
              setShowSettings(true);
            }}
          >
            Настроить колоду
          </button>
        )}
      </div>

      <section className="deck-detail-hero">
        <div className="deck-detail-header-row">
          <div className="deck-detail-title-group">
            <p className="eyebrow">{isUntagged ? 'Системный раздел' : 'Колода знаний'}</p>
            <h1>{deckTitle}</h1>
            <p className="muted">{pluralObjects(entities.length)}</p>
          </div>
          <div className="deck-detail-hero-actions">
            <button
              type="button"
              className="button primary"
              onClick={() => onStudy(isUntagged ? 'all' : deckId)}
              disabled={entities.length === 0}
            >
              Учить эту тему
            </button>
            {!isUntagged && (
              <button
                type="button"
                className="button outline"
                onClick={() => {
                  setSelectedToAdd(new Set());
                  setExistingQuery('');
                  setShowAddExisting(true);
                }}
              >
                + Выбрать из базы
              </button>
            )}
            <button
              type="button"
              className="button outline"
              onClick={() => onCreateEntity(isUntagged ? undefined : deckId)}
            >
              + Создать объект
            </button>
          </div>
        </div>

        <div className="deck-detail-stats-bar">
          <div className="deck-detail-stat">
            <span className="deck-detail-stat-val">{entities.length}</span>
            <span className="deck-detail-stat-label">Объектов</span>
          </div>
          {childTags.length > 0 ? (
            <div className="deck-detail-stat">
              <span className="deck-detail-stat-val">{childTags.length}</span>
              <span className="deck-detail-stat-label">
                {childTags.length === 1 ? 'Подколода' : childTags.length < 5 ? 'Подколоды' : 'Подколод'}
              </span>
            </div>
          ) : (
            <div className="deck-detail-stat">
              <span className="deck-detail-stat-val">{types.length}</span>
              <span className="deck-detail-stat-label">Категорий</span>
            </div>
          )}
        </div>
      </section>

      <section className="deck-detail-toolbar">
        <div className="search">
          <input
            type="search"
            placeholder="Поиск объектов в колоде…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Поиск объектов в колоде"
          />
        </div>

        <div className="deck-detail-filter-row">
          {childTags.length > 0 ? (
            <div className="deck-type-pills" role="radiogroup" aria-label="Фильтр по подтегам">
              <button
                type="button"
                className={`deck-type-pill ${subtagFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setSubtagFilter('all')}
                aria-checked={subtagFilter === 'all'}
              >
                Все ({entities.length})
              </button>
              {childTags.map(ct => {
                const count = entities.filter(e => ix.tagsByEntity.get(e.id)?.has(ct.id)).length;
                return (
                  <button
                    type="button"
                    key={ct.id}
                    className={`deck-type-pill ${subtagFilter === ct.id ? 'is-active' : ''}`}
                    onClick={() => setSubtagFilter(ct.id)}
                    aria-checked={subtagFilter === ct.id}
                  >
                    {ct.name} ({count})
                  </button>
                );
              })}
            </div>
          ) : types.length > 1 ? (
            <div className="deck-type-pills" role="radiogroup" aria-label="Фильтр по типу">
              <button
                type="button"
                className={`deck-type-pill ${typeFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setTypeFilter('all')}
                aria-checked={typeFilter === 'all'}
              >
                Все ({entities.length})
              </button>
              {types.map(t => {
                const count = entities.filter(e => e.type === t.id).length;
                return (
                  <button
                    type="button"
                    key={t.id}
                    className={`deck-type-pill ${typeFilter === t.id ? 'is-active' : ''}`}
                    onClick={() => setTypeFilter(t.id)}
                    aria-checked={typeFilter === t.id}
                  >
                    {t.name} ({count})
                  </button>
                );
              })}
            </div>
          ) : null}

          <div style={{display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap'}}>
            {types.length > 1 && childTags.length > 0 && (
              <select
                className="deck-detail-sort-select"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                aria-label="Фильтр по типу объекта"
              >
                <option value="all">Все типы</option>
                {types.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}

            <label className="deck-sort-label" style={{display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px'}}>
              <span>Сортировка:</span>
              <select
                className="deck-detail-sort-select"
                value={sort}
                onChange={e => setSort(e.target.value as 'name' | 'type')}
              >
                <option value="name">По имени (А–Я)</option>
                <option value="type">По категории</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {filteredEntities.length === 0 ? (
        <div className="empty-state">
          <p className="muted">
            {query || typeFilter !== 'all'
              ? 'Объекты не найдены по заданным фильтрам'
              : 'В этой колоде пока нет объектов'}
          </p>
          {!query && typeFilter === 'all' && (
            <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
              {!isUntagged && (
                <button
                  type="button"
                  className="button primary"
                  onClick={() => setShowAddExisting(true)}
                >
                  Выбрать из базы
                </button>
              )}
              <button
                type="button"
                className="button outline"
                onClick={() => onCreateEntity(isUntagged ? undefined : deckId)}
              >
                Создать объект
              </button>
            </div>
          )}
        </div>
      ) : (
        <section className="deck-entity-grid" aria-label="Объекты колоды">
          {filteredEntities.map(e => {
            const img = ix.mediaByEntity.get(e.id)?.[0];
            const mastery = getEntityMasterySummary(e.id, snapshot);
            const typeName = typeMap.get(e.type) ?? e.type;

            return (
              <article
                key={e.id}
                className="deck-entity-card"
                onClick={() => onSelectEntity(e)}
                onKeyDown={ev => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    onSelectEntity(e);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Объект: ${e.name}, тип: ${typeName}, статус: ${mastery.label}`}
              >
                <div className="deck-entity-thumb-wrap">
                  {img ? (
                    <KnowledgeImage src={img.url} alt="" className="deck-entity-thumb" />
                  ) : (
                    <div className="deck-entity-thumb-fallback">
                      <span>{e.name.trim()[0]?.toUpperCase() ?? '•'}</span>
                    </div>
                  )}
                </div>

                <div className="deck-entity-card-info">
                  <p className="deck-entity-eyebrow">{getEntityEyebrow(e)}</p>
                  <h3 className="deck-entity-name">{e.name}</h3>
                </div>

                <div className="deck-entity-footer">
                  <span className="deck-entity-mastery" title={mastery.label}>
                    <span aria-hidden="true">{mastery.mark}</span>
                    <span>{mastery.label}</span>
                  </span>
                  {!isUntagged && (
                    <button
                      type="button"
                      className="deck-entity-detach-btn"
                      title="Убрать из колоды"
                      disabled={busy}
                      onClick={ev => void handleDetach(e.id, ev)}
                    >
                      Убрать
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Tag settings dialog */}
      {showSettings && tag && (
        <div className="overlay nested" onMouseDown={e => e.target === e.currentTarget && setShowSettings(false)}>
          <section className="editor-panel" role="dialog" aria-modal="true" aria-label="Настройки колоды">
            <div className="section-heading">
              <h2>Настройки колоды</h2>
              <button type="button" className="icon-button" onClick={() => setShowSettings(false)} aria-label="Закрыть">
                ×
              </button>
            </div>

            <label>
              Название колоды
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                maxLength={100}
              />
            </label>

            <label>
              Родительская колода
              <select value={editParent} onChange={e => setEditParent(e.target.value)}>
                <option value="">Без родительской (основная колода)</option>
                {otherTags.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px'}}>
              <button
                type="button"
                className="button primary"
                disabled={busy || !editName.trim()}
                onClick={() => void handleSaveTag()}
              >
                Сохранить
              </button>
              <button
                type="button"
                className="button destructive"
                disabled={busy}
                onClick={() => void handleDeleteTag()}
                style={{background: '#c74744', color: '#fff', borderColor: '#c74744'}}
              >
                Удалить колоду
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Add existing entities modal */}
      {showAddExisting && (
        <div className="overlay nested" onMouseDown={e => e.target === e.currentTarget && setShowAddExisting(false)}>
          <section className="editor-panel" role="dialog" aria-modal="true" aria-label="Выбрать объекты из базы">
            <div className="section-heading">
              <h2>Добавить объекты в колоду</h2>
              <button type="button" className="icon-button" onClick={() => setShowAddExisting(false)} aria-label="Закрыть">
                ×
              </button>
            </div>

            <p className="muted" style={{fontSize: '13px', margin: '0 0 12px'}}>
              Отметьте объекты, которые хотите включить в колоду «{deckTitle}».
            </p>

            <div className="search">
              <input
                type="search"
                placeholder="Поиск по имени объекта…"
                value={existingQuery}
                onChange={e => setExistingQuery(e.target.value)}
              />
            </div>

            <div className="deck-candidate-list">
              {candidateEntities.length === 0 ? (
                <p className="muted" style={{padding: '16px', textAlign: 'center'}}>
                  Нет доступных объектов для добавления
                </p>
              ) : (
                candidateEntities.map(cand => {
                  const isChecked = selectedToAdd.has(cand.id);
                  return (
                    <label key={cand.id} className="deck-candidate-row">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          const next = new Set(selectedToAdd);
                          if (e.target.checked) next.add(cand.id);
                          else next.delete(cand.id);
                          setSelectedToAdd(next);
                        }}
                      />
                      <div className="deck-candidate-info">
                        <span className="deck-candidate-name">{cand.name}</span>
                        <span className="deck-candidate-type">{typeMap.get(cand.type) ?? cand.type}</span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px'}}>
              <button type="button" className="button outline" onClick={() => setShowAddExisting(false)}>
                Отмена
              </button>
              <button
                type="button"
                className="button primary"
                disabled={busy || selectedToAdd.size === 0}
                onClick={() => void handleAddExisting()}
              >
                Добавить выбранные ({selectedToAdd.size})
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}