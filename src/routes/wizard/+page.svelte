<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { supabase } from '#lib/supabase';
	import { calculateProduction, SYSTEMS, type ProductionResult } from '#lib/calculation/production-engine';
	import { Boxes, Calculator, Check, ChevronLeft, Download, Factory, GlassWater, Ruler, Save, Scissors, Sparkles } from '@lucide/svelte';

	let customer = $state('');
	let projectName = $state('Yeni cam balkon işi');
	let systemCode = $state('KATLANIR_8MM');
	let width = $state(3200), height = $state(2600), quantity = $state(1);
	let panelMode = $state<'auto' | 'manual'>('auto'), manualPanelCount = $state(5);
	let color = $state('Eloksal'), glassType = $state('8 mm şeffaf temperli');
	let stockLength = $state(6500), kerf = $state(5), pricePerM2 = $state(4800);
	let result = $state<ProductionResult | null>(null);
	let activeTab = $state<'summary' | 'glass' | 'cuts' | 'stock' | 'accessories'>('summary');
	let saving = $state(false), message = $state('');
	const colors = ['Eloksal', 'Antrasit Gri', 'Siyah', 'Beyaz', 'Bronz', 'Ahşap', 'RAL Özel'];

	$effect(() => {
		const requested = page.url.searchParams.get('system');
		if (requested && SYSTEMS.some((item) => item.code === requested)) selectSystem(requested);
	});
	function currentSystem() { return SYSTEMS.find((item) => item.code === systemCode) ?? SYSTEMS[0]; }
	function displayPanelCount() { return panelMode === 'manual' ? Math.max(1, manualPanelCount) : Math.max(1, Math.ceil(width / currentSystem().panelWidth)); }
	function selectSystem(code: string) {
		const system = SYSTEMS.find((item) => item.code === code); if (!system) return;
		systemCode = code; glassType = system.glassType; pricePerM2 = system.pricePerM2; result = null;
	}
	function calculate() {
		message = '';
		result = calculateProduction({ systemCode, width, height, quantity, panelCount: panelMode === 'manual' ? manualPanelCount : undefined, color, glassType, stockLength, kerf, pricePerM2 });
		activeTab = 'summary';
		requestAnimationFrame(() => document.querySelector('.results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
	}
	async function save() {
		if (!result) return; saving = true; message = '';
		try {
			const now = Date.now(), projectKey = `p-${now}`, drawingKey = `d-${now}`;
			const { error } = await supabase.from('cb_records').insert([
				{ key: projectKey, kind: 'project', data: { name: projectName, customer: customer || 'Müşteri seçilmedi', status: 'Üretim hesabı hazır', created_at: new Date().toISOString() }, origin: 'web', deleted: false },
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
			<details><summary>Kesim ayarları</summary><div class="field-grid two details-body"><label>Standart profil boyu (mm)<input type="number" bind:value={stockLength} /></label><label>Testere payı (mm)<input type="number" bind:value={kerf} /></label></div></details>
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
			<div class="kpis"><div><span>Toplam alan</span><strong>{result.area.toFixed(2)} m²</strong></div><div><span>Cam ölçüsü</span><strong>{result.glassWidth} × {result.glassHeight}</strong><small>{result.panelCount} adet</small></div><div><span>Profil boyu</span><strong>{result.profileMeters.toFixed(2)} m</strong></div><div><span>Gerekli boy</span><strong>{result.stockBarCount} adet</strong><small>{stockLength / 1000} metrelik</small></div><div class="accent"><span>Kesim verimi</span><strong>%{result.efficiency}</strong><small>{(result.totalWaste / 1000).toFixed(2)} m fire</small></div><div class="price"><span>Tahmini satış</span><strong>{money(result.price)}</strong></div></div>
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
	.page-shell{max-width:1500px;margin:0 auto;padding:28px 30px 60px}.page-header,.title-row,.result-header,.actions,.section-title,.panel-control,.engine-badge{display:flex;align-items:center}.page-header{justify-content:space-between;margin-bottom:22px}.title-row{gap:12px}.back{width:40px;height:40px;border:1px solid #dfe3e8;background:white;border-radius:7px;display:grid;place-items:center;cursor:pointer}.eyebrow{display:block;color:#0f7c80;font-size:11px;font-weight:800;letter-spacing:1px}.page-header h1,.result-header h2{margin:2px 0 0;font-size:25px;letter-spacing:0}.page-header p{margin:3px 0 0;color:#6b7280}.engine-badge{gap:7px;padding:8px 11px;background:#e9f7f5;color:#086c70;border-radius:6px;font-weight:700;font-size:12px}.workspace{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(340px,.75fr);gap:18px}.form-panel,.preview-panel,.results{background:#fff;border:1px solid #dfe3e8;border-radius:8px}.form-panel{padding:22px}.section-title{gap:11px;margin-bottom:15px}.section-title>span{width:32px;height:32px;display:grid;place-items:center;background:#123b47;color:#fff;border-radius:6px;font-size:11px;font-weight:800}.section-title h2{font-size:16px;margin:0}.section-title p{font-size:12px;color:#7a8491;margin:1px 0 0}.field-grid{display:grid;gap:12px}.field-grid.two{grid-template-columns:1fr 1fr}.field-grid.three{grid-template-columns:repeat(3,1fr)}label{display:flex;flex-direction:column;gap:5px;color:#4b5563;font-size:12px;font-weight:700}input,select{height:41px;border:1px solid #d6dbe1;border-radius:5px;padding:0 11px;background:#fff;color:#17212b;font:inherit;font-weight:500}input:focus,select:focus{outline:2px solid #99d7d4;border-color:#0f8b8d}.system-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:16px}.system-grid button{position:relative;min-height:105px;padding:11px;border:1px solid #dfe3e8;border-radius:6px;background:#fafbfc;text-align:left;cursor:pointer;color:#26313b}.system-grid button:hover,.system-grid button.active{border-color:#0f8b8d;background:#f0fbfa}.system-icon{width:34px;height:34px;display:grid;place-items:center;background:#e6f3f3;color:#0f7c80;border-radius:6px;margin-bottom:8px}.system-grid strong,.system-grid small{display:block}.system-grid strong{font-size:13px}.system-grid small{font-size:10px;color:#7a8491;line-height:1.3;margin-top:2px}.selected-check{position:absolute;right:8px;top:8px;color:#0f8b8d}.divider{height:1px;background:#edf0f2;margin:22px 0}.panel-control{gap:14px;padding:12px;margin-top:14px;background:#f7f8f9;border:1px solid #e3e7eb;border-radius:6px}.panel-control>div:first-child{margin-right:auto}.panel-control strong,.panel-control small{display:block}.panel-control small{color:#7a8491;font-size:11px}.segmented{display:flex;background:#e7eaed;padding:3px;border-radius:5px}.segmented button{height:31px;padding:0 14px;border:0;background:transparent;border-radius:4px;cursor:pointer;font-weight:700;color:#66707c}.segmented button.active{background:white;color:#0f7c80;box-shadow:0 1px 3px #0001}.panel-input{width:70px}details{margin-top:12px;border:1px solid #e1e5e9;border-radius:6px}summary{padding:12px;font-weight:700;cursor:pointer}.details-body{padding:0 12px 12px}.calculate{width:100%;height:48px;margin-top:15px;border:0;border-radius:6px;background:#ec942f;color:white;font-weight:800;display:flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;font-size:14px}.preview-panel{padding:18px;position:sticky;top:18px;height:fit-content}.preview-head{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#78838f}.preview-head strong{color:#173b46;font-size:13px}.drawing{height:330px;margin:34px 23px 24px;position:relative;display:grid;place-items:center}.frame{width:100%;height:82%;display:grid;grid-template-columns:repeat(var(--panels),1fr);border:8px solid #365966;background:#dff1f2;box-shadow:0 8px 20px #15343c22}.pane{border-right:4px solid #52747c;background:linear-gradient(135deg,#e9f8fa,#c9e5e8);display:grid;place-items:center;min-width:0}.pane:last-child{border-right:0}.pane span{font-size:11px;color:#739099}.measure{position:absolute;color:#52616c;font-size:11px;font-weight:700}.measure.top{top:0;left:0;right:0;text-align:center;border-bottom:1px solid #aebac2;padding-bottom:5px}.measure.side{left:-31px;top:50%;transform:rotate(-90deg);white-space:nowrap}.preview-stats{border-top:1px solid #e7eaed;padding-top:15px;display:grid;grid-template-columns:1fr 1fr;gap:12px}.preview-stats div:last-child{grid-column:1/-1}.preview-stats span,.preview-stats strong{display:block}.preview-stats span{font-size:10px;color:#7b8691}.preview-stats strong{font-size:13px;color:#1e2d36;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.results{margin-top:18px;padding:22px;scroll-margin-top:20px}.result-header{justify-content:space-between}.result-header h2{font-size:20px}.actions{gap:8px}.actions button{height:38px;padding:0 13px;display:flex;align-items:center;gap:7px;border:1px solid #d9dee3;border-radius:5px;background:white;cursor:pointer;font-weight:700}.actions button.primary{background:#0f7c80;color:white;border-color:#0f7c80}.message{margin-top:12px;padding:10px;background:#fff5db;color:#8a5b00;border-radius:5px}.message.success{background:#eaf8f0;color:#147541}.kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:18px 0}.kpis>div{padding:13px;border:1px solid #e1e5e9;border-radius:6px;min-width:0}.kpis span,.kpis strong,.kpis small{display:block}.kpis span{font-size:10px;color:#7a8491}.kpis strong{font-size:17px;color:#1b2933;margin-top:3px;white-space:nowrap}.kpis small{font-size:10px;color:#78838f}.kpis .accent{border-left:3px solid #0f8b8d}.kpis .price{background:#173b46;border-color:#173b46}.kpis .price span,.kpis .price strong{color:white}.tabs{display:flex;gap:2px;border-bottom:1px solid #dfe3e8;overflow-x:auto}.tabs button{height:44px;padding:0 15px;border:0;border-bottom:3px solid transparent;background:white;color:#65717c;display:flex;align-items:center;gap:7px;white-space:nowrap;cursor:pointer;font-weight:700}.tabs button.active{color:#0f7c80;border-bottom-color:#0f7c80}.tab-content{padding-top:18px}.summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.summary-grid>div{padding:16px;background:#f7f9fa;border-radius:6px}.summary-grid h3,.glass-sheet h3{margin:0 0 12px;font-size:14px}dl{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0}dt{color:#78838f}dd{margin:0;text-align:right;font-weight:700}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:10px 12px;border-bottom:1px solid #e7eaed;text-align:left}th{font-size:10px;color:#68737e;text-transform:uppercase;background:#f6f8f9}td strong,td small{display:block}td small{font-size:10px;color:#7a8491}code{font-weight:700;color:#0f6f72}.glass-sheet{display:flex;align-items:center;gap:28px;padding:20px;background:#f4f8f8;border-radius:6px}.glass-visual{width:220px;aspect-ratio:1.45;border:6px solid #40636c;background:linear-gradient(135deg,#eafafa,#bcdde2);display:grid;place-items:center;position:relative}.glass-visual strong{color:#668b94}.glass-visual span{position:absolute;font-size:10px}.glass-visual span:first-child{top:-22px}.glass-visual span:last-child{right:-48px;transform:rotate(90deg)}.stock-list{display:grid;gap:12px}.stock-list article{padding:13px;border:1px solid #e0e5e8;border-radius:6px}.bar-info{display:flex;justify-content:space-between;gap:12px;margin-bottom:9px}.bar-info span{font-size:11px;color:#6c7781}.bar-track{height:34px;display:flex;background:#e8ecee;border:1px solid #ccd4d8;position:relative;overflow:hidden}.bar-track div{height:100%;min-width:34px;background:#42a5a5;border-right:2px solid white;color:white;display:grid;place-items:center;font-size:9px}.bar-track i{flex:1;background:repeating-linear-gradient(45deg,#e5e8ea,#e5e8ea 6px,#f4f5f6 6px,#f4f5f6 12px)}
	@media(max-width:1100px){.workspace{grid-template-columns:1fr}.preview-panel{position:static}.system-grid{grid-template-columns:repeat(3,1fr)}.kpis{grid-template-columns:repeat(3,1fr)}}
	@media(max-width:720px){.page-shell{padding:16px 12px 90px}.page-header{align-items:flex-start}.page-header h1{font-size:20px}.page-header p,.engine-badge{display:none}.form-panel,.results{padding:15px}.system-grid{grid-template-columns:1fr 1fr}.field-grid.two,.field-grid.three{grid-template-columns:1fr 1fr}.panel-control{align-items:flex-start;flex-wrap:wrap}.panel-control>div:first-child{width:100%}.drawing{height:250px}.result-header{align-items:flex-start;gap:12px;flex-direction:column}.actions{width:100%}.actions button{flex:1;justify-content:center}.kpis{grid-template-columns:1fr 1fr}.tabs{margin:0 -15px;padding:0 8px}.summary-grid{grid-template-columns:1fr}.glass-sheet{flex-direction:column;align-items:flex-start}.bar-info{flex-direction:column;gap:2px}.preview-panel{display:none}}
	@media(max-width:420px){.field-grid.two,.field-grid.three{grid-template-columns:1fr}.system-grid{grid-template-columns:1fr 1fr}.system-grid button{min-height:98px}.kpis{grid-template-columns:1fr 1fr}.kpis strong{font-size:15px}}
	@media print{.page-header,.workspace,.tabs,.actions,.message{display:none}.page-shell{padding:0}.results{border:0;margin:0;padding:0}.tab-content{display:block}.kpis{grid-template-columns:repeat(3,1fr)}}
</style>
