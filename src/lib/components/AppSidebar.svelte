<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		BarChart3,
		CalendarDays,
		ChevronLeft,
		ChevronRight,
		ClipboardList,
		FileText,
		FolderKanban,
		House,
		Layers3,
		LogOut,
		Menu,
		PackageSearch,
		Plus,
		Settings,
		Users,
		X
	} from '@lucide/svelte';
	import { auth } from '#lib/stores/auth';

	let collapsed = $state(false);
	let mobileMoreOpen = $state(false);

	const groups = [
		{
			label: 'OPERASYON',
			items: [
				{ label: 'Bugün', href: '/', icon: House },
				{ label: 'İşler', href: '/projects', icon: FolderKanban },
				{ label: 'Montaj Planı', href: '/montage', icon: CalendarDays }
			]
		},
		{
			label: 'SATIŞ',
			items: [
				{ label: 'Müşteriler', href: '/customers', icon: Users },
				{ label: 'Teklifler', href: '/teklif', icon: FileText }
			]
		},
		{
			label: 'ÜRETİM',
			items: [
				{ label: 'Üretim Masası', href: '/wizard', icon: ClipboardList },
				{ label: 'Sistem Reçeteleri', href: '/systems', icon: Layers3 },
				{ label: 'Stok İhtiyacı', href: '/stock', icon: PackageSearch }
			]
		},
		{
			label: 'YÖNETİM',
			items: [
				{ label: 'Raporlar', href: '/analytics', icon: BarChart3 },
				{ label: 'Ayarlar', href: '/settings', icon: Settings }
			]
		}
	];

	const mobileItems = [
		{ label: 'Bugün', href: '/', icon: House, primary: false },
		{ label: 'İşler', href: '/projects', icon: FolderKanban, primary: false },
		{ label: 'Yeni İş', href: '/wizard', icon: Plus, primary: true },
		{ label: 'Montaj', href: '/montage', icon: CalendarDays, primary: false }
	];

	const moreItems = groups
		.flatMap((group) => group.items)
		.filter((item) => !['/', '/projects', '/wizard', '/montage'].includes(item.href));

	function isActive(href: string) {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}

	function closeMore() {
		mobileMoreOpen = false;
	}

	async function signOut() {
		closeMore();
		await auth.signOut();
		await goto('/auth/login');
	}
</script>

<aside class:collapsed class="sidebar">
	<div class="brand-row">
		<div class="brand-mark" aria-hidden="true"><Layers3 size={22} strokeWidth={2.2} /></div>
		<div class="brand-copy"><strong>Tayfun Yapı</strong><span>Üretim ve Operasyon</span></div>
		<button
			class="collapse-button"
			type="button"
			onclick={() => (collapsed = !collapsed)}
			aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
			title={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
		>
			{#if collapsed}<ChevronRight size={18} />{:else}<ChevronLeft size={18} />{/if}
		</button>
	</div>

	<nav aria-label="Ana menü">
		{#each groups as group}
			<section class="nav-group">
				<div class="group-label">{group.label}</div>
				{#each group.items as item}
					{@const Icon = item.icon}
					<a
						href={item.href}
						class:active={isActive(item.href)}
						aria-current={isActive(item.href) ? 'page' : undefined}
						title={collapsed ? item.label : undefined}
					>
						<Icon size={19} strokeWidth={1.9} /><span>{item.label}</span>
					</a>
				{/each}
			</section>
		{/each}
	</nav>

	<div class="sidebar-footer">
		<div class="company-state"><i></i><span>Sistem çevrimiçi</span></div>
		<button type="button" onclick={signOut} title={collapsed ? 'Çıkış Yap' : undefined}
			><LogOut size={19} strokeWidth={1.9} /><span>Çıkış Yap</span></button
		>
	</div>
</aside>

{#if mobileMoreOpen}
	<button class="sheet-backdrop" aria-label="Menüyü kapat" onclick={closeMore}></button>
	<section class="more-sheet" aria-label="Daha fazla menüsü">
		<header>
			<div><span>MENÜ</span><strong>Tayfun Works</strong></div>
			<button onclick={closeMore} aria-label="Kapat"><X size={20} /></button>
		</header>
		<div class="more-grid">
			{#each moreItems as item}
				{@const Icon = item.icon}
				<a href={item.href} onclick={closeMore} class:active={isActive(item.href)}
					><Icon size={21} /><span>{item.label}</span></a
				>
			{/each}
		</div>
		<button class="mobile-signout" onclick={signOut}><LogOut size={19} /> Çıkış Yap</button>
	</section>
{/if}

<nav class="mobile-nav" aria-label="Mobil ana menü">
	{#each mobileItems as item}
		{@const Icon = item.icon}
		<a
			href={item.href}
			class:active={isActive(item.href)}
			class:primary={item.primary}
			aria-current={isActive(item.href) ? 'page' : undefined}
		>
			<span class="mobile-icon"
				><Icon size={item.primary ? 27 : 21} strokeWidth={item.primary ? 2.4 : 1.9} /></span
			><small>{item.label}</small>
		</a>
	{/each}
	<button class:active={mobileMoreOpen} onclick={() => (mobileMoreOpen = !mobileMoreOpen)}
		><span class="mobile-icon"><Menu size={21} strokeWidth={1.9} /></span><small>Menü</small
		></button
	>
</nav>

<style>
	.sidebar {
		width: var(--tw-sidebar-width);
		min-width: var(--tw-sidebar-width);
		height: 100dvh;
		position: sticky;
		top: 0;
		display: flex;
		flex-direction: column;
		background: var(--tw-ink);
		color: #f8fbfb;
		border-right: 1px solid #304047;
		transition:
			width 180ms ease,
			min-width 180ms ease;
		z-index: 30;
	}
	.sidebar.collapsed {
		width: var(--tw-sidebar-compact);
		min-width: var(--tw-sidebar-compact);
	}
	.brand-row {
		height: 78px;
		display: flex;
		align-items: center;
		gap: 11px;
		padding: 0 16px;
		border-bottom: 1px solid #2d3c42;
	}
	.brand-mark {
		width: 42px;
		height: 42px;
		min-width: 42px;
		display: grid;
		place-items: center;
		background: var(--tw-glass);
		color: #fff;
		border-radius: var(--tw-radius-md);
		box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.1);
	}
	.brand-copy {
		display: flex;
		flex-direction: column;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
	}
	.brand-copy strong {
		font-size: 15px;
		line-height: 1.2;
	}
	.brand-copy span {
		margin-top: 3px;
		color: #8fa2a7;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.5px;
		text-transform: uppercase;
	}
	.collapse-button {
		width: 30px;
		height: 30px;
		min-width: 30px;
		margin-left: auto;
		border: 1px solid #36474e;
		background: var(--tw-ink-soft);
		color: #c8d3d5;
		border-radius: var(--tw-radius-sm);
		display: grid;
		place-items: center;
		cursor: pointer;
	}
	.sidebar.collapsed .brand-copy,
	.sidebar.collapsed nav a span,
	.sidebar.collapsed .group-label,
	.sidebar.collapsed .company-state span,
	.sidebar.collapsed .sidebar-footer button span {
		display: none;
	}
	.sidebar.collapsed .brand-row {
		padding: 0 17px;
	}
	.sidebar.collapsed .collapse-button {
		position: absolute;
		top: 61px;
		left: 50px;
		width: 23px;
		height: 23px;
		min-width: 23px;
	}

	.sidebar > nav {
		flex: 1;
		padding: 15px 12px;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: #3b4b51 transparent;
	}
	.nav-group + .nav-group {
		margin-top: 13px;
	}
	.group-label {
		min-height: 23px;
		padding: 0 12px;
		color: #71868c;
		font-size: 9px;
		font-weight: 800;
		letter-spacing: 1px;
	}
	.sidebar nav a,
	.sidebar-footer button {
		height: 40px;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0 12px;
		border: 0;
		border-radius: var(--tw-radius-md);
		background: transparent;
		color: #b8c6c9;
		font: inherit;
		font-size: 13px;
		font-weight: 650;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background 140ms ease,
			color 140ms ease;
	}
	.sidebar nav a:hover,
	.sidebar-footer button:hover {
		background: #24343a;
		color: #fff;
	}
	.sidebar nav a.active {
		background: #0b6665;
		color: #fff;
		box-shadow: inset 3px 0 0 var(--tw-signal);
	}
	.sidebar.collapsed nav a,
	.sidebar.collapsed .sidebar-footer button {
		justify-content: center;
		padding: 0;
	}
	.sidebar-footer {
		padding: 12px;
		border-top: 1px solid #2d3c42;
	}
	.sidebar-footer button {
		width: 100%;
	}
	.company-state {
		height: 31px;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 12px 8px;
		color: #84979c;
		font-size: 10px;
		white-space: nowrap;
	}
	.company-state i {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #48b982;
		box-shadow: 0 0 0 3px rgb(72 185 130 / 0.12);
	}
	.mobile-nav,
	.more-sheet,
	.sheet-backdrop {
		display: none;
	}

	@media (max-height: 760px) {
		.sidebar > nav {
			padding-top: 9px;
			padding-bottom: 9px;
		}
		.nav-group + .nav-group {
			margin-top: 7px;
		}
		.group-label {
			min-height: 17px;
		}
		.sidebar nav a {
			height: 36px;
		}
	}

	@media (max-width: 820px) {
		.sidebar {
			display: none;
		}
		.mobile-nav {
			position: fixed;
			z-index: 60;
			left: 0;
			right: 0;
			bottom: 0;
			height: calc(var(--tw-mobile-nav-height) + env(safe-area-inset-bottom));
			display: grid;
			grid-template-columns: repeat(5, 1fr);
			align-items: start;
			padding: 7px 7px env(safe-area-inset-bottom);
			background: rgb(255 255 255 / 0.97);
			border-top: 1px solid var(--tw-border);
			box-shadow: 0 -8px 26px rgb(23 35 40 / 0.08);
			backdrop-filter: blur(16px);
		}
		.mobile-nav a,
		.mobile-nav button {
			position: relative;
			height: 58px;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 2px;
			border: 0;
			background: transparent;
			color: #7a898e;
			text-decoration: none;
			cursor: pointer;
		}
		.mobile-nav small {
			font-size: 9px;
			font-weight: 750;
			letter-spacing: 0;
		}
		.mobile-icon {
			width: 34px;
			height: 29px;
			display: grid;
			place-items: center;
			border-radius: 14px;
		}
		.mobile-nav .active {
			color: var(--tw-glass);
		}
		.mobile-nav .active:not(.primary) .mobile-icon {
			background: var(--tw-glass-soft);
		}
		.mobile-nav .primary {
			transform: translateY(-17px);
			color: var(--tw-ink);
		}
		.mobile-nav .primary .mobile-icon {
			width: 54px;
			height: 54px;
			border-radius: 50%;
			background: var(--tw-signal);
			color: #fff;
			box-shadow: 0 9px 20px rgb(242 140 40 / 0.32);
		}
		.mobile-nav .primary small {
			margin-top: 3px;
			color: var(--tw-ink);
		}
		.sheet-backdrop {
			position: fixed;
			z-index: 64;
			inset: 0;
			display: block;
			border: 0;
			background: rgb(13 24 28 / 0.44);
			backdrop-filter: blur(2px);
		}
		.more-sheet {
			position: fixed;
			z-index: 65;
			left: 10px;
			right: 10px;
			bottom: calc(var(--tw-mobile-nav-height) + env(safe-area-inset-bottom) + 8px);
			display: block;
			padding: 16px;
			background: var(--tw-surface);
			border: 1px solid var(--tw-border);
			border-radius: var(--tw-radius-lg);
			box-shadow: 0 24px 55px rgb(23 35 40 / 0.22);
		}
		.more-sheet header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 13px;
		}
		.more-sheet header span,
		.more-sheet header strong {
			display: block;
		}
		.more-sheet header span {
			color: var(--tw-glass);
			font-size: 9px;
			font-weight: 850;
			letter-spacing: 1px;
		}
		.more-sheet header strong {
			font-size: 18px;
		}
		.more-sheet header button {
			width: 36px;
			height: 36px;
			display: grid;
			place-items: center;
			border: 1px solid var(--tw-border);
			border-radius: 50%;
			background: var(--tw-canvas);
			color: var(--tw-ink);
		}
		.more-grid {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 8px;
		}
		.more-grid a {
			min-height: 58px;
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 10px 12px;
			background: var(--tw-canvas);
			border: 1px solid transparent;
			border-radius: var(--tw-radius-md);
			color: var(--tw-ink);
			font-size: 12px;
			font-weight: 700;
			text-decoration: none;
		}
		.more-grid a svg {
			color: var(--tw-glass);
		}
		.more-grid a.active {
			border-color: #9fc9c6;
			background: var(--tw-glass-soft);
		}
		.mobile-signout {
			width: 100%;
			height: 42px;
			margin-top: 10px;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			border: 1px solid #efcccc;
			border-radius: var(--tw-radius-md);
			background: #fff7f7;
			color: var(--tw-danger);
			font-weight: 750;
		}
	}
</style>
