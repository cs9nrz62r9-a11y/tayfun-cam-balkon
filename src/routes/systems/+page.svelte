<script lang="ts">
	import { loadBundle } from '#lib/calculation/bundle-loader';
	import { onMount } from 'svelte';

	interface SystemData {
		code: string;
		name: string;
		kind: string;
		description?: string;
	}

	let systems = $state<SystemData[]>([]);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			const bundle = await loadBundle();
			if (bundle.systems && Array.isArray(bundle.systems)) {
				systems = bundle.systems;
			}
			loading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Sistemler yüklenemedi';
			loading = false;
		}
	});
</script>

<div class="container">
	<header>
		<h1>Sistemler Kataloğu</h1>
		<p>Mevcut cam balkon sistemleri ve fiyatlandırma</p>
	</header>

	{#if loading}
		<div class="loading">Yükleniyor...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else}
		<div class="systems-grid">
			{#each systems as system}
				<div class="system-card">
					<h3>{system.name}</h3>
					<p class="code">Kod: {system.code}</p>
					<p class="kind">Tip: {system.kind || 'Genel'}</p>
					{#if system.description}
						<p class="description">{system.description}</p>
					{/if}
					<div class="card-footer">
						<a href="/wizard?system={system.code}" class="btn">Tasarla</a>
					</div>
				</div>
			{:else}
				<p class="empty">Sistem bulunamadı</p>
			{/each}
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	header {
		margin-bottom: 2rem;
	}

	header h1 {
		margin: 0;
		color: var(--color-primary);
	}

	header p {
		margin: 0.5rem 0 0;
		color: var(--color-text-light);
	}

	.loading,
	.error {
		padding: 2rem;
		text-align: center;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 6px;
	}

	.error {
		color: #dc2626;
		background: #fef2f2;
		border-color: #fecaca;
	}

	.systems-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.system-card {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		transition: all 0.2s;
	}

	.system-card:hover {
		border-color: var(--color-secondary);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
	}

	.system-card h3 {
		margin: 0;
		color: var(--color-text);
		font-size: 18px;
	}

	.system-card p {
		margin: 0;
		font-size: 14px;
	}

	.system-card .code {
		color: var(--color-text-light);
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: 12px;
	}

	.system-card .kind {
		color: var(--color-secondary);
		font-weight: 500;
	}

	.system-card .description {
		color: var(--color-text-light);
		font-size: 13px;
		line-height: 1.4;
	}

	.card-footer {
		margin-top: auto;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		display: flex;
		justify-content: flex-end;
	}

	.btn {
		padding: 0.5rem 1rem;
		background: var(--color-secondary);
		color: white;
		border: none;
		border-radius: 4px;
		text-decoration: none;
		font-weight: 500;
		cursor: pointer;
		font-size: 13px;
		transition: background-color 0.2s;
		display: inline-block;
	}

	.btn:hover {
		background: #059669;
	}

	.empty {
		grid-column: 1 / -1;
		text-align: center;
		color: var(--color-text-light);
		padding: 3rem;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.systems-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
