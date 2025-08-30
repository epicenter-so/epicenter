import type { OsType } from '@tauri-apps/plugin-os';

import { type } from 'arktype';

import type { OsService } from '.';

const UserAgentData = type({ platform: 'string' });
// Type for navigator with userAgentData support
type NavigatorWithUAData = Navigator & {
	userAgentData: UserAgentData;
};

type UserAgentData = typeof UserAgentData.infer;

export function createOsServiceWeb(): OsService {
	return {
		type(): OsType {
			// Try modern User-Agent Client Hints API first
			if (hasUserAgentData(navigator)) {
				const maybeOsType = getPlatformFromClientHints(navigator);
				if (maybeOsType) return maybeOsType;
			}

			// Fallback to traditional user agent detection
			return getPlatformFromUserAgent(navigator);
		},
	};
}

/**
 * Attempts to detect platform using modern User-Agent Client Hints API
 * @returns OsType if detected, null otherwise
 */
function getPlatformFromClientHints(
	navigator: NavigatorWithUAData,
): null | OsType {
	const platform = navigator.userAgentData.platform.toLowerCase();

	// Direct mapping from client hints to OsType
	const platformMap: Record<string, OsType> = {
		android: 'android',
		ios: 'ios',
		linux: 'linux',
		macos: 'macos',
		windows: 'windows',
	};

	return platformMap[platform] ?? null;
}

/**
 * Detects platform using traditional user agent string parsing
 * @returns OsType based on user agent detection
 */
function getPlatformFromUserAgent(navigator: Navigator): OsType {
	const userAgent = navigator.userAgent.toLowerCase();
	const platform = navigator.platform?.toLowerCase() || '';

	// iOS detection (must be before macOS)
	// Handles both regular iOS devices and iPadOS in desktop mode
	if (
		/ipad|iphone|ipod/.test(userAgent) ||
		(platform.includes('mac') && 'ontouchend' in document)
	) {
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

	// Linux detection (default for Unix-like systems)
	return 'linux';
}

/**
 * Type guard to check if navigator supports User-Agent Client Hints
 */
function hasUserAgentData(
	navigator: Navigator,
): navigator is NavigatorWithUAData {
	return (
		'userAgentData' in navigator &&
		UserAgentData.allows(navigator.userAgentData)
	);
}
