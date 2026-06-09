import { useMemo, useState } from 'react';
import { TEMPLATE_CATEGORIES } from '../utils/messageTemplates';

function TemplateCard({ template, onEdit, onDelete, onToggleFavorite, onUse }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-slate-900">{template.name}</h4>
        <button
          type="button"
          onClick={() => onToggleFavorite(template.id)}
          title={template.is_favorite ? 'Remove from favorites' : 'Mark as favorite'}
          className={`text-lg leading-none transition ${template.is_favorite ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}
        >
          {template.is_favorite ? '★' : '☆'}
        </button>
      </div>
      <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-slate-600">{template.body}</p>
      {template.variables_used?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.variables_used.map((token) => (
            <span key={token} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
              {`{{${token}}}`}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onUse(template)}
          className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Use template
        </button>
        <button
          type="button"
          onClick={() => onEdit(template)}
          className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(template)}
          className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function TemplateLibrary({
  templates,
  loading,
  onCreate,
  onEdit,
  onDelete,
  onToggleFavorite,
  onUse,
  onLoadStarters,
}) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (templates || []).filter((template) => {
      if (favoritesOnly && !template.is_favorite) return false;
      if (categoryFilter !== 'all' && template.category !== categoryFilter) return false;
      if (!term) return true;
      return (
        template.name.toLowerCase().includes(term) ||
        template.body.toLowerCase().includes(term) ||
        template.category.toLowerCase().includes(term)
      );
    });
  }, [templates, query, categoryFilter, favoritesOnly]);

  const grouped = useMemo(() => {
    const map = new Map(TEMPLATE_CATEGORIES.map((category) => [category, []]));
    filtered.forEach((template) => {
      if (!map.has(template.category)) map.set(template.category, []);
      map.get(template.category).push(template);
    });
    return Array.from(map.entries()).filter(([, items]) => items.length > 0);
  }, [filtered]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Template Library</h2>
          <p className="mt-1 text-sm text-slate-500">Reusable messages grouped by where they fit in the relationship lifecycle.</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + New Template
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates by keyword..."
          className="min-w-[220px] flex-1 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All categories</option>
          {TEMPLATE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setFavoritesOnly((current) => !current)}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
            favoritesOnly ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          ★ Favorites only
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading templates...</p>}

      {!loading && (templates || []).length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-700">No templates yet</p>
          <p className="mt-1 text-sm text-slate-500">Get started quickly with a starter library covering first contact, follow-up and reactivation.</p>
          <button
            type="button"
            onClick={onLoadStarters}
            className="mt-4 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Load starter templates
          </button>
        </div>
      )}

      {!loading && (templates || []).length > 0 && filtered.length === 0 && (
        <p className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          No templates match your search.
        </p>
      )}

      <div className="space-y-8">
        {grouped.map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{category}</h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleFavorite={onToggleFavorite}
                  onUse={onUse}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
