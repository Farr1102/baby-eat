CREATE TABLE IF NOT EXISTS baby (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  gender INTEGER NOT NULL DEFAULT 0,
  born_at TEXT NOT NULL,
  avatar INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

CREATE TABLE IF NOT EXISTS event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '',
  extra_fields TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

CREATE TABLE IF NOT EXISTS event_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  event_time TEXT,
  comment TEXT,
  extra TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

CREATE TABLE IF NOT EXISTS moment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'moment',
  attachments TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours'))
);

CREATE TABLE IF NOT EXISTS session (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+8 hours')),
  FOREIGN KEY (user_id) REFERENCES user(id)
);

-- Seed default events (baby tracking essentials)
INSERT OR IGNORE INTO event (name, display_name, icon, extra_fields) VALUES
('Feed', '喂养', '🍼', '[{"name":"type","displayName":"类型","type":"radio","enums":["Breast","Formula"],"userInput":true},{"name":"milkVolume","displayName":"奶量(ml)","type":"number","userInput":true}]'),
('Diaper', '尿布', '🩲', '[{"name":"source","displayName":"类型","type":"radio","enums":["Wet","Dirty","Both"],"userInput":true}]'),
('Sleep', '睡眠', '😴', '[{"name":"duration","displayName":"时长(分钟)","type":"number","userInput":true}]'),
('Weigh', '体重', '⚖️', '[{"name":"weight","displayName":"体重(kg)","type":"number","userInput":true}]'),
('Bath', '洗澡', '🛁', '[]'),
('Pump', '吸奶', '🤱', '[{"name":"volume","displayName":"奶量(ml)","type":"number","userInput":true}]'),
('Supplement', '补剂', '💊', '[{"name":"type","displayName":"类型","type":"text","userInput":true}]');
