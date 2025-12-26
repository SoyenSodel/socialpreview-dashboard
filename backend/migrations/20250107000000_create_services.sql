-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    service_type TEXT NOT NULL, -- 'web_development', 'social_media', 'seo', 'graphic_design', 'other'
    price REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'paused', 'cancelled'
    start_date TEXT NOT NULL,
    end_date TEXT,
    progress INTEGER NOT NULL DEFAULT 0, -- 0-100 percentage
    notes TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users (id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services (user_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON services (status);
CREATE INDEX IF NOT EXISTS idx_services_created_by ON services (created_by);
CREATE INDEX IF NOT EXISTS idx_services_start_date ON services (start_date);
