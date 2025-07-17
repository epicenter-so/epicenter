use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{SampleFormat, Stream};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::sync::{
    mpsc::{self, SendError},
    Arc,
};
use tracing::{debug, error, info, warn};

/// Pre-allocate buffer for ~2 minutes at 16kHz (standard for voice)
const INITIAL_BUFFER_CAPACITY: usize = 16000 * 120;

/// Preferred sample rate for voice recording
const VOICE_SAMPLE_RATE: u32 = 16000;

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

/// Audio recording data with metadata - matches TypeScript interface
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioRecording {
    pub audio_data: Vec<f32>,
    pub sample_rate: u32,
    pub channels: u16,
    pub duration_seconds: f32,
}

/// Responses from the audio thread
#[derive(Debug)]
pub enum AudioResponse {
    /// List of available recording devices
    RecordingDeviceList(Vec<String>),
    /// Recorded audio data with metadata
    AudioData(AudioRecording),
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
    sample_rate: u32,
    channels: u16,
}

impl Drop for RecordingSession {
    fn drop(&mut self) {
        self.is_recording.store(false, Ordering::Release);

        if let Err(e) = self.stream.pause() {
            debug!("Error pausing stream during drop: {}", e);
        }

        debug!("Recording session resources released");
    }
}

/// Spawns a new audio thread and returns a channel for sending commands to it
pub fn spawn_audio_thread(
    response_tx: mpsc::Sender<AudioResponse>,
) -> Result<mpsc::Sender<AudioCommand>, SendError<AudioCommand>> {
    let (tx, rx) = mpsc::channel();

    std::thread::Builder::new()
        .name("audio-recorder".to_string())
        .spawn(move || -> Result<(), SendError<AudioResponse>> {
            let host = cpal::default_host();
            let mut current_session: Option<RecordingSession> = None;

            while let Ok(cmd) = rx.recv() {
                match cmd {
                    AudioCommand::EnumerateRecordingDevices => {
                        debug!("Audio thread: Enumerating recording devices");
                        let devices = match host.input_devices() {
                            Ok(devices) => devices.filter_map(|d| d.name().ok()).collect(),
                            Err(e) => {
                                error!("Failed to get input devices: {}", e);
                                response_tx.send(AudioResponse::Error(e.to_string()))?;
                                vec![]
                            }
                        };
                        info!("Found {} recording devices", devices.len());
                        response_tx.send(AudioResponse::RecordingDeviceList(devices))?;
                    }

                    AudioCommand::InitRecordingSession(device_name) => {
                        info!(
                            "Audio thread: Initializing recording session with device: {}",
                            device_name
                        );

                        // Close any existing session first
                        if current_session.is_some() {
                            info!("Closing existing session before initializing new one");
                            current_session = None;
                        }

                        // Create a new pre-allocated buffer for storing audio data
                        let audio_buffer =
                            Arc::new(Mutex::new(Vec::with_capacity(INITIAL_BUFFER_CAPACITY)));
                        let is_recording = Arc::new(AtomicBool::new(false));

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
                                error!("Failed to get device config for '{}': {}", device_name, e);
                                response_tx.send(AudioResponse::Error(format!(
                                    "Device '{}' configuration error: {}", device_name, e
                                )))?;
                                continue;
                            }
                        };

                        // Extract all values before creating StreamConfig directly
                        let sample_format = config.sample_format();
                        let sample_rate = config.sample_rate().0;
                        let channels = config.channels();

                        // Create StreamConfig directly instead of converting
                        let stream_config = cpal::StreamConfig {
                            channels,
                            sample_rate: cpal::SampleRate(sample_rate),
                            buffer_size: match config.buffer_size() {
                                cpal::SupportedBufferSize::Range { min: _, max: _ } => {
                                    cpal::BufferSize::Default
                                }
                                cpal::SupportedBufferSize::Unknown => cpal::BufferSize::Default,
                            },
                        };

                        // Build the stream with appropriate sample format handling
                        let stream = match sample_format {
                            SampleFormat::F32 => build_stream_f32(
                                &device,
                                &stream_config,
                                is_recording.clone(),
                                audio_buffer.clone(),
                                sample_rate,
                                channels,
                            ),
                            SampleFormat::I16 => build_stream_i16(
                                &device,
                                &stream_config,
                                is_recording.clone(),
                                audio_buffer.clone(),
                                sample_rate,
                                channels,
                            ),
                            SampleFormat::U16 => build_stream_u16(
                                &device,
                                &stream_config,
                                is_recording.clone(),
                                audio_buffer.clone(),
                                sample_rate,
                                channels,
                            ),
                            _ => {
                                let err_msg = "Unsupported sample format".to_string();
                                error!("{}", err_msg);
                                response_tx.send(AudioResponse::Error(err_msg))?;
                                continue;
                            }
                        };

                        let stream = match stream {
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
                            sample_rate,
                            channels,
                        });

                        info!(
                            "Recording session initialized successfully: {}Hz, {} channels",
                            sample_rate, channels
                        );
                        response_tx.send(AudioResponse::Success(format!(
                            "Recording session initialized: {}Hz, {} channels",
                            sample_rate, channels
                        )))?;
                    }

                    AudioCommand::GetRecorderState => {
                        debug!("Audio thread: Getting recorder state");
                        let state = if let Some(session) = &current_session {
                            if session.is_recording.load(Ordering::Acquire) {
                                "RECORDING"
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
                                // Pre-allocate capacity to avoid reallocations during recording
                                buffer.reserve(INITIAL_BUFFER_CAPACITY);
                            }

                            // Start the stream first, then set recording flag
                            if let Err(e) = session.stream.play() {
                                let err_msg = format!("Failed to start stream: {}", e);
                                error!("{}", err_msg);
                                response_tx.send(AudioResponse::Error(err_msg))?;
                                continue;
                            }

                            // Set recording flag after stream is started
                            session.is_recording.store(true, Ordering::Release);

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
                            session.is_recording.store(false, Ordering::Release);

                            // Pause the stream immediately to stop audio callback
                            if let Err(e) = session.stream.pause() {
                                warn!("Error pausing stream: {}", e);
                            }

                            // The atomic store above prevents new data from being written
                            // Safe to read buffer now that stream is paused

                            let audio_data = if let Ok(buffer) = session.audio_buffer.lock() {
                                buffer.clone()
                            } else {
                                warn!("Could not lock audio buffer, returning empty data");
                                Vec::new()
                            };

                            let duration_secs = audio_data.len() as f32
                                / (session.sample_rate as f32 * session.channels as f32);

                            info!(
                                "Recorded {} samples total ({:.2} seconds at {}Hz, {} channels)",
                                audio_data.len(),
                                duration_secs,
                                session.sample_rate,
                                session.channels
                            );

                            // Create complete AudioRecording object with metadata
                            let audio_recording = AudioRecording {
                                audio_data,
                                sample_rate: session.sample_rate,
                                channels: session.channels,
                                duration_seconds: duration_secs,
                            };

                            response_tx.send(AudioResponse::AudioData(audio_recording))?;
                        } else {
                            error!("Cannot stop recording: no active session");
                            response_tx
                                .send(AudioResponse::Error("No active recording".to_string()))?;
                        }
                    }

                    AudioCommand::CloseRecordingSession => {
                        info!("Audio thread: Closing recording session");
                        if let Some(session) = current_session.take() {
                            // The Drop implementation will handle stopping recording and pausing the stream
                            drop(session);
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
                            // The Drop implementation will handle stopping recording and pausing the stream
                            drop(session);
                        }

                        response_tx.send(AudioResponse::Success("Thread closed".to_string()))?;
                        break; // Exit the loop to terminate the thread
                    }
                }
            }

            info!("Audio thread terminated");
            Ok(())
        })
        .expect("Failed to spawn audio thread");

    Ok(tx)
}

/// Build a stream for f32 sample format
fn build_stream_f32(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    is_recording: Arc<AtomicBool>,
    audio_buffer: Arc<Mutex<Vec<f32>>>,
    _sample_rate: u32,
    _channels: u16,
) -> Result<Stream, cpal::BuildStreamError> {
    let err_fn = |err| error!("Error in audio stream: {}", err);

    device.build_input_stream(
        config,
        move |data: &[f32], _: &_| {
            if is_recording.load(Ordering::Acquire) {
                if let Ok(mut buffer) = audio_buffer.lock() {
                    // Reserve space for new samples to avoid frequent reallocations
                    let new_samples = data.len();
                    if buffer.capacity() < buffer.len() + new_samples {
                        buffer.reserve(new_samples);
                    }

                    // Directly extend with f32 data
                    buffer.extend_from_slice(data);
                }
            }
        },
        err_fn,
        None,
    )
}

/// Build a stream for i16 sample format
fn build_stream_i16(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    is_recording: Arc<AtomicBool>,
    audio_buffer: Arc<Mutex<Vec<f32>>>,
    _sample_rate: u32,
    _channels: u16,
) -> Result<Stream, cpal::BuildStreamError> {
    use cpal::Sample; // Bring Sample trait into scope
    let err_fn = |err| error!("Error in audio stream: {}", err);

    device.build_input_stream(
        config,
        move |data: &[i16], _: &_| {
            if is_recording.load(Ordering::Acquire) {
                if let Ok(mut buffer) = audio_buffer.lock() {
                    // Reserve space for new samples to avoid frequent reallocations
                    let new_samples = data.len();
                    if buffer.capacity() < buffer.len() + new_samples {
                        buffer.reserve(new_samples);
                    }

                    // Convert i16 to f32 and store
                    buffer.extend(data.iter().map(|&s| f32::from_sample(s)));
                }
            }
        },
        err_fn,
        None,
    )
}

/// Build a stream for u16 sample format
fn build_stream_u16(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    is_recording: Arc<AtomicBool>,
    audio_buffer: Arc<Mutex<Vec<f32>>>,
    _sample_rate: u32,
    _channels: u16,
) -> Result<Stream, cpal::BuildStreamError> {
    use cpal::Sample; // Bring Sample trait into scope
    let err_fn = |err| error!("Error in audio stream: {}", err);

    device.build_input_stream(
        config,
        move |data: &[u16], _: &_| {
            if is_recording.load(Ordering::Acquire) {
                if let Ok(mut buffer) = audio_buffer.lock() {
                    // Reserve space for new samples to avoid frequent reallocations
                    let new_samples = data.len();
                    if buffer.capacity() < buffer.len() + new_samples {
                        buffer.reserve(new_samples);
                    }

                    // Convert u16 to f32 and store
                    buffer.extend(data.iter().map(|&s| f32::from_sample(s)));
                }
            }
        },
        err_fn,
        None,
    )
}

/// Find a recording device by name
fn find_device(host: &cpal::Host, device_name: &str) -> Result<cpal::Device, String> {
    // If "default" is requested, return default device
    if device_name.to_lowercase() == "default" {
        return host
            .default_input_device()
            .ok_or_else(|| "No default input device available".to_string());
    }

    // Get all available devices
    let devices: Vec<_> = host
        .input_devices()
        .map_err(|e| e.to_string())?
        .collect();

    if devices.is_empty() {
        return Err("No recording devices available".to_string());
    }

    // Try exact match
    for device in &devices {
        if let Ok(name) = device.name() {
            if name == device_name {
                info!("Found exact device match: '{}'", name);
                return Ok(device.clone());
            }
        }
    }

    // List available devices in error message for better debugging
    let available_devices: Vec<String> = devices
        .iter()
        .filter_map(|d| d.name().ok())
        .collect();

    Err(format!(
        "Device '{}' not found. Available devices: [{}]",
        device_name,
        available_devices.join(", ")
    ))
}

/// Get an optimal audio configuration for voice recording
fn get_optimal_config(device: &cpal::Device) -> Result<cpal::SupportedStreamConfig, String> {
    let supported_configs = device
        .supported_input_configs()
        .map_err(|e| e.to_string())?
        .collect::<Vec<_>>();

    if supported_configs.is_empty() {
        return Err("No supported input configurations found".to_string());
    }

    // First try to find a mono configuration that supports voice sample rate
    let voice_config = supported_configs
        .iter()
        .find(|config| {
            let min_rate = config.min_sample_rate().0;
            let max_rate = config.max_sample_rate().0;
            let channels = config.channels();

            // Prefer mono for voice recording
            channels == 1 && min_rate <= VOICE_SAMPLE_RATE && max_rate >= VOICE_SAMPLE_RATE
        })
        .map(|range| range.with_sample_rate(cpal::SampleRate(VOICE_SAMPLE_RATE)));

    if let Some(config) = voice_config {
        info!(
            "Using voice-optimized config: {} Hz, {} channels, {:?} format",
            config.sample_rate().0,
            config.channels(),
            config.sample_format()
        );
        return Ok(config);
    }

    // Next, try to find any configuration that supports voice sample rate
    let any_voice_rate = supported_configs
        .iter()
        .find(|config| {
            let min_rate = config.min_sample_rate().0;
            let max_rate = config.max_sample_rate().0;

            min_rate <= VOICE_SAMPLE_RATE && max_rate >= VOICE_SAMPLE_RATE
        })
        .map(|range| range.with_sample_rate(cpal::SampleRate(VOICE_SAMPLE_RATE)));

    if let Some(config) = any_voice_rate {
        info!(
            "Using voice sample rate: {} Hz, {} channels, {:?} format",
            config.sample_rate().0,
            config.channels(),
            config.sample_format()
        );
        return Ok(config);
    }

    // Finally, fall back to default configuration
    device
        .default_input_config()
        .map_err(|e| e.to_string())
        .map(|config| {
            info!(
                "Using default config: {} Hz, {} channels, {:?} format",
                config.sample_rate().0,
                config.channels(),
                config.sample_format()
            );
            config
        })
}
