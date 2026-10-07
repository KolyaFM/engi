import {useMemo, useState} from 'react';
import type {Snapshot} from '../../lib/engi/types';
import {getDeckList, type DeckInfo} from '../../lib/engi/knowledge/decks';
import {DeckCard} from './DeckCard';
import {ConflictResolver} from './ConflictResolver';
import './decks.css';

export type DeckCatalogProps = {
  snapshot: Snapshot;
  onSelectDeck: (deckId: string) => void;
  onStudy: (tagId: string) => void;
  onCreateDeck: () => void;
  onCreateEntity: () => void;
  onReload: () => Promise<void>;
};

export function DeckCatalog({
  snapshot,
  onSelectDeck,
  onStudy,
  onCreateDeck,
  onCreateEntity,
  onReload,
}: DeckCatalogProps) {
  const [query, setQuery] = useState('');

  const allDecks = useMemo(() => getDeckList(snapshot), [snapshot]);

  const filteredDecks = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/ё/g, 'е');
    if (!q) return allDecks;
    return allDecks.filter(deck =>
      deck.name.toLowerCase().replace(/ё/g, 'е').includes(q)
    );
  }, [allDecks, query]);

  const regularDecks = useMemo(
    () => filteredDecks.filter(d => !d.isUntagged),
    [filteredDecks]
  );
  const untaggedDeck = useMemo(
    () => filteredDecks.find(d => d.isUntagged),
    [filteredDecks]
  );

  return (
    <div className="deck-catalog">
      <div className="page-heading">
        <div>
          <p className="eyebrow">База знаний</p>
          <h1>Колоды</h1>
        </div>
        <div className="catalog-heading-actions">
          <button type="button" className="button outline" onClick={onCreateDeck}>
            + Новая колода
          </button>
          <button type="button" className="button primary" onClick={onCreateEntity}>
            + Новый объект
          </button>
        </div>
      </div>

      <div className="catalog-toolbar">
        <div className="search">
          <input
            type="search"
            placeholder="Найти колоду по названию…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Поиск колоды"
          />
        </div>
      </div>

      <ConflictResolver bundle={snapshot.bundle} onReload={onReload} />

      {(() => {
        const inProgress = filteredDecks.filter(d => d.category === 'in_progress');
        const completed = filteredDecks.filter(d => d.category === 'completed');
        const unlearned = filteredDecks.filter(d => d.category === 'unlearned');

        const sections = [
          {id: 'in_progress', title: 'В процессе изучения', decks: inProgress},
          {id: 'completed', title: 'Изучено', decks: completed},
          {id: 'unlearned', title: 'Не изучено', decks: unlearned},
        ].filter(s => s.decks.length > 0);

        if (sections.length === 0) {
          return (
            <div className="empty-state deck-empty">
              <p className="muted">
                {query ? 'Колоды с таким названием не найдены' : 'В базе пока нет колод. Создайте первую колоду или объект.'}
              </p>
              {!query && (
                <button type="button" className="button primary" onClick={onCreateDeck}>
                  Создать колоду
                </button>
              )}
            </div>
          );
        }

        return (
          <div className="deck-catalog-sections" style={{display: 'flex', flexDirection: 'column', gap: '28px'}}>
            {sections.map(sec => (
              <section className="deck-catalog-section" key={sec.id} aria-label={sec.title}>
                <div className="section-divider" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px'}}>
                  <h2 style={{fontSize: '20px', margin: 0}}>{sec.title}</h2>
                  <span className="deck-section-count">{sec.decks.length}</span>
                </div>
                <div className="deck-grid">
                  {sec.decks.map(deck => (
                    <DeckCard
                      key={deck.id}
                      deck={deck}
                      onSelect={onSelectDeck}
                      onStudy={onStudy}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        );
      })()}
    </div>
  );
}