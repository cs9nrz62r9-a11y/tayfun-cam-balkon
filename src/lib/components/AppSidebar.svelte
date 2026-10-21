<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		BarChart3,
		ChevronLeft,
		ChevronRight,
		FileText,
		FolderKanban,
		House,
		Image,
		Layers3,
		LogOut,
		Menu,
		Palette,
		Settings,
		Users
	} from '@lucide/svelte';
	import { auth } from '#lib/stores/auth';

	let collapsed = $state(false);

	const items = [
		{ label: 'Ana Sayfa', href: '/', icon: House },
		{ label: 'Projeler', href: '/projects', icon: FolderKanban },
		{ label: 'Yeni Çizim', href: '/wizard', icon: Palette },
		{ label: 'Tasarımlarım', href: '/designs', icon: Image },
		{ label: 'Müşteriler', href: '/customers', icon: Users },
		{ label: 'Teklifler', href: '/teklif', icon: FileText },
		{ label: 'Şablonlar', href: '/templates', icon: Layers3 },
		{ label: 'Sistemler', href: '/systems', icon: Menu },
		{ label: 'Analitikler', href: '/analytics', icon: BarChart3 },
		{ label: 'Ayarlar', href: '/settings', icon: Settings }
	];

	onMount(() => {
		const mobile = window.matchMedia('(max-width: 820px)');
		const sync = () => {
			if (mobile.matches) collapsed = true;
		};
		sync();
		mobile.addEventListener('change', sync);
		return () => mobile.removeEventListener('change', sync);
	});

	function isActive(href: string) {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}

	async function signOut() {
		await auth.signOut();
		await goto('/auth/login');
	}
</script>

<aside class:collapsed class="sidebar">
	<div class="brand-row">
		<div class="brand-mark" aria-hidden="true"><Layers3 size={22} strokeWidth={2.2} /></div>
		<div class="brand-copy">
			<strong>Tayfun Yapı</strong>
			<span>Cam Balkon</span>
		</div>
		<button
			class="collapse-button"
			type="button"
			onclick={() => (collapsed = !collapsed)}
			aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
			title={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
		>
			{#if collapsed}<ChevronRight size={19} />{:else}<ChevronLeft size={19} />{/if}
		</button>
	</div>

	<nav aria-label="Ana menü">
		{#each items as item}
			{@const Icon = item.icon}
			<a
				href={item.href}
				class:active={isActive(item.href)}
				aria-current={isActive(item.href) ? 'page' : undefined}
				title={collapsed ? item.label : undefined}
			>
				<Icon size={20} strokeWidth={1.9} />
				<span>{item.label}</span>
			</a>
		{/each}
	</nav>

	<div class="sidebar-footer">
		<button type="button" onclick={signOut} title={collapsed ? 'Çıkış Yap' : undefined}>
			<LogOut size={20} strokeWidth={1.9} />
			<span>Çıkış Yap</span>
		</button>
		<div class="version">v1.0</div>
	</div>
</aside>

<style>
	.sidebar {
		width: 250px;
		min-width: 250px;
		height: 100dvh;
		position: sticky;
		top: 0;
		display: flex;
		flex-direction: column;
		background: #17191d;
		color: #f8fafc;
		border-right: 1px solid #2a2e35;
		transition: width 180ms ease, min-width 180ms ease;
		z-index: 20;
	}

	.sidebar.collapsed {
		width: 76px;
		min-width: 76px;
	}

	.brand-row {
		height: 76px;
		display: flex;
		align-items: center;
		gap: 11px;
		padding: 0 16px;
		border-bottom: 1px solid #2a2e35;
	}

	.brand-mark {
		width: 42px;
		height: 42px;
		min-width: 42px;
		display: grid;
		place-items: center;
		background: #0f8b8d;
		color: #ffffff;
		border-radius: 7px;
	}

	.brand-copy {
		display: flex;
		flex-direction: column;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
	}

	.brand-copy strong { font-size: 15px; line-height: 1.2; }
	.brand-copy span { font-size: 11px; color: #9ca3af; margin-top: 3px; }

	.collapse-button {
		width: 30px;
		height: 30px;
		min-width: 30px;
		margin-left: auto;
		border: 0;
		background: #272b31;
		color: #cbd5e1;
		border-radius: 6px;
		display: grid;
		place-items: center;
		cursor: pointer;
	}

	.sidebar.collapsed .brand-copy,
	.sidebar.collapsed nav a span,
	.sidebar.collapsed .sidebar-footer button span,
	.sidebar.collapsed .version { display: none; }

	.sidebar.collapsed .brand-row { padding: 0 17px; }

	.sidebar.collapsed .collapse-button {
		position: absolute;
		top: 60px;
		left: 49px;
		width: 24px;
		height: 24px;
		min-width: 24px;
		border: 1px solid #3a3f47;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 18px 12px;
		overflow-y: auto;
	}

	nav a,
	.sidebar-footer button {
		height: 44px;
		display: flex;
		align-items: center;
		gap: 13px;
		padding: 0 13px;
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: #b9c0ca;
		font: inherit;
		font-weight: 500;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
		transition: background 140ms ease, color 140ms ease;
	}

	nav a:hover,
	.sidebar-footer button:hover { background: #252930; color: #ffffff; }

	nav a.active {
		background: #0f6f72;
		color: #ffffff;
		box-shadow: inset 3px 0 0 #f1a33c;
	}

	.sidebar.collapsed nav a,
	.sidebar.collapsed .sidebar-footer button { justify-content: center; padding: 0; }

	.sidebar-footer {
		margin-top: auto;
		padding: 12px;
		border-top: 1px solid #2a2e35;
	}

	.sidebar-footer button { width: 100%; }
	.version { padding: 10px 13px 0; font-size: 10px; color: #6b7280; }

	@media (max-height: 700px) {
		nav { padding-top: 10px; padding-bottom: 10px; }
		nav a, .sidebar-footer button { height: 39px; }
	}
</style>
