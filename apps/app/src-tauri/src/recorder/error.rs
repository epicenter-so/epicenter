use serde::Serialize;
use thiserror::Error;

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
