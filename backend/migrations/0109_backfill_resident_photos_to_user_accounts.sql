-- Existing resident records can have a photo while their linked login account
-- has none. Use the resident photo for those accounts without overwriting an
-- image already managed directly from User Management.
UPDATE users u
SET profile_picture_url = r.profile_photo,
    updated_at = now()
FROM residents r
WHERE r.user_id = u.id
  AND nullif(trim(r.profile_photo), '') IS NOT NULL
  AND nullif(trim(u.profile_picture_url), '') IS NULL;
