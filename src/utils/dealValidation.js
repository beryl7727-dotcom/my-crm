export function validateDealRequired(values) {
  if (!values) return 'Missing deal values';
  if (!values.title || String(values.title).trim() === '') return 'Title is required';
  if (!values.company_id || String(values.company_id).trim() === '') return 'Company is required';
  if (!values.contact_id || String(values.contact_id).trim() === '') return 'Primary contact is required';
  return null;
}
export const dealRules = {
  title: { required: 'Title is required' },
  company_id: { required: 'Company is required' },
  primary_contact_id: { required: 'Primary contact is required' },
  amount: {
    min: { value: 0, message: 'Value must be 0 or more' },
  },
  probability: {
    min: { value: 0, message: 'Probability must be at least 0%' },
    max: { value: 100, message: 'Probability cannot exceed 100%' },
  },
};

export const activityRules = {
  type: { required: 'Activity type is required' },
  title: { required: 'Title is required' },
  date_time: { required: 'Activity date is required' },
};

export const validateActivityDuration = (type, value) => {
  if (['call', 'meeting'].includes(type)) {
    if (!value) return 'Duration is required for call or meeting';
    if (Number(value) <= 0) return 'Duration must be greater than zero';
  }
  return true;
};
