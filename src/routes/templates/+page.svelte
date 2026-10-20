<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '#lib/supabase';

	interface QuoteTemplate {
		id: string;
		name: string;
		system: string;
		color: string;
		glassType: string;
		area: number;
		price: number;
		width: number;
		height: number;
		notes?: string;
		createdAt: string;
		usageCount: number;
	}

	let templates = $state<QuoteTemplate[]>([]);
	let loading = $state(true);
	let error = $state('');
	let searchQuery = $state('');
	let showForm = $state(false);
	let isSubmitting = $state(false);
	let editingId = $state('');

	let formData = $state({
		name: '',
		system: '',
		color: '',
		glassType: '',
		area: 0,
		price: 0,
		width: 0,
		height: 0,
		notes: ''
	});

	onMount(async () => {
		await loadTemplates();
	});

	async function loadTemplates() {
		loading = true;
		error = '';
		try {
			const { data, error: err } = await supabase
				.from('cb_records')
				.select('*')
				.eq('kind', 'template')
				.eq('deleted', false)
				.order('created_at', { ascending: false });

			if (err) throw err;

			templates = (data || []).map((d: any) => ({
				id: d.key,
				name: d.data.name || 'Adsız Şablon',
				system: d.data.system || '',
				color: d.data.color || '',
				glassType: d.data.glassType || '',
				area: d.data.area || 0,
				price: d.data.price || 0,
				width: d.data.width || 0,
				height: d.data.height || 0,
				notes: d.data.notes || '',
				createdAt: d.created_at,
				usageCount: d.data.usageCount || 0
			}));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Şablonlar yüklenemedi';
		} finally {
			loading = false;
		}
	}

	async function handleSaveTemplate() {
		if (!formData.name || !formData.system) {
			error = 'Lütfen şablon adı ve sistem türünü belirtiniz';
			return;
		}

		isSubmitting = true;
		error = '';
		try {
			if (editingId) {
				// Update existing template
				const { error: err } = await supabase
					.from('cb_records')
					.update({
						data: {
							...formData,
							usageCount: templates.find(t => t.id === editingId)?.usageCount || 0
						}
					})
					.eq('key', editingId)
					.eq('kind', 'template');

				if (err) throw err;
			} else {
				// Create new template
				const { error: err } = await supabase
					.from('cb_records')
					.insert({
						kind: 'template',
						key: `template_${Date.now()}`,
						data: {
							...formData,
							usageCount: 0
						},
						deleted: false
					});

				if (err) throw err;
			}

			// Reset form
			formData = {
				name: '',
				system: '',
				color: '',
				glassType: '',
				area: 0,
				price: 0,
				width: 0,
				height: 0,
				notes: ''
			};
			editingId = '';
			showForm = false;
			await loadTemplates();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Şablon kaydedilemedi';
		} finally {
			isSubmitting = false;
		}
	}

	async function deleteTemplate(id: string) {
		if (!confirm('Şablonu silmek istediğinizden emin misiniz?')) return;

		try {
			const { error: err } = await supabase
				.from('cb_records')
				.update({ deleted: true })
				.eq('key', id)
				.eq('kind', 'template');

			if (err) throw err;
			await loadTemplates();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Silme işlemi başarısız';
		}
	}

	function editTemplate(template: QuoteTemplate) {
		formData = {
			name: template.name,
			system: template.system,
			color: template.color,
			glassType: template.glassType,
			area: template.area,
			price: template.price,
			width: template.width,
			height: template.height,
			notes: template.notes || ''
		};
		editingId = template.id;
		showForm = true;
	}

	function filteredTemplates() {
		return templates.filter(t =>
			t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			t.system.toLowerCase().includes(searchQuery.toLowerCase())
		);
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('tr-TR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function copyToClipboard(template: QuoteTemplate) {
		const text = `
Şablon: ${template.name}
Sistem: ${template.system}
Ölçüler: ${template.width}×${template.height}mm
Alan: ${template.area}m²
Fiyat: ₺${template.price}
Cam: ${template.glassType}
Renk: ${template.color}
${template.notes ? `Not: ${template.notes}` : ''}
`.trim();
		
		navigator.clipboard.writeText(text).then(() => {
			error = 'Şablon panoya kopyalandı!';
			setTimeout(() => error = '', 2000);
		});
	}
</script>

<div class="container">
	<header>
		<h1>Teklif Şablonları</h1>
		<p>Sık kullanılan konfigürasyonları kaydedin ve hızlıca kullanın</p>
	</header>

	{#if error}
		<div class="error" style="background-color: {error.includes('kopyalandı') ? '#ecfdf5' : '#fef2f2'}; color: {error.includes('kopyalandı') ? '#059669' : '#dc2626'} border-color: {error.includes('kopyalandı') ? '#d1fae5' : '#fecaca'}">
			{error}
		</div>
	{/if}

	{#if showForm}
		<div class="form-card">
			<h2>{editingId ? 'Şablonu Düzenle' : 'Yeni Şablon Oluştur'}</h2>
			
			<div class="form-group">
				<label for="name">Şablon Adı *</label>
				<input
					id="name"
					type="text"
					bind:value={formData.name}
					placeholder="Örn: Standart Alüminyum Balkon"
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
					<input id="color" type="text" bind:value={formData.color} placeholder="Örn: Antrasit" />
				</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="width">Genişlik (mm)</label>
					<input id="width" type="number" bind:value={formData.width} placeholder="0" />
				</div>

				<div class="form-group">
					<label for="height">Yükseklik (mm)</label>
					<input id="height" type="number" bind:value={formData.height} placeholder="0" />
				</div>

				<div class="form-group">
					<label for="area">Alan (m²)</label>
					<input id="area" type="number" step="0.01" bind:value={formData.area} placeholder="0.00" />
				</div>
			</div>

			<div class="form-row">
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
					<label for="price">Standart Fiyat (₺)</label>
					<input id="price" type="number" step="0.01" bind:value={formData.price} placeholder="0.00" />
				</div>
			</div>

			<div class="form-group">
				<label for="notes">Notlar</label>
				<textarea id="notes" bind:value={formData.notes} placeholder="Şablon ile ilgili notlar..." rows="2"></textarea>
			</div>

			<div class="form-actions">
				<button onclick={() => { showForm = false; editingId = ''; }} class="btn-secondary">İptal</button>
				<button onclick={handleSaveTemplate} disabled={isSubmitting} class="btn-primary">
					{isSubmitting ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Şablonu Kaydet'}
				</button>
			</div>
		</div>
	{:else}
		<div class="controls">
			<div class="search-box">
				<input
					type="text"
					placeholder="Şablon adı veya sistem türüne göre ara..."
					bind:value={searchQuery}
				/>
			</div>
			<button onclick={() => showForm = true} class="btn-primary">+ Yeni Şablon</button>
		</div>

		{#if loading}
			<div class="loading">Şablonlar yükleniyor...</div>
		{:else if filteredTemplates().length === 0}
			<div class="empty">
				<p>{searchQuery ? 'Aradığınız şablon bulunamadı' : 'Henüz şablon kaydınız yok'}</p>
				{#if !searchQuery}
					<button onclick={() => showForm = true} class="btn-primary">İlk Şablonu Oluştur</button>
				{/if}
			</div>
		{:else}
			<div class="templates-grid">
				{#each filteredTemplates() as template (template.id)}
					<div class="template-card">
						<div class="card-header">
							<h3>{template.name}</h3>
							<span class="usage-badge">{template.usageCount}x</span>
						</div>

						<div class="card-details">
							<div class="detail-row">
								<span class="label">Sistem:</span>
								<span class="value">{template.system}</span>
							</div>
							<div class="detail-row">
								<span class="label">Ölçüler:</span>
								<span class="value">{template.width}×{template.height}mm</span>
							</div>
							<div class="detail-row">
								<span class="label">Alan:</span>
								<span class="value">{template.area.toFixed(2)}m²</span>
							</div>
							<div class="detail-row">
								<span class="label">Fiyat:</span>
								<span class="value price">₺{template.price.toLocaleString('tr-TR')}</span>
							</div>
							{#if template.glassType}
								<div class="detail-row">
									<span class="label">Cam:</span>
									<span class="value">{template.glassType}</span>
								</div>
							{/if}
							{#if template.color}
								<div class="detail-row">
									<span class="label">Renk:</span>
									<span class="value">{template.color}</span>
								</div>
							{/if}
						</div>

						<div class="card-actions">
							<button onclick={() => copyToClipboard(template)} class="btn-secondary" title="Panoya kopyala">
								📋 Kopyala
							</button>
							<button onclick={() => editTemplate(template)} class="btn-secondary">✏️ Düzenle</button>
							<button onclick={() => deleteTemplate(template.id)} class="btn-danger">🗑️ Sil</button>
						</div>

						{#if template.notes}
							<div class="card-notes">
								<strong>Not:</strong> {template.notes}
							</div>
						{/if}
					</div>
				{/each}
			</div>
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
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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

	.btn-primary,
	.btn-secondary,
	.btn-danger {
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

	.btn-danger {
		background: white;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	.btn-danger:hover {
		background: #fef2f2;
	}

	.btn-primary:disabled,
	.btn-secondary:disabled,
	.btn-danger:disabled {
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

	.templates-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
		gap: 1.5rem;
	}

	.template-card {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		transition: all 0.2s;
	}

	.template-card:hover {
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

	.usage-badge {
		background: var(--color-border);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 11px;
		color: var(--color-text-light);
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

	.card-notes {
		padding: 0.75rem;
		background: var(--color-border);
		border-radius: 4px;
		font-size: 12px;
		color: var(--color-text-light);
		border-left: 3px solid var(--color-secondary);
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: auto;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
	}

	.card-actions button {
		flex: 1;
		padding: 0.5rem;
		font-size: 12px;
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

		.templates-grid {
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
