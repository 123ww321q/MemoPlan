use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::fs;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub tags: String, // JSON array stored as string
    pub is_pinned: bool,
    pub is_favorite: bool,
    pub is_archived: bool,
    pub is_deleted: bool,
    pub deleted_at: Option<i64>,
    pub color: Option<String>,
    pub font_size: Option<i32>,
    pub font_family: Option<String>,
    pub category: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub note_id: String,
    pub title: String,
    pub completed: bool,
    pub priority: String,
    pub due_date: Option<i64>,
    pub level: i32,
    pub parent_id: Option<String>,
    pub order_index: i32,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub created_at: i64,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(app_dir: PathBuf) -> Result<Self> {
        let db_path = app_dir.join("memoplan.db");
        
        // Ensure directory exists
        if let Some(parent) = db_path.parent() {
            fs::create_dir_all(parent)?;
        }
        
        let conn = Connection::open(&db_path)?;
        let db = Database { conn };
        db.init_tables()?;
        
        Ok(db)
    }

    fn init_tables(&self) -> Result<()> {
        // Notes table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL DEFAULT '',
                tags TEXT NOT NULL DEFAULT '[]',
                is_pinned BOOLEAN NOT NULL DEFAULT 0,
                is_favorite BOOLEAN NOT NULL DEFAULT 0,
                is_archived BOOLEAN NOT NULL DEFAULT 0,
                is_deleted BOOLEAN NOT NULL DEFAULT 0,
                deleted_at INTEGER,
                color TEXT,
                font_size INTEGER,
                font_family TEXT,
                category TEXT NOT NULL DEFAULT 'notes',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Tasks table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                note_id TEXT NOT NULL,
                title TEXT NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT 0,
                priority TEXT NOT NULL DEFAULT 'medium',
                due_date INTEGER,
                level INTEGER NOT NULL DEFAULT 0,
                parent_id TEXT,
                order_index INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Tags table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS tags (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                color TEXT,
                created_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Note-Tags relationship table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS note_tags (
                note_id TEXT NOT NULL,
                tag_id TEXT NOT NULL,
                PRIMARY KEY (note_id, tag_id),
                FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Settings table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Create indexes for better search performance
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_search ON notes(title, content)",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_deleted ON notes(is_deleted)",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category)",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_note_id ON tasks(note_id)",
            [],
        )?;

        Ok(())
    }

    // Note operations
    pub fn add_note(&self, note: &Note) -> Result<()> {
        self.conn.execute(
            "INSERT INTO notes (id, title, content, tags, is_pinned, is_favorite, is_archived, 
             is_deleted, deleted_at, color, font_size, font_family, category, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            params![
                note.id, note.title, note.content, note.tags, note.is_pinned, 
                note.is_favorite, note.is_archived, note.is_deleted, note.deleted_at,
                note.color, note.font_size, note.font_family, note.category,
                note.created_at, note.updated_at
            ],
        )?;
        Ok(())
    }

    pub fn update_note(&self, note: &Note) -> Result<()> {
        self.conn.execute(
            "UPDATE notes SET 
             title = ?2, content = ?3, tags = ?4, is_pinned = ?5, is_favorite = ?6,
             is_archived = ?7, is_deleted = ?8, deleted_at = ?9, color = ?10,
             font_size = ?11, font_family = ?12, category = ?13, updated_at = ?14
             WHERE id = ?1",
            params![
                note.id, note.title, note.content, note.tags, note.is_pinned,
                note.is_favorite, note.is_archived, note.is_deleted, note.deleted_at,
                note.color, note.font_size, note.font_family, note.category,
                note.updated_at
            ],
        )?;
        Ok(())
    }

    pub fn delete_note_permanently(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM notes WHERE id = ?1", [id])?;
        Ok(())
    }

    pub fn get_note_by_id(&self, id: &str) -> Result<Option<Note>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, content, tags, is_pinned, is_favorite, is_archived,
             is_deleted, deleted_at, color, font_size, font_family, category, created_at, updated_at
             FROM notes WHERE id = ?1"
        )?;
        
        let note = stmt.query_row([id], |row| {
            Ok(Note {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                tags: row.get(3)?,
                is_pinned: row.get(4)?,
                is_favorite: row.get(5)?,
                is_archived: row.get(6)?,
                is_deleted: row.get(7)?,
                deleted_at: row.get(8)?,
                color: row.get(9)?,
                font_size: row.get(10)?,
                font_family: row.get(11)?,
                category: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        });

        match note {
            Ok(n) => Ok(Some(n)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn get_all_notes(&self, include_deleted: bool) -> Result<Vec<Note>> {
        let sql = if include_deleted {
            "SELECT id, title, content, tags, is_pinned, is_favorite, is_archived,
             is_deleted, deleted_at, color, font_size, font_family, category, created_at, updated_at
             FROM notes ORDER BY is_pinned DESC, updated_at DESC"
        } else {
            "SELECT id, title, content, tags, is_pinned, is_favorite, is_archived,
             is_deleted, deleted_at, color, font_size, font_family, category, created_at, updated_at
             FROM notes WHERE is_deleted = 0 ORDER BY is_pinned DESC, updated_at DESC"
        };

        let mut stmt = self.conn.prepare(sql)?;
        let notes = stmt.query_map([], |row| {
            Ok(Note {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                tags: row.get(3)?,
                is_pinned: row.get(4)?,
                is_favorite: row.get(5)?,
                is_archived: row.get(6)?,
                is_deleted: row.get(7)?,
                deleted_at: row.get(8)?,
                color: row.get(9)?,
                font_size: row.get(10)?,
                font_family: row.get(11)?,
                category: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        })?;

        notes.collect()
    }

    pub fn search_notes(&self, query: &str) -> Result<Vec<Note>> {
        let search_pattern = format!("%{}%", query);
        let mut stmt = self.conn.prepare(
            "SELECT id, title, content, tags, is_pinned, is_favorite, is_archived,
             is_deleted, deleted_at, color, font_size, font_family, category, created_at, updated_at
             FROM notes 
             WHERE is_deleted = 0 
             AND (title LIKE ?1 OR content LIKE ?2 OR tags LIKE ?3)
             ORDER BY is_pinned DESC, updated_at DESC"
        )?;

        let notes = stmt.query_map([&search_pattern, &search_pattern, &search_pattern], |row| {
            Ok(Note {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                tags: row.get(3)?,
                is_pinned: row.get(4)?,
                is_favorite: row.get(5)?,
                is_archived: row.get(6)?,
                is_deleted: row.get(7)?,
                deleted_at: row.get(8)?,
                color: row.get(9)?,
                font_size: row.get(10)?,
                font_family: row.get(11)?,
                category: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        })?;

        notes.collect()
    }

    // Task operations
    pub fn add_task(&self, task: &Task) -> Result<()> {
        self.conn.execute(
            "INSERT INTO tasks (id, note_id, title, completed, priority, due_date, level, parent_id, order_index, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                task.id, task.note_id, task.title, task.completed, task.priority,
                task.due_date, task.level, task.parent_id, task.order_index,
                task.created_at, task.updated_at
            ],
        )?;
        Ok(())
    }

    pub fn update_task(&self, task: &Task) -> Result<()> {
        self.conn.execute(
            "UPDATE tasks SET 
             title = ?2, completed = ?3, priority = ?4, due_date = ?5,
             level = ?6, parent_id = ?7, order_index = ?8, updated_at = ?9
             WHERE id = ?1",
            params![
                task.id, task.title, task.completed, task.priority, task.due_date,
                task.level, task.parent_id, task.order_index, task.updated_at
            ],
        )?;
        Ok(())
    }

    pub fn delete_task(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM tasks WHERE id = ?1", [id])?;
        Ok(())
    }

    pub fn get_tasks_by_note_id(&self, note_id: &str) -> Result<Vec<Task>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, note_id, title, completed, priority, due_date, level, parent_id, order_index, created_at, updated_at
             FROM tasks WHERE note_id = ?1 ORDER BY order_index ASC"
        )?;

        let tasks = stmt.query_map([note_id], |row| {
            Ok(Task {
                id: row.get(0)?,
                note_id: row.get(1)?,
                title: row.get(2)?,
                completed: row.get(3)?,
                priority: row.get(4)?,
                due_date: row.get(5)?,
                level: row.get(6)?,
                parent_id: row.get(7)?,
                order_index: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?;

        tasks.collect()
    }

    pub fn get_all_tasks(&self) -> Result<Vec<Task>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, note_id, title, completed, priority, due_date, level, parent_id, order_index, created_at, updated_at
             FROM tasks ORDER BY created_at DESC"
        )?;

        let tasks = stmt.query_map([], |row| {
            Ok(Task {
                id: row.get(0)?,
                note_id: row.get(1)?,
                title: row.get(2)?,
                completed: row.get(3)?,
                priority: row.get(4)?,
                due_date: row.get(5)?,
                level: row.get(6)?,
                parent_id: row.get(7)?,
                order_index: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?;

        tasks.collect()
    }

    // Tag operations
    pub fn add_tag(&self, tag: &Tag) -> Result<()> {
        self.conn.execute(
            "INSERT INTO tags (id, name, color, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![tag.id, tag.name, tag.color, tag.created_at],
        )?;
        Ok(())
    }

    pub fn update_tag(&self, tag: &Tag) -> Result<()> {
        self.conn.execute(
            "UPDATE tags SET name = ?2, color = ?3 WHERE id = ?1",
            params![tag.id, tag.name, tag.color],
        )?;
        Ok(())
    }

    pub fn delete_tag(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM tags WHERE id = ?1", [id])?;
        Ok(())
    }

    pub fn get_all_tags(&self) -> Result<Vec<Tag>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, color, created_at FROM tags ORDER BY name ASC"
        )?;

        let tags = stmt.query_map([], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?;

        tags.collect()
    }

    // Settings operations
    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        let now = Utc::now().timestamp_millis();
        self.conn.execute(
            "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3)",
            params![key, value, now],
        )?;
        Ok(())
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let mut stmt = self.conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
        let result = stmt.query_row([key], |row| row.get(0));
        
        match result {
            Ok(v) => Ok(Some(v)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    // Migration from localStorage
    pub fn migrate_from_json(&self, notes_json: &str, tasks_json: &str, settings_json: &str) -> Result<()> {
        // Parse and migrate notes
        if let Ok(notes) = serde_json::from_str::<Vec<Note>>(notes_json) {
            for note in notes {
                let _ = self.add_note(&note);
            }
        }

        // Parse and migrate tasks
        if let Ok(tasks) = serde_json::from_str::<Vec<Task>>(tasks_json) {
            for task in tasks {
                let _ = self.add_task(&task);
            }
        }

        // Migrate settings
        if let Ok(settings) = serde_json::from_str::<serde_json::Value>(settings_json) {
            if let Some(obj) = settings.as_object() {
                for (key, value) in obj {
                    if let Ok(value_str) = serde_json::to_string(value) {
                        let _ = self.set_setting(key, &value_str);
                    }
                }
            }
        }

        Ok(())
    }
}

// Global database instance (will be managed by Tauri state)
use std::sync::Mutex;

pub struct AppState {
    pub db: Mutex<Database>,
}
