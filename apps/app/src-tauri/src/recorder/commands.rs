use crate::recorder::manager::{AudioManager, DeviceInfo, Result};
use crate::recorder::RecorderError;
use std::sync::Mutex;
use tauri::State;
use tracing::{debug, info};

pub struct AppData {
    pub audio_manager: Mutex<AudioManager>,
}

impl AppData {
    pub fn new() -> Self {
        Self {
            audio_manager: Mutex::new(AudioManager::new()),
        }
    }
}

#[tauri::command]
pub async fn ensure_thread_initialized(state: State<'_, AppData>) -> Result<()> {
    debug!("Ensuring thread is initialized...");
    let mut audio_manager = state
        .audio_manager
        .lock()
        .map_err(|e| RecorderError::LockError(e.to_string()))?;

    audio_manager.ensure_initialized()
}

#[tauri::command]
pub async fn enumerate_recording_devices(state: State<'_, AppData>) -> Result<Vec<DeviceInfo>> {
    debug!("Enumerating recording devices");
    let mut audio_manager = state
        .audio_manager
        .lock()
        .map_err(|e| RecorderError::LockError(e.to_string()))?;

    audio_manager.enumerate_recording_devices()
}

#[tauri::command]
pub async fn init_recording_session(device_name: String, state: State<'_, AppData>) -> Result<()> {
    info!(
        "Starting init_recording_session with device_name: {}",
        device_name
    );
    let mut audio_manager = state
        .audio_manager
        .lock()
        .map_err(|e| RecorderError::LockError(e.to_string()))?;

    audio_manager.init_recording_session(device_name)
}

#[tauri::command]
pub async fn close_recording_session(state: State<'_, AppData>) -> Result<()> {
    let mut audio_manager = state
        .audio_manager
        .lock()
        .map_err(|e| RecorderError::LockError(e.to_string()))?;

    audio_manager.close_recording_session()
}

#[tauri::command]
pub async fn close_thread(state: State<'_, AppData>) -> Result<()> {
    let mut audio_manager = state
        .audio_manager
        .lock()
        .map_err(|e| RecorderError::LockError(e.to_string()))?;

    audio_manager.close_thread()
}

#[tauri::command]
pub async fn get_recorder_state(state: State<'_, AppData>) -> Result<String> {
    let mut audio_manager = state
        .audio_manager
        .lock()
        .map_err(|e| RecorderError::LockError(e.to_string()))?;

    audio_manager.get_recorder_state()
}

#[tauri::command]
pub async fn start_recording(state: State<'_, AppData>) -> Result<()> {
    let mut audio_manager = state
        .audio_manager
        .lock()
        .map_err(|e| RecorderError::LockError(e.to_string()))?;

    audio_manager.start_recording()
}

#[tauri::command]
pub async fn stop_recording(state: State<'_, AppData>) -> Result<Vec<f32>> {
    debug!("Stopping recording");
    let mut audio_manager = state
        .audio_manager
        .lock()
        .map_err(|e| RecorderError::LockError(e.to_string()))?;

    audio_manager.stop_recording()
}

#[tauri::command]
pub async fn cancel_recording(state: State<'_, AppData>) -> Result<()> {
    debug!("Canceling recording");
    let mut audio_manager = state
        .audio_manager
        .lock()
        .map_err(|e| RecorderError::LockError(e.to_string()))?;

    audio_manager.cancel_recording()
}
