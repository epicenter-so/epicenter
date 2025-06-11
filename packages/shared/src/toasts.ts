import { z } from 'zod';

const toastVariantSchema = z.enum([
	'error',
	'warning',
	'success',
	'info',
	'loading',
]);

export const toastAndNotificationOptionsSchema = z.object({
	id: z.string().optional(),
	variant: toastVariantSchema,
	title: z.string(),
	description: z.string(),
	action: z
		.discriminatedUnion('type', [
			z.object({
				type: z.literal('link'),
				label: z.string(),
				goto: z.string(),
			}),
			z.object({
				type: z.literal('more-details'),
				error: z.unknown(),
			}),
			z.object({
				type: z.literal('button'),
				label: z.string(),
				onClick: z.function().args().returns(z.void()),
			}),
		])
		.optional(),
});

export type ToastAndNotifyOptions = z.infer<
	typeof toastAndNotificationOptionsSchema
>;
