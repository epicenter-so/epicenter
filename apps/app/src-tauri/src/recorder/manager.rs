use crate::recorder::thread::{spawn_audio_thread, AudioCommand, AudioResponse};
use crate::recorder::RecorderError;
use serde::Serialize;
use std::sync::mpsc::{self, Receiver, RecvError, SendError, Sender};
use tracing::{debug, error, info};

pub type Result<T> = std::result::Result<T, RecorderError>;

pub struct AudioThreadHandle {
    pub command_tx: Sender<AudioCommand>,
    pub response_rx: Receiver<AudioResponse>,
}

pub struct AudioManager {
    thread_handle: Option<AudioThreadHandle>,
    is_recording: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInfo {
    device_id: String,
    label: String,
}

// Implement From traits for more idiomatic error handling
impl From<SendError<AudioCommand>> for RecorderError {
    fn from(err: SendError<AudioCommand>) -> Self {
        RecorderError::SendError(err.to_string())
    }
}

impl From<RecvError> for RecorderError {
    fn from(err: RecvError) -> Self {
        RecorderError::ReceiveError(err.to_string())
    }
}

impl From<std::sync::PoisonError<std::sync::MutexGuard<'_, AudioManager>>> for RecorderError {
    fn from(err: std::sync::PoisonError<std::sync::MutexGuard<'_, AudioManager>>) -> Self {
        RecorderError::LockError(err.to_string())
    }
}

impl AudioManager {
    pub fn new() -> Self {
        Self {
            thread_handle: None,
            is_recording: false,
        }
    }

    /// Ensure the audio thread is initialized
    pub fn ensure_initialized(&mut self) -> Result<()> {
        if self.thread_handle.is_some() {
            debug!("Audio thread already initialized");
            return Ok(());
        }

        debug!("Initializing audio thread...");
        let (response_tx, response_rx) = mpsc::channel();
        let command_tx = spawn_audio_thread(response_tx)?;

        self.thread_handle = Some(AudioThreadHandle {
            command_tx,
            response_rx,
        });

        info!("Audio thread initialized successfully");
        Ok(())
    }

    /// Helper method to execute operations with the audio thread
    fn with_thread<F, T>(&mut self, f: F) -> Result<T>
    where
        F: FnOnce(&Sender<AudioCommand>, &Receiver<AudioResponse>) -> Result<(T, Option<bool>)>,
    {
        self.ensure_initialized()?;

        let handle = self
            .thread_handle
            .as_ref()
            .ok_or(RecorderError::ThreadNotInitialized)?;

        let (result, is_recording_update) = f(&handle.command_tx, &handle.response_rx)?;

        // Update is_recording if needed
        if let Some(recording_state) = is_recording_update {
            self.is_recording = recording_state;
        }

        Ok(result)
    }

    /// Enumerate available recording devices
    pub fn enumerate_recording_devices(&mut self) -> Result<Vec<DeviceInfo>> {
        debug!("Enumerating recording devices");
        self.with_thread(|tx, rx| {
            tx.send(AudioCommand::EnumerateRecordingDevices)?;

            match rx.recv()? {
                AudioResponse::RecordingDeviceList(devices) => {
                    info!("Found {} recording devices", devices.len());
                    Ok((
                        devices
                            .into_iter()
                            .map(|label| DeviceInfo {
                                device_id: label.clone(),
                                label,
                            })
                            .collect(),
                        None,
                    ))
                }
                AudioResponse::Error(e) => {
                    error!("Failed to enumerate devices: {}", e);
                    Err(RecorderError::AudioError(e))
                }
                _ => {
                    error!("Unexpected response while enumerating devices");
                    Err(RecorderError::AudioError("Unexpected response".to_string()))
                }
            }
        })
    }

    /// Initialize a recording session with the specified device
    pub fn init_recording_session(&mut self, device_name: String) -> Result<()> {
        info!(
            "Initializing recording session with device: {}",
            device_name
        );
        self.with_thread(|tx, rx| {
            tx.send(AudioCommand::InitRecordingSession(device_name))?;

            match rx.recv()? {
                AudioResponse::Success(_) => {
                    info!("Recording session initialized successfully");
                    Ok(((), None))
                }
                AudioResponse::Error(e) => {
                    error!("Failed to initialize recording session: {}", e);
                    Err(RecorderError::AudioError(e))
                }
                _ => {
                    error!("Unexpected response during initialization");
                    Err(RecorderError::AudioError("Unexpected response".to_string()))
                }
            }
        })
    }

    /// Close the current recording session
    pub fn close_recording_session(&mut self) -> Result<()> {
        info!("Closing recording session");
        self.with_thread(|tx, rx| {
            tx.send(AudioCommand::CloseRecordingSession)?;

            match rx.recv()? {
                AudioResponse::Success(_) => {
                    info!("Recording session closed successfully");
                    Ok(((), Some(false)))
                }
                AudioResponse::Error(e) => {
                    error!("Failed to close recording session: {}", e);
                    Err(RecorderError::AudioError(e))
                }
                _ => {
                    error!("Unexpected response while closing session");
                    Err(RecorderError::AudioError("Unexpected response".to_string()))
                }
            }
        })
    }

    /// Get the current recorder state
    pub fn get_recorder_state(&mut self) -> Result<String> {
        debug!("Getting recorder state");
        self.with_thread(|tx, rx| {
            tx.send(AudioCommand::GetRecorderState)?;

            match rx.recv()? {
                AudioResponse::Success(status) => Ok((status, None)),
                AudioResponse::Error(e) => Err(RecorderError::AudioError(e)),
                _ => Err(RecorderError::AudioError("Unexpected response".to_string())),
            }
        })
    }

    /// Start recording audio
    pub fn start_recording(&mut self) -> Result<()> {
        info!("Starting recording");
        self.with_thread(|tx, rx| {
            tx.send(AudioCommand::StartRecording)?;

            match rx.recv()? {
                AudioResponse::Success(_) => {
                    info!("Recording started successfully");
                    Ok(((), Some(true)))
                }
                AudioResponse::Error(e) => {
                    error!("Failed to start recording: {}", e);
                    Err(RecorderError::AudioError(e))
                }
                _ => {
                    error!("Unexpected response while starting recording");
                    Err(RecorderError::AudioError("Unexpected response".to_string()))
                }
            }
        })
    }

    /// Stop recording and return the recorded audio data
    pub fn stop_recording(&mut self) -> Result<Vec<f32>> {
        info!("Stopping recording");
        self.with_thread(|tx, rx| {
            tx.send(AudioCommand::StopRecording)?;

            match rx.recv()? {
                AudioResponse::AudioData(data) => {
                    info!("Recording stopped successfully ({} samples)", data.len());
                    Ok((data, Some(false)))
                }
                AudioResponse::Error(e) => {
                    error!("Failed to stop recording: {}", e);
                    Err(RecorderError::AudioError(e))
                }
                _ => {
                    error!("Unexpected response while stopping recording");
                    Err(RecorderError::AudioError("Unexpected response".to_string()))
                }
            }
        })
    }

    /// Cancel the current recording
    pub fn cancel_recording(&mut self) -> Result<()> {
        info!("Canceling recording");
        self.with_thread(|tx, rx| {
            tx.send(AudioCommand::StopRecording)?;

            match rx.recv()? {
                AudioResponse::AudioData(_) => {
                    info!("Recording canceled successfully");
                    Ok(((), Some(false)))
                }
                AudioResponse::Error(e) => {
                    error!("Failed to cancel recording: {}", e);
                    Err(RecorderError::AudioError(e))
                }
                _ => {
                    error!("Unexpected response while canceling recording");
                    Err(RecorderError::AudioError("Unexpected response".to_string()))
                }
            }
        })
    }

    /// Close the audio thread
    pub fn close_thread(&mut self) -> Result<()> {
        if let Some(handle) = self.thread_handle.take() {
            debug!("Sending CloseThread command...");
            handle.command_tx.send(AudioCommand::CloseThread)?;

            match handle.response_rx.recv()? {
                AudioResponse::Success(_) => {
                    info!("Audio thread closed successfully");
                    self.is_recording = false;
                    Ok(())
                }
                AudioResponse::Error(e) => {
                    error!("Error closing audio thread: {}", e);
                    Err(RecorderError::AudioError(e))
                }
                _ => {
                    error!("Unexpected response while closing thread");
                    Err(RecorderError::AudioError("Unexpected response".to_string()))
                }
            }
        } else {
            debug!("No audio thread to close");
            Ok(())
        }
    }
}

impl Drop for AudioManager {
    fn drop(&mut self) {
        debug!("AudioManager being dropped, cleaning up resources");
        if let Some(handle) = &self.thread_handle {
            // Try to close the thread gracefully, but don't wait for response
            let _ = handle.command_tx.send(AudioCommand::CloseThread);
        }
    }
}
