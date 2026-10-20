<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '#lib/assets/favicon.svg';
	import { auth } from '#lib/stores/auth';
	import { data } from '#lib/stores/data';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	let initialized = $state(false);

	onMount(async () => {
		// Initialize auth
		const unsubscribe = await auth.initialize();

		// Load initial data
		await data.loadAll();
		const unsubscribeRealtime = data.setupRealtimeListeners();

		initialized = true;

		return () => {
			unsubscribe?.();
			unsubscribeRealtime?.();
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Tayfun Cam Balkon</title>
	<meta name="description" content="Web-based glass balcony design system" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<style>
	:global(:root) {
		--color-primary: #1f2937;
		--color-secondary: #10b981;
		--color-border: #e5e7eb;
		--color-text: #111827;
		--color-text-light: #6b7280;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 14px;
		line-height: 1.5;
		color: var(--color-text);
		background: #ffffff;
	}

	:global(*) {
		box-sizing: border-box;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>

{#if initialized}
	{@render children()}
{:else}
	<div style="display: flex; align-items: center; justify-content: center; height: 100vh;">
		<div style="text-align: center;">
			<div style="width: 40px; height: 40px; border: 4px solid var(--color-border); border-top-color: var(--color-secondary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
			<p>Yükleniyor...</p>
		</div>
	</div>
{/if}
