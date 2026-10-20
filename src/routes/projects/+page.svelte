<script lang="ts">
	import { data } from '#lib/stores/data';
</script>

<div class="container">
	<header>
		<h1>Projeler</h1>
		<a href="/wizard" class="btn-new">+ Yeni Proje</a>
	</header>

	<div class="projects-grid">
		{#each Object.entries($data.projects) as [key, project]}
			<a href="/projects/{key}" class="project-card">
				<h2>{project.data?.name || key}</h2>
				<p class="customer">{project.data?.customer || 'Müşteri bilgisi yok'}</p>
				<p class="date">{new Date(project.updated_at).toLocaleDateString('tr-TR')}</p>
			</a>
		{:else}
			<div class="empty">
				<p>Henüz proje yok</p>
				<a href="/wizard" class="btn">Yeni Proje Başlat</a>
			</div>
		{/each}
	</div>
</div>

<style>
	.container {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	header h1 {
		margin: 0;
		color: var(--color-primary);
	}

	.btn-new {
		padding: 0.75rem 1.5rem;
		background: var(--color-secondary);
		color: white;
		border-radius: 4px;
		text-decoration: none;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.btn-new:hover {
		background: #059669;
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}

	.project-card {
		display: block;
		padding: 1.5rem;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.project-card:hover {
		border-color: var(--color-secondary);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
	}

	.project-card h2 {
		margin: 0 0 0.5rem;
		color: var(--color-text);
		font-size: 18px;
	}

	.project-card p {
		margin: 0.25rem 0;
		font-size: 14px;
		color: var(--color-text-light);
	}

	.customer {
		font-weight: 500;
	}

	.date {
		font-size: 12px;
		margin-top: 0.5rem;
	}

	.empty {
		grid-column: 1 / -1;
		text-align: center;
		padding: 3rem;
		color: var(--color-text-light);
	}

	.btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: var(--color-secondary);
		color: white;
		border-radius: 4px;
		text-decoration: none;
		margin-top: 1rem;
		transition: background-color 0.2s;
	}

	.btn:hover {
		background: #059669;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		header {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.projects-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
