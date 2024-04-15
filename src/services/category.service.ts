const Categories = [
  'all_joined',
  'all_joined_day',
  'all_consistent',
  'all_vital',
  'all_active',
  'all_connected',
  'all_paused',
  'all_new_disengaged',
  'all_disengaged',
  'all_unpaused',
  'all_returned',
  'all_new_active',
  'all_still_active',
  'all_dropped',
] as const;

const getCategories = () => {
  return Categories;
};

export default {
  getCategories,
};
