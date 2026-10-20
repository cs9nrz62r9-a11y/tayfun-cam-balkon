<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '#lib/supabase';
	import { goto } from '$app/navigation';
	import { generateQuotePDF } from '#lib/utils/pdf-export';
	import { calculateInstallments, type InstallmentOption } from '#lib/utils/installments';

	interface Design {
		id: string;
		name: string;
		system: string;
		width: number;
		height: number;
		color: string;
		glassType: string;
		price: number;
		area: number;
		created_at: string;
	}

	let designs = $state<Design[]>([]);
	let loading = $state(true);
	let error = $state('');
	let searchQuery = $state('');
	let exporting = $state<string>('');
	let exportError = $state<string>('');

	onMount(async () => {
		try {
			const { data, error: err } = await supabase
				.from('cb_records')
				.select('*')
				.eq('kind', 'drawing')
				.order('created_at', { ascending: false });

			if (err) throw err;

			designs = (data || []).map((d: any) => ({
				id: d.key,
				name: d.data.name || `Tasarım ${new Date(d.data.created_at).toLocaleDateString('tr-TR')}`,
				system: d.data.system,
				width: d.data.props?.width || 0,
				height: d.data.props?.height || 0,
				color: d.data.props?.color || '',
				glassType: d.data.props?.glassType || '',
				price: d.data.price || 0,
				area: d.data.area || 0,
				created_at: d.data.created_at
			}));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Tasarımlar yüklenemedi';
		} finally {
			loading = false;
		}
	});

	function loadDesign(design: Design) {
		// Store design in session storage for wizard to use
		sessionStorage.setItem('loadedDesign', JSON.stringify(design));
		goto('/wizard');
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('tr-TR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function filteredDesigns() {
		return designs.filter(
			(d) =>
				d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				d.system.toLowerCase().includes(searchQuery.toLowerCase())
		);
	}

	async function exportDesignPDF(design: Design) {
		exporting = design.id;
		exportError = '';

		try {
			const installments = calculateInstallments(design.price);
			const defaultInstallment = installments.options[0]; // Use first option (single payment)

			await generateQuotePDF({
				system: design.system,
				area: design.area,
				price: design.price,
				width: design.width,
				height: design.height,
				color: design.color,
				glassType: design.glassType,
				materials: [],
				warnings: [],
				createdAt: design.created_at,
				selectedInstallment: defaultInstallment
			});
		} catch (err) {
			exportError = err instanceof Error ? err.message : 'PDF oluşturma başarısız';
			console.error('PDF export error:', err);
		} finally {
			exporting = '';
		}
	}
</script>

<div class="container">
	<header>
		<h1>Tasarımlarım</h1>
		<p>Kayıtlı tasarımları yönet ve yeniden düzenle</p>
	</header>

	{#if loading}
		<div class="loading">Yükleniyor...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if designs.length === 0}
		<div class="empty">
			<p>Henüz tasarım kaydınız yok</p>
			<a href="/wizard" class="btn-primary">İlk Tasarımı Oluştur</a>
		</div>
	{:else}
		<div class="search-box">
			<input
				type="text"
				placeholder="Tasarım adı veya sistem türüne göre ara..."
				bind:value={searchQuery}
			/>
		</div>

		<div class="designs-grid">
			{#each filteredDesigns() as design (design.id)}
				<div class="design-card">
					<div class="card-header">
						<h3>{design.name}</h3>
						<span class="system-badge">{design.system}</span>
					</div>

					<div class="card-details">
						<div class="detail-row">
							<span class="label">Ölçüler:</span>
							<span class="value">{design.width} × {design.height} mm</span>
						</div>
						<div class="detail-row">
							<span class="label">Alan:</span>
							<span class="value">{design.area.toFixed(2)} m²</span>
						</div>
						<div class="detail-row">
							<span class="label">Fiyat:</span>
							<span class="value price">₺{design.price.toLocaleString('tr-TR')}</span>
						</div>
						<div class="detail-row">
							<span class="label">Renk:</span>
							<span class="value">{design.color}</span>
						</div>
						<div class="detail-row">
							<span class="label">Cam:</span>
							<span class="value">{design.glassType}</span>
						</div>
						<div class="detail-row">
							<span class="label">Tarih:</span>
							<span class="value date">{formatDate(design.created_at)}</span>
						</div>
					</div>

					<div class="card-actions">
						<button on:click={() => loadDesign(design)} class="btn-primary">
							Düzenle
						</button>
						<button
							on:click={() => exportDesignPDF(design)}
							class="btn-secondary"
							disabled={exporting === design.id}
						>
							{exporting === design.id ? 'Hazırlanıyor...' : 'PDF İndir'}
						</button>
					</div>
				</div>
			{/each}
		</div>

		{#if filteredDesigns().length === 0 && searchQuery}
			<div class="no-results">Aradığınız tasarım bulunamadı</div>
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

	.loading,
	.error,
	.empty,
	.no-results {
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

	.designs-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.design-card {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		transition: all 0.2s;
	}

	.design-card:hover {
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
		font-size: 18px;
	}

	.system-badge {
		background: var(--color-secondary);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 500;
		white-space: nowrap;
	}

	.card-details {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--color-border);
		font-size: 13px;
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
	}

	.detail-row .value.price {
		color: var(--color-secondary);
		font-weight: 600;
	}

	.detail-row .value.date {
		font-size: 12px;
	}

	.card-actions {
		display: flex;
		gap: 1rem;
		margin-top: auto;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
	}

	.btn-primary,
	.btn-secondary {
		flex: 1;
		padding: 0.75rem;
		border: none;
		border-radius: 4px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 13px;
	}

	.btn-primary {
		background: var(--color-secondary);
		color: white;
	}

	.btn-primary:hover {
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

	.no-results {
		color: var(--color-text-light);
		padding: 3rem 2rem;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.designs-grid {
			grid-template-columns: 1fr;
		}

		.card-actions {
			flex-direction: column;
		}

		header h1 {
			font-size: 24px;
		}
	}
</style>
