<script lang="ts">
	import Copyable from '$lib/components/copyable/Copyable.svelte';
	import CopyableTextDialog from '$lib/components/copyable/CopyableTextDialog.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import * as Table from '$lib/components/ui/table';
	import type { TransformationRun } from '$lib/services/db';
	import { getTransformationStepRunTransitionId } from '$lib/utils/getRecordingTransitionId';
	import { format } from 'date-fns';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';

	let { runs }: { runs: TransformationRun[] } = $props();

	let expandedRunId = $state<string | null>(null);

	function toggleRunExpanded(runId: string) {
		expandedRunId = expandedRunId === runId ? null : runId;
	}

	function formatDate(dateStr: string) {
		return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
	}
</script>

{#if runs.length === 0}
	<div class="flex h-full items-center justify-center">
		<div class="flex flex-col items-center gap-4 text-center">
			<div class="rounded-full bg-muted p-4">
				<ChevronRight class="size-6 text-muted-foreground" />
			</div>
			<div class="space-y-1">
				<h3 class="text-xl font-semibold">No Runs Yet</h3>
				<p class="text-muted-foreground">
					When you run a transformation, the results will appear here.
				</p>
			</div>
		</div>
	</div>
{:else}
	<div class="h-full overflow-y-auto px-2">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Expand</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head>Started</Table.Head>
					<Table.Head>Completed</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each runs as run}
					<Table.Row>
						<Table.Cell>
							<Button
								variant="ghost"
								size="icon"
								class="size-8 shrink-0"
								onclick={() => toggleRunExpanded(run.id)}
							>
								{#if expandedRunId === run.id}
									<ChevronDown class="size-4" />
								{:else}
									<ChevronRight class="size-4" />
								{/if}
							</Button>
						</Table.Cell>
						<Table.Cell>
							<Badge variant={`status.${run.status}`}>
								{run.status}
							</Badge>
						</Table.Cell>
						<Table.Cell>
							{formatDate(run.startedAt)}
						</Table.Cell>
						<Table.Cell>
							{run.completedAt ? formatDate(run.completedAt) : '-'}
						</Table.Cell>
					</Table.Row>

					{#if expandedRunId === run.id}
						<Table.Row>
							<Table.Cell class="space-y-4" colspan={4}>
								<Copyable
									variant="text"
									copyableText={run.input}
									label="Input"
								/>
								{#if run.output}
									<Copyable
										variant="text"
										copyableText={run.output}
										label="Output"
									/>
								{:else if run.error}
									<Copyable
										variant="error"
										copyableText={run.error}
										label="Error"
									/>
								{/if}
								{#if run.stepRuns.length > 0}
									<div class="flex flex-col gap-2">
										<Label class="text-sm font-medium">Steps</Label>
										<Card.Root>
											<Table.Root>
												<Table.Header>
													<Table.Row>
														<Table.Head>Status</Table.Head>
														<Table.Head>Started</Table.Head>
														<Table.Head>Completed</Table.Head>
														<Table.Head>Input</Table.Head>
														<Table.Head>Output</Table.Head>
													</Table.Row>
												</Table.Header>
												<Table.Body>
													{#each run.stepRuns as stepRun}
														<Table.Row>
															<Table.Cell>
																<Badge variant={`status.${stepRun.status}`}>
																	{stepRun.status}
																</Badge>
															</Table.Cell>
															<Table.Cell>
																{formatDate(stepRun.startedAt)}
															</Table.Cell>
															<Table.Cell>
																{stepRun.completedAt
																	? formatDate(stepRun.completedAt)
																	: '-'}
															</Table.Cell>
															<Table.Cell>
																<CopyableTextDialog
																	id={getTransformationStepRunTransitionId({
																		stepRunId: stepRun.id,
																		propertyName: 'input',
																	})}
																	label="Input"
																	text={stepRun.input}
																/>
															</Table.Cell>
															<Table.Cell>
																{#if stepRun.output}
																	<CopyableTextDialog
																		id={getTransformationStepRunTransitionId({
																			stepRunId: stepRun.id,
																			propertyName: 'output',
																		})}
																		label="Output"
																		text={stepRun.output}
																	/>
																{:else if stepRun.error}
																	<CopyableTextDialog
																		id={getTransformationStepRunTransitionId({
																			stepRunId: stepRun.id,
																			propertyName: 'error',
																		})}
																		label="Error"
																		text={stepRun.error}
																	/>
																{/if}
															</Table.Cell>
														</Table.Row>
													{/each}
												</Table.Body>
											</Table.Root>
										</Card.Root>
									</div>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/if}
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
{/if}
