import { useDashboardFeedback } from '../../../lib/useDashboardFeedback.js';
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
import securityApi from '../../security/api/security-operations.api';

/** One page for two routes: /users/new (create) and /users/:userId/edit (edit). */
export default function UserFormPage() {
  const { userId, staffId } = useParams();
  const isGuardEdit = Boolean(staffId);
  const isEdit = Boolean(userId || staffId);
  const navigate = useNavigate();
  const { societyId } = useSociety();
  const { user, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useDashboardFeedback('', 'error');

  const existing = useFetch(() => (isEdit && !isGuardEdit ? userApi.getUser(userId) : Promise.resolve(null)), [userId, isGuardEdit]);
  const guardProfile = useFetch(() => (isGuardEdit ? securityApi.getStaffById(staffId) : Promise.resolve(null)), [staffId]);

  if (isEdit && (isGuardEdit ? guardProfile.loading : existing.loading) && !(isGuardEdit ? guardProfile.data : existing.data)) return <FullPageLoader />;
  const loadError = isGuardEdit ? guardProfile.error : existing.error;
  const loadedRecord = isGuardEdit ? guardProfile.data : existing.data;
  if (isEdit && loadError && !loadedRecord) {
    return (
      <div className="empty-state">
        <h1>Couldn't load this user</h1>
        <p>{getErrorMessage(loadError)}</p>
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
      if (isGuardEdit) {
        const staffPayload = { ...payload };
        if (Object.hasOwn(staffPayload, 'phone')) {
          staffPayload.mobileNumber = staffPayload.phone;
          delete staffPayload.phone;
        }
        await securityApi.updateStaff(staffId, staffPayload);
        navigate('/users', { state: { notice: 'User profile updated.' } });
      } else if (isEdit) {
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

  const initialValues = isGuardEdit
    ? {
        firstName: loadedRecord?.firstName || '',
        lastName: loadedRecord?.lastName || '',
        phone: loadedRecord?.mobileNumber || '',
        email: loadedRecord?.email || '',
        profilePictureUrl: loadedRecord?.photoPath || '',
      }
    : isEdit
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
        cancelTo={isGuardEdit ? '/users' : isEdit ? `/users/${userId}` : '/users'}
      />
    </PageContainer>
  );
}
