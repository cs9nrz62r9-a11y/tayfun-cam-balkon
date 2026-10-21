<script lang="ts">
	import { data } from '#lib/stores/data';
	import { formatMoney, recordData, statusInfo } from '#lib/workflow';
	import { CalendarDays, ChevronRight, CircleDollarSign, FolderKanban, Plus, Search } from '@lucide/svelte';
	let query = $state('');
	let filter = $state('TUMU');
	function rows() {
		return Object.entries($data.projects).map(([key, record]) => ({ key, record, value: recordData(record) }))
			.filter(({ value }) => filter === 'TUMU' || value.status === filter)
			.filter(({ value, key }) => `${value.name ?? ''} ${value.customer ?? ''} ${key}`.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR')))
			.sort((a, b) => String(b.record.updated_at).localeCompare(String(a.record.updated_at)));
	}
</script>
<svelte:head><title>İşler | Tayfun Yapı</title></svelte:head>
<div class="page">
	<header><div><span class="eyebrow">SATIŞ VE ÜRETİM</span><h1>İşler</h1><p>Ölçüden montaja bütün projeleri tek ekrandan yönetin.</p></div><a href="/wizard"><Plus size={18}/> Yeni İş</a></header>
	<section class="summary"><div><FolderKanban size={20}/><span>Toplam iş<strong>{Object.keys($data.projects).length}</strong></span></div><div><CircleDollarSign size={20}/><span>Toplam değer<strong>{formatMoney(Object.values($data.drawings).reduce((sum, item) => sum + Number(recordData(item).price || 0), 0))}</strong></span></div><div><CalendarDays size={20}/><span>Montaj bekleyen<strong>{Object.values($data.projects).filter(item => ['ONAYLANDI','URETIMDE','MONTAJ_PLANLANDI'].includes(String(recordData(item).status))).length}</strong></span></div></section>
	<div class="tools"><label><Search size={17}/><input bind:value={query} placeholder="İş, müşteri veya kod ara" /></label><select bind:value={filter}><option value="TUMU">Tüm durumlar</option><option value="OLCULDU">Ölçü alındı</option><option value="TEKLIF_VERILDI">Teklif verildi</option><option value="ONAYLANDI">Onaylandı</option><option value="URETIMDE">Üretimde</option><option value="MONTAJ_PLANLANDI">Montaj planlandı</option><option value="MONTAJDA">Montajda</option><option value="TESLIM">Teslim edildi</option></select></div>
	<section class="list">
		{#each rows() as row}
			{@const status = statusInfo(row.value.status)}
			<a href={`/projects/${row.key}`}>
				<div class="project-mark"><FolderKanban size={20}/></div><div class="main"><strong>{row.value.name || 'Adsız iş'}</strong><span>{row.value.customer || 'Müşteri seçilmedi'} · {row.value.system_name || row.value.system || 'Sistem hesabı bekliyor'}</span></div>
				<div class="measure"><span>Ölçü</span><strong>{row.value.width ? `${row.value.width} × ${row.value.height} mm` : 'Henüz yok'}</strong></div><div class="value"><span>Tutar</span><strong>{formatMoney(row.value.price)}</strong></div>
				<span class="status" style={`--status:${status.color}`}>{status.label}</span><ChevronRight class="arrow" size={19}/>
			</a>
		{:else}<div class="empty"><FolderKanban size={34}/><strong>İş bulunamadı</strong><span>Yeni bir üretim hesabıyla ilk işi oluşturun.</span><a href="/wizard">Yeni iş başlat</a></div>{/each}
	</section>
</div>
<style>
	.page{max-width:1400px;margin:auto;padding:30px}.eyebrow{font-size:10px;font-weight:800;letter-spacing:1px;color:#0f7c80}header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}h1{font-size:28px;margin:2px 0}header p{margin:0;color:#73808c}header>a,.empty>a{display:flex;align-items:center;gap:7px;padding:11px 15px;background:#ec942f;color:#fff;border-radius:6px;text-decoration:none;font-weight:800}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}.summary>div{display:flex;align-items:center;gap:12px;padding:15px;background:#fff;border:1px solid #dfe4e8;border-radius:7px;color:#0f7c80}.summary span,.summary strong{display:block}.summary span{font-size:11px;color:#78838f}.summary strong{font-size:19px;color:#1f2933;margin-top:2px}.tools{display:flex;gap:9px;margin-bottom:10px}.tools label{height:42px;flex:1;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #d9dfe4;border-radius:6px;padding:0 12px;color:#7b8791}.tools input{border:0;outline:0;width:100%;font:inherit}.tools select{border:1px solid #d9dfe4;border-radius:6px;padding:0 11px;background:#fff}.list{background:#fff;border:1px solid #dfe4e8;border-radius:7px;overflow:hidden}.list>a{display:grid;grid-template-columns:42px minmax(200px,1fr) 170px 130px 150px 24px;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #edf0f2;color:inherit;text-decoration:none}.list>a:last-child{border-bottom:0}.list>a:hover{background:#f8fbfb}.project-mark{width:38px;height:38px;display:grid;place-items:center;border-radius:6px;background:#e8f4f4;color:#0f7c80}.main strong,.main span,.measure span,.measure strong,.value span,.value strong{display:block}.main span,.measure span,.value span{font-size:11px;color:#84909a}.measure strong,.value strong{font-size:12px;margin-top:2px}.status{justify-self:start;padding:6px 9px;border-radius:5px;background:color-mix(in srgb,var(--status) 12%,white);color:var(--status);font-size:11px;font-weight:800}.arrow{color:#9aa4ad}.empty{min-height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#8b96a0}.empty strong{color:#374151}.empty>a{font-size:12px;margin-top:8px}
	@media(max-width:900px){.list>a{grid-template-columns:42px 1fr 140px 20px}.measure,.value{display:none}.summary{grid-template-columns:1fr 1fr}.summary>div:last-child{grid-column:1/-1}}
	@media(max-width:650px){.page{padding:18px 12px 90px}header p{display:none}h1{font-size:23px}.summary{grid-template-columns:1fr 1fr}.summary>div{padding:12px}.tools{flex-direction:column}.tools select{height:42px}.list>a{grid-template-columns:38px 1fr 20px;padding:12px}.status{grid-column:2/3}.main span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.summary>div:last-child{grid-column:1/-1}}
</style>
