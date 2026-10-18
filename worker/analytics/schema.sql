-- Dedicated analytics database. Never store customer data, raw URLs, IPs or UAs.
CREATE TABLE IF NOT EXISTS events (
 event_id TEXT PRIMARY KEY,
 is_entry INTEGER NOT NULL DEFAULT 0 CHECK(is_entry IN (0,1)),
 occurred_at TEXT NOT NULL,
 environment TEXT NOT NULL CHECK(environment IN ('live','test')),
 event_name TEXT NOT NULL CHECK(event_name IN ('page_view','coaching_view','first_call_click','first_call_submit','training_plan_view','training_plans_view','plan_select','checkout_start','purchase_success','app_click')),
 page_path TEXT NOT NULL,
 source TEXT NOT NULL,
 campaign TEXT NOT NULL DEFAULT '',
 content TEXT NOT NULL DEFAULT '',
 device TEXT NOT NULL,
 country TEXT NOT NULL DEFAULT 'unknown',
 plan_id TEXT NOT NULL DEFAULT '',
 cta_location TEXT NOT NULL DEFAULT '',
 amount_minor INTEGER NOT NULL DEFAULT 0 CHECK(amount_minor >= 0),
 currency TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS events_period ON events(environment,occurred_at,event_name);
CREATE INDEX IF NOT EXISTS events_products ON events(environment,plan_id,event_name,occurred_at);
