import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useFetch from '../../../utils/useFetch';
import { getErrorMessage } from '../../../lib/axios';
import * as rbacApi from '../api/rbac.api';
import PageContainer from '../../../components/layout/PageContainer';
import { FullPageLoader } from '../../../components/ui/Spinner';
import RoleForm from '../components/RoleForm';

/** One page for two routes: /roles/new (create) and /roles/:roleId/edit (edit). */
export default function RoleFormPage() {
  const { roleId } = useParams();
  const isEdit = Boolean(roleId);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // No "get one role" endpoint, so edit mode looks the role up in the list.
  const roles = useFetch(() => (isEdit ? rbacApi.listRoles() : Promise.resolve(null)), [roleId]);

  if (isEdit && roles.loading && !roles.data) return <FullPageLoader />;

  const role = isEdit ? roles.data?.find((r) => r.id === roleId) : null;

  if (isEdit && (!role || role.is_system_role)) {
    let heading = 'Role not found';
    let text = 'It may have been deleted, or the link is wrong.';
    if (roles.error) {
      heading = "Couldn't load this role";
      text = getErrorMessage(roles.error);
    } else if (role?.is_system_role) {
      heading = "System roles can't be edited";
      text = 'They are built in. Create a custom role if you need something different.';
    }
    return (
      <div className="empty-state">
        <h1>{heading}</h1>
        <p>{text}</p>
        <p>
          <Link to="/roles">Back to roles</Link>
        </p>
      </div>
    );
  }

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      if (isEdit) {
        await rbacApi.updateRole(roleId, payload);
        navigate(`/roles/${roleId}`, { state: { notice: 'Role updated.' } });
      } else {
        const created = await rbacApi.createRole(payload);
        navigate(`/roles/${created.id}`, { state: { notice: 'Role created. Now choose the permissions it should grant.' } });
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  const initialValues = isEdit
    ? { name: role.name, code: role.code, description: role.description || '', status: role.status }
    : {};

  return (
    <PageContainer
      eyebrow="ACCESS CONTROL"
      title={isEdit ? 'Edit role' : 'New role'}
      subtitle={isEdit ? 'Change the name, description or status.' : 'Name the role first. You choose its permissions on the next screen.'}
      className="roles-module-page role-form-page"
    >
      <RoleForm
        mode={isEdit ? 'edit' : 'create'}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitError={submitError}
        cancelTo={isEdit ? `/roles/${roleId}` : '/roles'}
      />
    </PageContainer>
  );
}
