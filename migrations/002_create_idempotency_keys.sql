CREATE TABLE idem_keys(
     id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     key VARCHAR(255) NOT NULL UNIQUE,
     request_hash CHAR(64) NOT NULL,
     response_status INTEGER NOT NULL,
     response_body JSONB NOT NULL,
     created_at TIMESTAMPTZ NOT NULL
)
