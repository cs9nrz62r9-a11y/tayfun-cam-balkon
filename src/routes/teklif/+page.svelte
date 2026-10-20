<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '#lib/supabase';
	import { generateQuotePDF } from '#lib/utils/pdf-export';
	import { calculateInstallments } from '#lib/utils/installments';

	interface Quote {
		id: string;
		customerName: string;
		quoteNumber: string;
		system: string;
		area: number;
		price: number;
		width: number;
		height: number;
		color: string;
		glassType: string;
		status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'completed';
		sentAt?: string;
		validUntil: string;
		notes?: string;
		createdAt: string;
		updatedAt: string;
	}

	let quotes = $state<Quote[]>([]);
	let loading = $state(true);
	let error = $state('');
	let searchQuery = $state('');
	let showForm = $state(false);
	let isSubmitting = $state(false);
	let selectedStatus = $state<'all' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'completed'>('all');
	let exportingId = $state('');

	let formData = $state({
		customerName: '',
		system: '',
		area: 0,
		price: 0,
		width: 0,
		height: 0,
		color: '',
		glassType: '',
		notes: ''
	});

	onMount(async () => {
		await loadQuotes();
	});

	async function loadQuotes() {
		loading = true;
		error = '';
		try {
			const { data, error: err } = await supabase
				.from('cb_records')
				.select('*')
				.eq('kind', 'quote')
				.eq('deleted', false)
				.order('created_at', { ascending: false });

			if (err) throw err;

			quotes = (data || []).map((d: any) => ({
				id: d.key,
				customerName: d.data.customerName || 'Bilinmeyen Müşteri',
				quoteNumber: d.data.quoteNumber || `TEK-${d.key.substring(0, 8).toUpperCase()}`,
				system: d.data.system || '',
				area: d.data.area || 0,
				price: d.data.price || 0,
				width: d.data.width || 0,
				height: d.data.height || 0,
				color: d.data.color || '',
				glassType: d.data.glassType || '',
				status: d.data.status || 'draft',
				sentAt: d.data.sentAt,
				validUntil: d.data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
				notes: d.data.notes || '',
				createdAt: d.data.created_at || d.created_at,
				updatedAt: d.updated_at
			}));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Teklifler yüklenemedi';
		} finally {
			loading = false;
		}
	}

	async function handleAddQuote() {
		if (!formData.customerName || !formData.system || !formData.price) {
			error = 'Lütfen tüm gerekli alanları doldurunuz';
			return;
		}

		isSubmitting = true;
		error = '';
		try {
			const quoteNumber = `TEK-${Date.now()}`;
			const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

			const { error: err } = await supabase
				.from('cb_records')
				.insert({
					kind: 'quote',
					key: `quote_${Date.now()}`,
					data: {
						...formData,
						quoteNumber,
						validUntil,
						status: 'draft',
						created_at: new Date().toISOString()
					},
					deleted: false
				});

			if (err) throw err;

			// Reset form
			formData = {
				customerName: '',
				system: '',
				area: 0,
				price: 0,
				width: 0,
				height: 0,
				color: '',
				glassType: '',
				notes: ''
			};
			showForm = false;
			await loadQuotes();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Teklif kaydedilemedi';
		} finally {
			isSubmitting = false;
		}
	}

	async function updateQuoteStatus(quoteId: string, newStatus: string) {
		try {
			const quote = quotes.find(q => q.id === quoteId);
			if (!quote) return;

			const { error: err } = await supabase
				.from('cb_records')
				.update({
					data: {
						...quote,
						status: newStatus,
						sentAt: newStatus === 'sent' ? new Date().toISOString() : quote.sentAt
					}
				})
				.eq('key', quoteId)
				.eq('kind', 'quote');

			if (err) throw err;
			await loadQuotes();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Durum güncellenemedi';
		}
	}

	async function exportQuotePDF(quote: Quote) {
		exportingId = quote.id;
		try {
			const installments = calculateInstallments(quote.price);
			const defaultInstallment = installments.options[0];

			await generateQuotePDF({
				system: quote.system,
				area: quote.area,
				price: quote.price,
				width: quote.width,
				height: quote.height,
				color: quote.color,
				glassType: quote.glassType,
				materials: [],
				warnings: [],
				createdAt: quote.createdAt,
				selectedInstallment: defaultInstallment
			});
		} catch (err) {
			error = err instanceof Error ? err.message : 'PDF oluşturma başarısız';
		} finally {
			exportingId = '';
		}
	}

	function filteredQuotes() {
		return quotes.filter(q => {
			const matchesSearch = q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
				q.system.toLowerCase().includes(searchQuery.toLowerCase());
			
			const matchesStatus = selectedStatus === 'all' || q.status === selectedStatus;
			
			return matchesSearch && matchesStatus;
		});
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('tr-TR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getStatusColor(status: string) {
		const colors: Record<string, string> = {
			draft: '#6b7280',
			sent: '#3b82f6',
			accepted: '#10b981',
			rejected: '#ef4444',
			completed: '#8b5cf6'
		};
		return colors[status] || '#6b7280';
	}

	function getStatusLabel(status: string) {
		const labels: Record<string, string> = {
			draft: 'Taslak',
			sent: 'Gönderildi',
			accepted: 'Kabul Edildi',
			rejected: 'Reddedildi',
			completed: 'Tamamlandı'
		};
		return labels[status] || status;
	}

	function daysUntilExpiry(validUntil: string) {
		const days = Math.floor((new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
		return days > 0 ? days : 0;
	}
</script>

<div class="container">
	<header>
		<h1>Teklifler</h1>
		<p>Müşteri tekliflerini yönet ve takip et</p>
	</header>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if showForm}
		<div class="form-card">
			<h2>Yeni Teklif Oluştur</h2>
			
			<div class="form-group">
				<label for="customerName">Müşteri Adı *</label>
				<input
					id="customerName"
					type="text"
					bind:value={formData.customerName}
					placeholder="Müşteri veya şirket adı"
				/>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="system">Sistem Türü *</label>
					<select id="system" bind:value={formData.system}>
						<option value="">Seçiniz</option>
						<option value="Alüminyum">Alüminyum</option>
						<option value="Yumuşak Çerçeve">Yumuşak Çerçeve</option>
						<option value="PVC">PVC</option>
						<option value="Çift Cam">Çift Cam</option>
					</select>
				</div>

				<div class="form-group">
					<label for="color">Renk</label>
					<input id="color" type="text" bind:value={formData.color} placeholder="Renk" />
				</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="width">Genişlik (mm) *</label>
					<input id="width" type="number" bind:value={formData.width} placeholder="0" />
				</div>

				<div class="form-group">
					<label for="height">Yükseklik (mm) *</label>
					<input id="height" type="number" bind:value={formData.height} placeholder="0" />
				</div>

				<div class="form-group">
					<label for="area">Alan (m²) *</label>
					<input id="area" type="number" step="0.01" bind:value={formData.area} placeholder="0.00" />
				</div>
			</div>

			<div class="form-group">
				<label for="glassType">Cam Türü</label>
				<select id="glassType" bind:value={formData.glassType}>
					<option value="">Seçiniz</option>
					<option value="Standart">Standart</option>
					<option value="Güneş Kontrolü">Güneş Kontrolü</option>
					<option value="Ses Yalıtımı">Ses Yalıtımı</option>
					<option value="Laminert">Laminert</option>
				</select>
			</div>

			<div class="form-group">
				<label for="price">Fiyat (₺) *</label>
				<input id="price" type="number" step="0.01" bind:value={formData.price} placeholder="0.00" />
			</div>

			<div class="form-group">
				<label for="notes">Notlar</label>
				<textarea id="notes" bind:value={formData.notes} placeholder="İlave notlar..." rows="3"></textarea>
			</div>

			<div class="form-actions">
				<button onclick={() => (showForm = false)} class="btn-secondary">İptal</button>
				<button onclick={handleAddQuote} disabled={isSubmitting} class="btn-primary">
					{isSubmitting ? 'Kaydediliyor...' : 'Teklifi Kaydet'}
				</button>
			</div>
		</div>
	{:else}
		<div class="controls">
			<div class="search-box">
				<input
					type="text"
					placeholder="Müşteri adı, teklif numarası veya sistem türüne göre ara..."
					bind:value={searchQuery}
				/>
			</div>

			<div class="status-filter">
				<button
					class="filter-btn"
					class:active={selectedStatus === 'all'}
					onclick={() => (selectedStatus = 'all')}
				>
					Hepsi
				</button>
				<button
					class="filter-btn"
					class:active={selectedStatus === 'draft'}
					onclick={() => (selectedStatus = 'draft')}
				>
					Taslak
				</button>
				<button
					class="filter-btn"
					class:active={selectedStatus === 'sent'}
					onclick={() => (selectedStatus = 'sent')}
				>
					Gönderildi
				</button>
				<button
					class="filter-btn"
					class:active={selectedStatus === 'accepted'}
					onclick={() => (selectedStatus = 'accepted')}
				>
					Kabul
				</button>
				<button
					class="filter-btn"
					class:active={selectedStatus === 'rejected'}
					onclick={() => (selectedStatus = 'rejected')}
				>
					Red
				</button>
				<button
					class="filter-btn"
					class:active={selectedStatus === 'completed'}
					onclick={() => (selectedStatus = 'completed')}
				>
					Tamamlandı
				</button>
			</div>

			<button onclick={() => (showForm = true)} class="btn-primary">+ Yeni Teklif</button>
		</div>

		{#if loading}
			<div class="loading">Teklifler yükleniyor...</div>
		{:else if filteredQuotes().length === 0}
			<div class="empty">
				<p>{searchQuery || selectedStatus !== 'all' ? 'Aradığınız teklif bulunamadı' : 'Henüz teklif kaydınız yok'}</p>
				{#if !searchQuery && selectedStatus === 'all'}
					<button onclick={() => (showForm = true)} class="btn-primary">İlk Teklifi Oluştur</button>
				{/if}
			</div>
		{:else}
			<div class="quotes-grid">
				{#each filteredQuotes() as quote (quote.id)}
					<div class="quote-card">
						<div class="card-header">
							<div>
								<h3>{quote.customerName}</h3>
								<span class="quote-number">{quote.quoteNumber}</span>
							</div>
							<span class="status-badge" style="background-color: {getStatusColor(quote.status)}">
								{getStatusLabel(quote.status)}
							</span>
						</div>

						<div class="card-details">
							<div class="detail-row">
								<span class="label">Sistem:</span>
								<span class="value">{quote.system}</span>
							</div>
							<div class="detail-row">
								<span class="label">Ölçüler:</span>
								<span class="value">{quote.width} × {quote.height} mm</span>
							</div>
							<div class="detail-row">
								<span class="label">Alan:</span>
								<span class="value">{quote.area.toFixed(2)} m²</span>
							</div>
							<div class="detail-row">
								<span class="label">Fiyat:</span>
								<span class="value price">₺{quote.price.toLocaleString('tr-TR')}</span>
							</div>
							<div class="detail-row">
								<span class="label">Geçerlilik:</span>
								<span class="value">{daysUntilExpiry(quote.validUntil)} gün kaldı</span>
							</div>
							<div class="detail-row">
								<span class="label">Oluşturulma:</span>
								<span class="value date">{formatDate(quote.createdAt)}</span>
							</div>
						</div>

						<div class="card-actions">
							<select
								value={quote.status}
								onchange={(e) => updateQuoteStatus(quote.id, e.target.value)}
								class="status-select"
							>
								<option value="draft">Taslak</option>
								<option value="sent">Gönderildi</option>
								<option value="accepted">Kabul Edildi</option>
								<option value="rejected">Reddedildi</option>
								<option value="completed">Tamamlandı</option>
							</select>

							<button
								onclick={() => exportQuotePDF(quote)}
								disabled={exportingId === quote.id}
								class="btn-secondary"
							>
								{exportingId === quote.id ? '⏳' : '📥'} PDF
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	header {
		margin-bottom: 2rem;
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

	.error {
		padding: 1rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 6px;
		color: #dc2626;
		margin-bottom: 1rem;
	}

	.form-card {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.form-card h2 {
		margin-top: 0;
		color: var(--color-primary);
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--color-text);
		font-size: 13px;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-family: inherit;
		font-size: 14px;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--color-secondary);
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
		justify-content: flex-end;
	}

	.controls {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		align-items: center;
	}

	.search-box {
		flex: 1;
		min-width: 250px;
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

	.status-filter {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.filter-btn {
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-border);
		background: white;
		border-radius: 20px;
		cursor: pointer;
		font-size: 12px;
		font-weight: 500;
		transition: all 0.2s;
	}

	.filter-btn:hover {
		border-color: var(--color-secondary);
		color: var(--color-secondary);
	}

	.filter-btn.active {
		background: var(--color-secondary);
		color: white;
		border-color: var(--color-secondary);
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 13px;
		white-space: nowrap;
	}

	.btn-primary {
		background: var(--color-secondary);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #059669;
	}

	.btn-secondary {
		background: white;
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.btn-secondary:hover:not(:disabled) {
		border-color: var(--color-text);
		background: var(--color-border);
	}

	.btn-primary:disabled,
	.btn-secondary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.loading,
	.empty {
		padding: 2rem;
		text-align: center;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 6px;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.empty p {
		color: var(--color-text-light);
		margin: 0;
	}

	.quotes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.quote-card {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		transition: all 0.2s;
	}

	.quote-card:hover {
		border-color: var(--color-secondary);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.card-header h3 {
		margin: 0;
		color: var(--color-text);
		font-size: 16px;
	}

	.quote-number {
		display: block;
		font-size: 12px;
		color: var(--color-text-light);
		margin-top: 0.25rem;
	}

	.status-badge {
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 11px;
		font-weight: 600;
		white-space: nowrap;
	}

	.card-details {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--color-border);
		font-size: 12px;
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.detail-row .label {
		font-weight: 500;
		color: var(--color-text);
	}

	.detail-row .value {
		color: var(--color-text-light);
		text-align: right;
	}

	.detail-row .value.price {
		color: var(--color-secondary);
		font-weight: 600;
	}

	.detail-row .value.date {
		font-size: 11px;
	}

	.card-actions {
		display: flex;
		gap: 1rem;
		margin-top: auto;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
	}

	.status-select {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
		background: white;
	}

	.status-select:focus {
		outline: none;
		border-color: var(--color-secondary);
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.controls {
			flex-direction: column;
			align-items: stretch;
		}

		.search-box {
			min-width: auto;
		}

		.status-filter {
			justify-content: flex-start;
			overflow-x: auto;
			padding-bottom: 0.5rem;
		}

		.quotes-grid {
			grid-template-columns: 1fr;
		}

		.card-actions {
			flex-direction: column;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		header h1 {
			font-size: 24px;
		}
	}
</style>
