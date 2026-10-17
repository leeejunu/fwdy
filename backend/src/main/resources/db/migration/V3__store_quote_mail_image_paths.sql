ALTER TABLE quote_analyses
    ADD COLUMN shipper_image_path TEXT,
    ADD COLUMN console_image_path TEXT;

CREATE POLICY "Authenticated users can upload their quote mail images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'images'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

CREATE POLICY "Authenticated users can read their quote mail images"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'images'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

CREATE POLICY "Authenticated users can delete their quote mail images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'images'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );
