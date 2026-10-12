CREATE TABLE quote_analyses (
    id UUID PRIMARY KEY,
    user_id UUID,
    title VARCHAR(200) NOT NULL,
    detail VARCHAR(200) NOT NULL,
    shipper_mail TEXT NOT NULL,
    console_mail TEXT NOT NULL,
    cargo_settings TEXT NOT NULL,
    analysis_result TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_quote_analyses_user_created_at
    ON quote_analyses (user_id, created_at DESC);
