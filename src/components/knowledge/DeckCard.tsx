import type {DeckInfo} from '../../lib/engi/knowledge/decks';
import {KnowledgeImage} from './KnowledgeImage';
import './decks.css';

export function pluralObjects(count: number): string {
  const abs = Math.abs(count) % 100;
  const rem = abs % 10;
  if (abs > 10 && abs < 20) return `${count} объектов`;
  if (rem > 1 && rem < 5) return `${count} объекта`;
  if (rem === 1) return `${count} объект`;
  return `${count} объектов`;
}

export function pluralSubtags(count: number): string {
  const abs = Math.abs(count) % 100;
  const rem = abs % 10;
  if (abs > 10 && abs < 20) return `+${count} подтегов`;
  if (rem === 1) return `+${count} подтег`;
  if (rem > 1 && rem < 5) return `+${count} подтега`;
  return `+${count} подтегов`;
}

export type DeckCardProps = {
  deck: DeckInfo;
  onSelect: (deckId: string) => void;
  onStudy?: (deckId: string) => void;
};

export function DeckCard({deck, onSelect, onStudy}: DeckCardProps) {
  const images = deck.sampleImages;
  const hasDue = deck.stats.due > 0;
  const hasCovered = deck.stats.covered > 0;
  const canStudy = deck.stats.available > 0;

  return (
    <article
      className={`deck-card ${deck.isUntagged ? 'is-untagged' : ''}`}
      onClick={() => onSelect(deck.id)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(deck.id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Колода: ${deck.name}. ${pluralObjects(deck.entityCount)}`}
    >
      <div className="deck-art-stack" aria-hidden="true">
        {images.length === 0 ? (
          <div className="deck-stack-fallback">
            <span>{deck.isUntagged ? '📥' : deck.name.trim()[0]?.toUpperCase() ?? '📁'}</span>
          </div>
        ) : images.length === 1 ? (
          <div className="deck-stack-single">
            <KnowledgeImage src={images[0]} alt="" className="deck-stack-img" />
          </div>
        ) : images.length === 2 ? (
          <div className="deck-stack-double">
            <KnowledgeImage src={images[0]} alt="" className="deck-stack-img stack-back" />
            <KnowledgeImage src={images[1]} alt="" className="deck-stack-img stack-front" />
          </div>
        ) : (
          <div className="deck-stack-triple">
            <KnowledgeImage src={images[0]} alt="" className="deck-stack-img stack-left" />
            <KnowledgeImage src={images[1]} alt="" className="deck-stack-img stack-right" />
            <KnowledgeImage src={images[2]} alt="" className="deck-stack-img stack-center" />
          </div>
        )}
      </div>

      <div className="deck-card-body">
        <div className="deck-card-header">
          <h3 className="deck-title">{deck.name}</h3>
          {deck.childTagIds.length > 0 && (
            <span className="deck-badge-subtags">
              {pluralSubtags(deck.childTagIds.length)}
            </span>
          )}
        </div>

        <div className="deck-meta">
          <span className="deck-count">
            {deck.learnedEntityCount} из {deck.entityCount} изучено{deck.learnedEntityCount === deck.entityCount && deck.entityCount > 0 ? ' ✓' : ''}
          </span>
          {hasDue && (
            <span className="deck-badge-due" aria-label={`Пора повторить: ${deck.stats.due}`}>
              {deck.stats.due} к повторению
            </span>
          )}
        </div>

        <div className="deck-progress-row">
          {deck.entityCount > 0 ? (
            <div className="deck-retention">
              <div
                className="deck-retention-track"
                role="progressbar"
                aria-label="Прогресс изучения колоды"
                aria-valuenow={Math.round((deck.learnedEntityCount / deck.entityCount) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`deck-retention-fill ${deck.category === 'completed' ? 'is-completed' : ''}`}
                  style={{width: `${Math.round((deck.learnedEntityCount / deck.entityCount) * 100)}%`}}
                />
              </div>
              <span className="deck-retention-label">
                {deck.category === 'completed'
                  ? 'Изучено'
                  : deck.learnedEntityCount > 0
                  ? `${Math.round((deck.learnedEntityCount / deck.entityCount) * 100)}%`
                  : 'Не начато'}
              </span>
            </div>
          ) : (
            <span className="deck-unstarted">Пустая колода</span>
          )}
        </div>

        <div className="deck-actions">
          <button
            type="button"
            className="deck-study-btn button primary"
            disabled={!canStudy}
            onClick={e => {
              e.stopPropagation();
              onStudy?.(deck.id);
            }}
          >
            Учить
          </button>
        </div>
      </div>
    </article>
  );
}