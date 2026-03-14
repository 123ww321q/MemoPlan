// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;

use db::{Database, AppState, Note, Task, Tag};
use tauri::{CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem, GlobalShortcutManager, WindowEvent};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Deserialize)]
struct MigrationData {
    notes: String,
    tasks: String,
    settings: String,
}

// Database commands
#[tauri::command]
fn db_add_note(state: tauri::State<AppState>, note: Note) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.add_note(&note).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_update_note(state: tauri::State<AppState>, note: Note) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_note(&note).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_delete_note_permanently(state: tauri::State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_note_permanently(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_get_note_by_id(state: tauri::State<AppState>, id: String) -> Result<Option<Note>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_note_by_id(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_get_all_notes(state: tauri::State<AppState>, include_deleted: bool) -> Result<Vec<Note>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_all_notes(include_deleted).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_search_notes(state: tauri::State<AppState>, query: String) -> Result<Vec<Note>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.search_notes(&query).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_add_task(state: tauri::State<AppState>, task: Task) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.add_task(&task).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_update_task(state: tauri::State<AppState>, task: Task) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_task(&task).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_delete_task(state: tauri::State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_task(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_get_tasks_by_note_id(state: tauri::State<AppState>, note_id: String) -> Result<Vec<Task>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_tasks_by_note_id(&note_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_get_all_tasks(state: tauri::State<AppState>) -> Result<Vec<Task>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_all_tasks().map_err(|e| e.to_string())
}

#[tauri::command]
fn db_add_tag(state: tauri::State<AppState>, tag: Tag) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.add_tag(&tag).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_update_tag(state: tauri::State<AppState>, tag: Tag) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_tag(&tag).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_delete_tag(state: tauri::State<AppState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_tag(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_get_all_tags(state: tauri::State<AppState>) -> Result<Vec<Tag>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_all_tags().map_err(|e| e.to_string())
}

#[tauri::command]
fn db_set_setting(state: tauri::State<AppState>, key: String, value: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.set_setting(&key, &value).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_get_setting(state: tauri::State<AppState>, key: String) -> Result<Option<String>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_setting(&key).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_migrate_from_json(state: tauri::State<AppState>, data: MigrationData) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.migrate_from_json(&data.notes, &data.tasks, &data.settings).map_err(|e| e.to_string())
}

// Window control commands
#[tauri::command]
fn show_window(window: tauri::Window) {
    let _ = window.show();
    let _ = window.set_focus();
}

#[tauri::command]
fn hide_window(window: tauri::Window) {
    let _ = window.hide();
}

#[tauri::command]
fn quit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}

fn main() {
    // System tray menu
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show", "显示 MemoPlan"))
        .add_item(CustomMenuItem::new("new_note", "新建笔记"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit", "退出"));

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| {
            match event {
                SystemTrayEvent::LeftClick {
                    position: _,
                    size: _,
                    ..
                } => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                SystemTrayEvent::MenuItemClick { id, .. } => {
                    match id.as_str() {
                        "show" => {
                            if let Some(window) = app.get_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "new_note" => {
                            if let Some(window) = app.get_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.emit("new-note", ());
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        })
        .setup(|app| {
            // Initialize database
            let app_dir = app.path_resolver().app_data_dir().expect("Failed to get app data dir");
            let db = Database::new(app_dir).expect("Failed to initialize database");
            app.manage(AppState { db: std::sync::Mutex::new(db) });

            // Register global shortcuts
            let window = app.get_window("main").unwrap();
            let window_clone = window.clone();
            
            app.global_shortcut_manager()
                .register("CmdOrCtrl+Shift+N", move || {
                    let _ = window_clone.show();
                    let _ = window_clone.set_focus();
                    let _ = window_clone.emit("new-note", ());
                })
                .expect("Failed to register global shortcut: CmdOrCtrl+Shift+N");

            let window_clone2 = window.clone();
            app.global_shortcut_manager()
                .register("CmdOrCtrl+Shift+M", move || {
                    if window_clone2.is_visible().unwrap_or(true) {
                        let _ = window_clone2.hide();
                    } else {
                        let _ = window_clone2.show();
                        let _ = window_clone2.set_focus();
                    }
                })
                .expect("Failed to register global shortcut: CmdOrCtrl+Shift+M");

            let window_clone3 = window.clone();
            app.global_shortcut_manager()
                .register("CmdOrCtrl+Shift+F", move || {
                    let _ = window_clone3.show();
                    let _ = window_clone3.set_focus();
                    let _ = window_clone3.emit("focus-search", ());
                })
                .expect("Failed to register global shortcut: CmdOrCtrl+Shift+F");

            Ok(())
        })
        .on_window_event(|event| {
            match event.event() {
                WindowEvent::CloseRequested { api, .. } => {
                    // Hide window instead of closing when clicking X
                    event.window().hide().unwrap();
                    api.prevent_close();
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            db_add_note,
            db_update_note,
            db_delete_note_permanently,
            db_get_note_by_id,
            db_get_all_notes,
            db_search_notes,
            db_add_task,
            db_update_task,
            db_delete_task,
            db_get_tasks_by_note_id,
            db_get_all_tasks,
            db_add_tag,
            db_update_tag,
            db_delete_tag,
            db_get_all_tags,
            db_set_setting,
            db_get_setting,
            db_migrate_from_json,
            show_window,
            hide_window,
            quit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
