use crate::recorder::thread::{spawn_audio_thread, AudioCommand, AudioResponse};
use crate::recorder::RecorderError;
use serde::Serialize;
use std::sync::mpsc::{self, Receiver, RecvError, SendError, Sender};
use tracing::{debug, error, info};

pub type Result<T> = std::result::Result<T, RecorderError>;

struct AudioThreadHandle {
    command_tx: Sender<AudioCommand>,
    response_rx: Receiver<AudioResponse>,
}

pub struct AudioManager {
    thread_handle: Option<AudioThreadHandle>,
    is_recording: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInfo {
    pub device_id: String,
    pub label: String,
}

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

    /// Helper method to handle common response patterns
    fn handle_response<T>(
        response: AudioResponse,
        success_handler: impl FnOnce(String) -> T,
        context: &str,
        recording_state: Option<bool>,
    ) -> Result<(T, Option<bool>)> {
        match response {
            AudioResponse::Success(status) => {
                if recording_state.is_some() {
                    info!("{} completed successfully", context);
                }
                Ok((success_handler(status), recording_state))
            }
            AudioResponse::Error(e) => {
                error!("Error in {}: {}", context, e);
                Err(RecorderError::AudioError(e))
            }
            _ => {
                error!("Unexpected response in {}", context);
                Err(RecorderError::AudioError(format!(
                    "Unexpected response in {}",
                    context
                )))
            }
        }
    }

    /// Ensure the audio thread is initialized
    fn ensure_initialized(&mut self) -> Result<()> {
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

    /// Helper method to handle device list responses
    fn handle_device_list_response(
        response: AudioResponse,
        context: &str,
    ) -> Result<(Vec<DeviceInfo>, Option<bool>)> {
        match response {
            AudioResponse::RecordingDeviceList(devices) => {
                info!("Found {} recording devices", devices.len());
                let device_infos = devices
                    .into_iter()
                    .map(|label| DeviceInfo {
                        device_id: label.clone(),
                        label,
                    })
                    .collect();
                Ok((device_infos, None))
            }
            AudioResponse::Error(e) => {
                error!("Error in {}: {}", context, e);
                Err(RecorderError::AudioError(e))
            }
            _ => {
                error!("Unexpected response in {}", context);
                Err(RecorderError::AudioError(format!(
                    "Unexpected response in {}",
                    context
                )))
            }
        }
    }

    /// Enumerate available recording devices
    pub fn enumerate_recording_devices(&mut self) -> Result<Vec<DeviceInfo>> {
        debug!("Enumerating recording devices");
        self.with_thread(|tx, rx| {
            tx.send(AudioCommand::EnumerateRecordingDevices)?;
            let response = rx.recv()?;
            Self::handle_device_list_response(response, "enumerate_recording_devices")
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
            let response = rx.recv()?;
            Self::handle_response(response, |_| (), "init_recording_session", None)
        })
    }

    /// Close the current recording session
    pub fn close_recording_session(&mut self) -> Result<()> {
        info!("Closing recording session");
        self.with_thread(|tx, rx| {
            tx.send(AudioCommand::CloseRecordingSession)?;
            let response = rx.recv()?;
            Self::handle_response(response, |_| (), "close_recording_session", Some(false))
        })
    }

    /// Get the current recorder state
    pub fn get_recorder_state(&mut self) -> Result<String> {
        debug!("Getting recorder state");
        self.with_thread(|tx, rx| {
            tx.send(AudioCommand::GetRecorderState)?;
            let response = rx.recv()?;
            Self::handle_response(response, |status| status, "get_recorder_state", None)
        })
    }

    /// Start recording audio
    pub fn start_recording(&mut self) -> Result<()> {
        info!("Starting recording");
        self.with_thread(|tx, rx| {
            tx.send(AudioCommand::StartRecording)?;
            let response = rx.recv()?;
            Self::handle_response(response, |_| (), "start_recording", Some(true))
        })
    }

    /// Helper method to handle audio data responses
    fn handle_audio_response(
        response: AudioResponse,
        context: &str,
    ) -> Result<(Vec<f32>, Option<bool>)> {
        match response {
            AudioResponse::AudioData(data) => {
                info!(
                    "{} completed successfully ({} samples)",
                    context,
                    data.len()
                );
                Ok((data, Some(false)))
            }
            AudioResponse::Error(e) => {
                error!("Error in {}: {}", context, e);
                Err(RecorderError::AudioError(e))
            }
            _ => {
                error!("Unexpected response in {}", context);
                Err(RecorderError::AudioError(format!(
                    "Unexpected response in {}",
                    context
                )))
            }
        }
    }

    /// Stop recording and return the recorded audio data
    pub fn stop_recording(&mut self) -> Result<Vec<f32>> {
        info!("Stopping recording");
        self.with_thread(|tx, rx| {
            tx.send(AudioCommand::StopRecording)?;
            let response = rx.recv()?;
            Self::handle_audio_response(response, "stop_recording")
        })
    }

    /// Cancel the current recording
    pub fn cancel_recording(&mut self) -> Result<()> {
        info!("Canceling recording");
        // Reuse stop_recording and discard the audio data
        self.stop_recording().map(|_| ())
    }

    /// Close the audio thread
    pub fn close_thread(&mut self) -> Result<()> {
        let handle = match self.thread_handle.take() {
            Some(h) => h,
            None => {
                debug!("No audio thread to close");
                return Ok(());
            }
        };

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
    }
}

impl Drop for AudioManager {
    fn drop(&mut self) {
        debug!("AudioManager being dropped, cleaning up resources");
        if let Err(e) = self.close_thread() {
            error!("Error during AudioManager drop: {}", e);
        }
    }
}
