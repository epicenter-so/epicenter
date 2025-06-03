import { trySync } from '@epicenterhq/result';

export const parseJson = (value: string) =>
	trySync({
		try: () => JSON.parse(value) as unknown,
		mapErr: (error) => ({ name: 'ParseJsonError', error }),
	});
