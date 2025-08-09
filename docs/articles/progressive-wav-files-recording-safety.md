# Progressive WAV Files: Your Recording App's Safety Net

Your app just crashed after recording for 47 minutes. The user's interview? Gone. 

This happened to me. Here's how I fixed it with 20 lines of Rust.

## The Problem Nobody Talks About

Most recording apps do this:

1. Record audio to memory
2. Keep recording... to memory
3. Still recording... still in memory
4. User clicks stop
5. *Now* write everything to disk

What happens if your app crashes at step 3? Or the user force-quits? Or the system runs out of memory?

Everything is lost. Hours of recording, vanished.

## What Progressive WAV Files Are

Instead of buffering everything in memory, write directly to disk as audio comes in. But here's the clever bit: WAV files have a header that includes the file size. How can you write the header when you don't know the final size yet?

You update it. Every few seconds.

```rust
fn write_samples(&mut self, samples: &[f32]) {
    // Write the actual audio data
    for sample in samples {
        self.writer.write_f32(*sample)?;
        self.samples_written += 1;
    }
    
    // Every 16,384 samples (about 1 second at 16kHz), update the header
    if self.samples_written % 16384 == 0 {
        self.update_header()?;
    }
}

fn update_header(&mut self) -> Result<()> {
    let current_pos = self.writer.stream_position()?;
    
    // Seek back to header position
    self.writer.seek(SeekFrom::Start(4))?;
    self.writer.write_u32((current_pos - 8) as u32)?;  // File size
    
    self.writer.seek(SeekFrom::Start(40))?;
    self.writer.write_u32((current_pos - 44) as u32)?; // Data size
    
    // Return to where we were
    self.writer.seek(SeekFrom::Start(current_pos))?;
    Ok(())
}
```

## Why This Changes Everything

**Crash resilience.** App crashes? Power outage? Force quit? Doesn't matter. The file on disk is valid up to the last header update. You lose at most a few seconds, not the entire recording.

**Instant feedback.** Users can see the file growing in real-time. They know it's working. They can even play the file *while it's still recording* in another app.

**Memory efficiency.** A 3-hour recording at 16kHz stereo is about 1.3GB. Instead of holding that in RAM, you're using maybe 64KB for buffering.

**Simple recovery.** If something goes wrong, the partial file is still there. Still playable. Still useful.

## The Tooling Benefit

Something unexpected happened when I implemented this. Debugging became so much easier.

Recording not working? Open the file while it's recording. Hear clicking sounds? You're dropping samples. Hear silence? Your audio callback isn't firing. The file becomes a real-time debugging tool.

Users started doing this too. "Is it actually recording?" Just check if the file is growing. No need to trust the UI.

## Implementation Details That Matter

**Buffer your writes.** Don't actually hit the disk for every sample. Use a BufWriter and flush periodically:

```rust
let file = File::create(path)?;
let writer = BufWriter::with_capacity(65536, file);  // 64KB buffer
```

**Update headers on a schedule, not sample count.** Every second or every 16K samples, whichever comes first. This handles variable sample rates gracefully.

**Lock the file correctly.** On Windows especially, you need exclusive access. But that's fine; it prevents users from accidentally deleting an active recording.

## The Confidence Factor

There's something psychological about seeing that file on disk, growing second by second. Users trust it. They can right-click, see the size, even copy it somewhere safe while recording continues.

Compare that to a recording app that shows a timer but no file. Are you *sure* it's recording? What if the timer is just... counting?

With progressive files, the proof is right there. 47MB and growing. That's 12 minutes of real audio, on disk, safe.

## When Not to Use This

Live streaming? You probably want circular buffers instead. 

Encrypted recordings? You'll need block-level encryption that supports streaming writes.

Recording to cloud storage? The latency will kill you. Buffer locally first.

But for 90% of recording apps? Where users just want to capture audio and not lose it? Progressive WAV files are the answer.

## The Takeaway

Stop treating recordings as precious data that needs complex state management. It's just samples. Write them to disk. Update the header. Move on.

Your users won't thank you for the elegant architecture. They'll thank you for not losing their interview when your app inevitably crashes.

Because it will crash. But now, it won't matter.