#[cfg(target_os = "linux")]
use crate::recorder::wav_writer::WavWriter;
use crate::recorder::recorder::{AudioRecording, Result};
use gstreamer::prelude::*;
use gstreamer::{Caps, Element, ElementFactory, Pipeline, State};
use gstreamer_app::AppSink;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tracing::{debug, error, info};

/// GStreamer-based audio recorder for Linux
pub struct GStreamerRecorder {
    pipeline: Option<Pipeline>,
    writer: Option<Arc<Mutex<WavWriter>>>,
    is_recording: Arc<AtomicBool>,
    sample_rate: u32,
    channels: u16,
    file_path: Option<PathBuf>,
}

impl GStreamerRecorder {
    pub fn new() -> Result<Self> {
        // Initialize GStreamer
        gstreamer::init().map_err(|e| {
            error!("Failed to initialize GStreamer: {}", e);
            format!("Failed to initialize GStreamer: {}", e)
        })?;
        
        debug!("GStreamer initialized successfully");
        
        Ok(Self {
            pipeline: None,
            writer: None,
            is_recording: Arc::new(AtomicBool::new(false)),
            sample_rate: 0,
            channels: 0,
            file_path: None,
        })
    }

    /// List available recording devices by name
    pub fn enumerate_devices(&self) -> Result<Vec<String>> {
        let mut devices = Vec::new();
        
        // Always add default and common options
        devices.push("default".to_string());
        devices.push("pipewire".to_string());
        devices.push("pulse".to_string());
        
        // Try to enumerate actual devices (simplified for now)
        // TODO: Implement proper device enumeration when GStreamer API is stable
        
        Ok(devices)
    }

    /// Initialize recording session
    pub fn init_session(
        &mut self,
        device_name: String,
        output_folder: PathBuf,
        recording_id: String,
        preferred_sample_rate: Option<u32>,
    ) -> Result<()> {
        debug!("Initializing GStreamer recording session: device={}, recording_id={}", device_name, recording_id);
        
        // Clean up any existing session
        self.close_session()?;

        // Create file path
        let file_path = output_folder.join(format!("{}.wav", recording_id));
        
        // Use preferred sample rate or default to 16kHz for voice
        let sample_rate = preferred_sample_rate.unwrap_or(16000);
        let channels = 1; // Start with mono for voice

        // Create WAV writer
        let writer = WavWriter::new(file_path.clone(), sample_rate, channels)
            .map_err(|e| format!("Failed to create WAV file: {}", e))?;
        let writer = Arc::new(Mutex::new(writer));

        // Create GStreamer pipeline
        let pipeline = Pipeline::new();
        
        // Create elements
        let src = self.create_audio_source(&device_name)?;
        let convert = ElementFactory::make("audioconvert")
            .build()
            .map_err(|e| format!("Failed to create audioconvert: {}", e))?;
        let resample = ElementFactory::make("audioresample")
            .build()
            .map_err(|e| format!("Failed to create audioresample: {}", e))?;
        let capsfilter = ElementFactory::make("capsfilter")
            .build()
            .map_err(|e| format!("Failed to create capsfilter: {}", e))?;
        let sink = ElementFactory::make("appsink")
            .build()
            .map_err(|e| format!("Failed to create appsink: {}", e))?;

        // Configure caps for our desired format
        let caps = Caps::builder("audio/x-raw")
            .field("format", "F32LE")
            .field("rate", sample_rate as i32)
            .field("channels", channels as i32)
            .field("layout", "interleaved")
            .build();
        
        capsfilter.set_property("caps", &caps);

        // Add elements to pipeline first
        pipeline.add_many([&src, &convert, &resample, &capsfilter, &sink])
            .map_err(|e| format!("Failed to add elements to pipeline: {}", e))?;

        // Link elements
        Element::link_many([&src, &convert, &resample, &capsfilter, &sink])
            .map_err(|e| format!("Failed to link pipeline elements: {}", e))?;

        // Configure appsink after adding to pipeline
        let appsink = sink.downcast::<AppSink>().unwrap();
        appsink.set_property("emit-signals", true);
        appsink.set_property("max-buffers", 1u32);
        appsink.set_property("drop", true);

        // Set up the sample callback
        let writer_clone = writer.clone();
        let is_recording = self.is_recording.clone();
        
        appsink.set_callbacks(
            gstreamer_app::AppSinkCallbacks::builder()
                .new_sample(move |sink| {
                    if is_recording.load(Ordering::Acquire) {
                        if let Ok(sample) = sink.pull_sample() {
                            if let Some(buffer) = sample.buffer() {
                                if let Ok(map) = buffer.map_readable() {
                                    let data = map.as_slice();
                                    // Convert bytes to f32 samples
                                    let samples: &[f32] = unsafe {
                                        std::slice::from_raw_parts(
                                            data.as_ptr() as *const f32,
                                            data.len() / 4,
                                        )
                                    };
                                    
                                    if let Ok(mut w) = writer_clone.lock() {
                                        let _ = w.write_samples_f32(samples);
                                    }
                                }
                            }
                        }
                    }
                    Ok(gstreamer::FlowSuccess::Ok)
                })
                .build(),
        );

        // Store everything
        self.pipeline = Some(pipeline);
        self.writer = Some(writer);
        self.sample_rate = sample_rate;
        self.channels = channels;
        self.file_path = Some(file_path);
        // DON'T create a new Arc! Keep the one the callback is already using
        self.is_recording.store(false, Ordering::Release);

        info!(
            "GStreamer recording session initialized: {} Hz, {} channels, file: {:?}",
            sample_rate, channels, self.file_path
        );

        Ok(())
    }

    /// Create appropriate audio source element based on device name
    fn create_audio_source(&self, device_name: &str) -> Result<Element> {
        match device_name.to_lowercase().as_str() {
            "default" => {
                // Try pipewiresrc first, fallback to pulsesrc
                if let Ok(src) = ElementFactory::make("pipewiresrc").build() {
                    info!("Using pipewiresrc for default device");
                    Ok(src)
                } else if let Ok(src) = ElementFactory::make("pulsesrc").build() {
                    info!("Using pulsesrc for default device");
                    Ok(src)
                } else {
                    // Ultimate fallback to autoaudiosrc
                    ElementFactory::make("autoaudiosrc")
                        .build()
                        .map_err(|e| format!("Failed to create audio source: {}", e))
                }
            }
            "pipewire" => {
                ElementFactory::make("pipewiresrc")
                    .build()
                    .map_err(|e| format!("Failed to create pipewiresrc: {}", e))
            }
            "pulse" => {
                ElementFactory::make("pulsesrc")
                    .build()
                    .map_err(|e| format!("Failed to create pulsesrc: {}", e))
            }
            device_name => {
                // Try to find specific device
                if let Ok(src) = ElementFactory::make("pipewiresrc").build() {
                    // Try to set device property for PipeWire
                    src.set_property("target-object", device_name);
                    Ok(src)
                } else if let Ok(src) = ElementFactory::make("pulsesrc").build() {
                    // Try to set device property for PulseAudio
                    src.set_property("device", device_name);
                    Ok(src)
                } else {
                    Err(format!("Cannot create audio source for device: {}", device_name))
                }
            }
        }
    }

    /// Start recording
    pub fn start_recording(&mut self) -> Result<()> {
        if let Some(pipeline) = &self.pipeline {
            // Set pipeline to playing state
            pipeline.set_state(State::Playing)
                .map_err(|e| format!("Failed to start pipeline: {:?}", e))?;
            
            self.is_recording.store(true, Ordering::Release);
            debug!("GStreamer recording started");
            Ok(())
        } else {
            Err("No recording session initialized".to_string())
        }
    }

    /// Stop recording
    pub fn stop_recording(&mut self) -> Result<AudioRecording> {
        // Stop recording flag first
        self.is_recording.store(false, Ordering::Release);

        // Stop pipeline
        if let Some(pipeline) = &self.pipeline {
            pipeline.set_state(State::Null)
                .map_err(|e| format!("Failed to stop pipeline: {:?}", e))?;
        }

        // Finalize the WAV file and get metadata
        let (sample_rate, channels, duration) = if let Some(writer) = &self.writer {
            let mut w = writer
                .lock()
                .map_err(|e| format!("Failed to lock writer: {}", e))?;
            w.finalize()
                .map_err(|e| format!("Failed to finalize WAV: {}", e))?;
            w.get_metadata()
        } else {
            (self.sample_rate, self.channels, 0.0)
        };

        let file_path = self
            .file_path
            .as_ref()
            .map(|p| p.to_string_lossy().to_string());

        info!("GStreamer recording stopped: {:.2}s, file: {:?}", duration, file_path);

        Ok(AudioRecording {
            audio_data: Vec::new(),
            sample_rate,
            channels,
            duration_seconds: duration,
            file_path,
        })
    }

    /// Cancel recording
    pub fn cancel_recording(&mut self) -> Result<()> {
        // Stop recording
        self.is_recording.store(false, Ordering::Release);

        // Stop pipeline
        if let Some(pipeline) = &self.pipeline {
            let _ = pipeline.set_state(State::Null);
        }

        // Delete the file if it exists
        if let Some(file_path) = &self.file_path {
            std::fs::remove_file(file_path).ok();
            debug!("Deleted recording file: {:?}", file_path);
        }

        // Clear the session
        self.close_session()?;
        Ok(())
    }

    /// Close the recording session
    pub fn close_session(&mut self) -> Result<()> {
        // Stop recording if active
        self.is_recording.store(false, Ordering::Release);

        // Stop and drop pipeline
        if let Some(pipeline) = self.pipeline.take() {
            let _ = pipeline.set_state(State::Null);
        }

        // Finalize and drop the writer
        if let Some(writer) = self.writer.take() {
            if let Ok(mut w) = writer.lock() {
                let _ = w.finalize();
            }
        }

        // Clear state
        self.file_path = None;
        self.sample_rate = 0;
        self.channels = 0;

        debug!("GStreamer recording session closed");
        Ok(())
    }

    /// Get current recording ID if actively recording
    pub fn get_current_recording_id(&self) -> Option<String> {
        if self.is_recording.load(Ordering::Acquire) {
            self.file_path
                .as_ref()
                .and_then(|path| path.file_stem())
                .and_then(|stem| stem.to_str())
                .map(|s| s.to_string())
        } else {
            None
        }
    }
}

impl Drop for GStreamerRecorder {
    fn drop(&mut self) {
        let _ = self.close_session();
    }
}