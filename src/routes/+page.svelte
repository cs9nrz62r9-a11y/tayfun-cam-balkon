<script lang="ts">
	import {
		ArrowRight,
		Boxes,
		CalendarDays,
		CheckCircle2,
		ChevronRight,
		CircleAlert,
		Clock3,
		Factory,
		FolderKanban,
		GlassWater,
		MapPin,
		Plus,
		Scissors,
		UsersRound
	} from '@lucide/svelte';
	import { isAuthenticated } from '#lib/stores/auth';
	import { data as dataStore } from '#lib/stores/data';
	import { recordData, statusInfo } from '#lib/workflow';

	const todayLabel = new Intl.DateTimeFormat('tr-TR', {
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	}).format(new Date());

	function dateKey(value: unknown) {
		if (!value) return '';
		const date = new Date(String(value));
		if (Number.isNaN(date.getTime())) return '';
		return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
	}

	function projects() {
		return Object.entries($dataStore.projects)
			.map(([key, record]) => ({ key, record, value: recordData(record) }))
			.sort((a, b) => String(b.record.updated_at).localeCompare(String(a.record.updated_at)));
	}

	function activeProjects() {
		return projects().filter((row) => row.value.status !== 'TESLIM');
	}

	function todayMontages() {
		const today = dateKey(new Date());
		return projects().filter((row) => dateKey(row.value.montage_date) === today);
	}

	function upcomingMontages() {
		const start = new Date();
		start.setHours(0, 0, 0, 0);
		const end = new Date(start);
		end.setDate(end.getDate() + 7);
		return projects()
			.filter((row) => {
				if (!row.value.montage_date) return false;
				const date = new Date(row.value.montage_date);
				return date >= start && date <= end;
			})
			.sort((a, b) => String(a.value.montage_date).localeCompare(String(b.value.montage_date)))
			.slice(0, 4);
	}

	function actionText(status: unknown) {
		const actions: Record<string, string> = {
			OLCULDU: 'Teklif hazırlanacak',
			TEKLIF_VERILDI: 'Müşteri onayı bekleniyor',
			ONAYLANDI: 'Üretime hazırlanacak',
			URETIMDE: 'Atölyede üretimde',
			MONTAJ_PLANLANDI: 'Montaj günü bekleniyor',
			MONTAJDA: 'Sahada montaj sürüyor'
		};
		return actions[String(status)] ?? 'İş dosyasını kontrol edin';
	}

	function productionSignals() {
		const productions = Object.values($dataStore.drawings)
			.map((record) => recordData(record).production)
			.filter(Boolean);
		const profileMeters = productions.reduce(
			(sum, item) => sum + Number(item.profileMeters || 0),
			0
		);
		const glassArea = productions.reduce((sum, item) => sum + Number(item.glassArea || 0), 0);
		const efficiencies = productions
			.map((item) => Number(item.efficiency || 0))
			.filter((value) => value > 0);
		const efficiency = efficiencies.length
			? efficiencies.reduce((sum, value) => sum + value, 0) / efficiencies.length
			: 0;
		return { profileMeters, glassArea, efficiency };
	}
</script>

{#if $isAuthenticated}
	<div class="dashboard">
		<header class="page-header">
			<div>
				<span class="date-label">{todayLabel}</span>
				<h1>Bugün</h1>
				<p>Satıştan montaja işletmenizin anlık çalışma planı.</p>
			</div>
			<a class="new-job" href="/wizard"><Plus size={19} /> Yeni İş Başlat</a>
		</header>

		<section class="pulse-grid" aria-label="Operasyon özeti">
			<a href="/projects" class="pulse-card teal"
				><div class="pulse-icon"><FolderKanban size={21} /></div>
				<div>
					<span>Aktif işler</span><strong>{activeProjects().length}</strong><small
						>{projects().filter((row) => row.value.status === 'URETIMDE').length} iş üretimde</small
					>
				</div>
				<ChevronRight size={18} /></a
			>
			<a href="/montage" class="pulse-card orange"
				><div class="pulse-icon"><CalendarDays size={21} /></div>
				<div>
					<span>Bugünün montajı</span><strong>{todayMontages().length}</strong><small
						>{upcomingMontages().length} plan bu hafta</small
					>
				</div>
				<ChevronRight size={18} /></a
			>
			<a href="/projects" class="pulse-card dark"
				><div class="pulse-icon"><Clock3 size={21} /></div>
				<div>
					<span>Onay bekleyen</span><strong
						>{projects().filter((row) => row.value.status === 'TEKLIF_VERILDI').length}</strong
					><small>Müşteri dönüşü bekleniyor</small>
				</div>
				<ChevronRight size={18} /></a
			>
			<a href="/stock" class="pulse-card green"
				><div class="pulse-icon"><Factory size={21} /></div>
				<div>
					<span>Üretim sırası</span><strong
						>{projects().filter((row) =>
							['ONAYLANDI', 'URETIMDE'].includes(String(row.value.status))
						).length}</strong
					><small>Atölye kontrol listesi</small>
				</div>
				<ChevronRight size={18} /></a
			>
		</section>

		<div class="workspace-grid">
			<section class="work-panel">
				<div class="section-head">
					<div>
						<span>İŞ AKIŞI</span>
						<h2>Öncelikli işler</h2>
					</div>
					<a href="/projects">Tüm işleri gör <ArrowRight size={15} /></a>
				</div>
				<div class="work-list">
					{#each activeProjects().slice(0, 6) as job}
						{@const status = statusInfo(job.value.status)}
						<a class="work-row" href={`/projects/${job.key}`}>
							<div class="job-code">
								<FolderKanban size={18} /><span>{job.key.slice(-5).toUpperCase()}</span>
							</div>
							<div class="job-main">
								<strong>{job.value.name || 'Adsız iş'}</strong><span
									>{job.value.customer || 'Müşteri seçilmedi'} · {job.value.system_name ||
										job.value.system ||
										'Sistem seçilmedi'}</span
								>
							</div>
							<div class="next-action">
								<span>Sıradaki işlem</span><strong>{actionText(job.value.status)}</strong>
							</div>
							<span class="status" style={`--status:${status.color}`}>{status.label}</span
							><ChevronRight class="row-arrow" size={18} />
						</a>
					{:else}
						<div class="empty-state">
							<CheckCircle2 size={34} /><strong>Bekleyen iş yok</strong><span
								>Yeni iş oluşturduğunuzda çalışma sırası burada görünür.</span
							><a href="/wizard">Yeni iş başlat</a>
						</div>
					{/each}
				</div>
			</section>

			<aside class="right-rail">
				<section class="schedule-panel">
					<div class="section-head compact">
						<div>
							<span>BU HAFTA</span>
							<h2>Montaj planı</h2>
						</div>
						<a href="/montage" aria-label="Montaj planına git"><CalendarDays size={17} /></a>
					</div>
					<div class="schedule-list">
						{#each upcomingMontages() as job}
							<a href={`/projects/${job.key}`}
								><div class="calendar-tile">
									<strong>{new Date(job.value.montage_date).getDate()}</strong><span
										>{new Date(job.value.montage_date).toLocaleDateString('tr-TR', {
											month: 'short'
										})}</span
									>
								</div>
								<div>
									<strong>{job.value.customer || job.value.name || 'Adsız iş'}</strong><span
										><UsersRound size={13} />{job.value.montage_team || 'Ekip seçilmedi'}</span
									>
								</div>
								<ChevronRight size={16} /></a
							>
						{:else}<div class="small-empty">
								<CalendarDays size={25} /><span>Bu hafta için montaj planlanmadı.</span>
							</div>{/each}
					</div>
				</section>

				<section class="production-panel">
					<div class="section-head compact">
						<div>
							<span>ATÖLYE</span>
							<h2>Üretim sinyalleri</h2>
						</div>
						<a href="/stock" aria-label="Stok ihtiyacına git"><Boxes size={17} /></a>
					</div>
					<div class="signal-list">
						<div>
							<span class="signal-icon"><Scissors size={18} /></span>
							<p>
								Profil ihtiyacı<strong>{productionSignals().profileMeters.toFixed(1)} m</strong>
							</p>
						</div>
						<div>
							<span class="signal-icon glass"><GlassWater size={18} /></span>
							<p>Cam ihtiyacı<strong>{productionSignals().glassArea.toFixed(2)} m²</strong></p>
						</div>
						<div>
							<span class="signal-icon efficiency"><Factory size={18} /></span>
							<p>
								Ortalama kesim verimi<strong>%{productionSignals().efficiency.toFixed(1)}</strong>
							</p>
						</div>
					</div>
					<a class="stock-link" href="/stock">Malzeme ihtiyacını incele <ArrowRight size={15} /></a>
				</section>
			</aside>
		</div>

		<section class="mobile-today">
			<div class="section-head">
				<div>
					<span>BUGÜN SAHADA</span>
					<h2>Montajlar</h2>
				</div>
			</div>
			{#each todayMontages() as job}
				<a href={`/projects/${job.key}`}
					><div>
						<strong>{job.value.customer || job.value.name}</strong><span
							><MapPin size={13} />{job.value.address || 'Adres iş dosyasında'}</span
						>
					</div>
					<span>{job.value.montage_team || 'Ekip seç'}</span><ChevronRight size={18} /></a
				>
			{:else}<div class="mobile-empty">
					<CircleAlert size={20} /> Bugün için montaj kaydı yok.
				</div>{/each}
		</section>
	</div>
{:else}
	<div class="auth-page">
		<div class="auth-card">
			<div class="auth-mark"><FolderKanban size={28} /></div>
			<span>TAYFUN WORKS</span>
			<h1>Tayfun Yapı</h1>
			<p>Cam balkon üretim ve operasyon sistemi</p>
			<a href="/auth/login">Giriş Yap</a>
		</div>
	</div>
{/if}

<style>
	.dashboard {
		width: 100%;
		max-width: 1540px;
		margin: 0 auto;
		padding: 30px 34px 44px;
	}
	.page-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 24px;
		margin-bottom: 22px;
	}
	.date-label {
		display: block;
		margin-bottom: 4px;
		color: var(--tw-glass);
		font-size: 10px;
		font-weight: 850;
		letter-spacing: 0.8px;
		text-transform: uppercase;
	}
	.page-header h1 {
		margin: 0;
		color: var(--tw-ink);
		font-size: 30px;
		line-height: 1.1;
	}
	.page-header p {
		margin: 6px 0 0;
		color: var(--tw-text-muted);
	}
	.new-job {
		height: 43px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 0 17px;
		border-radius: var(--tw-radius-md);
		background: var(--tw-signal);
		color: #fff;
		font-weight: 800;
		text-decoration: none;
		box-shadow: 0 8px 18px rgb(242 140 40 / 0.2);
	}
	.pulse-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 10px;
		margin-bottom: 12px;
	}
	.pulse-card {
		min-height: 104px;
		display: grid;
		grid-template-columns: 43px 1fr 18px;
		align-items: center;
		gap: 12px;
		padding: 16px;
		border: 1px solid var(--tw-border);
		border-radius: var(--tw-radius-lg);
		background: var(--tw-surface);
		color: var(--tw-text-muted);
		text-decoration: none;
		box-shadow: var(--tw-shadow-sm);
		transition:
			transform 140ms ease,
			border-color 140ms ease;
	}
	.pulse-card:hover {
		transform: translateY(-2px);
		border-color: var(--tw-border-strong);
	}
	.pulse-icon {
		width: 43px;
		height: 43px;
		display: grid;
		place-items: center;
		border-radius: var(--tw-radius-md);
	}
	.pulse-card.teal .pulse-icon {
		color: var(--tw-glass);
		background: var(--tw-glass-soft);
	}
	.pulse-card.orange .pulse-icon {
		color: var(--tw-signal);
		background: var(--tw-signal-soft);
	}
	.pulse-card.dark .pulse-icon {
		color: #53656c;
		background: #e7edef;
	}
	.pulse-card.green .pulse-icon {
		color: var(--tw-success);
		background: #e4f2ea;
	}
	.pulse-card span,
	.pulse-card strong,
	.pulse-card small {
		display: block;
	}
	.pulse-card span {
		font-size: 10px;
		font-weight: 750;
		text-transform: uppercase;
	}
	.pulse-card strong {
		margin: 1px 0;
		color: var(--tw-ink);
		font-size: 25px;
		line-height: 1.1;
	}
	.pulse-card small {
		color: #8a969a;
		font-size: 10px;
	}
	.workspace-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 340px;
		gap: 12px;
	}
	.work-panel,
	.schedule-panel,
	.production-panel,
	.mobile-today {
		overflow: hidden;
		border: 1px solid var(--tw-border);
		border-radius: var(--tw-radius-lg);
		background: var(--tw-surface);
		box-shadow: var(--tw-shadow-sm);
	}
	.right-rail {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.section-head {
		min-height: 67px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 18px;
		padding: 14px 18px;
		border-bottom: 1px solid #e7ecec;
	}
	.section-head span,
	.section-head h2 {
		display: block;
	}
	.section-head span {
		color: var(--tw-glass);
		font-size: 9px;
		font-weight: 850;
		letter-spacing: 1px;
	}
	.section-head h2 {
		margin: 1px 0 0;
		color: var(--tw-ink);
		font-size: 16px;
	}
	.section-head > a {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--tw-glass);
		font-size: 11px;
		font-weight: 800;
		text-decoration: none;
	}
	.section-head.compact {
		min-height: 61px;
		padding: 12px 15px;
	}
	.section-head.compact > a {
		width: 34px;
		height: 34px;
		display: grid;
		place-items: center;
		border-radius: var(--tw-radius-md);
		background: var(--tw-glass-soft);
	}
	.work-row {
		min-height: 76px;
		display: grid;
		grid-template-columns: 72px minmax(160px, 1fr) 190px 118px 18px;
		align-items: center;
		gap: 13px;
		padding: 11px 17px;
		border-bottom: 1px solid #edf0f1;
		color: inherit;
		text-decoration: none;
		transition: background 140ms ease;
	}
	.work-row:last-child {
		border-bottom: 0;
	}
	.work-row:hover {
		background: #f8fbfa;
	}
	.job-code {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		color: var(--tw-glass);
	}
	.job-code span {
		color: #829095;
		font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
		font-size: 9px;
		font-weight: 750;
	}
	.job-main,
	.next-action {
		min-width: 0;
	}
	.job-main strong,
	.job-main span,
	.next-action span,
	.next-action strong {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.job-main strong {
		color: var(--tw-ink);
		font-size: 13px;
	}
	.job-main span {
		margin-top: 3px;
		color: var(--tw-text-muted);
		font-size: 10px;
	}
	.next-action span {
		color: #89969a;
		font-size: 9px;
		text-transform: uppercase;
	}
	.next-action strong {
		margin-top: 2px;
		color: #3b4b50;
		font-size: 11px;
	}
	.status {
		justify-self: start;
		padding: 6px 8px;
		border-radius: var(--tw-radius-sm);
		background: color-mix(in srgb, var(--status) 11%, white);
		color: var(--status);
		font-size: 9px;
		font-weight: 850;
		white-space: nowrap;
	}
	.row-arrow {
		color: #9ca7aa;
	}
	.schedule-list > a {
		min-height: 66px;
		display: grid;
		grid-template-columns: 45px 1fr 16px;
		align-items: center;
		gap: 10px;
		padding: 9px 14px;
		border-bottom: 1px solid #edf0f1;
		color: inherit;
		text-decoration: none;
	}
	.schedule-list > a:last-child {
		border-bottom: 0;
	}
	.calendar-tile {
		width: 42px;
		height: 45px;
		display: grid;
		place-items: center;
		align-content: center;
		border-radius: var(--tw-radius-md);
		background: var(--tw-glass-soft);
		color: var(--tw-glass);
	}
	.calendar-tile strong {
		font-size: 17px;
		line-height: 1;
	}
	.calendar-tile span {
		font-size: 8px;
		text-transform: uppercase;
	}
	.schedule-list a > div:nth-child(2) strong,
	.schedule-list a > div:nth-child(2) span {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.schedule-list a > div:nth-child(2) strong {
		font-size: 11px;
	}
	.schedule-list a > div:nth-child(2) span {
		margin-top: 4px;
		color: var(--tw-text-muted);
		font-size: 9px;
	}
	.small-empty {
		min-height: 138px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 7px;
		padding: 20px;
		color: #89969a;
		font-size: 11px;
		text-align: center;
	}
	.signal-list {
		padding: 6px 14px;
	}
	.signal-list > div {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 9px 0;
		border-bottom: 1px solid #edf0f1;
	}
	.signal-list > div:last-child {
		border-bottom: 0;
	}
	.signal-icon {
		width: 35px;
		height: 35px;
		display: grid;
		place-items: center;
		border-radius: var(--tw-radius-md);
		color: var(--tw-signal);
		background: var(--tw-signal-soft);
	}
	.signal-icon.glass {
		color: var(--tw-glass);
		background: var(--tw-glass-soft);
	}
	.signal-icon.efficiency {
		color: var(--tw-success);
		background: #e4f2ea;
	}
	.signal-list p {
		flex: 1;
		margin: 0;
		color: var(--tw-text-muted);
		font-size: 10px;
	}
	.signal-list strong {
		float: right;
		color: var(--tw-ink);
		font-size: 12px;
	}
	.stock-link {
		min-height: 42px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 14px;
		border-top: 1px solid #e7ecec;
		color: var(--tw-glass);
		font-size: 10px;
		font-weight: 800;
		text-decoration: none;
	}
	.empty-state {
		min-height: 360px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 7px;
		padding: 30px;
		color: #8a969a;
		text-align: center;
	}
	.empty-state strong {
		color: var(--tw-ink);
	}
	.empty-state span {
		max-width: 280px;
		font-size: 11px;
	}
	.empty-state > a {
		margin-top: 7px;
		padding: 9px 12px;
		border-radius: var(--tw-radius-md);
		background: var(--tw-glass);
		color: #fff;
		font-size: 11px;
		font-weight: 800;
		text-decoration: none;
	}
	.mobile-today {
		display: none;
	}
	.auth-page {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 24px;
		background: var(--tw-ink);
	}
	.auth-card {
		width: min(100%, 380px);
		padding: 34px;
		border: 1px solid #334349;
		border-radius: var(--tw-radius-lg);
		background: #1e2c31;
		color: #fff;
		text-align: center;
		box-shadow: var(--tw-shadow-md);
	}
	.auth-mark {
		width: 52px;
		height: 52px;
		display: grid;
		place-items: center;
		margin: 0 auto 18px;
		border-radius: var(--tw-radius-md);
		background: var(--tw-glass);
	}
	.auth-card > span {
		color: #88bbb8;
		font-size: 9px;
		font-weight: 850;
		letter-spacing: 1.2px;
	}
	.auth-card h1 {
		margin: 4px 0 0;
		font-size: 24px;
	}
	.auth-card p {
		margin: 8px 0 24px;
		color: #9babad;
	}
	.auth-card a {
		display: block;
		padding: 11px;
		border-radius: var(--tw-radius-md);
		background: var(--tw-signal);
		color: #fff;
		font-weight: 800;
		text-decoration: none;
	}

	@media (max-width: 1180px) {
		.pulse-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.workspace-grid {
			grid-template-columns: minmax(0, 1fr) 300px;
		}
		.work-row {
			grid-template-columns: 62px minmax(150px, 1fr) 110px 18px;
		}
		.next-action {
			display: none;
		}
	}
	@media (max-width: 960px) {
		.dashboard {
			padding: 24px 20px 40px;
		}
		.workspace-grid {
			grid-template-columns: 1fr;
		}
		.right-rail {
			display: grid;
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 650px) {
		.dashboard {
			padding: 19px 12px 22px;
		}
		.page-header {
			align-items: flex-start;
			margin-bottom: 16px;
		}
		.page-header h1 {
			font-size: 25px;
		}
		.page-header p {
			max-width: 230px;
			font-size: 11px;
		}
		.new-job {
			display: none;
		}
		.pulse-grid {
			grid-template-columns: 1fr 1fr;
			gap: 8px;
		}
		.pulse-card {
			min-height: 91px;
			grid-template-columns: 36px 1fr;
			gap: 9px;
			padding: 11px;
		}
		.pulse-card > svg {
			display: none;
		}
		.pulse-icon {
			width: 36px;
			height: 36px;
		}
		.pulse-card strong {
			font-size: 21px;
		}
		.pulse-card small {
			max-width: 110px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.section-head {
			min-height: 60px;
			padding: 12px;
		}
		.section-head > a {
			font-size: 0;
		}
		.work-row {
			min-height: 76px;
			grid-template-columns: 38px minmax(0, 1fr) 16px;
			gap: 9px;
			padding: 10px 12px;
		}
		.job-code span,
		.next-action,
		.work-row .status {
			display: none;
		}
		.job-main strong {
			font-size: 12px;
		}
		.right-rail {
			display: block;
		}
		.right-rail > section {
			margin-top: 10px;
		}
		.schedule-panel {
			display: none;
		}
		.signal-list strong {
			float: none;
			display: block;
			margin-top: 1px;
		}
		.mobile-today {
			display: block;
			margin-top: 10px;
		}
		.mobile-today > a {
			min-height: 62px;
			display: grid;
			grid-template-columns: 1fr auto 18px;
			align-items: center;
			gap: 8px;
			padding: 10px 12px;
			border-bottom: 1px solid #edf0f1;
			color: inherit;
			text-decoration: none;
		}
		.mobile-today > a:last-child {
			border-bottom: 0;
		}
		.mobile-today strong,
		.mobile-today span {
			display: flex;
			align-items: center;
			gap: 4px;
		}
		.mobile-today strong {
			font-size: 12px;
		}
		.mobile-today span {
			margin-top: 3px;
			color: var(--tw-text-muted);
			font-size: 9px;
		}
		.mobile-today > a > span {
			margin: 0;
			padding: 5px 7px;
			border-radius: var(--tw-radius-sm);
			background: var(--tw-glass-soft);
			color: var(--tw-glass);
			font-weight: 750;
		}
		.mobile-empty {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 17px 12px;
			color: var(--tw-text-muted);
			font-size: 11px;
		}
	}
</style>
