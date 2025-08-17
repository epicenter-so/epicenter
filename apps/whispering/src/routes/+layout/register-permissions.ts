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
			toast.info('Accessibility Permission Required', {
				id: accessibilityToastId,
				description:
					'Whispering needs accessibility permissions to write transcribed text to the cursor',
				duration: Number.POSITIVE_INFINITY,
				action: {
					label: 'Enable Permission',
					onClick: async () => {
						const { error: requestError } =
							await services.permissions.accessibility.request();

						if (requestError) {
							toast.error('Failed to open accessibility settings', {
								description:
									'Please open System Settings > Privacy & Security > Accessibility manually',
							});
							// toast.info(
							// 	'Please enable or re-enable accessibility to write transcriptions!',
							// 	{
							// 		description:
							// 			'Accessibility must be enabled or re-enabled for Whispering after install or update. Follow the link below for instructions.',
							// 		action: {
							// 			label: 'Open Directions',
							// 			onClick: () => {
							// 				window.open('/macos-enable-accessibility', '_blank');
							// 			},
							// 		},
							// 	},
							// );
							return;
						}
						// Dismiss the toast after requesting
						toast.dismiss(accessibilityToastId);
					},
				},
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
				id: microphoneToastId,
				description: 'Whispering needs microphone access to record audio',
				duration: Number.POSITIVE_INFINITY,
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
			});
		}
	})();

	// Return cleanup function
	return () => {
		toast.dismiss(microphoneToastId);
	};
}
