-- ============================================================================
-- SUPABASE STORAGE RLS POLICIES
-- ============================================================================
-- These policies define access control for different storage scenarios
-- Run these in the Supabase SQL Editor (as project owner/admin)
-- ============================================================================

-- 1. PUBLIC JPG IMAGES - Anonymous users can read JPG files from /public folder
-- ============================================================================
CREATE POLICY "Public access to JPG images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'content-images' 
  AND (storage.foldername(name))[1] = 'public'
  AND lower(storage.extension(name)) = 'jpg'
);

-- Alternative: Allow JPG and JPEG files
CREATE POLICY "Public access to JPG and JPEG images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'content-images' 
  AND (storage.foldername(name))[1] = 'public'
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg')
);

-- ============================================================================
-- 2. USER'S OWN FOLDER - Users can only access their own uid folder
-- ============================================================================
CREATE POLICY "Users can access their own uid folder"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload to their own uid folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own uid folder files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete from their own uid folder"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- 3. AUTHENTICATED ONLY FOLDER - Only authenticated users can access
-- ============================================================================
CREATE POLICY "Authenticated users can access auth-only folder"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'authenticated-only'
);

CREATE POLICY "Authenticated users can upload to auth-only folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'authenticated-only'
);

CREATE POLICY "Authenticated users can update auth-only folder"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'authenticated-only'
)
WITH CHECK (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'authenticated-only'
);

CREATE POLICY "Authenticated users can delete from auth-only folder"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'authenticated-only'
);

-- ============================================================================
-- 4. ADMIN/ASSETS - Only a specific user can access
-- ============================================================================
-- Replace 'YOUR-UID-HERE' with the actual user UUID
CREATE POLICY "Admin can access admin/assets folder"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
  AND auth.uid() = 'YOUR-UID-HERE'::uuid
  AND (storage.foldername(name))[1] = 'admin'
  AND (storage.foldername(name))[2] = 'assets'
);

CREATE POLICY "Admin can upload to admin/assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
  AND auth.uid() = 'YOUR-UID-HERE'::uuid
  AND (storage.foldername(name))[1] = 'admin'
  AND (storage.foldername(name))[2] = 'assets'
);

CREATE POLICY "Admin can update admin/assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
  AND auth.uid() = 'YOUR-UID-HERE'::uuid
  AND (storage.foldername(name))[1] = 'admin'
  AND (storage.foldername(name))[2] = 'assets'
)
WITH CHECK (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
  AND auth.uid() = 'YOUR-UID-HERE'::uuid
  AND (storage.foldername(name))[1] = 'admin'
  AND (storage.foldername(name))[2] = 'assets'
);

CREATE POLICY "Admin can delete from admin/assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
  AND auth.uid() = 'YOUR-UID-HERE'::uuid
  AND (storage.foldername(name))[1] = 'admin'
  AND (storage.foldername(name))[2] = 'assets'
);

-- ============================================================================
-- 5. SPECIFIC FILE ACCESS - A specific user can access a specific file
-- ============================================================================
-- Replace:
-- - 'YOUR-UID-HERE' with the actual user UUID
-- - 'path/to/file.jpg' with the actual file path
CREATE POLICY "User access to specific file"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'content-images'
  AND auth.role() = 'authenticated'
  AND auth.uid() = 'YOUR-UID-HERE'::uuid
  AND name = 'path/to/file.jpg'
);

-- ============================================================================
-- 6. CMS CONTENT - Anyone can manage CMS slug folders (no login required yet)
--    (e.g. location-map/, contact-us/, home/, etc.)
--    NOTE: Tighten these policies once authentication is implemented.
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can upload CMS content" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update CMS content" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete CMS content" ON storage.objects;

CREATE POLICY "Anyone can upload CMS content"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'content-images'
);

CREATE POLICY "Anyone can update CMS content"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'content-images'
)
WITH CHECK (
  bucket_id = 'content-images'
);

CREATE POLICY "Anyone can delete CMS content"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'content-images'
);

-- ============================================================================
-- HELPER QUERIES
-- ============================================================================
-- Get your current user's UID (run this to find YOUR-UID-HERE)
-- SELECT auth.uid();

-- View all existing policies on storage.objects
-- SELECT * FROM pg_policies WHERE tablename = 'objects';

-- Drop a specific policy if needed:
-- DROP POLICY IF EXISTS "policy_name" ON storage.objects;

-- ============================================================================
-- DEBUG RESET (use if upload still returns 403 RLS)
-- This removes all INSERT policies on storage.objects, then recreates one
-- permissive policy for the content-images bucket.
-- ============================================================================
-- DO $$
-- DECLARE p RECORD;
-- BEGIN
--   FOR p IN
--     SELECT policyname
--     FROM pg_policies
--     WHERE schemaname = 'storage'
--       AND tablename = 'objects'
--       AND cmd = 'INSERT'
--   LOOP
--     EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
--   END LOOP;
-- END $$;
--
-- CREATE POLICY "Anyone can upload CMS content"
-- ON storage.objects
-- FOR INSERT
-- WITH CHECK (
--   bucket_id = 'content-images'
-- );
--
-- SELECT policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'storage'
--   AND tablename = 'objects'
-- ORDER BY cmd, policyname;
