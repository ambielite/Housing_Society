-- Show existing security-guard staff photos on their linked user records
-- when the user has no separately uploaded profile picture.
UPDATE public.users u
SET profile_picture_url = s.photo_path,
    updated_at = now()
FROM public.security_guards g
JOIN public.staff s ON s.id = g.staff_id
WHERE g.user_id = u.id
  AND s.staff_type = 'SECURITY_GUARD'
  AND nullif(trim(s.photo_path), '') IS NOT NULL
  AND nullif(trim(u.profile_picture_url), '') IS NULL;
