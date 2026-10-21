<script lang="ts">
	import { BarChart3, FolderKanban, PencilRuler, Users } from '@lucide/svelte';
	import { isAuthenticated } from '#lib/stores/auth';
	import { data as dataStore } from '#lib/stores/data';

	const today = new Intl.DateTimeFormat('tr-TR', {
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	}).format(new Date());
</script>

{#if $isAuthenticated}
	<div class="dashboard">
		<header class="page-header">
			<div>
				<p>{today}</p>
				<h1>Ana Sayfa</h1>
				<span>Projelerinizin ve müşteri kayıtlarınızın güncel durumu</span>
			</div>
			<a class="primary-action" href="/wizard"><PencilRuler size={19} /> Yeni Çizim</a>
		</header>

		<section class="stats" aria-label="Genel istatistikler">
			<div class="stat-card teal">
				<div class="stat-icon"><FolderKanban size={22} /></div>
				<div><span>Toplam Proje</span><strong>{Object.keys($dataStore.projects).length}</strong></div>
			</div>
			<div class="stat-card orange">
				<div class="stat-icon"><Users size={22} /></div>
				<div><span>Müşteriler</span><strong>{Object.keys($dataStore.customers).length}</strong></div>
			</div>
			<div class="stat-card violet">
				<div class="stat-icon"><PencilRuler size={22} /></div>
				<div><span>Çizimler</span><strong>{Object.keys($dataStore.drawings).length}</strong></div>
			</div>
		</section>

		<section class="recent-panel">
			<div class="section-heading">
				<div>
					<h2>Son Projeler</h2>
					<p>En son güncellenen proje kayıtları</p>
				</div>
				<a href="/projects">Tümünü Gör</a>
			</div>

			<div class="project-list">
				{#each Object.entries($dataStore.projects).slice(0, 6) as [key, project]}
					<a class="project-row" href="/projects/{key}">
						<div class="project-icon"><FolderKanban size={19} /></div>
						<div class="project-copy">
							<strong>{project.data?.name || key}</strong>
							<span>{project.data?.customer || 'Müşteri bilgisi eklenmemiş'}</span>
						</div>
						<time>{new Date(project.updated_at).toLocaleDateString('tr-TR')}</time>
					</a>
				{:else}
					<div class="empty-state">
						<BarChart3 size={30} />
						<strong>Henüz proje yok</strong>
						<span>İlk çiziminizi oluşturduğunuzda burada görünecek.</span>
					</div>
				{/each}
			</div>
		</section>
	</div>
{:else}
	<div class="auth-page">
		<div class="auth-card">
			<div class="auth-mark"><FolderKanban size={28} /></div>
			<h1>Tayfun Cam Balkon</h1>
			<p>Web tabanlı yönetim sistemi</p>
			<a href="/auth/login">Giriş Yap</a>
		</div>
	</div>
{/if}

<style>
	.dashboard {
		width: 100%;
		max-width: 1440px;
		margin: 0 auto;
		padding: 36px 42px;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		margin-bottom: 30px;
	}

	.page-header p {
		margin: 0 0 6px;
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		color: #0f7b7d;
	}

	.page-header h1 {
		margin: 0;
		font-size: 30px;
		line-height: 1.2;
		color: #161a20;
	}

	.page-header span { display: block; margin-top: 7px; color: #6b7280; }

	.primary-action {
		height: 44px;
		display: inline-flex;
		align-items: center;
		gap: 9px;
		padding: 0 18px;
		border-radius: 6px;
		background: #e99332;
		color: #ffffff;
		font-weight: 700;
		text-decoration: none;
		box-shadow: 0 7px 18px rgba(233, 147, 50, 0.22);
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 18px;
		margin-bottom: 26px;
	}

	.stat-card {
		min-height: 124px;
		display: flex;
		align-items: center;
		gap: 18px;
		padding: 22px;
		background: #ffffff;
		border: 1px solid #e3e6ea;
		border-radius: 8px;
		box-shadow: 0 4px 14px rgba(26, 32, 44, 0.04);
	}

	.stat-icon {
		width: 48px;
		height: 48px;
		display: grid;
		place-items: center;
		border-radius: 7px;
	}

	.stat-card.teal .stat-icon { background: #dcf2f1; color: #0f7b7d; }
	.stat-card.orange .stat-icon { background: #fff0dc; color: #d47916; }
	.stat-card.violet .stat-icon { background: #eee8ff; color: #7351c8; }

	.stat-card span { display: block; font-size: 13px; font-weight: 600; color: #6b7280; }
	.stat-card strong { display: block; margin-top: 4px; font-size: 30px; line-height: 1; color: #171b21; }

	.recent-panel {
		background: #ffffff;
		border: 1px solid #e3e6ea;
		border-radius: 8px;
		box-shadow: 0 4px 14px rgba(26, 32, 44, 0.04);
		overflow: hidden;
	}

	.section-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 21px 24px;
		border-bottom: 1px solid #edf0f2;
	}

	.section-heading h2 { margin: 0; font-size: 17px; color: #171b21; }
	.section-heading p { margin: 4px 0 0; font-size: 12px; color: #8a919b; }
	.section-heading a { font-size: 13px; font-weight: 700; color: #0f7b7d; text-decoration: none; }

	.project-row {
		display: grid;
		grid-template-columns: 42px minmax(0, 1fr) auto;
		align-items: center;
		gap: 14px;
		padding: 15px 24px;
		border-bottom: 1px solid #f0f1f3;
		color: inherit;
		text-decoration: none;
		transition: background 140ms ease;
	}

	.project-row:last-child { border-bottom: 0; }
	.project-row:hover { background: #f8fafb; }

	.project-icon {
		width: 38px;
		height: 38px;
		display: grid;
		place-items: center;
		border-radius: 6px;
		background: #edf6f6;
		color: #0f7b7d;
	}

	.project-copy { min-width: 0; }
	.project-copy strong,
	.project-copy span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.project-copy strong { color: #22262c; }
	.project-copy span { margin-top: 3px; font-size: 12px; color: #8a919b; }
	.project-row time { font-size: 12px; color: #8a919b; }

	.empty-state {
		min-height: 220px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		color: #9aa1aa;
	}

	.empty-state strong { color: #4b5563; }
	.empty-state span { font-size: 12px; text-align: center; }

	.auth-page {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 24px;
		background: #17191d;
	}

	.auth-card {
		width: min(100%, 380px);
		padding: 34px;
		background: #ffffff;
		border-radius: 8px;
		text-align: center;
	}

	.auth-mark {
		width: 52px;
		height: 52px;
		display: grid;
		place-items: center;
		margin: 0 auto 18px;
		border-radius: 7px;
		background: #0f7b7d;
		color: #ffffff;
	}

	.auth-card h1 { margin: 0; font-size: 23px; }
	.auth-card p { margin: 8px 0 24px; color: #6b7280; }
	.auth-card a {
		display: block;
		padding: 12px;
		border-radius: 6px;
		background: #0f7b7d;
		color: #ffffff;
		font-weight: 700;
		text-decoration: none;
	}

	@media (max-width: 700px) {
		.dashboard { padding: 28px 24px; }
		.stats { grid-template-columns: 1fr; gap: 12px; }
		.stat-card { min-height: 96px; }
	}

	@media (max-width: 600px) {
		.dashboard { padding: 22px 16px; }
		.page-header { align-items: flex-start; }
		.page-header h1 { font-size: 25px; }
		.page-header span { max-width: 220px; }
		.primary-action { width: 44px; padding: 0; justify-content: center; font-size: 0; }
		.project-row { grid-template-columns: 38px minmax(0, 1fr); padding: 14px 16px; }
		.project-row time { display: none; }
		.section-heading { padding: 18px 16px; }
	}
</style>
