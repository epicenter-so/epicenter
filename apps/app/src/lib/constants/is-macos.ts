import * as services from '$lib/services';

export const IS_MACOS = services.os.type() === 'macos';
