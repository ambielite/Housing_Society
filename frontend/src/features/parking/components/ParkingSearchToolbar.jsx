import { Search } from 'lucide-react';

export default function ParkingSearchToolbar({ value, onChange, placeholder, action }) {
  return (
    <div className="parking-module-search" role="search">
      <label className="parking-module-search-input">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder || 'Search by any detail…'}
          aria-label="Search this parking table by any detail"
        />
      </label>
      {action}
    </div>
  );
}
