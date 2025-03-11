use super::thread::{spawn_audio_thread, AudioCommand, AudioResponse};
use once_cell::sync::Lazy;
use serde::Serialize;
use std::sync::mpsc::{self, Receiver, Sender};
use std::sync::Mutex;
use thiserror::Error;
use tracing::{debug, error, info};

// Global static mutex to hold the audio thread sender and state
static AUDIO_THREAD: Lazy<Mutex<Option<(Sender<AudioCommand>, Receiver<AudioResponse>)>>> =
    Lazy::new(|| Mutex::new(None));

// Track current recording state
static IS_RECORDING: Lazy<Mutex<bool>> = Lazy::new(|| Mutex::new(false));

#[derive(Debug, Error, Serialize)]
pub enum RecorderError {
    #[error("Audio thread not initialized")]
    ThreadNotInitialized,
    #[error("Failed to send command: {0}")]
    SendError(String),
    #[error("Failed to receive response: {0}")]
    ReceiveError(String),
    #[error("Audio error: {0}")]
    AudioError(String),
    #[error("No active recording")]
    NoActiveRecording,
    #[error("Failed to acquire lock: {0}")]
    LockError(String),
}

pub type Result<T> = std::result::Result<T, RecorderError>;

pub fn ensure_thread_initialized() -> Result<()> {
    debug!("Ensuring thread is initialized...");
    let mut thread = AUDIO_THREAD
        .lock()
        .map_err(|e| RecorderError::LockError(e.to_string()))?;

    if thread.is_some() {
        debug!("Thread already initialized");
        return Ok(());
    }

    debug!("Thread not initialized, creating new audio thread...");
    let (response_tx, response_rx) = mpsc::channel();

    let command_tx =
        spawn_audio_thread(response_tx).map_err(|e| RecorderError::SendError(e.to_string()))?;

    *thread = Some((command_tx, response_rx));

    info!("Audio thread created successfully");
    Ok(())
}

fn with_thread<F, T>(f: F) -> Result<T>
where
    F: FnOnce(&Sender<AudioCommand>, &Receiver<AudioResponse>) -> Result<T>,
{
    ensure_thread_initialized()?;
    let thread = AUDIO_THREAD
        .lock()
        .map_err(|e| RecorderError::LockError(e.to_string()))?;
    let (tx, rx) = thread.as_ref().ok_or(RecorderError::ThreadNotInitialized)?;
    f(tx, rx)
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInfo {
    device_id: String,
    label: String,
}

#[tauri::command]
pub async fn enumerate_recording_devices() -> Result<Vec<DeviceInfo>> {
    debug!("Enumerating recording devices");
    with_thread(|tx, rx| {
        tx.send(AudioCommand::EnumerateRecordingDevices)
            .map_err(|e| RecorderError::SendError(e.to_string()))?;

        match rx.recv() {
            Ok(AudioResponse::RecordingDeviceList(devices)) => {
                info!("Found {} recording devices", devices.len());
                Ok(devices
                    .into_iter()
                    .map(|label| DeviceInfo {
                        device_id: label.clone(),
                        label,
                    })
                    .collect())
            }
            Ok(AudioResponse::Error(e)) => {
                error!("Failed to enumerate devices: {}", e);
                Err(RecorderError::AudioError(e))
            }
            Ok(_) => {
                error!("Unexpected response while enumerating devices");
                Err(RecorderError::AudioError("Unexpected response".to_string()))
            }
            Err(e) => {
                error!("Failed to receive device enumeration response: {}", e);
                Err(RecorderError::ReceiveError(e.to_string()))
            }
        }
    })
}

#[tauri::command]
pub async fn init_recording_session(device_name: String) -> Result<()> {
    info!(
        "Starting init_recording_session with device_name: {}",
        device_name
    );
    with_thread(|tx, rx| {
        debug!("Sending InitRecordingSession command...");
        tx.send(AudioCommand::InitRecordingSession(device_name))
            .map_err(|e| RecorderError::SendError(e.to_string()))?;

        debug!("Waiting for response...");
        match rx.recv() {
            Ok(AudioResponse::Success(_)) => {
                info!("Recording session initialized successfully");
                Ok(())
            }
            Ok(AudioResponse::Error(e)) => {
                error!("Failed to initialize recording session: {}", e);
                Err(RecorderError::AudioError(e))
            }
            Ok(_) => {
                error!("Unexpected response during initialization");
                Err(RecorderError::AudioError("Unexpected response".to_string()))
            }
            Err(e) => {
                error!("Failed to receive initialization response: {}", e);
                Err(RecorderError::ReceiveError(e.to_string()))
            }
        }
    })
}

#[tauri::command]
pub async fn close_recording_session() -> Result<()> {
    with_thread(|tx, rx| {
        tx.send(AudioCommand::CloseRecordingSession)
            .map_err(|e| RecorderError::SendError(e.to_string()))?;

        match rx.recv() {
            Ok(AudioResponse::Success(_)) => {
                *IS_RECORDING.lock().unwrap() = false;
                Ok(())
            }
            Ok(AudioResponse::Error(e)) => Err(RecorderError::AudioError(e)),
            Ok(_) => Err(RecorderError::AudioError("Unexpected response".to_string())),
            Err(e) => Err(RecorderError::ReceiveError(e.to_string())),
        }
    })
}

pub async fn close_thread() -> Result<()> {
    let mut thread = AUDIO_THREAD
        .lock()
        .map_err(|e| RecorderError::LockError(e.to_string()))?;

    if let Some((tx, rx)) = thread.take() {
        debug!("Sending CloseThread command...");
        tx.send(AudioCommand::CloseThread)
            .map_err(|e| RecorderError::SendError(e.to_string()))?;

        match rx.recv() {
            Ok(AudioResponse::Success(_)) => {
                info!("Audio thread closed successfully");
                Ok(())
            }
            Ok(AudioResponse::Error(e)) => {
                error!("Error closing audio thread: {}", e);
                Err(RecorderError::AudioError(e))
            }
            Ok(_) => {
                error!("Unexpected response while closing thread");
                Err(RecorderError::AudioError("Unexpected response".to_string()))
            }
            Err(e) => {
                error!("Failed to receive thread close response: {}", e);
                Err(RecorderError::ReceiveError(e.to_string()))
            }
        }
    } else {
        debug!("No audio thread to close");
        Ok(())
    }
}

#[tauri::command]
pub async fn get_recorder_state() -> Result<String> {
    with_thread(|tx, rx| {
        tx.send(AudioCommand::GetRecorderState)
            .map_err(|e| RecorderError::SendError(e.to_string()))?;

        match rx.recv() {
            Ok(AudioResponse::Success(status)) => Ok(status),
            Ok(AudioResponse::Error(e)) => Err(RecorderError::AudioError(e)),
            Ok(_) => Err(RecorderError::AudioError("Unexpected response".to_string())),
            Err(e) => Err(RecorderError::ReceiveError(e.to_string())),
        }
    })
}

#[tauri::command]
pub async fn start_recording() -> Result<()> {
    with_thread(|tx, rx| {
        tx.send(AudioCommand::StartRecording)
            .map_err(|e| RecorderError::SendError(e.to_string()))?;

        match rx.recv() {
            Ok(AudioResponse::Success(_)) => {
                *IS_RECORDING.lock().unwrap() = true;
                Ok(())
            }
            Ok(AudioResponse::Error(e)) => Err(RecorderError::AudioError(e)),
            Ok(_) => Err(RecorderError::AudioError("Unexpected response".to_string())),
            Err(e) => Err(RecorderError::ReceiveError(e.to_string())),
        }
    })
}

#[tauri::command]
pub async fn stop_recording() -> Result<Vec<f32>> {
    debug!("Stopping recording");
    with_thread(|tx, rx| {
        tx.send(AudioCommand::StopRecording)
            .map_err(|e| RecorderError::SendError(e.to_string()))?;

        match rx.recv() {
            Ok(AudioResponse::AudioData(data)) => {
                *IS_RECORDING.lock().unwrap() = false;
                info!("Recording stopped successfully ({} samples)", data.len());
                Ok(data)
            }
            Ok(AudioResponse::Error(e)) => {
                error!("Failed to stop recording: {}", e);
                Err(RecorderError::AudioError(e))
            }
            Ok(_) => {
                error!("Unexpected response while stopping recording");
                Err(RecorderError::AudioError("Unexpected response".to_string()))
            }
            Err(e) => {
                error!("Failed to receive stop recording response: {}", e);
                Err(RecorderError::ReceiveError(e.to_string()))
            }
        }
    })
}

#[tauri::command]
pub async fn cancel_recording() -> Result<()> {
    debug!("Canceling recording");
    with_thread(|tx, rx| {
        tx.send(AudioCommand::StopRecording)
            .map_err(|e| RecorderError::SendError(e.to_string()))?;

        match rx.recv() {
            Ok(AudioResponse::AudioData(_)) => {
                *IS_RECORDING.lock().unwrap() = false;
                info!("Recording canceled successfully");
                Ok(())
            }
            Ok(AudioResponse::Error(e)) => {
                error!("Failed to cancel recording: {}", e);
                Err(RecorderError::AudioError(e))
            }
            Ok(_) => {
                error!("Unexpected response while canceling recording");
                Err(RecorderError::AudioError("Unexpected response".to_string()))
            }
            Err(e) => {
                error!("Failed to receive cancel recording response: {}", e);
                Err(RecorderError::ReceiveError(e.to_string()))
            }
        }
    })
}
