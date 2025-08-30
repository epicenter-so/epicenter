import type { Result } from 'wellcrafted/result';

import { IS_MACOS } from '$lib/constants/platform';
import { createTaggedError, extractErrorMessage } from 'wellcrafted/error';
import { Ok, tryAsync } from 'wellcrafted/result';

export const { PermissionsServiceErr, PermissionsServiceError } =
	createTaggedError('PermissionsServiceError');
export type PermissionsService = {
	accessibility: {
		check: () => Promise<Result<boolean, PermissionsServiceError>>;
		request: () => Promise<Result<unknown, PermissionsServiceError>>;
	};
	microphone: {
		check: () => Promise<Result<boolean, PermissionsServiceError>>;
		request: () => Promise<Result<unknown, PermissionsServiceError>>;
	};
};

export type PermissionsServiceError = ReturnType<
	typeof PermissionsServiceError
>;

function createPermissionsService(): PermissionsService {
	return {
		accessibility: {
			async check() {
				if (!IS_MACOS) return Ok(true);

				return tryAsync({
					mapErr: (error) =>
						PermissionsServiceErr({
							cause: error,
							message: `Failed to check accessibility permissions: ${extractErrorMessage(error)}`,
						}),
					try: async () => {
						const { checkAccessibilityPermission } = await import(
							'tauri-plugin-macos-permissions-api'
						);
						return await checkAccessibilityPermission();
					},
				});
			},

			async request() {
				if (!IS_MACOS) return Ok(true);

				return tryAsync({
					mapErr: (error) =>
						PermissionsServiceErr({
							cause: error,
							message: `Failed to request accessibility permissions: ${extractErrorMessage(error)}`,
						}),
					try: async () => {
						const { requestAccessibilityPermission } = await import(
							'tauri-plugin-macos-permissions-api'
						);
						return await requestAccessibilityPermission();
					},
				});
			},
		},

		microphone: {
			async check() {
				if (!IS_MACOS) return Ok(true);

				return tryAsync({
					mapErr: (error) =>
						PermissionsServiceErr({
							cause: error,
							message: `Failed to check microphone permissions: ${extractErrorMessage(error)}`,
						}),
					try: async () => {
						const { checkMicrophonePermission } = await import(
							'tauri-plugin-macos-permissions-api'
						);
						return await checkMicrophonePermission();
					},
				});
			},

			async request() {
				if (!IS_MACOS) return Ok(true);

				return tryAsync({
					mapErr: (error) =>
						PermissionsServiceErr({
							cause: error,
							message: `Failed to request microphone permissions: ${extractErrorMessage(error)}`,
						}),
					try: async () => {
						const { requestMicrophonePermission } = await import(
							'tauri-plugin-macos-permissions-api'
						);
						return await requestMicrophonePermission();
					},
				});
			},
		},
	};
}

export const PermissionsServiceLive = createPermissionsService();
