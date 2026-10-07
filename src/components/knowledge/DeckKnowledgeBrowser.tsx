import {useMemo, useState} from 'react';
import type {Snapshot, Entity} from '../../lib/engi/types';
import {indexes} from '../../lib/engi/indexes';
import {entityTypes} from '../../lib/engi/knowledge/properties';
import {saveTag, newId} from '../../services/knowledge-service';
import {getEntityMasterySummary, UNTAGGED_TAG_ID} from '../../lib/engi/knowledge/decks';
import {DeckCatalog} from './DeckCatalog';
import {DeckDetailView} from './DeckDetailView';
import {EntityPage} from './EntityPage';
import {EntityEditor} from './EntityEditor';
import {KnowledgeImage} from './KnowledgeImage';
import {ConflictResolver} from './ConflictResolver';
import './decks.css';

export function DeckKnowledgeBrowser({
  snapshot,
  onReload,
  onStudy,
}: {
  snapshot: Snapshot;
  onReload: () => Promise<void>;
  onStudy: (tag: string) => void;
}) {
  const activeTags = useMemo(
    () => snapshot.bundle.tags.filter(t => !t.archived),
    [snapshot.bundle.tags]
  );
  const allEntities = useMemo(
    () => snapshot.bundle.entities.filter(e => !e.archived),
    [snapshot.bundle.entities]
  );

  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'decks' | 'objects'>(activeTags.length > 0 ? 'decks' : 'objects');

  const [detail, setDetail] = useState<Entity | null>(null);
  const [edit, setEdit] = useState<Entity | null | undefined>(undefined);
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckParent, setNewDeckParent] = useState('');
  const [busy, setBusy] = useState(false);

  // Flat objects view filters
  const [objectQuery, setObjectQuery] = useState('');
  const [objectTagFilter, setObjectTagFilter] = useState('all');
  const [objectTypeFilter, setObjectTypeFilter] = useState('all');
  const [limit, setLimit] = useState(48);

  const ix = useMemo(() => indexes(snapshot.bundle), [snapshot.bundle]);
  const typeMap = useMemo(
    () => new Map(entityTypes(snapshot.bundle).map(t => [t.id, t.name])),
    [snapshot.bundle]
  );

  const filteredObjects = useMemo(() => {
    const q = objectQuery.trim().toLowerCase().replace(/ё/g, 'е');
    return allEntities.filter(e => {
      if (objectTypeFilter !== 'all' && e.type !== objectTypeFilter) return false;
      if (objectTagFilter !== 'all') {
        const entityTags = ix.tagsByEntity.get(e.id);
        if (!entityTags?.has(objectTagFilter)) return false;
      }
      if (!q) return true;
      const searchString = ix.searchByEntity.get(e.id);
      if (searchString && searchString.includes(q)) return true;
      return [e.name, ...(e.aliases ?? [])].some(n =>
        n.toLowerCase().replace(/ё/g, 'е').includes(q)
      );
    });
  }, [allEntities, objectQuery, objectTagFilter, objectTypeFilter, ix]);

  async function handleCreateDeck() {
    if (!newDeckName.trim()) return;
    setBusy(true);
    try {
      await saveTag({
        id: newId(),
        name: newDeckName.trim(),
        parentId: newDeckParent || undefined,
      });
      setNewDeckName('');
      setNewDeckParent('');
      setShowCreateDeck(false);
      await onReload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {selectedDeckId ? (
        <DeckDetailView
          deckId={selectedDeckId}
          snapshot={snapshot}
          onBack={() => {
            const currentTag = snapshot.bundle.tags.find(t => t.id === selectedDeckId);
            if (currentTag?.parentId) {
              setSelectedDeckId(currentTag.parentId);
            } else {
              setSelectedDeckId(null);
            }
          }}
          onStudy={onStudy}
          onSelectEntity={e => setDetail(e)}
          onCreateEntity={() => setEdit(null)}
          onReload={onReload}
          onSelectDeck={id => setSelectedDeckId(id)}
        />
      ) : (
        <div className="deck-browser-root" style={{display: 'flex', flexDirection: 'column', gap: '18px'}}>
          <div className="deck-browser-nav-row">
            <div className="deck-view-switcher" role="tablist" aria-label="Режим отображения">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'decks'}
                className={`deck-view-tab ${viewMode === 'decks' ? 'is-active' : ''}`}
                onClick={() => setViewMode('decks')}
              >
                Колоды ({activeTags.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'objects'}
                className={`deck-view-tab ${viewMode === 'objects' ? 'is-active' : ''}`}
                onClick={() => setViewMode('objects')}
              >
                Все объекты ({allEntities.length})
              </button>
            </div>
          </div>

          {viewMode === 'decks' ? (
            <DeckCatalog
              snapshot={snapshot}
              onSelectDeck={id => setSelectedDeckId(id)}
              onStudy={onStudy}
              onCreateDeck={() => setShowCreateDeck(true)}
              onCreateEntity={() => setEdit(null)}
              onReload={onReload}
            />
          ) : (
            <div className="flat-objects-browser">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">База знаний</p>
                  <h1>Все объекты</h1>
                </div>
                <button type="button" className="button primary" onClick={() => setEdit(null)}>
                  + Новый объект
                </button>
              </div>

              <div className="catalog-toolbar">
                <div className="search">
                  <input
                    type="search"
                    placeholder="Название, тег, значение или связанный объект…"
                    value={objectQuery}
                    onChange={e => {
                      setObjectQuery(e.target.value);
                      setLimit(48);
                    }}
                    aria-label="Поиск по всем объектам"
                  />
                </div>
                <div className="toolbar-filters" style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                  <select
                    value={objectTagFilter}
                    onChange={e => {
                      setObjectTagFilter(e.target.value);
                      setLimit(48);
                    }}
                    aria-label="Фильтр по колоде"
                  >
                    <option value="all">Все колоды</option>
                    {activeTags.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={objectTypeFilter}
                    onChange={e => {
                      setObjectTypeFilter(e.target.value);
                      setLimit(48);
                    }}
                    aria-label="Фильтр по типу"
                  >
                    <option value="all">Все типы</option>
                    {entityTypes(snapshot.bundle).map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <ConflictResolver bundle={snapshot.bundle} onReload={onReload} />

              <div className="catalog-grid">
                {filteredObjects.slice(0, limit).map(e => {
                  const img = ix.mediaByEntity.get(e.id)?.[0];
                  const mastery = getEntityMasterySummary(e.id, snapshot);
                  const typeName = typeMap.get(e.type) ?? e.type;

                  return (
                    <button
                      type="button"
                      className="object-card"
                      key={e.id}
                      onClick={() => setDetail(e)}
                    >
                      <div className="deck-entity-thumb-wrap">
                        {img ? (
                          <KnowledgeImage src={img.url} alt={e.name} className="deck-entity-thumb" />
                        ) : (
                          <div className="deck-entity-thumb-fallback">
                            <span>{e.name.trim()[0]?.toUpperCase() ?? '•'}</span>
                          </div>
                        )}
                      </div>
                      <p className="eyebrow">{typeName}</p>
                      <h3>{e.name}</h3>
                      <span className="deck-entity-mastery" style={{marginTop: 'auto', paddingTop: '4px'}}>
                        <span aria-hidden="true">{mastery.mark}</span> {mastery.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredObjects.length > limit && (
                <div style={{display: 'flex', justifyContent: 'center', margin: '20px 0'}}>
                  <button type="button" className="button outline" onClick={() => setLimit(n => n + 48)}>
                    Показать ещё
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Object detail view */}
      {detail && (
        <EntityPage
          entity={detail}
          snapshot={snapshot}
          onEdit={() => {
            const current = detail;
            setDetail(null);
            setEdit(current);
          }}
          onClose={() => setDetail(null)}
          onOpen={e => setDetail(e)}
          onReload={onReload}
        />
      )}

      {/* Object editor modal */}
      {edit !== undefined && (
        <EntityEditor
          bundle={snapshot.bundle}
          initial={edit ?? undefined}
          onSave={async () => {
            setEdit(undefined);
            await onReload();
          }}
          onClose={() => setEdit(undefined)}
        />
      )}

      {/* Create deck dialog */}
      {showCreateDeck && (
        <div
          className="overlay nested"
          onMouseDown={e => e.target === e.currentTarget && setShowCreateDeck(false)}
        >
          <section className="editor-panel" role="dialog" aria-modal="true" aria-label="Новая колода">
            <div className="section-heading">
              <h2>Новая колода</h2>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowCreateDeck(false)}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>

            <label>
              Название колоды
              <input
                type="text"
                placeholder="Например, Импрессионизм или Президенты"
                value={newDeckName}
                onChange={e => setNewDeckName(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </label>

            <label>
              Родительская колода (по желанию)
              <select value={newDeckParent} onChange={e => setNewDeckParent(e.target.value)}>
                <option value="">Без родительской (основная колода)</option>
                {activeTags.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px'}}>
              <button type="button" className="button outline" onClick={() => setShowCreateDeck(false)}>
                Отмена
              </button>
              <button
                type="button"
                className="button primary"
                disabled={busy || !newDeckName.trim()}
                onClick={() => void handleCreateDeck()}
              >
                {busy ? 'Создаём…' : 'Создать колоду'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}