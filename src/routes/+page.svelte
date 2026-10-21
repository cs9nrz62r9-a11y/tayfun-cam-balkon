<script lang="ts">
	import { isAuthenticated } from '#lib/stores/auth';
	import { data as dataStore } from '#lib/stores/data';
</script>

<div class="container">
	{#if $isAuthenticated}
		<div class="dashboard">
			<header>
				<h1>Tayfun Yapı - Cam Balkon Sistemi</h1>
				<p>Web Tabanlı Yönetim Sistemi</p>
			</header>

			<nav class="menu">
				<a href="/projects" class="menu-item">Projeler</a>
				<a href="/designs" class="menu-item">Tasarımlarım</a>
				<a href="/customers" class="menu-item">Müşteriler</a>
				<a href="/teklif" class="menu-item">Teklifler</a>
				<a href="/templates" class="menu-item">Şablonlar</a>
				<a href="/analytics" class="menu-item">Analitikler</a>
				<a href="/wizard" class="menu-item">Yeni Çizim</a>
				<a href="/systems" class="menu-item">Sistemler</a>
				<a href="/settings" class="menu-item">Ayarlar</a>
			</nav>

			<section class="stats">
				<div class="stat-card">
					<span class="label">Toplam Projeler</span>
					<span class="value">{Object.keys($dataStore.projects).length}</span>
				</div>
				<div class="stat-card">
					<span class="label">Müşteriler</span>
					<span class="value">{Object.keys($dataStore.customers).length}</span>
				</div>
				<div class="stat-card">
					<span class="label">Çizimler</span>
					<span class="value">{Object.keys($dataStore.drawings).length}</span>
				</div>
			</section>

			<section class="recent">
				<h2>Son Projeler</h2>
				<div class="projects-grid">
					{#each Object.entries($dataStore.projects).slice(0, 6) as [key, project]}
						<div class="project-card">
							<h3>{project.data?.name || key}</h3>
							<p class="meta">{new Date(project.updated_at).toLocaleDateString('tr-TR')}</p>
						</div>
					{:else}
						<p class="empty">Henüz proje yok</p>
					{/each}
				</div>
			</section>
		</div>
	{:else}
		<div class="auth-page">
			<div class="auth-card">
				<h1>Tayfun Cam Balkon</h1>
				<p>Web Tabanlı Yönetim Sistemi</p>
				<div class="auth-buttons">
					<a href="/auth/login" class="btn btn-primary">Giriş Yap</a>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.container {
		width: 100%;
		height: 100vh;
		display: flex;
	}

	.auth-page {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.auth-card {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		text-align: center;
		max-width: 400px;
	}

	.auth-card h1 {
		margin: 0 0 0.5rem;
		color: var(--color-primary);
	}

	.auth-card p {
		margin: 0 0 2rem;
		color: var(--color-text-light);
	}

	.auth-buttons {
		display: flex;
		gap: 1rem;
	}

	.btn {
		flex: 1;
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-primary {
		background: var(--color-secondary);
		color: white;
	}

	.btn-primary:hover {
		background: #059669;
	}

	.btn-secondary {
		background: var(--color-border);
		color: var(--color-text);
	}

	.btn-secondary:hover {
		background: #d1d5db;
	}

	.dashboard {
		width: 100%;
		display: flex;
		flex-direction: column;
		padding: 2rem;
	}

	header h1 {
		margin: 0;
		color: var(--color-primary);
	}

	header p {
		margin: 0.5rem 0 2rem;
		color: var(--color-text-light);
	}

	.menu {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.menu-item {
		padding: 0.75rem 1.5rem;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		text-decoration: none;
		color: var(--color-text);
		transition: all 0.2s;
	}

	.menu-item:hover {
		border-color: var(--color-secondary);
		color: var(--color-secondary);
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		padding: 1.5rem;
		border-radius: 4px;
		border: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
	}

	.stat-card .label {
		font-size: 12px;
		color: var(--color-text-light);
		margin-bottom: 0.5rem;
	}

	.stat-card .value {
		font-size: 24px;
		font-weight: bold;
		color: var(--color-primary);
	}

	.recent h2 {
		margin: 0 0 1rem;
		color: var(--color-primary);
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}

	.project-card {
		background: white;
		padding: 1.5rem;
		border-radius: 4px;
		border: 1px solid var(--color-border);
		transition: all 0.2s;
	}

	.project-card:hover {
		border-color: var(--color-secondary);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
	}

	.project-card h3 {
		margin: 0 0 0.5rem;
		color: var(--color-text);
	}

	.project-card .meta {
		margin: 0;
		font-size: 12px;
		color: var(--color-text-light);
	}

	.empty {
		color: var(--color-text-light);
		grid-column: 1 / -1;
		text-align: center;
		padding: 2rem;
	}

	@media (max-width: 768px) {
		.dashboard {
			padding: 1rem;
		}

		.menu {
			gap: 0.5rem;
		}

		.menu-item {
			padding: 0.5rem 1rem;
			font-size: 12px;
		}

		.stats {
			grid-template-columns: 1fr;
		}

		.projects-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
