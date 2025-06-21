# Browser Platform Detection Implementation

## Overview
Implement platform detection for the web version of the OS service to detect the user's operating system from the browser environment. The function should return one of: 'linux' | 'windows' | 'macos' | 'ios' | 'android'.

## Background
- The desktop version uses `@tauri-apps/plugin-os` which provides an `os.type()` function
- The web version needs to implement the same interface using browser APIs
- The returned values must match the OsType from Tauri: 'linux', 'windows', 'macos', 'ios', 'android'

## Requirements
1. Implement the `type()` method in `createOsServiceWeb()` to detect the platform
2. Return values must exactly match the Tauri OsType values
3. Must work reliably across different browsers and platforms
4. Should handle edge cases gracefully

## Technical Approach

### Primary Detection Method: navigator.userAgentData (Modern Approach)
The User-Agent Client Hints API provides a more reliable and privacy-preserving way to detect platform information:
- Available in modern Chromium-based browsers (Chrome, Edge, Opera)
- Provides structured data instead of parsing strings
- Less prone to spoofing

### Fallback Method: navigator.userAgent and navigator.platform
For browsers that don't support userAgentData:
- Parse the user agent string to detect platform
- Use navigator.platform as additional validation
- Handle various edge cases and browser inconsistencies

### Detection Logic

1. **iOS Detection** (must be checked first)
   - Check for iPad/iPhone/iPod in userAgent
   - navigator.platform contains "iPhone", "iPad", or "iPod"
   - Note: iPadOS 13+ reports as macOS in desktop mode

2. **Android Detection**
   - Check for "Android" in userAgent
   - Exclude Opera Mini false positives

3. **macOS Detection**
   - navigator.platform starts with "Mac"
   - Exclude iOS devices

4. **Windows Detection**
   - navigator.platform contains "Win"
   - Check for Windows Phone separately

5. **Linux Detection**
   - navigator.platform contains "Linux"
   - Exclude Android devices
   - Default fallback for Unix-like systems

## Implementation Details

### File: src/lib/services/os/web.ts

```typescript
import type { OsService } from './types';
import type { OsType } from '@tauri-apps/plugin-os';

export function createOsServiceWeb(): OsService {
	return {
		type(): OsType {
			// Modern approach using User-Agent Client Hints
			if ('userAgentData' in navigator && navigator.userAgentData?.platform) {
				const platform = navigator.userAgentData.platform.toLowerCase();
				
				// Map client hints platform to OsType
				switch (platform) {
					case 'windows':
						return 'windows';
					case 'macos':
						return 'macos';
					case 'linux':
						return 'linux';
					case 'android':
						return 'android';
					case 'ios':
						return 'ios';
				}
			}
			
			// Fallback to traditional detection
			const userAgent = navigator.userAgent.toLowerCase();
			const platform = navigator.platform.toLowerCase();
			
			// iOS detection (must be before macOS)
			if (/ipad|iphone|ipod/.test(userAgent) || 
			    (platform.includes('mac') && 'ontouchend' in document)) {
				return 'ios';
			}
			
			// Android detection
			if (/android/.test(userAgent)) {
				return 'android';
			}
			
			// macOS detection
			if (platform.startsWith('mac')) {
				return 'macos';
			}
			
			// Windows detection
			if (platform.includes('win')) {
				return 'windows';
			}
			
			// Linux detection (default for Unix-like)
			return 'linux';
		}
	};
}
```

## Testing Considerations

1. **Manual Testing Matrix**
   - Chrome on Windows, macOS, Linux
   - Safari on macOS, iOS
   - Firefox on Windows, macOS, Linux
   - Edge on Windows
   - Chrome on Android
   - Samsung Internet on Android

2. **Edge Cases to Test**
   - iPadOS in desktop mode
   - Windows on ARM
   - Chrome OS (should detect as Linux)
   - Various Linux distributions

3. **User Agent Spoofing**
   - Test with browser dev tools spoofing different user agents
   - Ensure graceful degradation

## Alternative NPM Packages Considered

While we could use packages like:
- `platform` - Provides platform detection but adds unnecessary bundle size
- `bowser` - More comprehensive but overkill for our simple needs
- `ua-parser-js` - Good but adds complexity

The native browser API approach is preferred because:
1. No additional dependencies
2. Smaller bundle size
3. Direct control over detection logic
4. Matches our simple use case perfectly

## TODO
- [ ] Read existing web.ts file
- [ ] Implement the platform detection logic
- [ ] Test detection on multiple browsers/platforms
- [ ] Ensure return values match OsType exactly

## Review
(To be added after implementation)