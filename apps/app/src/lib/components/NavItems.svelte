<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { GithubIcon } from '$lib/components/icons';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { cn } from '$lib/utils';
	import { LogicalSize, getCurrentWindow } from '@tauri-apps/api/window';
	import {
		LayersIcon,
		ListIcon,
		Minimize2Icon,
		MoonIcon,
		MoreVerticalIcon,
		SettingsIcon,
		SunIcon,
	} from 'lucide-svelte';
	import { toggleMode } from 'mode-watcher';

	let {
		class: className,
		collapsed = false,
	}: { class?: string; collapsed?: boolean } = $props();

	const navItems = [
		{
			id: 'recordings',
			label: 'Recordings',
			icon: ListIcon,
			type: 'anchor',
			href: '/recordings',
		},
		{
			id: 'transformations',
			label: 'Transformations',
			icon: LayersIcon,
			type: 'anchor',
			href: '/transformations',
		},
		{
			id: 'settings',
			label: 'Settings',
			icon: SettingsIcon,
			type: 'anchor',
			href: '/settings',
		},
		{
			id: 'github',
			label: 'View project on GitHub',
			icon: GithubIcon,
			href: 'https://github.com/braden-w/whispering',
			type: 'anchor',
			external: true,
		},
		{
			id: 'theme',
			label: 'Toggle dark mode',
			icon: SunIcon,
			type: 'theme',
			action: toggleMode,
		},
		...(window.__TAURI_INTERNALS__
			? ([
					{
						id: 'minimize',
						label: 'Minimize',
						icon: Minimize2Icon,
						type: 'button',
						action: () => getCurrentWindow().setSize(new LogicalSize(72, 84)),
					},
				] as const)
			: []),
	] satisfies ({
		id: string;
		label: string;
		icon: unknown;
		type: 'button' | 'anchor' | 'theme';
	} & (
		| { type: 'button'; action: () => void }
		| { type: 'anchor'; href: string; external?: boolean }
		| { type: 'theme'; action: () => void }
	))[];
</script>

{#if collapsed}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<WhisperingButton
					tooltipContent="Menu"
					variant="ghost"
					size="icon"
					class={className}
					{...props}
				>
					<MoreVerticalIcon class="size-4" aria-hidden="true" />
				</WhisperingButton>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-56">
			{#each navItems as item}
				{@const Icon = item.icon}
				{#if item.type === 'anchor'}
					<DropdownMenu.Item>
						{#snippet child({ props })}
							<a
								href={item.href}
								target={item.external ? '_blank' : undefined}
								rel={item.external ? 'noopener noreferrer' : undefined}
								class="flex items-center gap-2"
								{...props}
							>
								<Icon class="size-4" aria-hidden="true" />
								<span>{item.label}</span>
							</a>
						{/snippet}
					</DropdownMenu.Item>
				{:else if item.type === 'button'}
					<DropdownMenu.Item
						onclick={item.action}
						class="flex items-center gap-2"
					>
						<Icon class="size-4" aria-hidden="true" />
						<span>{item.label}</span>
					</DropdownMenu.Item>
				{:else if item.type === 'theme'}
					<DropdownMenu.Item
						onclick={item.action}
						class="flex items-center gap-2"
					>
						<div class="relative size-4">
							<SunIcon
								class="absolute h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
							/>
							<MoonIcon
								class="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
							/>
						</div>
						<span>{item.label}</span>
					</DropdownMenu.Item>
				{/if}
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<nav
		class={cn('flex items-center gap-1.5', className)}
		style="view-transition-name: nav"
	>
		{#each navItems as item}
			{@const Icon = item.icon}
			{#if item.type === 'anchor'}
				<WhisperingButton
					tooltipContent={item.label}
					href={item.href}
					target={item.external ? '_blank' : undefined}
					rel={item.external ? 'noopener noreferrer' : undefined}
					variant="ghost"
					size="icon"
				>
					<Icon class="size-4" aria-hidden="true" />
				</WhisperingButton>
			{:else if item.type === 'button'}
				<WhisperingButton
					tooltipContent={item.label}
					onclick={item.action}
					variant="ghost"
					size="icon"
				>
					{#if item.id === 'theme'}
						<SunIcon
							class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
						/>
						<MoonIcon
							class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
						/>
					{:else}
						<Icon class="size-4" aria-hidden="true" />
					{/if}
				</WhisperingButton>
			{/if}
		{/each}
	</nav>
{/if}

<style>
	@keyframes ping {
		75%,
		100% {
			transform: scale(2);
			opacity: 0;
		}
	}

	.animate-ping {
		animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
	}
</style>
