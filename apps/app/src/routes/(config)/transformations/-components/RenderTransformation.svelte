<script lang="ts">
	import * as Resizable from '$lib/components/ui/resizable';
	import { useTransformationRunsByTransformationIdQuery } from '$lib/query/transformationRuns/queries';
	import type { Transformation } from '$lib/services/db';
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

	const { transformationRunsByTransformationIdQuery } =
		useTransformationRunsByTransformationIdQuery(() => transformation.id);
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
