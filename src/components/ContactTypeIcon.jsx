import { CONTACT_TYPE_META } from '../utils/relationshipProfile';

const SIZE_CLASSES = {
  sm: 'h-6 w-6 text-sm',
  md: 'h-8 w-8 text-base',
  lg: 'h-10 w-10 text-lg',
};

// Color-coded icon badge for a relationship's contact type. Falls back to a
// neutral placeholder when the type hasn't been set yet.
export default function ContactTypeIcon({ type, size = 'md', showLabel = false, className = '' }) {
  const meta = CONTACT_TYPE_META[type];
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  if (!meta) {
    if (!showLabel) return null;
    return <span className={`text-xs text-slate-400 ${className}`}>No contact type</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} title={type}>
      <span className={`inline-flex items-center justify-center rounded-full ${meta.colors.bg} ${sizeClass}`}>{meta.icon}</span>
      {showLabel && <span className={`text-sm font-medium ${meta.colors.text}`}>{type}</span>}
    </span>
  );
}
