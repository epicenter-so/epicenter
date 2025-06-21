import type { OsService } from './types';
import type { OsType } from '@tauri-apps/plugin-os';

export function createOsServiceWeb(): OsService {
	return {
		type(): OsType {
			// Modern approach using User-Agent Client Hints
			if (doesNavigatorSupportUserAgentData(navigator)) {
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

			// Linux detection (default for Unix-like)
			return 'linux';
		},
	};
}

function doesNavigatorSupportUserAgentData(
	navigator: Navigator,
): navigator is Navigator & { userAgentData: { platform: string } } {
	return (
		'userAgentData' in navigator &&
		typeof (navigator.userAgentData as { platform: unknown }).platform ===
			'string'
	);
}
