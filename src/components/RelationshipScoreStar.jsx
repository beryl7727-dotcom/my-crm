import { useState } from 'react';
import { RELATIONSHIP_SCORE_MEANINGS } from '../utils/relationshipProfile';

const SIZE_CLASSES = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
};

// Renders 1-5 stars. In read-only mode it's a static display; otherwise each
// star is clickable and previews the hovered score before committing it.
export default function RelationshipScoreStar({ score = 0, onChange, readOnly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0);
  const value = Math.max(0, Math.min(5, Number(score) || 0));
  const preview = hovered || value;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  if (readOnly) {
    return (
      <span className={`leading-none tracking-tight ${sizeClass}`} title={value ? RELATIONSHIP_SCORE_MEANINGS[value] : 'No score yet'}>
        <span className="text-amber-400">{'★'.repeat(value)}</span>
        <span className="text-slate-300">{'★'.repeat(5 - value)}</span>
      </span>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <div
        className={`inline-flex leading-none tracking-tight ${sizeClass}`}
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange && onChange(star === value ? 0 : star)}
            onMouseEnter={() => setHovered(star)}
            title={RELATIONSHIP_SCORE_MEANINGS[star]}
            className={`transition hover:scale-110 ${star <= preview ? 'text-amber-400' : 'text-slate-300'}`}
          >
            ★
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{preview ? RELATIONSHIP_SCORE_MEANINGS[preview] : 'Click a star to set the score'}</p>
    </div>
  );
}
