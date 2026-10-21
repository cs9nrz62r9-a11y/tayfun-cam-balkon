<script lang="ts">
	import { auth } from '#lib/stores/auth';
	import { user } from '#lib/stores/auth';
	import { goto } from '$app/navigation';

	let loading = $state(false);
	let error = $state('');

	async function handleSignOut() {
		loading = true;
		try {
			await auth.signOut();
			await goto('/auth/login');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Çıkış yapma hatası';
		} finally {
			loading = false;
		}
	}
</script>

<div class="container">
	<header>
		<h1>Ayarlar</h1>
	</header>

	<div class="settings-section">
		<h2>Hesap Bilgileri</h2>

		{#if $user}
			<div class="info-item">
				<label>E-posta:</label>
				<span>{$user.email}</span>
			</div>

			<div class="info-item">
				<label>User ID:</label>
				<span class="mono">{$user.id}</span>
			</div>
		{/if}
	</div>

	<div class="settings-section">
		<h2>Bilgisayar Seçenekleri</h2>
		<p style="color: var(--color-text-light); font-size: 14px;">
			Daha fazla ayar gelecek sürümde eklenecektir.
		</p>
	</div>

	<div class="settings-section danger">
		<h2>Güvenlik</h2>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		<button on:click={handleSignOut} disabled={loading} class="btn-danger">
			{loading ? 'Çıkılıyor...' : 'Çıkış Yap'}
		</button>
	</div>
</div>

<style>
	.container {
		max-width: 600px;
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

	.settings-section {
		background: white;
		padding: 1.5rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		margin-bottom: 1.5rem;
	}

	.settings-section h2 {
		margin: 0 0 1rem;
		color: var(--color-primary);
		font-size: 16px;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 1rem;
	}

	.settings-section p {
		margin: 0;
		color: var(--color-text-light);
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.info-item:last-of-type {
		border-bottom: none;
	}

	.info-item label {
		font-weight: 500;
		color: var(--color-text);
	}

	.info-item span {
		color: var(--color-text-light);
		font-size: 14px;
	}

	.info-item .mono {
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: 12px;
	}

	.danger {
		background: #fef2f2;
		border-color: #fecaca;
	}

	.btn-danger {
		padding: 0.75rem 1.5rem;
		background: #dc2626;
		color: white;
		border: none;
		border-radius: 4px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
		font-size: 14px;
	}

	.btn-danger:hover:not(:disabled) {
		background: #b91c1c;
	}

	.btn-danger:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		padding: 0.75rem;
		background: #fee2e2;
		color: #dc2626;
		border-radius: 4px;
		font-size: 14px;
		margin-bottom: 1rem;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.settings-section {
			padding: 1rem;
		}

		.info-item {
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>
