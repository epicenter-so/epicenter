
use tauri::Manager;
use tauri_plugin_aptabase::EventTracker;

pub mod recorder;
use recorder::commands::{
    cancel_recording, close_recording_session, enumerate_recording_devices,
    get_current_recording_id, init_recording_session, start_recording, stop_recording, AppData,
};

pub mod whisper_cpp;
use whisper_cpp::transcribe_with_whisper_cpp;

pub mod windows_path;
use windows_path::fix_windows_path;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
#[tokio::main]
pub async fn run() {
    // Fix PATH environment for GUI applications on macOS and Linux
    // This ensures commands like ffmpeg installed via Homebrew are accessible
    let _ = fix_path_env::fix();
    
    // Fix Windows PATH inheritance bug
    // This ensures child processes can find ffmpeg on Windows
    fix_windows_path();
    
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
        .plugin(tauri_plugin_macos_permissions::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
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

    // Register command handlers (same for all platforms now)
    let builder = builder.invoke_handler(tauri::generate_handler![
        write_text,
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
        // Native HTTP transcription (bypasses CORS)
        native_openai_transcribe,
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
use tauri_plugin_clipboard_manager::ClipboardExt;

/// Writes text at the cursor position using the clipboard sandwich technique
///
/// This method preserves the user's existing clipboard content by:
/// 1. Saving the current clipboard content
/// 2. Writing the new text to clipboard
/// 3. Simulating a paste operation (Cmd+V on macOS, Ctrl+V elsewhere)
/// 4. Restoring the original clipboard content
///
/// This approach is faster than typing character-by-character and preserves
/// the user's clipboard, making it ideal for inserting transcribed text.
#[tauri::command]
async fn write_text(app: tauri::AppHandle, text: String) -> Result<(), String> {
    // 1. Save current clipboard content
    let original_clipboard = app.clipboard().read_text().ok();

    // 2. Write new text to clipboard
    app.clipboard()
        .write_text(&text)
        .map_err(|e| format!("Failed to write to clipboard: {}", e))?;

    // Small delay to ensure clipboard is updated
    tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

    // 3. Simulate paste operation using virtual key codes (layout-independent)
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    
    // Use virtual key codes for V to work with any keyboard layout
    #[cfg(target_os = "macos")]
    let (modifier, v_key) = (Key::Meta, Key::Other(9)); // Virtual key code for V on macOS
    #[cfg(target_os = "windows")]
    let (modifier, v_key) = (Key::Control, Key::Other(0x56)); // VK_V on Windows
    #[cfg(target_os = "linux")]
    let (modifier, v_key) = (Key::Control, Key::Unicode('v')); // Fallback for Linux

    // Press modifier + V
    enigo
        .key(modifier, Direction::Press)
        .map_err(|e| format!("Failed to press modifier key: {}", e))?;
    enigo
        .key(v_key, Direction::Press)
        .map_err(|e| format!("Failed to press V key: {}", e))?;
    
    // Release V + modifier (in reverse order for proper cleanup)
    enigo
        .key(v_key, Direction::Release)
        .map_err(|e| format!("Failed to release V key: {}", e))?;
    enigo
        .key(modifier, Direction::Release)
        .map_err(|e| format!("Failed to release modifier key: {}", e))?;

    // Small delay to ensure paste completes
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    // 4. Restore original clipboard content
    if let Some(content) = original_clipboard {
        app.clipboard()
            .write_text(&content)
            .map_err(|e| format!("Failed to restore clipboard: {}", e))?;
    }

    Ok(())
}

/// Native HTTP transcription that bypasses CORS restrictions
/// Uses Tauri's native HTTP client instead of browser fetch
#[tauri::command]
async fn native_openai_transcribe(
    api_key: String,
    base_url: Option<String>,
    model: String,
    audio_blob: Vec<u8>,
    language: Option<String>,
    prompt: Option<String>,
    temperature: Option<f32>,
) -> Result<String, String> {
    use tauri_plugin_http::reqwest;
    
    // Use custom base URL or default OpenAI endpoint
    let url = match base_url {
        Some(custom_url) => format!("{}/audio/transcriptions", custom_url.trim_end_matches('/')),
        None => "https://api.openai.com/v1/audio/transcriptions".to_string(),
    };
    
    // Create multipart form
    let form = reqwest::multipart::Form::new()
        .text("model", model)
        .part(
            "file",
            reqwest::multipart::Part::bytes(audio_blob)
                .file_name("recording.webm")
                .mime_str("audio/webm")
                .map_err(|e| format!("Invalid MIME type: {}", e))?
        );
    
    // Add optional parameters
    let form = if let Some(lang) = language {
        form.text("language", lang)
    } else {
        form
    };
    
    let form = if let Some(p) = prompt {
        if !p.is_empty() {
            form.text("prompt", p)
        } else {
            form
        }
    } else {
        form
    };
    
    let form = if let Some(temp) = temperature {
        form.text("temperature", temp.to_string())
    } else {
        form
    };
    
    // Make the request using Tauri's native HTTP client
    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;
    
    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, error_text));
    }
    
    let response_json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response JSON: {}", e))?;
    
    // Extract transcription text
    response_json
        .get("text")
        .and_then(|t| t.as_str())
        .map(|s| s.trim().to_string())
        .ok_or_else(|| "No 'text' field in response".to_string())
}

