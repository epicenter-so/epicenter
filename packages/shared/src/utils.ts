import { trySync } from '@epicenterhq/result';

export const parseJson = (value: string) =>
	trySync({
		try: () => JSON.parse(value) as unknown,
		mapError: (error) => ({ name: 'ParseJsonError', error }),
	});
