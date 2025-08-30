export function createTransformationViewTransitionName({
	transformationId,
}: {
	transformationId: null | string;
}): string {
	return `transformation-${transformationId ?? 'none'}`;
}
