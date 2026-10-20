<script lang="ts">
	import { auth } from '#lib/stores/auth';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleLogin() {
		if (!email || !password) {
			error = 'E-posta ve şifre gereklidir';
			return;
		}

		loading = true;
		error = '';

		try {
			await auth.signInWithPassword(email, password);
			await goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Giriş başarısız';
		} finally {
			loading = false;
		}
	}
</script>

<div class="auth-page">
	<div class="auth-card">
		<h1>Giriş Yap</h1>
		<p>Tayfun Cam Balkon Sistemi</p>

		<form on:submit|preventDefault={handleLogin}>
			<div class="form-group">
				<label for="email">E-posta</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					disabled={loading}
					placeholder="you@example.com"
				/>
			</div>

			<div class="form-group">
				<label for="password">Şifre</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					disabled={loading}
					placeholder="••••••••"
				/>
			</div>

			{#if error}
				<div class="error">{error}</div>
			{/if}

			<button type="submit" disabled={loading} class="btn-primary">
				{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
			</button>
		</form>

		<p class="signup-link">
			Hesabınız yok mu? <a href="/auth/signup">Kayıt olun</a>
		</p>
	</div>
</div>

<style>
	.auth-page {
		width: 100%;
		height: 100vh;
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
		width: 100%;
		max-width: 400px;
	}

	.auth-card h1 {
		margin: 0 0 0.25rem;
		color: var(--color-primary);
		font-size: 24px;
	}

	.auth-card p {
		margin: 0 0 1.5rem;
		color: var(--color-text-light);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 500;
		color: var(--color-text);
		font-size: 14px;
	}

	input {
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-size: 14px;
		font-family: inherit;
	}

	input:focus {
		outline: none;
		border-color: var(--color-secondary);
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	input:disabled {
		background: #f3f4f6;
		color: var(--color-text-light);
		cursor: not-allowed;
	}

	.error {
		padding: 0.75rem;
		background: #fee2e2;
		color: #dc2626;
		border-radius: 4px;
		font-size: 14px;
	}

	.btn-primary {
		padding: 0.75rem;
		background: var(--color-secondary);
		color: white;
		border: none;
		border-radius: 4px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
		font-size: 14px;
	}

	.btn-primary:hover:not(:disabled) {
		background: #059669;
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.signup-link {
		margin: 1rem 0 0;
		text-align: center;
		font-size: 14px;
		color: var(--color-text-light);
	}

	.signup-link a {
		color: var(--color-secondary);
		text-decoration: none;
		font-weight: 500;
	}

	.signup-link a:hover {
		text-decoration: underline;
	}
</style>
