<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { supabase } from '#lib/supabase';
	import { calculateProduction, SYSTEMS, type ProductionResult } from '#lib/calculation/production-engine';
	import { normalizeProductionSettings } from '#lib/calculation/technical-standards';
	import { Boxes, Calculator, Check, ChevronLeft, Download, Factory, GlassWater, Ruler, Save, Scissors, Sparkles } from '@lucide/svelte';

	let customer = $state('');
	let projectName = $state('Yeni cam balkon işi');
	let systemCode = $state('KATLANIR_8MM');
	let width = $state(3200), height = $state(2600), quantity = $state(1);
	let panelMode = $state<'auto' | 'manual'>('auto'), manualPanelCount = $state(5);
	let color = $state('Eloksal'), glassType = $state('8 mm şeffaf temperli');
	let stockLength = $state(6500), kerf = $state(5), edgeTrim = $state(10), usableRemnantThreshold = $state(500), pricePerM2 = $state(4800);
	let result = $state<ProductionResult | null>(null);
	let activeTab = $state<'summary' | 'glass' | 'cuts' | 'stock' | 'accessories'>('summary');
	let saving = $state(false), message = $state('');
	const colors = ['Eloksal', 'Antrasit Gri', 'Siyah', 'Beyaz', 'Bronz', 'Ahşap', 'RAL Özel'];

	onMount(async () => {
		const { data } = await supabase
			.from('cb_records')
			.select('data')
			.eq('kind', 'sysedit')
			.eq('key', 'production-settings')
			.maybeSingle();
		if (!data?.data) return;
		const settings = normalizeProductionSettings(data.data);
		stockLength = settings.stockLength;
		kerf = settings.sawKerf;
		edgeTrim = settings.endTrim;
		usableRemnantThreshold = settings.reusableOffcutThreshold;
	});

	$effect(() => {
		const requested = page.url.searchParams.get('system');
		if (requested && SYSTEMS.some((item) => item.code === requested)) selectSystem(requested);
		const requestedCustomer = page.url.searchParams.get('customer');
		if (requestedCustomer && !customer) customer = requestedCustomer;
	});
	function currentSystem() { return SYSTEMS.find((item) => item.code === systemCode) ?? SYSTEMS[0]; }
	function displayPanelCount() { return panelMode === 'manual' ? Math.max(1, manualPanelCount) : Math.max(1, Math.ceil(width / currentSystem().panelWidth)); }
	function selectSystem(code: string) {
		const system = SYSTEMS.find((item) => item.code === code); if (!system) return;
		systemCode = code; glassType = system.glassType; pricePerM2 = system.pricePerM2; result = null;
	}
	function calculate() {
		message = '';
		result = calculateProduction({ systemCode, width, height, quantity, panelCount: panelMode === 'manual' ? manualPanelCount : undefined, color, glassType, stockLength, kerf, edgeTrim, usableRemnantThreshold, pricePerM2 });
		activeTab = 'summary';
		requestAnimationFrame(() => document.querySelector('.results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
	}
	async function save() {
		if (!result) return; saving = true; message = '';
		try {
			const now = Date.now(), projectKey = `p-${now}`, drawingKey = `d-${now}`;
			const { error } = await supabase.from('cb_records').insert([
				{ key: projectKey, kind: 'project', data: { name: projectName, customer: customer || 'Müşteri seçilmedi', status: 'OLCULDU', system: result.system.code, system_name: result.system.name, width: result.input.width, height: result.input.height, area: result.area, price: result.price, created_at: new Date().toISOString() }, origin: 'web', deleted: false },
				{ key: drawingKey, kind: 'drawing', data: { project_key: projectKey, system: result.system.code, props: result.input, production: result, cuts: result.cuts, bars: result.bars, materials: result.accessories, price: result.price, area: result.area, created_at: new Date().toISOString() }, origin: 'web', deleted: false }
			]);
			if (error) throw error; message = 'Proje ve üretim listesi kaydedildi.';
		} catch (error) { message = error instanceof Error ? error.message : 'Kayıt sırasında hata oluştu.'; }
		finally { saving = false; }
	}
	const money = (value: number) => value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
</script>

<svelte:head><title>Üretim Hesabı | Tayfun Yapı</title></svelte:head>
<div class="page-shell">
	<header class="page-header">
		<div class="title-row">
			<button class="back" type="button" onclick={() => history.length > 1 ? history.back() : goto('/')} title="Geri"><ChevronLeft size={20} /></button>
			<div><span class="eyebrow">ÜRETİM MERKEZİ</span><h1>Yeni Sistem ve Kesim Listesi</h1><p>Ölçüyü girin; cam, profil, aksesuar ve fire hesabını birlikte hazırlayın.</p></div>
		</div>
		<span class="engine-badge"><Sparkles size={15} /> Analiz Pro motoru</span>
	</header>
	<section class="workspace">
		<div class="form-panel">
			<div class="section-title"><span>01</span><div><h2>İş bilgileri</h2><p>Müşteri ve üretilecek sistem</p></div></div>
			<div class="field-grid two"><label>Proje adı<input bind:value={projectName} /></label><label>Müşteri<input bind:value={customer} placeholder="Müşteri adı veya firma" /></label></div>
			<div class="system-grid">
				{#each SYSTEMS as system}
					<button type="button" class:active={systemCode === system.code} onclick={() => selectSystem(system.code)}>
						<span class="system-icon">{#if system.kind === 'sliding'}<Ruler size={20} />{:else if system.kind === 'guillotine'}<Factory size={20} />{:else if system.kind === 'aldox'}<Boxes size={20} />{:else}<GlassWater size={20} />{/if}</span>
					<strong>{system.name}</strong><small>{system.description}</small>{#if systemCode === system.code}<Check class="selected-check" size={16} />{/if}
					</button>
				{/each}
			</div>
			<div class="divider"></div>
			<div class="section-title"><span>02</span><div><h2>Ölçü ve özellikler</h2><p>Milimetre cinsinden net kasa ölçüsü</p></div></div>
			<div class="field-grid three">
				<label>Genişlik (mm)<input type="number" bind:value={width} min="500" /></label><label>Yükseklik (mm)<input type="number" bind:value={height} min="500" /></label><label>Adet<input type="number" bind:value={quantity} min="1" /></label>
				<label>Profil rengi<select bind:value={color}>{#each colors as item}<option>{item}</option>{/each}</select></label><label>Cam türü<input bind:value={glassType} /></label><label>Satış fiyatı (₺/m²)<input type="number" bind:value={pricePerM2} min="0" /></label>
			</div>
			<div class="panel-control">
				<div><strong>Kanat hesabı</strong><small>Otomatik hesaplayabilir veya sayıyı siz belirleyebilirsiniz.</small></div>
				<div class="segmented"><button type="button" class:active={panelMode === 'auto'} onclick={() => panelMode = 'auto'}>Otomatik</button><button type="button" class:active={panelMode === 'manual'} onclick={() => panelMode = 'manual'}>Elle</button></div>
				{#if panelMode === 'manual'}<input class="panel-input" type="number" bind:value={manualPanelCount} min="1" aria-label="Kanat sayısı" />{/if}
			</div>
			<details><summary>Kesim ayarları</summary><div class="field-grid two details-body"><label>Standart profil boyu (mm)<select bind:value={stockLength}><option value={6000}>6000</option><option value={6500}>6500</option><option value={7000}>7000</option></select></label><label>Testere payı (mm)<input type="number" bind:value={kerf} min="0" max="20" /></label><label>Uç temizleme (mm / uç)<input type="number" bind:value={edgeTrim} min="0" max="100" /></label><label>Kullanılabilir artık eşiği (mm)<input type="number" bind:value={usableRemnantThreshold} min="0" /></label></div></details>
			<button class="calculate" type="button" onclick={calculate}><Calculator size={20} /> Üretim hesabını hazırla</button>
		</div>
		<aside class="preview-panel">
			<div class="preview-head"><span>TEKNİK ÖN İZLEME</span><strong>{currentSystem().name}</strong></div>
			<div class="drawing" style={`--panels:${displayPanelCount()}`}><div class="measure top">{width.toLocaleString('tr-TR')} mm</div><div class="measure side">{height.toLocaleString('tr-TR')} mm</div><div class="frame">{#each Array(displayPanelCount()) as _, index}<div class="pane"><span>{index + 1}</span></div>{/each}</div></div>
			<div class="preview-stats"><div><span>Tahmini alan</span><strong>{(width * height * quantity / 1_000_000).toFixed(2)} m²</strong></div><div><span>Kanat</span><strong>{displayPanelCount() * quantity}</strong></div><div><span>Cam</span><strong>{glassType}</strong></div></div>
		</aside>
	</section>

	{#if result}
		<section class="results">
			<div class="result-header"><div><span class="eyebrow">HESAP TAMAMLANDI</span><h2>{result.system.name} üretim dosyası</h2></div><div class="actions"><button type="button" onclick={() => window.print()}><Download size={17} /> Yazdır / PDF</button><button class="primary" type="button" onclick={save} disabled={saving}><Save size={17} /> {saving ? 'Kaydediliyor' : 'Projeye kaydet'}</button></div></div>
			{#if message}<div class:success={message.includes('kaydedildi')} class="message">{message}</div>{/if}
			{#if result.warnings.length}<div class="technical-warnings"><strong>Teknik kontrol gerekli</strong>{#each result.warnings as warning}<span>{warning}</span>{/each}</div>{/if}
			<div class="kpis"><div><span>Toplam alan</span><strong>{result.area.toFixed(2)} m²</strong></div><div><span>Cam ölçüsü</span><strong>{result.glassWidth} × {result.glassHeight}</strong><small>{result.panelCount} adet</small></div><div><span>Profil boyu</span><strong>{result.profileMeters.toFixed(2)} m</strong></div><div><span>Gerekli boy</span><strong>{result.stockBarCount} adet</strong><small>{stockLength / 1000} metrelik</small></div><div class="accent"><span>Kesim verimi</span><strong>%{result.efficiency}</strong><small>{(result.totalScrapWaste / 1000).toFixed(2)} m hurda · {(result.totalReusableRemnant / 1000).toFixed(2)} m artık</small></div><div class="price"><span>Tahmini satış</span><strong>{money(result.price)}</strong></div></div>
			<div class="tabs" role="tablist">
				<button class:active={activeTab === 'summary'} onclick={() => activeTab = 'summary'}><Calculator size={17} /> Özet</button><button class:active={activeTab === 'glass'} onclick={() => activeTab = 'glass'}><GlassWater size={17} /> Camlar</button><button class:active={activeTab === 'cuts'} onclick={() => activeTab = 'cuts'}><Scissors size={17} /> Kesim listesi</button><button class:active={activeTab === 'stock'} onclick={() => activeTab = 'stock'}><Ruler size={17} /> Boy optimizasyonu</button><button class:active={activeTab === 'accessories'} onclick={() => activeTab = 'accessories'}><Boxes size={17} /> Aksesuarlar</button>
			</div>
			<div class="tab-content">
				{#if activeTab === 'summary'}
					<div class="summary-grid"><div><h3>İş özeti</h3><dl><dt>Proje</dt><dd>{projectName}</dd><dt>Müşteri</dt><dd>{customer || 'Belirtilmedi'}</dd><dt>Sistem</dt><dd>{result.system.name}</dd><dt>Renk</dt><dd>{color}</dd><dt>Ölçü</dt><dd>{width} × {height} mm</dd></dl></div><div><h3>Üretim özeti</h3><dl><dt>Toplam kanat</dt><dd>{result.panelCount} adet</dd><dt>Kanat eni</dt><dd>{result.panelWidth} mm</dd><dt>Cam alanı</dt><dd>{result.glassArea.toFixed(2)} m²</dd><dt>Profil satırı</dt><dd>{result.cuts.length}</dd><dt>Aksesuar kalemi</dt><dd>{result.accessories.length}</dd></dl></div></div>
				{:else if activeTab === 'glass'}
					<div class="glass-sheet"><div class="glass-visual"><span>{result.glassWidth} mm</span><strong>CAM</strong><span>{result.glassHeight} mm</span></div><div><h3>Cam sipariş ölçüsü</h3><p>{result.panelCount} adet <strong>{result.glassWidth} × {result.glassHeight} mm</strong></p><p>{glassType} · Toplam {result.glassArea.toFixed(2)} m²</p></div></div>
				{:else if activeTab === 'cuts'}
					<div class="table-wrap"><table><thead><tr><th>Profil kodu</th><th>Profil / görev</th><th>Kesim</th><th>Adet</th><th>Açı</th></tr></thead><tbody>{#each result.cuts as cut}<tr><td><code>{cut.profileCode}</code></td><td><strong>{cut.profileName}</strong><small>{cut.role}</small></td><td>{cut.length} mm</td><td>{cut.quantity}</td><td>{cut.angle}</td></tr>{/each}</tbody></table></div>
				{:else if activeTab === 'stock'}
					<div class="stock-list">{#each result.bars as bar}<article><div class="bar-info"><strong>{bar.profileCode} · {bar.profileName}</strong><span>Boy {bar.barNo} · %{bar.efficiency} verim · {bar.waste} mm fire</span></div><div class="bar-track">{#each bar.pieces as piece}<div style={`width:${Math.max(7, piece.length / bar.stockLength * 100)}%`} title={`${piece.role}: ${piece.length} mm`}><span>{piece.length}</span></div>{/each}<i></i></div></article>{/each}</div>
				{:else}
					<div class="table-wrap"><table><thead><tr><th>Malzeme / aksesuar</th><th>Miktar</th><th>Birim</th></tr></thead><tbody>{#each result.accessories as item}<tr><td><strong>{item.name}</strong></td><td>{item.quantity}</td><td>{item.unit}</td></tr>{/each}</tbody></table></div>
				{/if}
			</div>
		</section>
	{/if}
</div>

<style>
	.technical-warnings{margin-top:12px;padding:12px 14px;border:1px solid #f4cf82;background:#fff8e8;border-radius:6px;color:#76521a}.technical-warnings strong,.technical-warnings span{display:block}.technical-warnings strong{font-size:12px;margin-bottom:5px}.technical-warnings span{font-size:11px;line-height:1.45}
	@media(max-width:1100px){.workspace{grid-template-columns:1fr}.preview-panel{position:static}.system-grid{grid-template-columns:repeat(3,1fr)}.kpis{grid-template-columns:repeat(3,1fr)}}
	@media(max-width:720px){.page-shell{padding:16px 12px 90px}.page-header{align-items:flex-start}.page-header h1{font-size:20px}.page-header p,.engine-badge{display:none}.form-panel,.results{padding:15px}.system-grid{grid-template-columns:1fr 1fr}.field-grid.two,.field-grid.three{grid-template-columns:1fr 1fr}.panel-control{align-items:flex-start;flex-wrap:wrap}.panel-control>div:first-child{width:100%}.drawing{height:250px}.result-header{align-items:flex-start;gap:12px;flex-direction:column}.actions{width:100%}.actions button{flex:1;justify-content:center}.kpis{grid-template-columns:1fr 1fr}.tabs{margin:0 -15px;padding:0 8px}.summary-grid{grid-template-columns:1fr}.glass-sheet{flex-direction:column;align-items:flex-start}.bar-info{flex-direction:column;gap:2px}.preview-panel{display:none}}
	@media(max-width:420px){.field-grid.two,.field-grid.three{grid-template-columns:1fr}.system-grid{grid-template-columns:1fr 1fr}.system-grid button{min-height:98px}.kpis{grid-template-columns:1fr 1fr}.kpis strong{font-size:15px}}
	@media print{.page-header,.workspace,.tabs,.actions,.message{display:none}.page-shell{padding:0}.results{border:0;margin:0;padding:0}.tab-content{display:block}.kpis{grid-template-columns:repeat(3,1fr)}}
</style>
