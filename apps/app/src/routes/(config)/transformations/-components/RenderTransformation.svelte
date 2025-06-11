<script lang="ts">
	import * as Resizable from '$lib/components/ui/resizable';
	import { queries } from '$lib/query';
	import type { Transformation } from '$lib/services/db';
	import { createQuery } from '@tanstack/svelte-query';
	import RenderTransformationConfigurationAndSteps from './RenderTransformationConfigurationAndSteps.svelte';
	import RenderTransformationRuns from './RenderTransformationRuns.svelte';
	import RenderTransformationTest from './RenderTransformationTest.svelte';

	let {
		transformation,
		setTransformation,
		setTransformationDebounced,
	}: {
		transformation: Transformation;
		setTransformation: (transformation: Transformation) => void;
		setTransformationDebounced: (transformation: Transformation) => void;
	} = $props();

	const transformationRunsByTransformationIdQuery = createQuery(
		queries.transformationRuns.getTransformationRunsByTransformationId(
			() => transformation.id,
		).options,
	);
</script>

<Resizable.PaneGroup direction="horizontal">
	<Resizable.Pane>
		<RenderTransformationConfigurationAndSteps
			{transformation}
			{setTransformation}
			{setTransformationDebounced}
		/>
	</Resizable.Pane>
	<Resizable.Handle withHandle />
	<Resizable.Pane>
		<Resizable.PaneGroup direction="vertical">
			<Resizable.Pane>
				<RenderTransformationTest {transformation} />
			</Resizable.Pane>
			<Resizable.Handle withHandle />
			<Resizable.Pane>
				{#if transformationRunsByTransformationIdQuery.isPending}
					<div class="text-muted-foreground text-sm p-4">Loading runs...</div>
				{:else if transformationRunsByTransformationIdQuery.error}
					<div class="text-destructive text-sm p-4">
						Error loading transformation runs: {transformationRunsByTransformationIdQuery
							.error.message}
					</div>
				{:else if transformationRunsByTransformationIdQuery.data}
					<RenderTransformationRuns
						runs={transformationRunsByTransformationIdQuery.data}
					/>
				{/if}
			</Resizable.Pane>
		</Resizable.PaneGroup>
	</Resizable.Pane>
</Resizable.PaneGroup>
