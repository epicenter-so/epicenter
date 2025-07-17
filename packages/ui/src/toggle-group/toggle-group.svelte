<script lang="ts" module>
	import type { ToggleVariants } from '#toggle/index.js';

	import { getContext, setContext } from 'svelte';
	export function setToggleGroupCtx(props: ToggleVariants) {
		setContext('toggleGroup', props);
	}

	export function getToggleGroupCtx() {
		return getContext<ToggleVariants>('toggleGroup');
	}
</script>

<script lang="ts">
	import { cn } from '#/utils/utils.js';
	import { ToggleGroup as ToggleGroupPrimitive } from 'bits-ui';

	let {
		class: className,
		ref = $bindable(null),
		size = 'default',
		value = $bindable(),
		variant = 'default',
		...restProps
	}: ToggleGroupPrimitive.RootProps & ToggleVariants = $props();

	setToggleGroupCtx({
		size,
		variant,
	});
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<ToggleGroupPrimitive.Root
	bind:value={value as never}
	bind:ref
	data-slot="toggle-group"
	data-variant={variant}
	data-size={size}
	class={cn(
		'group/toggle-group data-[variant=outline]:shadow-xs flex w-fit items-center rounded-md',
		className,
	)}
	{...restProps}
/>
