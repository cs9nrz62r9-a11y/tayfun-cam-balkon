<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '#lib/supabase';
	import type { Customer } from '#lib/types/customer';

	let customers = $state<Customer[]>([]);
	let loading = $state(true);
	let error = $state('');
	let searchQuery = $state('');
	let showForm = $state(false);

	let formData = $state<Partial<Customer>>({
		name: '',
		email: '',
		phone: '',
		address: '',
		city: '',
		notes: ''
	});

	let isSubmitting = $state(false);

	onMount(async () => {
		try {
			const { data, error: err } = await supabase
				.from('customers')
				.select('*')
				.order('createdAt', { ascending: false });

			if (err) throw err;
			customers = data || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Müşteriler yüklenemedi';
		} finally {
			loading = false;
		}
	});

	async function handleAddCustomer() {
		if (!formData.name?.trim()) {
			error = 'Müşteri adı gereklidir';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const newCustomer: Customer = {
				id: `c-${Date.now()}`,
				name: formData.name,
				email: formData.email || undefined,
				phone: formData.phone || undefined,
				address: formData.address || undefined,
				city: formData.city || undefined,
				notes: formData.notes || undefined,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};

			const { error: insertErr } = await supabase.from('customers').insert([newCustomer]);

			if (insertErr) throw insertErr;

			customers = [newCustomer, ...customers];
			showForm = false;
			formData = {
				name: '',
				email: '',
				phone: '',
				address: '',
				city: '',
				notes: ''
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Müşteri eklenemedi';
		} finally {
			isSubmitting = false;
		}
	}

	function filteredCustomers() {
		return customers.filter(
			(c) =>
				c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.phone?.includes(searchQuery)
		);
	}
</script>

<div class="container">
	<header>
		<div>
			<h1>Müşteriler</h1>
			<p>Müşteri bilgileri ve teklif geçmişi</p>
		</div>
		<button class="btn-primary" on:click={() => (showForm = !showForm)}>
			{showForm ? 'İptal' : '+ Yeni Müşteri'}
		</button>
	</header>

	{#if showForm}
		<div class="form-card">
			<h2>Yeni Müşteri Ekle</h2>

			<div class="form-group">
				<label for="name">Adı / Şirketi *</label>
				<input
					type="text"
					id="name"
					bind:value={formData.name}
					placeholder="Müşteri adını girin"
				/>
			</div>

			<div class="two-column">
				<div class="form-group">
					<label for="phone">Telefon</label>
					<input
						type="tel"
						id="phone"
						bind:value={formData.phone}
						placeholder="+90 555 123 4567"
					/>
				</div>

				<div class="form-group">
					<label for="email">E-posta</label>
					<input
						type="email"
						id="email"
						bind:value={formData.email}
						placeholder="musteri@example.com"
					/>
				</div>
			</div>

			<div class="form-group">
				<label for="address">Adres</label>
				<input type="text" id="address" bind:value={formData.address} placeholder="Sokak, No..." />
			</div>

			<div class="form-group">
				<label for="city">Şehir</label>
				<input type="text" id="city" bind:value={formData.city} placeholder="Edremit, Balıkesir" />
			</div>

			<div class="form-group">
				<label for="notes">Notlar</label>
				<textarea id="notes" bind:value={formData.notes} placeholder="İlave bilgiler..."></textarea>
			</div>

			{#if error}
				<div class="error">{error}</div>
			{/if}

			<button
				class="btn-primary"
				on:click={handleAddCustomer}
				disabled={isSubmitting}
				style="width: 100%;"
			>
				{isSubmitting ? 'Ekleniyor...' : 'Müşteri Ekle'}
			</button>
		</div>
	{/if}

	{#if loading}
		<div class="loading">Yükleniyor...</div>
	{:else if error && !showForm}
		<div class="error">{error}</div>
	{:else if customers.length === 0}
		<div class="empty">
			<p>Henüz müşteri kaydınız yok</p>
			<button class="btn-primary" on:click={() => (showForm = true)}>Başlamak için Ekleyin</button>
		</div>
	{:else}
		<div class="search-box">
			<input
				type="text"
				placeholder="Müşteri adı, telefon veya e-posta ile ara..."
				bind:value={searchQuery}
			/>
		</div>

		<div class="customers-grid">
			{#each filteredCustomers() as customer (customer.id)}
				<div class="customer-card">
					<div class="card-header">
						<h3>{customer.name}</h3>
					</div>

					<div class="card-details">
						{#if customer.phone}
							<div class="detail-row">
								<span class="icon">📞</span>
								<span class="value">{customer.phone}</span>
							</div>
						{/if}

						{#if customer.email}
							<div class="detail-row">
								<span class="icon">📧</span>
								<span class="value">{customer.email}</span>
							</div>
						{/if}

						{#if customer.city}
							<div class="detail-row">
								<span class="icon">📍</span>
								<span class="value">{customer.city}</span>
							</div>
						{/if}

						{#if customer.notes}
							<div class="detail-row notes">
								<span class="icon">📝</span>
								<span class="value">{customer.notes}</span>
							</div>
						{/if}
					</div>

					<div class="card-footer">
						<small>Ekleme: {new Date(customer.createdAt).toLocaleDateString('tr-TR')}</small>
					</div>
				</div>
			{/each}
		</div>

		{#if filteredCustomers().length === 0 && searchQuery}
			<div class="no-results">Aradığınız müşteri bulunamadı</div>
		{/if}
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		gap: 2rem;
	}

	header h1 {
		margin: 0;
		color: var(--color-primary);
		font-size: 28px;
	}

	header p {
		margin: 0.5rem 0 0;
		color: var(--color-text-light);
	}

	.btn-primary {
		padding: 0.75rem 1.5rem;
		background: var(--color-secondary);
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
		white-space: nowrap;
	}

	.btn-primary:hover:not(:disabled) {
		background: #059669;
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.form-card {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.form-card h2 {
		margin: 0 0 1.5rem;
		color: var(--color-primary);
		font-size: 18px;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-weight: 500;
		margin-bottom: 0.5rem;
		color: var(--color-text);
		font-size: 14px;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-family: inherit;
		font-size: 14px;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--color-secondary);
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	.form-group textarea {
		resize: vertical;
		min-height: 80px;
	}

	.two-column {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 1rem;
	}

	.loading,
	.empty,
	.no-results {
		padding: 2rem;
		text-align: center;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		color: var(--color-text-light);
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.search-box {
		margin-bottom: 2rem;
	}

	.search-box input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		font-size: 14px;
		font-family: inherit;
	}

	.search-box input:focus {
		outline: none;
		border-color: var(--color-secondary);
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	.customers-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.customer-card {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		transition: all 0.2s;
	}

	.customer-card:hover {
		border-color: var(--color-secondary);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
	}

	.card-header {
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.75rem;
	}

	.card-header h3 {
		margin: 0;
		color: var(--color-text);
		font-size: 18px;
	}

	.card-details {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.detail-row {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		font-size: 13px;
		color: var(--color-text-light);
	}

	.detail-row .icon {
		font-size: 16px;
		min-width: 20px;
	}

	.detail-row .value {
		word-break: break-word;
	}

	.detail-row.notes {
		align-items: flex-start;
	}

	.card-footer {
		border-top: 1px solid var(--color-border);
		padding-top: 0.75rem;
		font-size: 12px;
		color: var(--color-text-light);
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		header {
			flex-direction: column;
		}

		.two-column {
			grid-template-columns: 1fr;
		}

		.customers-grid {
			grid-template-columns: 1fr;
		}

		header h1 {
			font-size: 24px;
		}
	}
</style>
