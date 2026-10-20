<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '#lib/supabase';

	interface DashboardData {
		totalQuotes: number;
		acceptedQuotes: number;
		totalRevenue: number;
		pendingQuotes: number;
		quotesThisMonth: number;
		conversionRate: number;
		topSystems: Record<string, number>;
		systemRevenue: Record<string, number>;
		monthlyData: Array<{ month: string; quotes: number; revenue: number }>;
	}

	let data = $state<DashboardData>({
		totalQuotes: 0,
		acceptedQuotes: 0,
		totalRevenue: 0,
		pendingQuotes: 0,
		quotesThisMonth: 0,
		conversionRate: 0,
		topSystems: {},
		systemRevenue: {},
		monthlyData: []
	});

	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		await loadAnalytics();
	});

	async function loadAnalytics() {
		loading = true;
		error = '';
		try {
			const { data: quotes, error: err } = await supabase
				.from('cb_records')
				.select('*')
				.eq('kind', 'quote')
				.eq('deleted', false);

			if (err) throw err;

			const processedQuotes = (quotes || []).map((d: any) => ({
				...d.data,
				id: d.key,
				status: d.data.status || 'draft'
			}));

			// Calculate metrics
			const totalQuotes = processedQuotes.length;
			const acceptedQuotes = processedQuotes.filter((q: any) => q.status === 'accepted').length;
			const totalRevenue = processedQuotes.reduce((sum: number, q: any) => sum + (q.price || 0), 0);
			const pendingQuotes = processedQuotes.filter((q: any) => q.status === 'draft' || q.status === 'sent').length;

			// This month
			const now = new Date();
			const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
			const quotesThisMonth = processedQuotes.filter((q: any) => {
				const createdAt = new Date(q.created_at || q.createdAt);
				return createdAt >= thisMonthStart;
			}).length;

			// Conversion rate
			const conversionRate = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;

			// Top systems
			const topSystems: Record<string, number> = {};
			const systemRevenue: Record<string, number> = {};
			processedQuotes.forEach((q: any) => {
				const system = q.system || 'Unknown';
				topSystems[system] = (topSystems[system] || 0) + 1;
				systemRevenue[system] = (systemRevenue[system] || 0) + (q.price || 0);
			});

			// Monthly data for last 6 months
			const monthlyData: Array<{ month: string; quotes: number; revenue: number }> = [];
			for (let i = 5; i >= 0; i--) {
				const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
				const monthStart = monthDate;
				const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

				const monthQuotes = processedQuotes.filter((q: any) => {
					const createdAt = new Date(q.created_at || q.createdAt);
					return createdAt >= monthStart && createdAt <= monthEnd;
				});

				monthlyData.push({
					month: monthDate.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' }),
					quotes: monthQuotes.length,
					revenue: monthQuotes.reduce((sum: number, q: any) => sum + (q.price || 0), 0)
				});
			}

			data = {
				totalQuotes,
				acceptedQuotes,
				totalRevenue,
				pendingQuotes,
				quotesThisMonth,
				conversionRate,
				topSystems,
				systemRevenue,
				monthlyData
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Veriler yüklenemedi';
		} finally {
			loading = false;
		}
	}

	function formatCurrency(value: number) {
		return new Intl.NumberFormat('tr-TR', {
			style: 'currency',
			currency: 'TRY',
			minimumFractionDigits: 0
		}).format(value);
	}

	function getSortedSystems() {
		return Object.entries(data.topSystems)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);
	}

	function getSortedByRevenue() {
		return Object.entries(data.systemRevenue)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);
	}
</script>

<div class="container">
	<header>
		<h1>Analitikler & Raporlar</h1>
		<p>İşletme performansını izleyin ve satış trendlerini takip edin</p>
	</header>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if loading}
		<div class="loading">Veriler yükleniyor...</div>
	{:else}
		<!-- KPI Cards -->
		<section class="kpi-grid">
			<div class="kpi-card">
				<div class="kpi-label">Toplam Teklifler</div>
				<div class="kpi-value">{data.totalQuotes}</div>
				<div class="kpi-subtext">Sistem tarafından oluşturulan</div>
			</div>

			<div class="kpi-card">
				<div class="kpi-label">Kabul Edilen</div>
				<div class="kpi-value" style="color: #10b981;">{data.acceptedQuotes}</div>
				<div class="kpi-subtext">Dönüşüm oranı: {data.conversionRate}%</div>
			</div>

			<div class="kpi-card">
				<div class="kpi-label">Beklemede</div>
				<div class="kpi-value" style="color: #3b82f6;">{data.pendingQuotes}</div>
				<div class="kpi-subtext">Taslak + Gönderilen</div>
			</div>

			<div class="kpi-card">
				<div class="kpi-label">Toplam Gelir</div>
				<div class="kpi-value" style="color: #10b981;">{formatCurrency(data.totalRevenue)}</div>
				<div class="kpi-subtext">Tüm kabul edilen teklifler</div>
			</div>

			<div class="kpi-card">
				<div class="kpi-label">Bu Ay Teklifler</div>
				<div class="kpi-value">{data.quotesThisMonth}</div>
				<div class="kpi-subtext">{new Date().toLocaleDateString('tr-TR', { month: 'long' })}</div>
			</div>

			<div class="kpi-card">
				<div class="kpi-label">Ortalama Teklif</div>
				<div class="kpi-value" style="color: #f59e0b;">
					{formatCurrency(data.totalQuotes > 0 ? data.totalRevenue / data.totalQuotes : 0)}
				</div>
				<div class="kpi-subtext">Teklif başına</div>
			</div>
		</section>

		<!-- Charts Section -->
		<section class="charts-grid">
			<div class="chart-card">
				<h3>Sisteme Göre Teklifler</h3>
				<div class="chart-content">
					{#if Object.keys(data.topSystems).length > 0}
						{#each getSortedSystems() as [system, count]}
							<div class="chart-row">
								<div class="chart-label">{system}</div>
								<div class="chart-bar-container">
									<div
										class="chart-bar"
										style="width: {(count / Math.max(...Object.values(data.topSystems))) * 100}%"
									></div>
									<span class="chart-value">{count}</span>
								</div>
							</div>
						{/each}
					{:else}
						<p class="empty">Henüz veri yok</p>
					{/if}
				</div>
			</div>

			<div class="chart-card">
				<h3>Sisteme Göre Gelir</h3>
				<div class="chart-content">
					{#if Object.keys(data.systemRevenue).length > 0}
						{#each getSortedByRevenue() as [system, revenue]}
							<div class="chart-row">
								<div class="chart-label">{system}</div>
								<div class="chart-bar-container">
									<div
										class="chart-bar"
										style="width: {(revenue / Math.max(...Object.values(data.systemRevenue))) * 100}%"
									></div>
									<span class="chart-value">{formatCurrency(revenue)}</span>
								</div>
							</div>
						{/each}
					{:else}
						<p class="empty">Henüz veri yok</p>
					{/if}
				</div>
			</div>
		</section>

		<!-- Monthly Trends -->
		<section class="trend-section">
			<h3>Son 6 Aylık Trendler</h3>
			<div class="monthly-table">
				<div class="table-header">
					<div class="col-month">Ay</div>
					<div class="col-quotes">Teklifler</div>
					<div class="col-revenue">Gelir</div>
				</div>
				{#each data.monthlyData as row}
					<div class="table-row">
						<div class="col-month">{row.month}</div>
						<div class="col-quotes">{row.quotes}</div>
						<div class="col-revenue">{formatCurrency(row.revenue)}</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Summary -->
		<section class="summary-section">
			<h3>Özet İstatistikler</h3>
			<div class="summary-grid">
				<div class="summary-item">
					<span class="summary-label">Ortalama Dönüşüm</span>
					<span class="summary-value">{data.conversionRate}%</span>
				</div>
				<div class="summary-item">
					<span class="summary-label">Yakın Teklifler</span>
					<span class="summary-value">{data.pendingQuotes}</span>
				</div>
				<div class="summary-item">
					<span class="summary-label">En Popüler Sistem</span>
					<span class="summary-value">
						{Object.entries(data.topSystems).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
					</span>
				</div>
				<div class="summary-item">
					<span class="summary-label">En Karlı Sistem</span>
					<span class="summary-value">
						{Object.entries(data.systemRevenue).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
					</span>
				</div>
			</div>
		</section>
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

	.loading {
		padding: 2rem;
		text-align: center;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		color: var(--color-text-light);
	}

	/* KPI Grid */
	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.kpi-card {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		transition: all 0.2s;
	}

	.kpi-card:hover {
		border-color: var(--color-secondary);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
	}

	.kpi-label {
		font-size: 12px;
		color: var(--color-text-light);
		font-weight: 500;
	}

	.kpi-value {
		font-size: 32px;
		font-weight: bold;
		color: var(--color-primary);
		line-height: 1;
	}

	.kpi-subtext {
		font-size: 11px;
		color: var(--color-text-light);
		margin-top: 0.25rem;
	}

	/* Charts */
	.charts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.chart-card {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.chart-card h3 {
		margin: 0 0 1.5rem;
		color: var(--color-primary);
		font-size: 16px;
	}

	.chart-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.chart-row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.chart-label {
		min-width: 100px;
		font-size: 13px;
		color: var(--color-text);
		font-weight: 500;
	}

	.chart-bar-container {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: var(--color-border);
		border-radius: 4px;
		overflow: hidden;
		height: 24px;
		min-width: 100px;
	}

	.chart-bar {
		height: 100%;
		background: linear-gradient(90deg, var(--color-secondary), #059669);
		transition: width 0.3s;
	}

	.chart-value {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-text);
		padding: 0 0.5rem;
		white-space: nowrap;
	}

	.empty {
		text-align: center;
		color: var(--color-text-light);
		padding: 2rem 1rem;
	}

	/* Trend Section */
	.trend-section {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.trend-section h3 {
		margin: 0 0 1.5rem;
		color: var(--color-primary);
		font-size: 16px;
	}

	.monthly-table {
		display: flex;
		flex-direction: column;
		gap: 0;
		overflow-x: auto;
	}

	.table-header,
	.table-row {
		display: grid;
		grid-template-columns: 1fr 1fr 2fr;
		gap: 1rem;
		padding: 1rem;
		align-items: center;
	}

	.table-header {
		background: var(--color-border);
		border-radius: 4px 4px 0 0;
		font-weight: 600;
		font-size: 13px;
		color: var(--color-text);
	}

	.table-row {
		border-bottom: 1px solid var(--color-border);
		font-size: 13px;
	}

	.table-row:last-child {
		border-bottom: none;
	}

	.table-row:hover {
		background: var(--color-border);
	}

	.col-month {
		font-weight: 500;
		color: var(--color-text);
	}

	.col-quotes {
		text-align: right;
		color: var(--color-text-light);
	}

	.col-revenue {
		text-align: right;
		color: var(--color-secondary);
		font-weight: 600;
	}

	/* Summary */
	.summary-section {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.summary-section h3 {
		margin: 0 0 1.5rem;
		color: var(--color-primary);
		font-size: 16px;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background: var(--color-border);
		border-radius: 6px;
	}

	.summary-label {
		font-size: 12px;
		color: var(--color-text-light);
		font-weight: 500;
	}

	.summary-value {
		font-size: 18px;
		font-weight: 600;
		color: var(--color-primary);
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.kpi-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 1rem;
		}

		.charts-grid {
			grid-template-columns: 1fr;
		}

		.table-header,
		.table-row {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.col-quotes,
		.col-revenue {
			text-align: left;
		}

		header h1 {
			font-size: 24px;
		}
	}
</style>
