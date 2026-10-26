const searchableText = (value) => {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(searchableText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(searchableText).join(' ');
  return String(value);
};

export const filterRecords = (records, query, extraText = () => '') => {
  if (!Array.isArray(records) || !query?.trim()) return records;
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return records.filter((record) => {
    const text = `${searchableText(record)} ${searchableText(extraText(record))}`.toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
};
