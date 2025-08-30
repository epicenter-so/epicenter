import { goto } from '$app/navigation';
import { IS_MACOS } from '$lib/constants/platform';
import * as services from '$lib/services';
import { nanoid } from 'nanoid/non-secure';
import { toast } from 'svelte-sonner';

export function registerAccessibilityPermission() {
	// Only run on macOS desktop
	if (!IS_MACOS) return;

	const accessibilityToastId = nanoid();

	// Check accessibility permission once on mount
	(async () => {
		const { data: isAccessibilityGranted, error } =
			await services.permissions.accessibility.check();

		if (error) {
			console.error('Failed to check accessibility permissions:', error);
			return;
		}

		if (!isAccessibilityGranted) {
			// Toast if permission not granted
			toast.warning('Accessibility Permission Issue', {
				description:
					'Whispering needs accessibility permissions. This often requires removing and re-adding the app after updates.',
				action: {
					label: 'View Guide',
					onClick: () => {
						goto('/macos-enable-accessibility');
						// Dismiss the toast
						toast.dismiss(accessibilityToastId);
					},
				},
				duration: Number.POSITIVE_INFINITY,
				id: accessibilityToastId,
			});
		}
	})();

	// Return cleanup function
	return () => {
		toast.dismiss(accessibilityToastId);
	};
}

export function registerMicrophonePermission() {
	// Only run on macOS desktop
	if (!IS_MACOS) return;

	const microphoneToastId = nanoid();

	// Check microphone permission once on mount
	(async () => {
		const { data: isMicrophoneGranted, error } =
			await services.permissions.microphone.check();

		if (error) {
			console.error('Failed to check microphone permissions:', error);
			return;
		}

		if (!isMicrophoneGranted) {
			// Toast if permission not granted
			toast.info('Microphone Permission Required', {
				description: 'Whispering needs microphone access to record audio',
				action: {
					label: 'Enable Permission',
					onClick: async () => {
						const { error: requestError } =
							await services.permissions.microphone.request();

						if (requestError) {
							toast.error('Failed to request microphone permission', {
								description: 'Please check your system settings',
							});
							return;
						}
						// Dismiss the toast after requesting
						toast.dismiss(microphoneToastId);
					},
				},
				duration: Number.POSITIVE_INFINITY,
				id: microphoneToastId,
			});
		}
	})();

	// Return cleanup function
	return () => {
		toast.dismiss(microphoneToastId);
	};
}
