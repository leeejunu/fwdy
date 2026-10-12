-- Quote records contain original customer and consolidator emails.
-- Access is intentionally limited to the authenticated backend connection;
-- browser clients must use the API, which enforces ownership from the JWT.
ALTER TABLE quote_analyses ENABLE ROW LEVEL SECURITY;
