// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod accessibility;
use accessibility::is_macos_accessibility_enabled;
use tauri::{CustomMenuItem, Manager};
use tauri::{SystemTray, SystemTrayEvent, SystemTrayMenu};

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    let tray_menu = SystemTrayMenu::new().add_item(quit);

    tauri::Builder::default()
        .system_tray(SystemTray::new().with_menu(tray_menu))
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                app.emit_all("toggle-recording", ()).unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            write_text,
            set_tray_icon,
            is_macos_accessibility_enabled
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use enigo::{Enigo, Keyboard, Settings};

#[tauri::command]
fn write_text(text: String) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    enigo.text(&text).map_err(|e| e.to_string())
}

#[tauri::command]
async fn set_tray_icon(recorder_state: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let icon = match recorder_state.as_str() {
        "IDLE" => include_bytes!("../icons/recorder_state/studio_microphone.png").to_vec(),
        "RECORDING" => include_bytes!("../icons/recorder_state/red_large_square.png").to_vec(),
        "LOADING" => include_bytes!("../icons/recorder_state/arrows_counterclockwise.png").to_vec(),
        _ => return Err("Invalid state. Must be IDLE, RECORDING, or LOADING.".to_string()),
    };
    app_handle
        .tray_handle()
        .set_icon(tauri::Icon::Raw(icon))
        .unwrap();
    Ok(())
}
