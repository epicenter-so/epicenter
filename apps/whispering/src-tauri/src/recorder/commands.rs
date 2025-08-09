use crate::recorder::recorder::{AudioRecording, RecorderState, Result};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Manager, State};
use tracing::{debug, info};

/// Application state containing the recorder
pub struct AppData {
    pub recorder: Mutex<RecorderState>,
}

impl AppData {
    pub fn new() -> Self {
        Self {
            recorder: Mutex::new(RecorderState::new()),
        }
    }
}

#[tauri::command]
pub async fn enumerate_recording_devices(state: State<'_, AppData>) -> Result<Vec<String>> {
    debug!("Enumerating recording devices");
    let recorder = state.recorder.lock()
        .map_err(|e| format!("Failed to lock recorder: {}", e))?;
    recorder.enumerate_devices()
}

#[tauri::command]
pub async fn init_recording_session(
    device_identifier: String,
    recording_id: String,
    output_folder: Option<String>,
    sample_rate: Option<u32>,
    state: State<'_, AppData>,
    app_handle: tauri::AppHandle,
) -> Result<()> {
    info!("Initializing recording session: device={}, id={}, folder={:?}, sample_rate={:?}", 
          device_identifier, recording_id, output_folder, sample_rate);
    
    // Determine output directory
    let recordings_dir = if let Some(folder) = output_folder {
        // Use user-specified folder
        let path = PathBuf::from(folder);
        // Validate the path exists and is a directory
        if !path.exists() {
            return Err(format!("Output folder does not exist: {:?}", path));
        }
        if !path.is_dir() {
            return Err(format!("Output path is not a directory: {:?}", path));
        }
        path
    } else {
        // Use default app data directory
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data dir: {}", e))?;
        
        let default_dir = app_data_dir.join("recordings");
        std::fs::create_dir_all(&default_dir)
            .map_err(|e| format!("Failed to create recordings dir: {}", e))?;
        default_dir
    };
    
    // Initialize the session with optional sample rate
    let mut recorder = state.recorder.lock()
        .map_err(|e| format!("Failed to lock recorder: {}", e))?;
    recorder.init_session(device_identifier, recordings_dir, recording_id, sample_rate)
}

#[tauri::command]
pub async fn start_recording(state: State<'_, AppData>) -> Result<()> {
    info!("Starting recording");
    let mut recorder = state.recorder.lock()
        .map_err(|e| format!("Failed to lock recorder: {}", e))?;
    recorder.start_recording()
}

#[tauri::command]
pub async fn stop_recording(state: State<'_, AppData>) -> Result<AudioRecording> {
    info!("Stopping recording");
    let mut recorder = state.recorder.lock()
        .map_err(|e| format!("Failed to lock recorder: {}", e))?;
    recorder.stop_recording()
}

#[tauri::command]
pub async fn cancel_recording(state: State<'_, AppData>) -> Result<()> {
    info!("Cancelling recording");
    let mut recorder = state.recorder.lock()
        .map_err(|e| format!("Failed to lock recorder: {}", e))?;
    recorder.cancel_recording()
}

#[tauri::command]
pub async fn close_recording_session(state: State<'_, AppData>) -> Result<()> {
    info!("Closing recording session");
    let mut recorder = state.recorder.lock()
        .map_err(|e| format!("Failed to lock recorder: {}", e))?;
    recorder.close_session()
}

#[tauri::command]
pub async fn get_current_recording_id(state: State<'_, AppData>) -> Result<Option<String>> {
    debug!("Getting current recording ID");
    let recorder = state.recorder.lock()
        .map_err(|e| format!("Failed to lock recorder: {}", e))?;
    Ok(recorder.get_current_recording_id())
}

