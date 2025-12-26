-- Future Plans table (for company roadmap and long-term goals)
CREATE TABLE IF NOT EXISTS future_plans (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('service', 'expansion', 'technology', 'team', 'other')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT NOT NULL CHECK (status IN ('idea', 'planned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'idea',
    target_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Schedule table (for work schedule/roster)
CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('shift', 'meeting', 'project', 'deadline', 'other')),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('meeting', 'deadline', 'milestone', 'reminder', 'other')),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    all_day BOOLEAN NOT NULL DEFAULT FALSE,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_future_plans_status ON future_plans(status);
CREATE INDEX idx_future_plans_category ON future_plans(category);
CREATE INDEX idx_future_plans_target_date ON future_plans(target_date);
CREATE INDEX idx_schedules_user_id ON schedules(user_id);
CREATE INDEX idx_schedules_start_time ON schedules(start_time);
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_event_type ON calendar_events(event_type);
