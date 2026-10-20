<script lang="ts">
	import { onMount } from 'svelte';
	import { data as dataStore } from '#lib/stores/data';
	import { pythonEngine } from '#lib/calculation/python-engine';
	import { loadBundle } from '#lib/calculation/bundle-loader';
	import { generateQuotePDF } from '#lib/utils/pdf-export';
	import { calculateInstallments, formatInstallmentOption, formatInstallmentDetails, type InstallmentOption } from '#lib/utils/installments';
	import { supabase } from '#lib/supabase';
	import { goto } from '$app/navigation';

	interface DrawingProps {
		system: string;
		width: number;
		height: number;
		color: string;
		glassType: string;
		[key: string]: unknown;
	}

	interface CalculationResult {
		system: string;
		props: DrawingProps;
		cuts: Record<string, unknown>;
		bars: Record<string, unknown>;
		materials: Record<string, unknown>;
		price: number;
		area: number;
		image?: string;
		warnings?: string[];
		errors?: string[];
	}

	let step = $state(1); // 1: System, 2: Properties, 3: Dimensions, 4: Accessories, 5: Result
	let systems = $state<Array<{ code: string; name: string }>>([]);
	let result = $state<CalculationResult | null>(null);
	let loading = $state(false);
	let error = $state('');
	let selectedInstallment = $state<InstallmentOption | null>(null);

	let props = $state<DrawingProps>({
		system: '',
		width: 3000,
		height: 2400,
		color: 'Anodized',
		glassType: '5mm'
	});

	let colors = $state<Record<string, string>>({});
	let glassTypes = $state<Record<string, string>>({});

	onMount(async () => {
		try {
			// Load bundle to get systems and options
			const bundle = await loadBundle();

			// Extract systems from bundle
			if (bundle.systems && Array.isArray(bundle.systems)) {
				systems = bundle.systems.map((s: any) => ({
					code: s.code || s.kind || s.name,
					name: s.name || s.code || 'Unknown'
				}));
			}

			// Extract colors and glass types
			if (bundle.colors) colors = bundle.colors as Record<string, string>;
			if (bundle.glass_types) glassTypes = bundle.glass_types as Record<string, string>;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Bundle yükleme hatası';
		}
	});

	async function handleCalculate() {
		if (!props.system || !props.width || !props.height) {
			error = 'Sistem, genişlik ve yükseklik gereklidir';
			return;
		}

		loading = true;
		error = '';

		try {
			result = await pythonEngine.calculate({
				system: props.system,
				props: props
			});

			if (result.errors && result.errors.length > 0) {
				error = result.errors.join(', ');
			} else {
				step = 5;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Hesaplama hatası';
		} finally {
			loading = false;
		}
	}

	async function handleSave() {
		if (!result) return;

		loading = true;
		error = '';

		try {
			const projectKey = `p-${Date.now()}`;
			const drawingKey = `d-${Date.now()}`;

			// Save project
			await supabase.from('cb_records').insert({
				key: projectKey,
				kind: 'project',
				data: {
					name: `Proje ${new Date().toLocaleDateString('tr-TR')}`,
					customer: 'New Customer',
					created_at: new Date().toISOString()
				},
				origin: 'web',
				deleted: false
			});

			// Save drawing
			await supabase.from('cb_records').insert({
				key: drawingKey,
				kind: 'drawing',
				data: {
					project_key: projectKey,
					system: result.system,
					props: result.props,
					cuts: result.cuts,
					bars: result.bars,
					materials: result.materials,
					price: result.price,
					area: result.area,
					created_at: new Date().toISOString()
				},
				origin: 'web',
				deleted: false
			});

			// Redirect to projects
			await goto('/projects');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Kayıt hatası';
		} finally {
			loading = false;
		}
	}

	async function handlePDFExport() {
		if (!result) return;

		try {
			await generateQuotePDF({
				system: result.system,
				area: result.area,
				price: result.price,
				width: result.props.width,
				height: result.props.height,
				color: result.props.color,
				glassType: result.props.glassType,
				materials: result.materials,
				warnings: result.warnings,
				createdAt: new Date().toISOString(),
				selectedInstallment: selectedInstallment || undefined
			});
		} catch (err) {
			error = err instanceof Error ? err.message : 'PDF oluşturma hatası';
		}
	}

	function reset() {
		step = 1;
		result = null;
		error = '';
		props = {
			system: '',
			width: 3000,
			height: 2400,
			color: 'Anodized',
			glassType: '5mm'
		};
	}
</script>

<div class="wizard-container">
	<div class="wizard-header">
		<h1>Yeni Çizim Sihirbazı</h1>
		<p>Adım {step} / 5</p>
	</div>

	<div class="wizard-content">
		{#if step === 1}
			<!-- System Selection -->
			<div class="step">
				<h2>Sistem Seçin</h2>
				<p>Tasarlamak istediğiniz sistem türünü seçin</p>

				<div class="systems-grid">
					{#each systems as system}
						<button
							class="system-card"
							class:active={props.system === system.code}
							on:click={() => {
								props.system = system.code;
								step = 2;
							}}
						>
							<span class="system-name">{system.name}</span>
						</button>
					{:else}
						<p class="empty">Sistem bulunamadı</p>
					{/each}
				</div>

				{#if error}
					<div class="error">{error}</div>
				{/if}
			</div>
		{:else if step === 2}
			<!-- Properties -->
			<div class="step">
				<h2>{systems.find(s => s.code === props.system)?.name}</h2>
				<p>Özelliklerini ayarlayın</p>

				<div class="form-group">
					<label>Renk</label>
					<select bind:value={props.color}>
						{#each Object.entries(colors) as [code, name]}
							<option value={code}>{name}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label>Cam Türü</label>
					<select bind:value={props.glassType}>
						{#each Object.entries(glassTypes) as [code, name]}
							<option value={code}>{name}</option>
						{/each}
					</select>
				</div>

				<div class="button-group">
					<button on:click={() => (step = 1)} class="btn-secondary">Geri</button>
					<button on:click={() => (step = 3)} class="btn-primary">İleri</button>
				</div>
			</div>
		{:else if step === 3}
			<!-- Dimensions -->
			<div class="step">
				<h2>Ölçüler</h2>
				<p>Genişlik ve yüksekliği girin (mm cinsinden)</p>

				<div class="two-column">
					<div class="form-group">
						<label for="width">Genişlik (mm)</label>
						<input
							type="number"
							id="width"
							bind:value={props.width}
							min="500"
							max="10000"
							step="10"
						/>
					</div>

					<div class="form-group">
						<label for="height">Yükseklik (mm)</label>
						<input
							type="number"
							id="height"
							bind:value={props.height}
							min="500"
							max="10000"
							step="10"
						/>
					</div>
				</div>

				<div class="preview-dimensions">
					<div class="preview-box" style="width: {Math.min(props.width / 30, 300)}px; height: {Math.min(props.height / 30, 300)}px;"></div>
				</div>

				<div class="button-group">
					<button on:click={() => (step = 2)} class="btn-secondary">Geri</button>
					<button on:click={() => (step = 4)} class="btn-primary">İleri</button>
				</div>
			</div>
		{:else if step === 4}
			<!-- Accessories -->
			<div class="step">
				<h2>Ek Özellikler</h2>
				<p>Varsa ek parçaları seçin (Sonraki sürümde etkin)</p>

				<p style="color: var(--color-text-light); font-size: 12px;">
					Bu aşama gelecek versiyonda kullanılabilir olacaktır. Şimdi hesaplamaya geçebiliriz.
				</p>

				<div class="button-group">
					<button on:click={() => (step = 3)} class="btn-secondary">Geri</button>
					<button on:click={handleCalculate} class="btn-primary" disabled={loading}>
						{loading ? 'Hesaplanıyor...' : 'Hesapla'}
					</button>
				</div>

				{#if error}
					<div class="error">{error}</div>
				{/if}
			</div>
		{:else if step === 5}
			<!-- Results -->
			<div class="step">
				<h2>Sonuç</h2>

				{#if result}
					<div class="result-details">
						<div class="result-row">
							<span class="label">Sistem:</span>
							<span class="value">{result.system}</span>
						</div>
						<div class="result-row">
							<span class="label">Alan:</span>
							<span class="value">{result.area.toFixed(2)} m²</span>
						</div>
						<div class="result-row">
							<span class="label">Fiyat:</span>
							<span class="value">₺{result.price.toLocaleString('tr-TR')}</span>
						</div>

						{#if result.warnings && result.warnings.length > 0}
							<div class="warnings">
								<strong>Uyarılar:</strong>
								<ul>
									{#each result.warnings as warning}
										<li>{warning}</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if result.materials}
							<div class="materials">
								<strong>Malzeme Listesi:</strong>
								<pre>{JSON.stringify(result.materials, null, 2)}</pre>
							</div>
						{/if}
					</div>

					<div class="installments-section">
						<h3>Kredi Kartı ile Ödeme Seçenekleri</h3>
						<p style="color: var(--color-text-light); font-size: 13px; margin-bottom: 1rem;">
							Aşağıdan tercih ettiğiniz ödeme şeklini seçin. Bu bilgi PDF teklife eklenecektir.
						</p>

						<div class="installments-grid">
							{#each calculateInstallments(result.price).options as option (option.months)}
								<button
									class="installment-card"
									class:selected={selectedInstallment?.months === option.months}
									on:click={() => (selectedInstallment = option)}
								>
									<div class="installment-header">
										{#if option.months === 1}
											<span class="installment-title">Tek Ödeme</span>
										{:else}
											<span class="installment-title">{option.months} Taksit</span>
										{/if}
									</div>
									<div class="installment-amount">
										₺{option.monthlyPayment.toLocaleString('tr-TR')}
									</div>
									<div class="installment-details">
										{#if option.interestRate > 0}
											%{option.interestRate} faiz
										{:else}
											Faiz yok
										{/if}
									</div>
									<div class="installment-total">
										Toplam: ₺{option.totalAmount.toLocaleString('tr-TR')}
									</div>
								</button>
							{/each}
						</div>
					</div>

					<div class="button-group three-buttons">
						<button on:click={reset} class="btn-secondary">Yeni Çizim</button>
						<button on:click={handlePDFExport} class="btn-secondary">PDF İndir</button>
						<button on:click={handleSave} class="btn-primary" disabled={loading}>
							{loading ? 'Kaydediliyor...' : 'Kaydet'}
						</button>
					</div>
				{/if}

				{#if error}
					<div class="error">{error}</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.wizard-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.wizard-header {
		margin-bottom: 2rem;
		text-align: center;
	}

	.wizard-header h1 {
		margin: 0;
		color: var(--color-primary);
	}

	.wizard-header p {
		margin: 0.5rem 0 0;
		color: var(--color-text-light);
		font-size: 12px;
	}

	.wizard-content {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 2rem;
	}

	.step {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.step h2 {
		margin: 0;
		color: var(--color-primary);
		font-size: 20px;
	}

	.step > p {
		margin: 0;
		color: var(--color-text-light);
	}

	.systems-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
	}

	.system-card {
		padding: 1.5rem;
		background: white;
		border: 2px solid var(--color-border);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		text-align: center;
	}

	.system-card:hover {
		border-color: var(--color-secondary);
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
	}

	.system-card.active {
		border-color: var(--color-secondary);
		background: rgba(16, 185, 129, 0.05);
	}

	.system-name {
		font-weight: 500;
		color: var(--color-text);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
		color: var(--color-text);
		font-size: 14px;
	}

	.form-group input,
	.form-group select {
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-size: 14px;
		font-family: inherit;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: var(--color-secondary);
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	.two-column {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.preview-dimensions {
		display: flex;
		justify-content: center;
		padding: 2rem;
		background: #f9fafb;
		border-radius: 4px;
	}

	.preview-box {
		border: 2px dashed var(--color-secondary);
		background: rgba(16, 185, 129, 0.05);
		border-radius: 2px;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.button-group.three-buttons {
		gap: 0.75rem;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 14px;
	}

	.btn-primary {
		background: var(--color-secondary);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #059669;
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: white;
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.btn-secondary:hover {
		border-color: var(--color-text);
		background: var(--color-border);
	}

	.error {
		padding: 1rem;
		background: #fee2e2;
		color: #dc2626;
		border-radius: 4px;
		font-size: 14px;
	}

	.result-details {
		background: #f9fafb;
		padding: 1.5rem;
		border-radius: 4px;
		border: 1px solid var(--color-border);
	}

	.result-row {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.result-row:last-of-type {
		border-bottom: none;
	}

	.result-row .label {
		font-weight: 500;
		color: var(--color-text);
	}

	.result-row .value {
		color: var(--color-primary);
		font-weight: 600;
	}

	.warnings,
	.materials {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-border);
	}

	.warnings strong,
	.materials strong {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--color-primary);
	}

	.warnings ul {
		margin: 0;
		padding-left: 1.5rem;
		color: var(--color-text-light);
	}

	.warnings li {
		margin: 0.25rem 0;
	}

	.materials pre {
		background: white;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		font-size: 12px;
		margin: 0;
		border: 1px solid var(--color-border);
	}

	.empty {
		grid-column: 1 / -1;
		text-align: center;
		color: var(--color-text-light);
		padding: 2rem;
	}

	.installments-section {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-border);
	}

	.installments-section h3 {
		margin: 0 0 0.5rem 0;
		color: var(--color-primary);
		font-size: 16px;
	}

	.installments-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.installment-card {
		padding: 1rem;
		border: 2px solid var(--color-border);
		border-radius: 6px;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.installment-card:hover {
		border-color: var(--color-secondary);
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
	}

	.installment-card.selected {
		border-color: var(--color-secondary);
		background: rgba(16, 185, 129, 0.05);
		box-shadow: 0 2px 12px rgba(16, 185, 129, 0.15);
	}

	.installment-header {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.installment-title {
		font-weight: 600;
		color: var(--color-text);
		font-size: 14px;
	}

	.installment-amount {
		font-size: 18px;
		font-weight: 700;
		color: var(--color-secondary);
	}

	.installment-details {
		font-size: 12px;
		color: var(--color-text-light);
	}

	.installment-total {
		font-size: 11px;
		color: var(--color-text-light);
		border-top: 1px solid var(--color-border);
		padding-top: 0.5rem;
	}

	@media (max-width: 768px) {
		.wizard-container {
			padding: 1rem;
		}

		.wizard-content {
			padding: 1rem;
		}

		.two-column {
			grid-template-columns: 1fr;
		}

		.button-group {
			flex-direction: column;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
		}

		.systems-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
