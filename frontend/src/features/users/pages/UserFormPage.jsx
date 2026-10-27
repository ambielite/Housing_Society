import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useSociety from '../../../app/store/useSociety';
import useFetch from '../../../utils/useFetch';
import { getErrorMessage } from '../../../lib/axios';
import * as userApi from '../api/user.api';
import PageContainer from '../../../components/layout/PageContainer';
import { FullPageLoader } from '../../../components/ui/Spinner';
import UserForm from '../components/UserForm';
import useAuth from '../../../app/providers/useAuth';

/** One page for two routes: /users/new (create) and /users/:userId/edit (edit). */
export default function UserFormPage() {
  const { userId } = useParams();
  const isEdit = Boolean(userId);
  const navigate = useNavigate();
  const { societyId } = useSociety();
  const { user, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const existing = useFetch(() => (isEdit ? userApi.getUser(userId) : Promise.resolve(null)), [userId]);

  if (isEdit && existing.loading && !existing.data) return <FullPageLoader />;
  if (isEdit && existing.error && !existing.data) {
    return (
      <div className="empty-state">
        <h1>Couldn't load this user</h1>
        <p>{getErrorMessage(existing.error)}</p>
        <p>
          <Link to="/users">Back to users</Link>
        </p>
      </div>
    );
  }

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      if (isEdit) {
        const updatedUser = await userApi.updateUser(userId, payload);
        if (String(user?.id) === String(updatedUser.id)) {
          await refreshProfile().catch(() => {});
        }
        navigate(`/users/${userId}`, { state: { notice: 'Profile updated.' } });
      } else {
        const created = await userApi.createUser(payload);
        navigate(`/users/${created.id}`, { state: { notice: 'User created. Assign a role so they can use the system.' } });
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  const initialValues = isEdit
    ? {
        firstName: existing.data.first_name || '',
        lastName: existing.data.last_name || '',
        phone: existing.data.phone || '',
        email: existing.data.email,
        profilePictureUrl: existing.data.profile_picture_url || '',
      }
    : {};

  return (
    <PageContainer
      eyebrow="USER MANAGEMENT"
      title={isEdit ? 'Edit user' : 'New user'}
      subtitle={isEdit ? 'Update the user’s details and profile picture.' : 'Create an account for someone who needs to sign in.'}
      className="user-module-page user-form-page"
    >
      <UserForm
        mode={isEdit ? 'edit' : 'create'}
        initialValues={initialValues}
        societyId={societyId}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitError={submitError}
        cancelTo={isEdit ? `/users/${userId}` : '/users'}
      />
    </PageContainer>
  );
}
