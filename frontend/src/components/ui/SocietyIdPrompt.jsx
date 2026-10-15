import { useState } from 'react';
import useSociety from '../../app/store/useSociety';
import { isUuid } from '../../utils/validators';
import TextField from './TextField';

/**
 * TEMPORARY. Parking data belongs to a society. Most accounts have one, but a
 * platform-wide account (like Super Admin) does not, so this asks which society
 * to work in. Replace with a real society switcher when the societies module
 * is connected.
 */
export default function SocietyIdPrompt() {
  const { setSocietyId } = useSociety();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const onSubmit = (event) => {
    event.preventDefault();
    if (!isUuid(value)) {
      setError('Enter a valid society ID.');
      return;
    }
    setSocietyId(value.trim());
  };

  return (
    <form className="card form-narrow" onSubmit={onSubmit} noValidate>
      <h2 className="section-title">Choose a society</h2>
      <p className="muted section-hint">Your account isn't tied to one society, so tell us which one to show.</p>
      <TextField
        id="societyId"
        label="Society ID"
        placeholder="Paste the society ID"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setError('');
        }}
        error={error}
        hint="Temporary: paste the society's ID. This becomes a society picker soon."
      />
      <button type="submit" className="btn btn-primary">
        Use this society
      </button>
    </form>
  );
}
