# Stop Emulating Web APIs in Your Tauri Apps

I spent weeks building a "proper" audio recording system for Whispering. Threads, channels, state machines, the works. Then I deleted it all and wrote 100 lines of straightforward Rust.

Here's what I learned the hard way.

## The Overengineered Mess I Built

I started with what seemed like good architecture. A dedicated recording thread that owned the audio stream. Message passing for control. Shared state wrapped in Arc<Mutex<>>. You know, "real" systems programming.

```rust
// The "sophisticated" approach
struct RecorderThread {
    control_tx: mpsc::Sender<RecorderCommand>,
    state: Arc<Mutex<RecorderState>>,
    handle: JoinHandle<()>,
}

impl RecorderThread {
    fn start_recording(&self) -> Result<()> {
        self.control_tx.send(RecorderCommand::Start)?;
        // Wait for state change confirmation...
        // Handle errors from the thread...
        // Manage timeouts...
    }
}
```

Every operation became an async dance. Start recording? Send a message, wait for confirmation. Stop recording? Another message, another wait. Want to know if we're recording? Check the shared state, but watch out for race conditions.

The worst part? Error handling. An error in the recording thread had to be caught, wrapped, sent back through channels, unwrapped, and re-thrown. A simple "device not found" error traveled through three layers of abstraction before reaching the UI.

## The Web API Trap

Here's the thing that took me too long to realize: I was trying to make Tauri behave like a web browser.

On the web, you call `mediaRecorder.start()` and it returns immediately. The recording happens somewhere else, in browser-land. So when I moved to Tauri, I unconsciously recreated this pattern. Background thread equals browser magic, right?

Wrong.

In Tauri, your Rust backend *is* your app. It's not some external service. It's not a browser. It's just your code running on the user's machine.

## The Simple Solution That Actually Works

Delete the threads. Delete the channels. Delete the state machines. Just... record audio.

```rust
#[tauri::command]
fn start_recording(device: String, output_path: PathBuf) -> Result<String> {
    let host = cpal::default_host();
    let device = host.input_devices()?
        .find(|d| d.name().ok() == Some(device.clone()))
        .ok_or("Device not found")?;
    
    let config = device.default_input_config()?;
    let recording_id = nanoid::nanoid!();
    
    // Start recording in a simple spawned task
    tauri::async_runtime::spawn(async move {
        let wav_writer = WavWriter::new(&output_path, &config)?;
        let stream = device.build_input_stream(
            &config,
            move |data: &[f32], _: &_| {
                wav_writer.write_samples(data);
            },
            |err| eprintln!("Stream error: {}", err),
            None
        )?;
        
        stream.play()?;
        ACTIVE_STREAMS.insert(recording_id.clone(), stream);
    });
    
    Ok(recording_id)
}
```

That's it. No channels. No shared state beyond a simple HashMap. Errors bubble up naturally. The recording ID is your handle.

## Why This Works Better

**Simplicity is speed.** Without channels and thread synchronization, starting a recording is instant. The UI feels snappier because it *is* snappier.

**Errors make sense.** When something fails, the error comes from where it actually happened. Not wrapped in three layers of thread communication protocol.

**State is obvious.** Recording? There's a stream in the HashMap. Not recording? The HashMap is empty. No race conditions, no state machines.

**Testing is trivial.** Call the function. Check the result. No need to mock message passing or wait for threads to synchronize.

## The Lesson

Stop treating Tauri like it's a browser. Your Rust backend isn't some external service you need to carefully orchestrate. It's just code running on the user's machine.

The browser's MediaRecorder API is complex because it has to be. It's bridging JavaScript to native code through multiple security boundaries. You're already in native code. You don't need that complexity.

Next time you find yourself building channels and threads and state machines in Tauri, ask yourself: am I solving a real problem, or am I just emulating a web API that I'm familiar with?

Sometimes the best architecture is no architecture at all.