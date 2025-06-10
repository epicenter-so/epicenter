<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { TrashIcon } from '$lib/components/icons';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import SelectAllPopover from '$lib/components/ui/table/SelectAllPopover.svelte';
	import SortableTableHeader from '$lib/components/ui/table/SortableTableHeader.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import { transformations } from '$lib/query/transformations';
	import {
		createResultMutation,
		createResultQuery,
	} from '@tanstack/svelte-query';
	import { type Transformation } from '$lib/services/db';
	import { createPersistedState } from '$lib/utils/createPersistedState.svelte';
	import { createTransformationViewTransitionName } from '$lib/utils/createTransformationViewTransitionName';
	import {
		FlexRender,
		createSvelteTable,
		renderComponent,
	} from '$lib/components/ui/data-table/index.js';
	import type {
		ColumnDef,
		ColumnFiltersState,
		PaginationState,
	} from '@tanstack/table-core';
	import {
		getCoreRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel,
	} from '@tanstack/table-core';
	import { createRawSnippet } from 'svelte';
	import { z } from 'zod';
	import CreateTransformationButton from './CreateTransformationButton.svelte';
	import MarkTransformationActiveButton from './MarkTransformationActiveButton.svelte';
	import TransformationRowActions from './TransformationRowActions.svelte';
	import { toast } from '$lib/services/toast';

	const transformationsQuery = createResultQuery(
		transformations.queries.getAllTransformations,
	);
	const deleteTransformations = createResultMutation(
		transformations.mutations.deleteTransformations.options,
	);

	const columns: ColumnDef<Transformation>[] = [
		{
			id: 'select',
			header: ({ table }) =>
				renderComponent(SelectAllPopover<Transformation>, { table }),
			cell: ({ row }) =>
				renderComponent(Checkbox, {
					checked: row.getIsSelected(),
					onCheckedChange: (value) => row.toggleSelected(!!value),
					'aria-label': 'Select row',
				}),
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: 'mark-selected',
			cell: ({ row }) =>
				renderComponent(MarkTransformationActiveButton, {
					transformation: row.original,
					size: 'icon',
				}),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: 'id',
			cell: ({ getValue }) =>
				renderComponent(Badge, {
					variant: 'id',
					children: createRawSnippet((name) => ({
						render: () => getValue<string>(),
					})),
				}),
			header: 'ID',
		},
		{
			accessorKey: 'title',
			header: ({ column }) =>
				renderComponent(SortableTableHeader, {
					column,
					headerText: 'Title',
				}),
		},
		{
			accessorKey: 'description',
			header: ({ column }) =>
				renderComponent(SortableTableHeader, {
					column,
					headerText: 'Description',
				}),
		},
		{
			id: 'actions',
			accessorFn: (transformation) => transformation,
			header: 'Actions',
			cell: ({ getValue }) => {
				const transformation = getValue<Transformation>();
				return renderComponent(TransformationRowActions, {
					transformationId: transformation.id,
				});
			},
		},
	];

	let sorting = createPersistedState({
		key: 'whispering-transformations-data-table-sorting',
		defaultValue: [{ id: 'title', desc: false }],
		schema: z.array(z.object({ desc: z.boolean(), id: z.string() })),
	});
	let columnFilters = $state<ColumnFiltersState>([]);
	let rowSelection = createPersistedState({
		key: 'whispering-transformations-data-table-row-selection',
		defaultValue: {},
		schema: z.record(z.string(), z.boolean()),
	});
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });

	const table = createSvelteTable({
		getRowId: (originalRow) => originalRow.id,
		get data() {
			return transformationsQuery.data ?? [];
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting.value = updater(sorting.value);
			} else {
				sorting.value = updater;
			}
		},
		onColumnFiltersChange: (updater) => {
			if (typeof updater === 'function') {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		onRowSelectionChange: (updater) => {
			if (typeof updater === 'function') {
				rowSelection.value = updater(rowSelection.value);
			} else {
				rowSelection.value = updater;
			}
		},
		onPaginationChange: (updater) => {
			if (typeof updater === 'function') {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
		state: {
			get sorting() {
				return sorting.value;
			},
			get columnFilters() {
				return columnFilters;
			},
			get rowSelection() {
				return rowSelection.value;
			},
			get pagination() {
				return pagination;
			},
		},
	});

	const selectedTransformationRows = $derived(
		table.getFilteredSelectedRowModel().rows,
	);

	const filterQuery = {
		get value() {
			return table.getColumn('select')?.getFilterValue() as string;
		},
		set value(value) {
			table.getColumn('select')?.setFilterValue(value);
		},
	};
</script>

<svelte:head>
	<title>All Transformations</title>
</svelte:head>

<main class="flex w-full flex-1 flex-col gap-2 px-4 py-4 md:px-8">
	<h1 class="scroll-m=20 text-4xl font-bold tracking-tight lg:text-5xl">
		Transformations
	</h1>
	<p class="text-muted-foreground">
		Your text transformations, stored locally in IndexedDB.
	</p>

	<div class="flex items-center justify-between gap-2 w-full">
		<Input
			placeholder="Filter transformations..."
			type="text"
			class="w-full"
			value={filterQuery.value}
			oninput={(e) => (filterQuery.value = e.currentTarget.value)}
		/>
		{#if selectedTransformationRows.length > 0}
			<WhisperingButton
				tooltipContent="Delete selected transformations"
				variant="outline"
				size="icon"
				onclick={() => {
					confirmationDialog.open({
						title: 'Delete transformations',
						subtitle: 'Are you sure you want to delete these transformations?',
						confirmText: 'Delete',
						onConfirm: () => {
							deleteTransformations.mutate(
								selectedTransformationRows.map(({ original }) => original),
								{
									onSuccess: () => {
										toast.success({
											title: 'Deleted transformations!',
											description:
												'Your transformations have been deleted successfully.',
										});
									},
									onError: (error) => {
										toast.error({
											title: 'Failed to delete transformations!',
											description: 'Your transformations could not be deleted.',
											action: { type: 'more-details', error },
										});
									},
								},
							);
						},
					});
				}}
			>
				<TrashIcon class="size-4" />
			</WhisperingButton>
		{/if}

		<CreateTransformationButton />
	</div>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup}
					<Table.Row>
						{#each headerGroup.headers as header}
							<Table.Head colspan={header.colSpan}>
								{#if !header.isPlaceholder}
									<FlexRender
										content={header.column.columnDef.header}
										context={header.getContext()}
									/>
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#if transformationsQuery.isPending}
					{#each { length: 5 }}
						<Table.Row>
							<Table.Cell>
								<Skeleton class="size-4" />
							</Table.Cell>
							<Table.Cell colspan={columns.length - 1}>
								<Skeleton class="h-4 w-full" />
							</Table.Cell>
						</Table.Row>
					{/each}
				{:else if table.getRowModel().rows?.length}
					{#each table.getRowModel().rows as row (row.id)}
						<Table.Row
							style="view-transition-name: {createTransformationViewTransitionName(
								{ transformationId: row.id },
							)}"
						>
							{#each row.getVisibleCells() as cell}
								<Table.Cell>
									<FlexRender
										content={cell.column.columnDef.cell}
										context={cell.getContext()}
									/>
								</Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				{:else}
					<Table.Row>
						<Table.Cell colspan={columns.length} class="h-24 text-center">
							{#if filterQuery.value}
								No transformations found.
							{:else}
								No transformations yet. Click "Create Transformation" to add
								one.
							{/if}
						</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	</div>

	<div class="flex items-center justify-between">
		<div class="text-muted-foreground text-sm">
			{selectedTransformationRows.length} of {table.getFilteredRowModel().rows
				.length} row(s) selected.
		</div>
		<div class="flex items-center space-x-2">
			<Button
				variant="outline"
				size="sm"
				onclick={() => table.previousPage()}
				disabled={!table.getCanPreviousPage()}
			>
				Previous
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={() => table.nextPage()}
				disabled={!table.getCanNextPage()}
			>
				Next
			</Button>
		</div>
	</div>
</main>
