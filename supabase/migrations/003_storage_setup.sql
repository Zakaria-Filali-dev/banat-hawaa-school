-- 📁 Storage Buckets Setup
-- Run these commands in your Supabase SQL Editor after setting up storage

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('document-uploads', 'document-uploads', false),
    ('assignment-submissions', 'assignment-submissions', false),
    ('profile-avatars', 'profile-avatars', true),
    ('public-assets', 'public-assets', true);

-- DOCUMENT UPLOADS POLICIES
CREATE POLICY "Authenticated users can view documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'document-uploads' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Teachers and admins can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'document-uploads' AND
        auth.role() = 'authenticated' AND
        (get_user_role(auth.uid()) IN ('teacher', 'admin'))
    );

CREATE POLICY "Uploaders can delete their documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'document-uploads' AND
        auth.uid() = owner
    );

-- ASSIGNMENT SUBMISSIONS POLICIES
CREATE POLICY "Students can upload their submissions" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'assignment-submissions' AND
        auth.role() = 'authenticated' AND
        get_user_role(auth.uid()) = 'student'
    );

CREATE POLICY "Students can view their submissions" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'assignment-submissions' AND
        auth.uid() = owner
    );

CREATE POLICY "Teachers can view submissions in their subjects" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'assignment-submissions' AND
        auth.role() = 'authenticated' AND
        get_user_role(auth.uid()) = 'teacher'
        -- Additional logic needed to check if submission belongs to teacher's subject
    );

-- PROFILE AVATARS POLICIES (Public bucket)
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users can upload their avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-avatars' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-avatars' AND
        auth.uid() = owner
    );

CREATE POLICY "Users can delete their avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-avatars' AND
        auth.uid() = owner
    );

-- PUBLIC ASSETS POLICIES (Public bucket)
CREATE POLICY "Anyone can view public assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'public-assets');

CREATE POLICY "Admins can manage public assets" ON storage.objects
    FOR ALL USING (
        bucket_id = 'public-assets' AND
        is_admin(auth.uid())
    );
