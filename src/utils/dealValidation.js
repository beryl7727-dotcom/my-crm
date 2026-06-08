export function validateDealRequired(values) {
  if (!values) return 'Missing deal values';
  if (!values.title || String(values.title).trim() === '') return 'Title is required';
  if (!values.company_id || String(values.company_id).trim() === '') return 'Company is required';
  if (!values.primary_contact_id || String(values.primary_contact_id).trim() === '') return 'Primary contact is required';
  return null;
}
export const dealRules = {
  title: { required: 'Title is required' },
  company_id: { required: 'Company is required' },
  primary_contact_id: { required: 'Primary contact is required' },
  value: {
    min: { value: 0, message: 'Value must be 0 or more' },
  },
  probability: {
    min: { value: 0, message: 'Probability must be at least 0%' },
    max: { value: 100, message: 'Probability cannot exceed 100%' },
  },
  relationship_score: {
    min: { value: 1, message: 'Score must be between 1 and 5' },
    max: { value: 5, message: 'Score must be between 1 and 5' },
  },
};

export const activityRules = {
  activity_type: { required: 'Activity type is required' },
  title: { required: 'Title is required' },
  activity_date: { required: 'Activity date is required' },
};
