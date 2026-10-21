<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '#lib/assets/favicon.svg';
	import AppSidebar from '#lib/components/AppSidebar.svelte';
	import { auth, isAuthenticated } from '#lib/stores/auth';
	import { data } from '#lib/stores/data';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	let initialized = $state(false);

	onMount(async () => {
		const unsubscribe = await auth.initialize();
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
	<meta name="description" content="Tayfun Yapı üretim ve operasyon yönetimi" />
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<meta name="theme-color" content="#172328" />
</svelte:head>

{#if initialized}
	{#if $isAuthenticated}
		<div class="app-shell">
			<AppSidebar />
			<main class="app-content">{@render children()}</main>
		</div>
	{:else}
		{@render children()}
	{/if}
{:else}
	<div class="boot-screen" role="status">
		<div>
			<i></i>
			<p>Tayfun Works hazırlanıyor</p>
		</div>
	</div>
{/if}

<style>
	:global(:root) {
		/* Tayfun Works: camın hafifliği, profilin teknik netliği. */
		--tw-ink: #172328;
		--tw-ink-soft: #243238;
		--tw-glass: #087b78;
		--tw-glass-strong: #056b68;
		--tw-glass-soft: #ddf1ef;
		--tw-aluminium: #d7dee1;
		--tw-canvas: #f3f6f5;
		--tw-surface: #ffffff;
		--tw-surface-muted: #eaf0ef;
		--tw-signal: #f28c28;
		--tw-signal-soft: #fff0df;
		--tw-success: #2f8f63;
		--tw-danger: #d64545;
		--tw-warning: #c97416;
		--tw-text: #1b272c;
		--tw-text-muted: #69777d;
		--tw-border: #dce3e4;
		--tw-border-strong: #c7d1d3;
		--tw-shadow-sm: 0 2px 8px rgb(23 35 40 / 0.05);
		--tw-shadow-md: 0 12px 30px rgb(23 35 40 / 0.09);
		--tw-radius-sm: 4px;
		--tw-radius-md: 6px;
		--tw-radius-lg: 8px;
		--tw-space-1: 4px;
		--tw-space-2: 8px;
		--tw-space-3: 12px;
		--tw-space-4: 16px;
		--tw-space-6: 24px;
		--tw-space-8: 32px;
		--tw-sidebar-width: 252px;
		--tw-sidebar-compact: 76px;
		--tw-mobile-nav-height: 72px;

		/* Eski ekranlar yeni ürün diliyle uyumlu kalır. */
		--color-primary: var(--tw-ink);
		--color-secondary: var(--tw-glass);
		--color-border: var(--tw-border);
		--color-text: var(--tw-text);
		--color-text-light: var(--tw-text-muted);
	}

	:global(html) {
		min-height: 100%;
		background: var(--tw-canvas);
	}
	:global(body) {
		min-height: 100%;
		margin: 0;
		padding: 0;
		font-family:
			Inter,
			ui-sans-serif,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		font-size: 14px;
		line-height: 1.5;
		letter-spacing: 0;
		color: var(--tw-text);
		background: var(--tw-canvas);
		-webkit-font-smoothing: antialiased;
	}
	:global(*) {
		box-sizing: border-box;
	}
	:global(button),
	:global(input),
	:global(select),
	:global(textarea) {
		font: inherit;
	}
	:global(button),
	:global(a) {
		-webkit-tap-highlight-color: transparent;
	}
	:global(:focus-visible) {
		outline: 3px solid rgb(8 123 120 / 0.24);
		outline-offset: 2px;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.app-shell {
		display: flex;
		min-height: 100dvh;
		background: var(--tw-canvas);
	}
	.app-content {
		flex: 1;
		min-width: 0;
		min-height: 100dvh;
		overflow-x: hidden;
	}
	.boot-screen {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		background: var(--tw-ink);
		color: #fff;
	}
	.boot-screen div {
		text-align: center;
	}
	.boot-screen i {
		display: block;
		width: 38px;
		height: 38px;
		margin: 0 auto 14px;
		border: 3px solid rgb(255 255 255 / 0.2);
		border-top-color: var(--tw-signal);
		border-radius: 50%;
		animation: spin 800ms linear infinite;
	}
	.boot-screen p {
		margin: 0;
		color: #c7d4d6;
		font-size: 12px;
		font-weight: 700;
	}

	@media (max-width: 820px) {
		.app-content {
			padding-bottom: calc(var(--tw-mobile-nav-height) + env(safe-area-inset-bottom));
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(*) {
			scroll-behavior: auto !important;
			transition-duration: 0.01ms !important;
		}
	}
</style>
