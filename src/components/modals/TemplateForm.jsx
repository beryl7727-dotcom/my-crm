import { useForm } from 'react-hook-form';
import { toast } from '../../utils/toast';
import { TEMPLATE_CATEGORIES, TEMPLATE_VARIABLES, extractVariables } from '../../utils/messageTemplates';

export default function TemplateForm({ template = null, onClose, onSaved, createTemplate, updateTemplate }) {
  const isEditing = Boolean(template);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: template?.name || '',
      category: template?.category || TEMPLATE_CATEGORIES[0],
      body: template?.body || '',
    },
  });

  const body = watch('body');
  const detectedVariables = extractVariables(body);

  const insertVariable = (token) => {
    setValue('body', `${body || ''}{{${token}}}`, { shouldDirty: true });
  };

  const onSubmit = async (values) => {
    try {
      if (!values.name.trim() || !values.body.trim()) {
        toast.error('Name and body are required');
        return;
      }

      if (isEditing) {
        await updateTemplate(template.id, values);
        toast.success('Template updated');
      } else {
        await createTemplate(values);
        toast.success('Template created');
      }
      onSaved && onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save template');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{isEditing ? 'Edit Template' : 'New Template'}</h2>
            <p className="text-sm text-slate-500">
              Use <span className="font-mono">{'{{First Name}}'}</span> style tokens — they auto-fill when you send.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input
                {...register('name', { required: 'Name is required' })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="e.g. RECS attendee"
              />
              {errors.name && <p className="text-sm text-rose-600">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select
                {...register('category', { required: true })}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                {TEMPLATE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-medium text-slate-700">Body</label>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLES.map((variable) => (
                  <button
                    key={variable.token}
                    type="button"
                    onClick={() => insertVariable(variable.token)}
                    title={variable.description}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {`{{${variable.token}}}`}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              {...register('body', { required: 'Body is required' })}
              rows={8}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-mono focus:border-blue-500 focus:outline-none"
              placeholder={'Hi {{First Name}}\nGreat meeting you at RECS...'}
            />
            {errors.body && <p className="text-sm text-rose-600">{errors.body.message}</p>}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Variables used</p>
            <div className="flex flex-wrap gap-2">
              {detectedVariables.length === 0 && <p className="text-sm text-slate-400">No variables yet — use the buttons above to insert one.</p>}
              {detectedVariables.map((token) => (
                <span key={token} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {`{{${token}}}`}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save changes' : 'Create template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
