// Platform-specific modules
#[cfg(target_os = "macos")]
mod accessibility;

// Re-export platform-specific functions
#[cfg(target_os = "macos")]
use accessibility::{is_macos_accessibility_enabled, open_apple_accessibility};

use tauri::Manager;
use tauri_plugin_aptabase::EventTracker;

pub mod recorder;
use recorder::commands::{
    cancel_recording, close_recording_session, enumerate_recording_devices,
    get_current_recording_id, init_recording_session, start_recording, stop_recording, AppData,
};

pub mod whisper_cpp;
use whisper_cpp::transcribe_with_whisper_cpp;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
#[tokio::main]
pub async fn run() {
    let mut builder = tauri::Builder::default();

    // Try to get APTABASE_KEY from environment, use empty string if not found
    let aptabase_key = option_env!("APTABASE_KEY").unwrap_or("");

    // Only add Aptabase plugin if key is not empty
    if !aptabase_key.is_empty() {
        println!("Aptabase analytics enabled");
        builder = builder.plugin(tauri_plugin_aptabase::Builder::new(aptabase_key).build());
    } else {
        println!("Warning: APTABASE_KEY not found, analytics disabled");
    }

    builder = builder
        .plugin(tauri_plugin_websocket::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .manage(AppData::new());

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }));
    }

    // Platform-specific command handlers
    #[cfg(target_os = "macos")]
    let builder = builder.invoke_handler(tauri::generate_handler![
        write_text,
        paste,
        open_apple_accessibility,
        is_macos_accessibility_enabled,
        // Audio recorder commands
        get_current_recording_id,
        enumerate_recording_devices,
        init_recording_session,
        close_recording_session,
        start_recording,
        stop_recording,
        cancel_recording,
        // Whisper transcription
        transcribe_with_whisper_cpp,
    ]);

    #[cfg(not(target_os = "macos"))]
    let builder = builder.invoke_handler(tauri::generate_handler![
        write_text,
        paste,
        // Audio recorder commands
        get_current_recording_id,
        enumerate_recording_devices,
        init_recording_session,
        close_recording_session,
        start_recording,
        stop_recording,
        cancel_recording,
        transcribe_with_whisper_cpp,
    ]);

    let app = builder
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|handler, event| {
        // Only track events if Aptabase is enabled (key is not empty)
        if !aptabase_key.is_empty() {
            match event {
                tauri::RunEvent::Exit { .. } => {
                    let _ = handler.track_event("app_exited", None);
                    handler.flush_events_blocking();
                }
                tauri::RunEvent::Ready { .. } => {
                    let _ = handler.track_event("app_started", None);
                }
                _ => {}
            }
        }
    });
}

use enigo::{Direction, Enigo, Key, Keyboard, Settings};

/// Types text character-by-character at the cursor position using Enigo.
///
/// This simulates keyboard input by typing each character sequentially, which works
/// across all applications but is slower than pasting. Best used as a fallback when
/// paste operations fail or for applications that don't support paste.
///
/// **Note**: This method may have issues with non-ASCII characters in some applications
/// and can appear slow for large text blocks.
#[tauri::command]
fn write_text(text: String) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    enigo.text(&text).map_err(|e| e.to_string())
}

/// Simulates a paste operation (Cmd+V on macOS, Ctrl+V elsewhere).
///
/// **Important**: This assumes text is already in the system clipboard. Call your
/// clipboard service to copy text before using this function.
///
/// **Known Issue**: Uses `Key::Unicode('v')` which assumes QWERTY keyboard layout.
/// This may fail on alternative layouts like Dvorak or Colemak.
#[tauri::command]
fn paste() -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    #[cfg(target_os = "macos")]
    let modifier = Key::Meta;
    #[cfg(not(target_os = "macos"))]
    let modifier = Key::Control;

    enigo
        .key(modifier, Direction::Press)
        .map_err(|e| e.to_string())?;
    enigo
        .key(Key::Unicode('v'), Direction::Click)
        .map_err(|e| e.to_string())?;
    enigo
        .key(modifier, Direction::Release)
        .map_err(|e| e.to_string())?;

    Ok(())
}
