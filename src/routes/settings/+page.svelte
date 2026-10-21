<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		DEFAULT_PRODUCTION_SETTINGS,
		normalizeProductionSettings,
		STOCK_LENGTH_OPTIONS,
		TECHNICAL_STANDARDS,
		validateProductionSettings,
		type ProductionSettings,
		type RecipeApprovalStatus,
		type StockLength
	} from '#lib/calculation/technical-standards';
	import { supabase } from '#lib/supabase';
	import { auth, user } from '#lib/stores/auth';
	import {
		BadgeCheck,
		BookOpenCheck,
		Check,
		CircleAlert,
		CircleUserRound,
		Factory,
		LogOut,
		Ruler,
		Save,
		Scissors,
		ShieldCheck
	} from '@lucide/svelte';
	import { onMount } from 'svelte';

	let settings = $state<ProductionSettings>(structuredClone(DEFAULT_PRODUCTION_SETTINGS));
	let loading = $state(true);
	let saving = $state(false);
	let signingOut = $state(false);
	let error = $state('');
	let success = $state('');
	let lastSavedAt = $state('');

	onMount(loadSettings);

	async function loadSettings() {
		loading = true;
		error = '';
		const { data, error: loadError } = await supabase
			.from('cb_records')
			.select('data, updated_at')
			.eq('kind', 'sysedit')
			.eq('key', 'production-settings')
			.eq('deleted', false)
			.maybeSingle();

		if (loadError) error = `Ayarlar yüklenemedi: ${loadError.message}`;
		else if (data) {
			settings = normalizeProductionSettings(data.data);
			lastSavedAt = data.updated_at ?? '';
		}
		loading = false;
	}

	async function saveSettings() {
		error = '';
		success = '';
		const errors = validateProductionSettings(settings);
		if (errors.length) {
			error = errors.join(' ');
			return;
		}

		saving = true;
		const { error: saveError } = await supabase
			.from('cb_records')
			.upsert(
				{
					key: 'production-settings',
					kind: 'sysedit',
					data: settings,
					origin: 'web',
					deleted: false
				},
				{ onConflict: 'key' }
			);
		if (saveError) error = `Ayarlar kaydedilemedi: ${saveError.message}`;
		else {
			lastSavedAt = new Date().toISOString();
			success = 'Üretim ve kesim ayarları kaydedildi.';
		}
		saving = false;
	}

	async function handleSignOut() {
		signingOut = true;
		try {
			await auth.signOut();
			await goto('/auth/login');
		} catch (signOutError) {
			error = signOutError instanceof Error ? signOutError.message : 'Çıkış yapılamadı.';
			signingOut = false;
		}
	}

	function setStockLength(value: StockLength) {
		settings.stockLength = value;
	}
	function setApprovalStatus(status: RecipeApprovalStatus) {
		settings.recipeApproval.status = status;
	}
	function dateTime(value: string) {
		return value
			? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(
					new Date(value)
				)
			: 'Henüz kaydedilmedi';
	}
</script>

<svelte:head><title>Ayarlar ve Teknik Güvenlik | Tayfun Yapı</title></svelte:head>

<div class="page">
	<header class="page-header">
		<div>
			<span class="eyebrow">SİSTEM YÖNETİMİ</span>
			<h1>Ayarlar ve Teknik Güvenlik</h1>
			<p>Hesap, atölye kesim değerleri ve üretici reçetesi doğrulamasını tek merkezden yönetin.</p>
		</div>
		<button class="primary" type="button" onclick={saveSettings} disabled={loading || saving}>
			{#if saving}<span class="spinner"></span>{:else}<Save size={18} />{/if}{saving
				? 'Kaydediliyor'
				: 'Ayarları Kaydet'}
		</button>
	</header>

	{#if error}<div class="message error"><CircleAlert size={18} />{error}</div>{/if}
	{#if success}<div class="message success"><Check size={18} />{success}</div>{/if}

	{#if loading}
		<div class="loading-card"><span class="spinner dark"></span>Ayarlar yükleniyor...</div>
	{:else}
		<div class="dashboard">
			<main>
				<section class="panel account-panel">
					<div class="section-title">
						<span class="section-icon teal"><CircleUserRound size={21} /></span>
						<div>
							<span>HESAP</span>
							<h2>Kullanıcı hesabı</h2>
						</div>
					</div>
					<div class="account-row">
						<div class="avatar">{($user?.email || 'T').slice(0, 1).toLocaleUpperCase('tr-TR')}</div>
						<div>
							<strong>{$user?.email || 'Oturum bilgisi bulunamadı'}</strong><small
								>Yönetici hesabı · Üretim ayarlarına tam erişim</small
							>
						</div>
						<button
							class="logout"
							type="button"
							onclick={handleSignOut}
							disabled={signingOut}
							title="Çıkış yap"><LogOut size={17} />{signingOut ? 'Çıkılıyor' : 'Çıkış Yap'}</button
						>
					</div>
				</section>

				<section class="panel">
					<div class="section-title">
						<span class="section-icon orange"><Scissors size={21} /></span>
						<div>
							<span>ATÖLYE</span>
							<h2>Üretim ve kesim ayarları</h2>
							<p>Bu değerler işletmenizin makine ve artık kullanım düzenine aittir.</p>
						</div>
					</div>
					<div class="field-group">
						<div class="field-heading">
							<span>Standart profil stok boyu</span><small
								>Optimizasyonda kullanılacak ham profil uzunluğu</small
							>
						</div>
						<div class="stock-options">
							{#each STOCK_LENGTH_OPTIONS as length}
								<button
									type="button"
									class:active={settings.stockLength === length}
									onclick={() => setStockLength(length)}
									><Ruler size={18} /><strong>{length / 1000} metre</strong><span>{length} mm</span
									></button
								>
							{/each}
						</div>
					</div>
					<div class="number-grid">
						<label
							><span>Testere payı <em>mm / kesim</em></span><input
								type="number"
								min="0"
								max="20"
								step="0.1"
								bind:value={settings.sawKerf}
							/><small>Her kesimde bıçak nedeniyle kaybolan malzeme.</small></label
						>
						<label
							><span>Uç temizleme payı <em>mm / uç</em></span><input
								type="number"
								min="0"
								max="100"
								step="1"
								bind:value={settings.endTrim}
							/><small>Profilin iki ucundaki bozuk veya boyalı kısmın temizliği.</small></label
						>
						<label
							><span>Kullanılabilir artık eşiği <em>mm</em></span><input
								type="number"
								min="0"
								max={settings.stockLength}
								step="10"
								bind:value={settings.reusableOffcutThreshold}
							/><small>Bu değerden uzun kalan parçalar artık stoğuna alınır.</small></label
						>
					</div>
					<div class="calculation-preview">
						<Factory size={20} />
						<div>
							<span>Bir stok boyunda net kullanılabilir uzunluk</span><strong
								>{settings.stockLength - settings.endTrim * 2} mm</strong
							>
						</div>
						<small>Kesim adedine göre ayrıca {settings.sawKerf} mm testere payı uygulanır.</small>
					</div>
				</section>

				<section class="panel">
					<div class="section-title">
						<span class="section-icon blue"><BookOpenCheck size={21} /></span>
						<div>
							<span>REÇETE KONTROLÜ</span>
							<h2>Üretici katalog onayı</h2>
							<p>
								Kesim sabitlerini yalnız güncel üretici dokümanı ve atölye doğrulamasıyla kullanın.
							</p>
						</div>
					</div>
					<div class="approval-switch" role="group" aria-label="Reçete onay durumu">
						<button
							type="button"
							class:active={settings.recipeApproval.status === 'pending'}
							onclick={() => setApprovalStatus('pending')}
							><CircleAlert size={17} />Onay bekliyor</button
						>
						<button
							type="button"
							class:verified={settings.recipeApproval.status === 'verified'}
							onclick={() => setApprovalStatus('verified')}
							><BadgeCheck size={17} />Katalogla doğrulandı</button
						>
					</div>
					<div class="form-grid">
						<label
							><span>Üretici</span><input
								bind:value={settings.recipeApproval.manufacturer}
								placeholder="Örn. üretici firma"
							/></label
						>
						<label
							><span>Sistem / seri</span><input
								bind:value={settings.recipeApproval.series}
								placeholder="Örn. seri kodu"
							/></label
						>
						<label class="wide"
							><span>Resmî katalog bağlantısı</span><input
								type="url"
								bind:value={settings.recipeApproval.catalogUrl}
								placeholder="https://uretici.com/teknik-katalog.pdf"
							/></label
						>
						<label
							><span>Katalog tarihi / revizyonu</span><input
								bind:value={settings.recipeApproval.catalogRevision}
								placeholder="Örn. 2026 / Rev. 3"
							/></label
						>
						<label
							><span>Onaylayan</span><input
								bind:value={settings.recipeApproval.approvedBy}
								placeholder="Teknik sorumlu"
							/></label
						>
						<label
							><span>Onay tarihi</span><input
								type="date"
								bind:value={settings.recipeApproval.approvedAt}
							/></label
						>
					</div>
					<div
						class:verified-note={settings.recipeApproval.status === 'verified'}
						class="catalog-warning"
					>
						{#if settings.recipeApproval.status === 'verified'}<BadgeCheck
								size={21}
							/>{:else}<CircleAlert size={21} />{/if}
						<div>
							<strong
								>{settings.recipeApproval.status === 'verified'
									? 'Doğrulama bilgileri kayda hazır'
									: 'Üretim reçetesi henüz doğrulanmadı'}</strong
							>
							<p>
								Kanat, cam, kasa ve profil kesim düşümleri üretici ve seri bazında değişir.
								Kaynaksız sabitlerle üretim emri oluşturmayın.
							</p>
						</div>
					</div>
				</section>
			</main>

			<aside>
				<section class="safety-card">
					<div class="shield"><ShieldCheck size={28} /></div>
					<span>TEKNİK GÜVENLİK MERKEZİ</span>
					<h2>Standartlar ve üretim kontrolü</h2>
					<p>
						Bu notlar kesim reçetesinin yerine geçmez. Proje, cam üreticisi ve sistem kataloğuyla
						birlikte değerlendirilmelidir.
					</p>
					<div class="standards">
						{#each TECHNICAL_STANDARDS as standard}<div>
								<strong>{standard.code}</strong><span>{standard.title}</span><small
									>{standard.note}</small
								>
							</div>{/each}
					</div>
				</section>
				<section class="checklist">
					<h3>Üretime göndermeden önce</h3>
					<div class:done={settings.recipeApproval.status === 'verified'}>
						<span>{settings.recipeApproval.status === 'verified' ? '✓' : '1'}</span>Üretici ve seri
						doğrulandı
					</div>
					<div class:done={Boolean(settings.recipeApproval.catalogUrl)}>
						<span>{settings.recipeApproval.catalogUrl ? '✓' : '2'}</span>Güncel katalog kaynağı
						eklendi
					</div>
					<div><span>3</span>İlk örnek kesim atölyede ölçüldü</div>
					<div><span>4</span>Cam tipi ve montaj koşulu kontrol edildi</div>
				</section>
				<p class="saved-at">Son kayıt: {dateTime(lastSavedAt)}</p>
			</aside>
		</div>
	{/if}
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}
	.page {
		max-width: 1380px;
		margin: 0 auto;
		padding: 30px;
		color: #202d35;
	}
	.page-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 24px;
		margin-bottom: 20px;
	}
	.eyebrow,
	.section-title > div > span,
	.safety-card > span {
		font-size: 10px;
		font-weight: 850;
		letter-spacing: 1.1px;
		color: #0f7c80;
	}
	.page-header h1 {
		margin: 3px 0 4px;
		font-size: 29px;
		letter-spacing: 0;
	}
	.page-header p,
	.section-title p {
		margin: 0;
		color: #71808a;
		font-size: 13px;
	}
	.primary {
		height: 43px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 0 17px;
		border: 0;
		border-radius: 6px;
		background: #0d7f83;
		color: #fff;
		font-weight: 750;
		cursor: pointer;
		box-shadow: 0 8px 20px rgba(13, 127, 131, 0.17);
	}
	button:disabled {
		opacity: 0.58;
		cursor: not-allowed;
	}
	.dashboard {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 330px;
		gap: 16px;
		align-items: start;
	}
	main {
		display: grid;
		gap: 14px;
	}
	.panel,
	.checklist {
		background: #fff;
		border: 1px solid #dce3e6;
		border-radius: 8px;
		padding: 20px;
	}
	.section-title {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding-bottom: 17px;
		border-bottom: 1px solid #e8edef;
	}
	.section-icon {
		width: 40px;
		height: 40px;
		display: grid;
		place-items: center;
		border-radius: 7px;
		flex: 0 0 auto;
	}
	.section-icon.teal {
		background: #e4f4f2;
		color: #08777a;
	}
	.section-icon.orange {
		background: #fff0dc;
		color: #d27416;
	}
	.section-icon.blue {
		background: #e8effd;
		color: #4167b2;
	}
	.section-title h2 {
		font-size: 18px;
		margin: 1px 0 2px;
	}
	.account-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-top: 17px;
	}
	.avatar {
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: #0c6e72;
		color: white;
		font-size: 18px;
		font-weight: 800;
	}
	.account-row div:nth-child(2) {
		display: grid;
		gap: 3px;
		min-width: 0;
	}
	.account-row strong {
		font-size: 14px;
		overflow-wrap: anywhere;
	}
	.account-row small {
		color: #7a8790;
	}
	.logout {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 7px;
		background: #fff;
		border: 1px solid #d9e0e3;
		border-radius: 6px;
		padding: 9px 12px;
		color: #44525b;
		font-weight: 700;
		cursor: pointer;
	}
	.field-group {
		margin-top: 18px;
	}
	.field-heading {
		display: flex;
		justify-content: space-between;
		gap: 20px;
		margin-bottom: 9px;
	}
	.field-heading label,
	.number-grid label > span,
	.form-grid label > span {
		font-size: 12px;
		font-weight: 800;
	}
	.field-heading small,
	.number-grid small {
		color: #7c8992;
		font-size: 10px;
	}
	.stock-options {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}
	.stock-options button {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		text-align: left;
		column-gap: 9px;
		padding: 12px;
		border: 1px solid #dbe2e5;
		border-radius: 7px;
		background: #fafbfb;
		color: #5c6a73;
		cursor: pointer;
	}
	.stock-options button :global(svg) {
		grid-row: 1/3;
	}
	.stock-options button strong {
		font-size: 13px;
		color: #27353d;
	}
	.stock-options button span {
		font-size: 10px;
	}
	.stock-options button.active {
		border-color: #0d8588;
		background: #eaf7f5;
		color: #08777a;
		box-shadow: inset 0 0 0 1px #0d8588;
	}
	.number-grid,
	.form-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		margin-top: 16px;
	}
	.number-grid label,
	.form-grid label {
		display: grid;
		gap: 6px;
	}
	.number-grid label > span,
	.form-grid label > span {
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}
	.number-grid em {
		font-style: normal;
		color: #84919a;
		font-size: 9px;
	}
	.number-grid input,
	.form-grid input {
		width: 100%;
		height: 40px;
		border: 1px solid #d8e0e3;
		border-radius: 6px;
		padding: 0 11px;
		background: #fff;
		color: #223139;
		font: inherit;
		outline: none;
	}
	.number-grid input:focus,
	.form-grid input:focus {
		border-color: #0d8588;
		box-shadow: 0 0 0 3px rgba(13, 133, 136, 0.1);
	}
	.calculation-preview {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 11px;
		margin-top: 16px;
		padding: 12px 14px;
		background: #f3f7f7;
		border-left: 3px solid #0d8588;
		border-radius: 5px;
		color: #0d777a;
	}
	.calculation-preview div {
		display: grid;
	}
	.calculation-preview span,
	.calculation-preview small {
		font-size: 10px;
		color: #73828a;
	}
	.calculation-preview strong {
		font-size: 16px;
		color: #22343b;
	}
	.approval-switch {
		display: flex;
		width: max-content;
		background: #eef2f3;
		border-radius: 6px;
		padding: 3px;
		margin-top: 17px;
	}
	.approval-switch button {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 8px 12px;
		border: 0;
		border-radius: 4px;
		background: transparent;
		color: #6a7881;
		font-weight: 750;
		cursor: pointer;
	}
	.approval-switch button.active {
		background: #fff;
		color: #b45d0b;
		box-shadow: 0 1px 5px #ccd4d7;
	}
	.approval-switch button.verified {
		background: #087c70;
		color: #fff;
	}
	.form-grid {
		grid-template-columns: repeat(2, 1fr);
	}
	.form-grid .wide {
		grid-column: 1/-1;
	}
	.catalog-warning {
		display: flex;
		gap: 10px;
		margin-top: 16px;
		padding: 13px;
		background: #fff7e8;
		border: 1px solid #f1d39d;
		border-radius: 6px;
		color: #b46310;
	}
	.catalog-warning.verified-note {
		background: #eaf7f2;
		border-color: #adddca;
		color: #08735f;
	}
	.catalog-warning :global(svg) {
		flex: 0 0 auto;
	}
	.catalog-warning strong {
		font-size: 12px;
	}
	.catalog-warning p {
		margin: 3px 0 0;
		color: #6f7779;
		font-size: 10px;
		line-height: 1.5;
	}
	.safety-card {
		background: #17383a;
		color: #fff;
		border-radius: 8px;
		padding: 22px;
	}
	.shield {
		width: 48px;
		height: 48px;
		display: grid;
		place-items: center;
		background: #2f585a;
		border-radius: 8px;
		margin-bottom: 14px;
		color: #78d7cb;
	}
	.safety-card > span {
		color: #79d2c7;
	}
	.safety-card h2 {
		font-size: 19px;
		margin: 5px 0 8px;
	}
	.safety-card > p {
		color: #bdd0d0;
		font-size: 11px;
		line-height: 1.55;
		margin: 0;
	}
	.standards {
		display: grid;
		gap: 8px;
		margin-top: 18px;
	}
	.standards > div {
		display: grid;
		gap: 2px;
		padding: 11px;
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.09);
		border-radius: 6px;
	}
	.standards strong {
		color: #83ddd1;
		font-size: 12px;
	}
	.standards span {
		font-size: 11px;
		font-weight: 750;
	}
	.standards small {
		font-size: 9px;
		line-height: 1.4;
		color: #b8caca;
	}
	.checklist {
		margin-top: 14px;
	}
	.checklist h3 {
		font-size: 13px;
		margin: 0 0 12px;
	}
	.checklist > div {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 9px 0;
		border-top: 1px solid #edf0f1;
		font-size: 10px;
		color: #65727a;
	}
	.checklist > div span {
		width: 22px;
		height: 22px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: #edf1f2;
		color: #738087;
		font-weight: 800;
	}
	.checklist > div.done {
		color: #087667;
		font-weight: 750;
	}
	.checklist > div.done span {
		background: #dff4ed;
		color: #087667;
	}
	.saved-at {
		text-align: center;
		color: #869198;
		font-size: 9px;
	}
	.message,
	.loading-card {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 12px 14px;
		border-radius: 6px;
		margin-bottom: 12px;
		font-size: 12px;
		font-weight: 700;
	}
	.message.error {
		background: #fff0ef;
		color: #b53b31;
		border: 1px solid #f2c3bf;
	}
	.message.success {
		background: #e9f7f1;
		color: #08745f;
		border: 1px solid #b8dfd1;
	}
	.loading-card {
		justify-content: center;
		background: #fff;
		border: 1px solid #dce3e6;
		min-height: 160px;
		color: #738087;
	}
	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.45);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}
	.spinner.dark {
		border-color: #d5dfe1;
		border-top-color: #0d8588;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (max-width: 1000px) {
		.dashboard {
			grid-template-columns: 1fr;
		}
		aside {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 12px;
		}
		.checklist {
			margin-top: 0;
		}
		.saved-at {
			grid-column: 1/-1;
		}
	}
	@media (max-width: 700px) {
		.page {
			padding: 18px 12px 92px;
		}
		.page-header {
			align-items: stretch;
			flex-direction: column;
			gap: 14px;
		}
		.page-header h1 {
			font-size: 24px;
		}
		.primary {
			width: 100%;
		}
		.panel {
			padding: 15px;
		}
		.account-row {
			align-items: flex-start;
			flex-wrap: wrap;
		}
		.logout {
			width: 100%;
			margin: 3px 0 0;
			justify-content: center;
		}
		.stock-options {
			grid-template-columns: 1fr;
		}
		.number-grid,
		.form-grid {
			grid-template-columns: 1fr;
		}
		.form-grid .wide {
			grid-column: auto;
		}
		.field-heading {
			display: grid;
			gap: 2px;
		}
		.calculation-preview {
			grid-template-columns: auto 1fr;
		}
		.calculation-preview > small {
			grid-column: 1/-1;
		}
		.approval-switch {
			width: 100%;
		}
		.approval-switch button {
			flex: 1;
			justify-content: center;
			font-size: 11px;
		}
		aside {
			grid-template-columns: 1fr;
		}
		.saved-at {
			grid-column: auto;
		}
	}
</style>
