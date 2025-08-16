mod error;

use error::WhisperCppError;
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};

#[tauri::command]
pub async fn transcribe_with_whisper_cpp(
    audio_data: Vec<u8>,
    model_path: String,
    language: Option<String>,
    use_gpu: bool,
    prompt: String,
    temperature: f32,
) -> Result<String, WhisperCppError> {
    // Read WAV and convert to f32 based on actual format
    let cursor = std::io::Cursor::new(audio_data);
    let mut reader = hound::WavReader::new(cursor).map_err(|e| {
        if e.to_string().contains("no RIFF tag") {
            WhisperCppError::AudioFormatNotSupported
        } else {
            WhisperCppError::AudioReadError {
                message: e.to_string(),
            }
        }
    })?;

    let spec = reader.spec();
    let mut samples: Vec<f32> = match spec.sample_format {
        hound::SampleFormat::Float => reader
            .samples::<f32>()
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| WhisperCppError::AudioReadError {
                message: format!("Failed to read float samples: {}", e),
            })?,
        hound::SampleFormat::Int => reader
            .samples::<i16>()
            .map(|s| s.map(|sample| sample as f32 / 32768.0))
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| WhisperCppError::AudioReadError {
                message: format!("Failed to read int samples: {}", e),
            })?,
    };

    // Convert stereo to mono if needed
    if spec.channels > 1 {
        let mono_len = samples.len() / spec.channels as usize;
        let mut mono = Vec::with_capacity(mono_len);
        for i in 0..mono_len {
            let mut sum = 0.0;
            for ch in 0..spec.channels as usize {
                sum += samples[i * spec.channels as usize + ch];
            }
            mono.push(sum / spec.channels as f32);
        }
        samples = mono;
    }

    // Return early if audio too short
    if samples.is_empty() {
        return Ok(String::new());
    }

    // Load model (no caching - just load fresh each time)
    let mut params = WhisperContextParameters::default();
    params.use_gpu = use_gpu;

    let context = WhisperContext::new_with_params(&model_path, params).map_err(|e| {
        // Check if it's a GPU-related error
        let error_str = e.to_string();
        if error_str.contains("GPU") || error_str.contains("CUDA") || error_str.contains("Metal") {
            WhisperCppError::GpuError {
                message: e.to_string(),
            }
        } else {
            WhisperCppError::ModelLoadError {
                message: e.to_string(),
            }
        }
    })?;

    let mut state = context
        .create_state()
        .map_err(|e| WhisperCppError::StateCreationError {
            message: e.to_string(),
        })?;

    // Basic transcription params
    let mut full_params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
    full_params.set_translate(false);
    full_params.set_no_timestamps(true);
    full_params.set_temperature(temperature);

    if let Some(ref lang) = language {
        if !lang.is_empty() && lang != "auto" {
            full_params.set_language(Some(lang));
        }
    }

    if !prompt.trim().is_empty() {
        full_params.set_initial_prompt(&prompt);
    }

    // Transcribe
    state
        .full(full_params, &samples)
        .map_err(|e| WhisperCppError::TranscriptionError {
            message: e.to_string(),
        })?;

    // Get text
    let num_segments = state
        .full_n_segments()
        .map_err(|e| WhisperCppError::SegmentError {
            message: e.to_string(),
        })?;

    let mut text = String::new();
    for i in 0..num_segments {
        text.push_str(&state.full_get_segment_text(i).map_err(|e| {
            WhisperCppError::SegmentError {
                message: format!("Failed to get segment text: {}", e),
            }
        })?);
    }

    Ok(text.trim().to_string())
}
