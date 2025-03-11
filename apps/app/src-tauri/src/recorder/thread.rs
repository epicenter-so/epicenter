use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::Stream;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::sync::{
    mpsc::{self, SendError},
    Arc,
};
use tracing::{debug, error, info};

/// Pre-allocate buffer for ~2 minutes at 48kHz
const INITIAL_BUFFER_CAPACITY: usize = 5_760_000;

/// Commands that can be sent to the audio thread
#[derive(Debug)]
pub enum AudioCommand {
    /// Get the current state of the recorder
    GetRecorderState,
    /// Close the audio thread
    CloseThread,
    /// List available recording devices
    EnumerateRecordingDevices,
    /// Initialize a recording session with the specified device
    InitRecordingSession(String),
    /// Close the current recording session
    CloseRecordingSession,
    /// Start recording audio
    StartRecording,
    /// Stop recording and return the recorded audio
    StopRecording,
}

/// Responses from the audio thread
#[derive(Debug)]
pub enum AudioResponse {
    /// List of available recording devices
    RecordingDeviceList(Vec<String>),
    /// Recorded audio data
    AudioData(Vec<f32>),
    /// Error message
    Error(String),
    /// Success message
    Success(String),
}

/// Represents an active recording session
struct RecordingSession {
    stream: Stream,
    is_recording: Arc<AtomicBool>,
    audio_buffer: Arc<Mutex<Vec<f32>>>,
}

/// Spawns a new audio thread and returns a channel for sending commands to it
pub fn spawn_audio_thread(
    response_tx: mpsc::Sender<AudioResponse>,
) -> Result<mpsc::Sender<AudioCommand>, SendError<AudioCommand>> {
    let (tx, rx) = mpsc::channel();

    std::thread::spawn(move || -> Result<(), SendError<AudioResponse>> {
        let host = cpal::default_host();
        let mut current_session: Option<RecordingSession> = None;

        while let Ok(cmd) = rx.recv() {
            match cmd {
                AudioCommand::EnumerateRecordingDevices => {
                    debug!("Audio thread: Enumerating recording devices");
                    let devices = host
                        .input_devices()
                        .map(|devices| devices.filter_map(|d| d.name().ok()).collect())
                        .unwrap_or_else(|e| {
                            error!("Failed to get input devices: {}", e);
                            let _ = response_tx.send(AudioResponse::Error(e.to_string()));
                            vec![]
                        });
                    info!("Found {} recording devices", devices.len());
                    response_tx.send(AudioResponse::RecordingDeviceList(devices))?;
                }

                AudioCommand::InitRecordingSession(device_name) => {
                    info!(
                        "Audio thread: Initializing recording session with device: {}",
                        device_name
                    );

                    // Create a new pre-allocated buffer for storing audio data
                    let audio_buffer =
                        Arc::new(Mutex::new(Vec::with_capacity(INITIAL_BUFFER_CAPACITY)));
                    let is_recording = Arc::new(AtomicBool::new(false));
                    let is_recording_producer = is_recording.clone();
                    let buffer_clone = audio_buffer.clone();

                    let device = match find_device(&host, &device_name) {
                        Ok(device) => device,
                        Err(e) => {
                            error!("Device not found: {}", e);
                            response_tx.send(AudioResponse::Error(e))?;
                            continue;
                        }
                    };

                    // Get an optimal configuration for voice recording
                    let config = match get_optimal_config(&device) {
                        Ok(config) => config,
                        Err(e) => {
                            error!("Failed to get device config: {}", e);
                            response_tx.send(AudioResponse::Error(e))?;
                            continue;
                        }
                    };

                    let sample_rate = config.sample_rate().0;
                    let stream = match device.build_input_stream(
                        &config.into(),
                        move |data: &[f32], _: &_| {
                            if is_recording_producer.load(Ordering::Relaxed) {
                                if let Ok(mut buffer) = buffer_clone.lock() {
                                    // Extend the buffer with new samples
                                    buffer.extend_from_slice(data);
                                    debug!(
                                        "Recorded {} samples, total length: {} ({:.2} seconds)",
                                        data.len(),
                                        buffer.len(),
                                        buffer.len() as f32 / sample_rate as f32
                                    );
                                }
                            }
                        },
                        |err| error!("Error in audio stream: {}", err),
                        None,
                    ) {
                        Ok(stream) => stream,
                        Err(e) => {
                            let err_msg = format!("Failed to build stream: {}", e);
                            error!("{}", err_msg);
                            response_tx.send(AudioResponse::Error(err_msg))?;
                            continue;
                        }
                    };

                    current_session = Some(RecordingSession {
                        stream,
                        is_recording,
                        audio_buffer,
                    });

                    info!("Recording session initialized successfully");
                    response_tx.send(AudioResponse::Success(
                        "Recording session initialized".to_string(),
                    ))?;
                }

                AudioCommand::GetRecorderState => {
                    debug!("Audio thread: Getting recorder state");
                    let state = if let Some(session) = &current_session {
                        if session.is_recording.load(Ordering::Relaxed) {
                            "SESSION+RECORDING"
                        } else {
                            "SESSION"
                        }
                    } else {
                        "IDLE"
                    };

                    debug!("Current recorder state: {}", state);
                    response_tx.send(AudioResponse::Success(state.to_string()))?;
                }

                AudioCommand::StartRecording => {
                    info!("Audio thread: Starting recording");
                    if let Some(session) = &current_session {
                        // Clear any existing data when starting a new recording
                        if let Ok(mut buffer) = session.audio_buffer.lock() {
                            buffer.clear();
                        }

                        session.is_recording.store(true, Ordering::Relaxed);
                        if let Err(e) = session.stream.play() {
                            let err_msg = format!("Failed to start stream: {}", e);
                            error!("{}", err_msg);
                            response_tx.send(AudioResponse::Error(err_msg))?;
                            continue;
                        }
                        info!("Recording started successfully");
                        response_tx
                            .send(AudioResponse::Success("Recording started".to_string()))?;
                    } else {
                        error!("Cannot start recording: session not initialized");
                        response_tx.send(AudioResponse::Error(
                            "Recording session not initialized".to_string(),
                        ))?;
                    }
                }

                AudioCommand::StopRecording => {
                    info!("Audio thread: Stopping recording");
                    if let Some(session) = &current_session {
                        // First stop recording to prevent new data from coming in
                        session.is_recording.store(false, Ordering::Relaxed);

                        // Get a copy of all recorded audio data
                        let audio_data = if let Ok(buffer) = session.audio_buffer.lock() {
                            buffer.clone()
                        } else {
                            Vec::new()
                        };

                        info!("Recorded {} samples total", audio_data.len());

                        // Stop the stream
                        if let Err(e) = session.stream.pause() {
                            error!("Error pausing stream: {}", e);
                        }

                        response_tx.send(AudioResponse::AudioData(audio_data))?;
                    } else {
                        error!("Cannot stop recording: no active session");
                        response_tx
                            .send(AudioResponse::Error("No active recording".to_string()))?;
                    }
                }

                AudioCommand::CloseRecordingSession => {
                    info!("Audio thread: Closing recording session");
                    if let Some(session) = current_session.take() {
                        session.is_recording.store(false, Ordering::Relaxed);
                        // Explicitly drop the stream to release resources
                        drop(session.stream);
                        info!("Recording session closed successfully");
                        response_tx.send(AudioResponse::Success(
                            "Recording session closed".to_string(),
                        ))?;
                    } else {
                        debug!("No active session to close");
                        response_tx.send(AudioResponse::Success(
                            "No active session to close".to_string(),
                        ))?;
                    }
                }

                AudioCommand::CloseThread => {
                    info!("Audio thread: Closing thread");
                    // Clean up any active session
                    if let Some(session) = current_session.take() {
                        session.is_recording.store(false, Ordering::Relaxed);
                        drop(session.stream);
                    }

                    response_tx.send(AudioResponse::Success("Thread closed".to_string()))?;
                    break; // Exit the loop to terminate the thread
                }
            }
        }

        info!("Audio thread terminated");
        Ok(())
    });

    Ok(tx)
}

/// Find a recording device by name
fn find_device(host: &cpal::Host, device_name: &str) -> Result<cpal::Device, String> {
    host.input_devices()
        .map_err(|e| e.to_string())?
        .find(|d| matches!(d.name(), Ok(name) if name == device_name))
        .ok_or_else(|| "Device not found".to_string())
}

/// Get an optimal audio configuration for voice recording
fn get_optimal_config(device: &cpal::Device) -> Result<cpal::SupportedStreamConfig, String> {
    let supported_configs = device
        .supported_input_configs()
        .map_err(|e| e.to_string())?;

    // Try to find a voice-friendly configuration
    let voice_config = find_voice_friendly_config(supported_configs);

    if let Some(config) = voice_config {
        info!(
            "Using voice-optimized config: {} Hz, {} channels",
            config.sample_rate().0,
            config.channels()
        );
        return Ok(config);
    }

    // Fall back to default configuration
    device
        .default_input_config()
        .map_err(|e| format!("Failed to get default input config: {}", e))
}

/// Find a configuration suitable for voice recording
fn find_voice_friendly_config(
    supported_configs: cpal::SupportedInputConfigs,
) -> Option<cpal::SupportedStreamConfig> {
    supported_configs
        .filter(|config| {
            let min_rate = config.min_sample_rate().0;
            let max_rate = config.max_sample_rate().0;
            let channels = config.channels();

            // Look for mono or stereo config that supports common voice sample rates
            (channels == 1 || channels == 2) && (min_rate <= 16000 && max_rate >= 16000)
        })
        .map(|range| range.with_sample_rate(cpal::SampleRate(16000)))
        .next()
}
