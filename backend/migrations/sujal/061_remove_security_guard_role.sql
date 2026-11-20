-- Guard profiles are identified by their staff record and employee code.
-- They use the shared Security Head account, so remove the extra role that
-- was previously assigned to those shared accounts.
DELETE FROM public.user_roles assigned_role
USING public.roles role
WHERE assigned_role.role_id = role.id
  AND role.code = 'SECURITY_GUARD'
  AND role.society_id IS NULL;

DELETE FROM public.roles
WHERE code = 'SECURITY_GUARD'
  AND society_id IS NULL;
