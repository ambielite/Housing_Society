import { useState } from 'react';
import { FOLDER_TYPES } from './documentVaultOptions';
import Alert from '../../../components/ui/Alert';

export default function FolderForm({ folders = [], initial = null, societyId, onSubmit, onCancel, saving, error }) {
  const [name, setName] = useState(initial?.name || '');
  const [folderType, setFolderType] = useState(initial?.folder_type || 'OTHER');
  const [parentFolderId, setParentFolderId] = useState(initial?.parent_folder_id || '');
  const [status, setStatus] = useState(initial?.status || 'ACTIVE');
  return (
    <form className="stack-form" onSubmit={(event) => {
      event.preventDefault();
      onSubmit(initial ? { name: name.trim(), folderType, status } : { societyId, name: name.trim(), folderType, ...(parentFolderId ? { parentFolderId } : {}) });
    }}>
      {error && <Alert variant="error">{error}</Alert>}
      <label className="field">Folder name<input className="input" required maxLength={150} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Society Bylaws" /></label>
      <label className="field">Folder type<select className="input" value={folderType} onChange={(e) => setFolderType(e.target.value)}>{FOLDER_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}</select></label>
      {!initial && <label className="field">Parent folder (optional)<select className="input" value={parentFolderId} onChange={(e) => setParentFolderId(e.target.value)}><option value="">Top-level folder</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>}
      {initial && <label className="field">Status<select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>{['ACTIVE', 'INACTIVE'].map((v) => <option key={v}>{v}</option>)}</select></label>}
      <div className="form-actions"><button className="btn btn-primary" disabled={saving || !name.trim()}>{initial ? 'Save changes' : 'Create folder'}</button><button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button></div>
    </form>
  );
}
