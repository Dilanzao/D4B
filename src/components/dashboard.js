import Chart from 'chart.js/auto';
import { getCreatureById, getCreatureName } from '../data/creatures.js';
import { formatCompactKamas, formatKamas, formatNumber } from '../utils/currency.js';
import { adSlot, escapeHtml, icon, t } from './common.js';
import { renderSimulationGallery } from './simulationGallery.js';

const charts = new Map();
const methodKeys = { vitaminizedFood:'marketFood', kolitokenBag:'kolitokenBag', resources:'combined', combined:'combined' };
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function startOfDay(date) { const copy=new Date(date); copy.setHours(0,0,0,0); return copy; }
function endOfDay(date) { const copy=new Date(date); copy.setHours(23,59,59,999); return copy; }
function addDays(date, days) { const copy=new Date(date); copy.setDate(copy.getDate()+days); return copy; }
function safeDate(value) { const date=new Date(value); return Number.isNaN(date.getTime())?null:date; }

export function getFilteredDashboardSales(state) {
  const f=state.dashboardFilters||{};
  const now=new Date();
  let from=null; let to=null;
  if(f.period==='7') from=startOfDay(addDays(now,-6));
  if(f.period==='30') from=startOfDay(addDays(now,-29));
  if(f.period==='90') from=startOfDay(addDays(now,-89));
  if(f.period==='year') from=new Date(now.getFullYear(),0,1);
  if(f.period==='custom') { from=f.from?safeDate(`${f.from}T00:00:00`):null; to=f.to?safeDate(`${f.to}T23:59:59`):null; }
  return state.sales.filter(sale=>{
    const date=safeDate(sale.soldAt||sale.createdAt);
    if(!date)return false;
    if(from&&date<from)return false;if(to&&date>to)return false;
    if(f.type&&f.type!=='all'&&sale.creatureType!==f.type)return false;
    if(f.creature&&f.creature!=='all'&&sale.creatureId!==f.creature)return false;
    if(f.channel&&f.channel!=='all'&&sale.saleChannel!==f.channel)return false;
    if(f.method&&f.method!=='all'&&sale.upMethod!==f.method)return false;
    if(f.result==='profit'&&sale.profit<=0)return false;
    if(f.result==='loss'&&sale.profit>=0)return false;
    return true;
  });
}

function groupKey(date, grouping, language) {
  const d=new Date(date);
  if(grouping==='day') return d.toISOString().slice(0,10);
  if(grouping==='week') {
    const utc=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
    const day=utc.getUTCDay()||7;utc.setUTCDate(utc.getUTCDate()+4-day);
    const yearStart=new Date(Date.UTC(utc.getUTCFullYear(),0,1));
    const week=Math.ceil((((utc-yearStart)/86400000)+1)/7);
    return `${utc.getUTCFullYear()}-W${String(week).padStart(2,'0')}`;
  }
  return d.toISOString().slice(0,7);
}
function groupLabel(key, grouping, language) {
  if(grouping==='day') return new Intl.DateTimeFormat(language,{day:'2-digit',month:'short',year:'2-digit'}).format(new Date(`${key}T12:00:00`));
  if(grouping==='week') return key.replace('-W',' · W');
  return new Intl.DateTimeFormat(language,{month:'short',year:'numeric'}).format(new Date(`${key}-01T12:00:00`));
}

function aggregate(sales, grouping, language) {
  const map=new Map();
  for(const sale of sales){
    const key=groupKey(sale.soldAt||sale.createdAt,grouping,language);
    const row=map.get(key)||{key,revenue:0,cost:0,profit:0,count:0};
    row.revenue+=sale.salePrice;row.cost+=sale.originCost+sale.upCost+(sale.additionalCosts||0);row.profit+=sale.profit;row.count+=1;map.set(key,row);
  }
  return [...map.values()].sort((a,b)=>a.key.localeCompare(b.key)).map(row=>({...row,label:groupLabel(row.key,grouping,language)}));
}

function saleName(state,sale){return getCreatureName(getCreatureById(sale.creatureId),state.language)||sale.creatureCanonicalName||sale.creatureId||'—';}
function statistics(sales,state) {
  const count=sales.length;
  const revenue=sales.reduce((sum,s)=>sum+s.salePrice,0);
  const cost=sales.reduce((sum,s)=>sum+s.originCost+s.upCost+(s.additionalCosts||0),0);
  const profit=sales.reduce((sum,s)=>sum+s.profit,0);
  const grouped={};
  sales.forEach(s=>{const key=s.creatureId||s.creatureCanonicalName||'—';const row=grouped[key]||(grouped[key]={name:saleName(state,s),profit:0});row.profit+=s.profit;});
  const bestCreature=Object.values(grouped).sort((a,b)=>b.profit-a.profit)[0]||null;
  return {
    count,revenue,cost,profit,
    margin:revenue?profit/revenue*100:0,
    ticket:count?revenue/count:0,
    investment:count?cost/count:0,
    averageProfit:count?profit/count:0,
    profitable:sales.filter(s=>s.profit>0).length,
    losses:sales.filter(s=>s.profit<0).length,
    bestSale:[...sales].sort((a,b)=>b.profit-a.profit)[0]||null,
    bestCreature
  };
}

function selectOptions(state, values, selected, allLabel, labeler=value=>value) {
  return `<option value="all">${escapeHtml(allLabel)}</option>${values.map(value=>`<option value="${escapeHtml(value)}" ${selected===value?'selected':''}>${escapeHtml(labeler(value))}</option>`).join('')}`;
}

function kpi(state,label,value,full,note='') { return `<article class="card kpi dashboard-kpi" title="${escapeHtml(full)}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${note?`<small>${escapeHtml(note)}</small>`:''}</article>`; }
function chartCard(state,id,title,summary,secondary=false) { const content=`<div class="chart-wrap"><canvas id="${id}" role="img" aria-describedby="${id}-summary" aria-label="${escapeHtml(title)}"></canvas></div><p class="visually-hidden" id="${id}-summary">${escapeHtml(summary)}</p>`; return secondary?`<details class="card chart-card secondary-chart" open><summary class="chart-head"><h3>${escapeHtml(title)}</h3><span aria-hidden="true">⌄</span></summary>${content}</details>`:`<article class="card chart-card"><div class="chart-head"><h3>${escapeHtml(title)}</h3></div>${content}</article>`; }

export function renderDashboard(state) {
  const f=state.dashboardFilters||{};
  const sales=getFilteredDashboardSales(state);
  const stats=statistics(sales,state);
  const creatures=[...new Map(state.sales.map(s=>[s.creatureId,s])).values()].filter(x=>x.creatureId);
  const methods=[...new Set(state.sales.map(s=>s.upMethod).filter(Boolean))];
  const hero=`<div class="card hero compact-hero"><div><span class="eyebrow">${escapeHtml(t(state,'home.eyebrow'))}</span><h1>${escapeHtml(t(state,'home.title'))}</h1><p>${escapeHtml(t(state,'home.description'))}</p><div class="hero-actions"><button class="button primary compact" data-action="new-simulation">${icon('plus',17)} ${escapeHtml(state.simulations.length?t(state,'home.newSimulation'):t(state,'home.firstButton'))}</button><button class="button secondary compact" data-action="open-information" data-section="how">${icon('details',17)} ${escapeHtml(t(state,'nav.guide'))}</button></div></div><img class="hero-logo" src="/assets/brand/logo-header.webp" alt="Dofus4Business"></div>`;
  const simulations=`<div class="section-head compact-head"><div><span class="eyebrow">${escapeHtml(t(state,'home.recentSimulations'))}</span><h2>${escapeHtml(t(state,'home.recentSimulations'))}</h2></div><div class="button-row"><button class="button secondary compact" data-action="new-simulation">${icon('plus',16)} ${escapeHtml(t(state,'home.newSimulation'))}</button>${state.simulations.length>4?`<button class="button ghost compact" data-action="navigate" data-view="simulations">${escapeHtml(t(state,'home.viewAll'))}</button>`:''}</div></div>${renderSimulationGallery(state,{limit:4})}`;
  const filterPanel=`<article class="card section dashboard-filter-card"><div class="section-head compact-head"><div><span class="eyebrow">${escapeHtml(t(state,'dashboard.filters'))}</span><h2>${escapeHtml(t(state,'dashboard.title'))}</h2><p>${escapeHtml(t(state,'dashboard.description'))}</p></div></div><div class="dashboard-filters">
    <label class="field"><span>${escapeHtml(t(state,'dashboard.period'))}</span><select class="select" data-dashboard-filter="period">${[['7','sevenDays'],['30','thirtyDays'],['90','ninetyDays'],['year','currentYear'],['all','allTime'],['custom','custom']].map(([value,key])=>`<option value="${value}" ${f.period===value?'selected':''}>${escapeHtml(t(state,`dashboard.${key}`))}</option>`).join('')}</select></label>
    <label class="field"><span>${escapeHtml(t(state,'dashboard.from'))}</span><input class="input" type="date" data-dashboard-filter="from" value="${escapeHtml(f.from||'')}" ${f.period!=='custom'?'disabled':''}></label>
    <label class="field"><span>${escapeHtml(t(state,'dashboard.to'))}</span><input class="input" type="date" data-dashboard-filter="to" value="${escapeHtml(f.to||'')}" ${f.period!=='custom'?'disabled':''}></label>
    <label class="field"><span>${escapeHtml(t(state,'dashboard.type'))}</span><select class="select" data-dashboard-filter="type">${selectOptions(state,['Mascote','Montascote'],f.type,t(state,'dashboard.all'),v=>v==='Mascote'?t(state,'simulation.pet'):t(state,'simulation.petsmount'))}</select></label>
    <label class="field"><span>${escapeHtml(t(state,'dashboard.creature'))}</span><select class="select" data-dashboard-filter="creature">${selectOptions(state,creatures.map(x=>x.creatureId),f.creature,t(state,'dashboard.all'),id=>{const sale=creatures.find(x=>x.creatureId===id);const c=getCreatureById(id);return getCreatureName(c,state.language)||sale?.creatureCanonicalName||id;})}</select></label>
    <label class="field"><span>${escapeHtml(t(state,'dashboard.channel'))}</span><select class="select" data-dashboard-filter="channel">${selectOptions(state,['Mercado HDV','Outro Jogador'],f.channel,t(state,'dashboard.all'),v=>v==='Mercado HDV'?t(state,'simulation.marketChannel'):t(state,'simulation.playerChannel'))}</select></label>
    <label class="field"><span>${escapeHtml(t(state,'dashboard.method'))}</span><select class="select" data-dashboard-filter="method">${selectOptions(state,methods,f.method,t(state,'dashboard.all'),v=>t(state,`simulation.${methodKeys[v]||'resources'}`))}</select></label>
    <label class="field"><span>${escapeHtml(t(state,'dashboard.result'))}</span><select class="select" data-dashboard-filter="result">${selectOptions(state,['profit','loss'],f.result,t(state,'dashboard.all'),v=>v==='profit'?t(state,'dashboard.positive'):t(state,'dashboard.negative'))}</select></label>
    <label class="field"><span>${escapeHtml(t(state,'dashboard.grouping'))}</span><select class="select" data-dashboard-filter="grouping">${['day','week','month'].map(v=>`<option value="${v}" ${f.grouping===v?'selected':''}>${escapeHtml(t(state,`dashboard.${v}`))}</option>`).join('')}</select></label>
    <label class="field"><span>${escapeHtml(t(state,'dashboard.typeMetricLabel'))}</span><select class="select" data-dashboard-filter="petMetric">${['quantity','revenue','profit'].map(v=>`<option value="${v}" ${f.petMetric===v?'selected':''}>${escapeHtml(t(state,`dashboard.${v}`))}</option>`).join('')}</select></label>
    <label class="field"><span>${escapeHtml(t(state,'dashboard.channelMetricLabel'))}</span><select class="select" data-dashboard-filter="channelMetric">${['quantity','revenue','profit','margin'].map(v=>`<option value="${v}" ${f.channelMetric===v?'selected':''}>${escapeHtml(t(state,`dashboard.${v}`))}</option>`).join('')}</select></label>
    <label class="field"><span>${escapeHtml(t(state,'dashboard.methodMetricLabel'))}</span><select class="select" data-dashboard-filter="methodMetric">${['averageCost','averageProfit','averageMargin','quantity'].map(v=>`<option value="${v}" ${f.methodMetric===v?'selected':''}>${escapeHtml(t(state,`dashboard.${v}`))}</option>`).join('')}</select></label>
  </div></article>`;
  if(!sales.length) return `<section class="stack">${hero}${simulations}${adSlot('ad-slot-middle','middle-ad',state)}${filterPanel}<div class="empty dashboard-empty"><img src="/assets/brand/logo-header.webp" alt=""><h2>${escapeHtml(t(state,'dashboard.empty'))}</h2><button class="button primary" data-action="navigate" data-view="sales">${escapeHtml(t(state,'nav.sales'))}</button></div></section>`;
  const bestSaleName=stats.bestSale?.creatureCanonicalName||'—';
  const cards=`<div class="dashboard-kpis">${[
    kpi(state,t(state,'dashboard.salesCount'),formatNumber(stats.count,state.language),formatNumber(stats.count,state.language)),
    kpi(state,t(state,'dashboard.revenue'),formatCompactKamas(stats.revenue,state.language),formatKamas(stats.revenue,state.language)),
    kpi(state,t(state,'dashboard.cost'),formatCompactKamas(stats.cost,state.language),formatKamas(stats.cost,state.language)),
    kpi(state,t(state,'dashboard.profit'),formatCompactKamas(stats.profit,state.language),formatKamas(stats.profit,state.language)),
    kpi(state,t(state,'dashboard.margin'),`${formatNumber(stats.margin,state.language,1)}%`,`${formatNumber(stats.margin,state.language,2)}%`),
    kpi(state,t(state,'dashboard.ticket'),formatCompactKamas(stats.ticket,state.language),formatKamas(stats.ticket,state.language)),
    kpi(state,t(state,'dashboard.investment'),formatCompactKamas(stats.investment,state.language),formatKamas(stats.investment,state.language)),
    kpi(state,t(state,'dashboard.averageProfit'),formatCompactKamas(stats.averageProfit,state.language),formatKamas(stats.averageProfit,state.language)),
    kpi(state,t(state,'dashboard.profitable'),formatNumber(stats.profitable,state.language),formatNumber(stats.profitable,state.language)),
    kpi(state,t(state,'dashboard.losses'),formatNumber(stats.losses,state.language),formatNumber(stats.losses,state.language)),
    kpi(state,t(state,'dashboard.bestSale'),stats.bestSale?formatCompactKamas(stats.bestSale.profit,state.language):'—',stats.bestSale?formatKamas(stats.bestSale.profit,state.language):'—',bestSaleName),
    kpi(state,t(state,'dashboard.bestCreature'),stats.bestCreature?.name||'—',stats.bestCreature?formatKamas(stats.bestCreature.profit,state.language):'—')
  ].join('')}</div>`;
  const summary=`${stats.count} · ${formatKamas(stats.revenue,state.language)} · ${formatKamas(stats.profit,state.language)}`;
  const chartsHtml=`<div class="dashboard-charts">
    ${chartCard(state,'chart-financial',t(state,'dashboard.financialEvolution'),summary)}
    ${chartCard(state,'chart-sales-count',t(state,'dashboard.salesEvolution'),summary)}
    ${chartCard(state,'chart-types',t(state,'dashboard.creatureTypes'),summary)}
    ${chartCard(state,'chart-channels',t(state,'dashboard.channels'),summary)}
    ${chartCard(state,'chart-top-creatures',t(state,'dashboard.topCreatures'),summary)}
    ${chartCard(state,'chart-roi',t(state,'dashboard.roi'),summary,true)}
    ${chartCard(state,'chart-methods',t(state,'dashboard.methods'),summary,true)}
    ${chartCard(state,'chart-distribution',t(state,'dashboard.distribution'),summary,true)}
  </div>`;
  const grouped=aggregate(sales,f.grouping||'month',state.language);const byProfit=[...grouped].sort((a,b)=>b.profit-a.profit)[0];const byRevenue=[...grouped].sort((a,b)=>b.revenue-a.revenue)[0];const byCount=[...grouped].sort((a,b)=>b.count-a.count)[0];
  const bestPeriod=`<article class="card section"><span class="eyebrow">${escapeHtml(t(state,'dashboard.bestPeriod'))}</span><div class="best-period-grid"><div><span>${escapeHtml(t(state,'dashboard.largestProfit'))}</span><strong>${escapeHtml(byProfit?.label||'—')}</strong><small>${formatKamas(byProfit?.profit||0,state.language)}</small></div><div><span>${escapeHtml(t(state,'dashboard.largestRevenue'))}</span><strong>${escapeHtml(byRevenue?.label||'—')}</strong><small>${formatKamas(byRevenue?.revenue||0,state.language)}</small></div><div><span>${escapeHtml(t(state,'dashboard.mostSales'))}</span><strong>${escapeHtml(byCount?.label||'—')}</strong><small>${formatNumber(byCount?.count||0,state.language)}</small></div></div></article>`;
  return `<section class="stack">${hero}${simulations}${adSlot('ad-slot-middle','middle-ad',state)}${filterPanel}${cards}${chartsHtml}${bestPeriod}</section>`;
}

function colorSet() { return { blue:'#4f91a8', gold:'#c39745', green:'#5f946b', red:'#b85a50', sand:'#d8bf8c', purple:'#8069a8', gray:'#827b72' }; }
function moneyTooltip(language) { return context => formatKamas(context.raw?.y ?? context.raw ?? 0, language); }
function makeChart(id, config) { const canvas=document.getElementById(id);if(!canvas||typeof Chart!=='function')return;charts.get(id)?.destroy();const chart=new Chart(canvas,config);charts.set(id,chart); }
function baseOptions(language, monetary=false) { return { responsive:true,maintainAspectRatio:false,animation:reduceMotion()?false:{duration:350},plugins:{legend:{position:'bottom'},tooltip:{callbacks:monetary?{label:moneyTooltip(language)}:{}}},scales:monetary?{y:{ticks:{callback:value=>formatCompactKamas(value,language)}}}:{}}; }

export function destroyDashboardCharts() { charts.forEach(chart=>chart.destroy()); charts.clear(); }

export function mountDashboardCharts(state) {
  destroyDashboardCharts();
  if(state.route?.name!=='pets' && state.view!=='pets' && state.view!=='dashboard')return;
  const sales=getFilteredDashboardSales(state);if(!sales.length)return;
  const colors=colorSet();const f=state.dashboardFilters||{};const grouped=aggregate(sales,f.grouping||'month',state.language);const labels=grouped.map(x=>x.label);
  makeChart('chart-financial',{type:'line',data:{labels,datasets:[{label:t(state,'dashboard.revenue'),data:grouped.map(x=>x.revenue),borderColor:colors.blue,backgroundColor:colors.blue,tension:.25},{label:t(state,'dashboard.cost'),data:grouped.map(x=>x.cost),borderColor:colors.gold,backgroundColor:colors.gold,tension:.25},{label:t(state,'dashboard.profit'),data:grouped.map(x=>x.profit),borderColor:colors.green,backgroundColor:colors.green,tension:.25}]},options:baseOptions(state.language,true)});
  makeChart('chart-sales-count',{type:'bar',data:{labels,datasets:[{label:t(state,'dashboard.salesCount'),data:grouped.map(x=>x.count),backgroundColor:colors.blue}]},options:baseOptions(state.language,false)});
  const types=['Mascote','Montascote'];const typeMetric=f.petMetric||'quantity';const typeValues=types.map(type=>sales.filter(x=>x.creatureType===type).reduce((sum,x)=>sum+(typeMetric==='revenue'?x.salePrice:typeMetric==='profit'?x.profit:1),0));
  makeChart('chart-types',{type:'doughnut',data:{labels:[t(state,'simulation.pet'),t(state,'simulation.petsmount')],datasets:[{data:typeValues,backgroundColor:[colors.gold,colors.blue]}]},options:{...baseOptions(state.language,typeMetric!=='quantity'),cutout:'58%'}});
  const channels=['Mercado HDV','Outro Jogador'];const channelMetric=f.channelMetric||'quantity';const channelRows=channels.map(channel=>{const rows=sales.filter(x=>x.saleChannel===channel);const revenue=rows.reduce((sum,x)=>sum+x.salePrice,0);const profit=rows.reduce((sum,x)=>sum+x.profit,0);return {channel,count:rows.length,revenue,profit,margin:revenue?profit/revenue*100:0};});const channelValues=channelRows.map(row=>channelMetric==='revenue'?row.revenue:channelMetric==='profit'?row.profit:channelMetric==='margin'?row.margin:row.count);makeChart('chart-channels',{type:'bar',data:{labels:channels.map(v=>v==='Mercado HDV'?t(state,'simulation.marketChannel'):t(state,'simulation.playerChannel')),datasets:[{label:t(state,`dashboard.${channelMetric}`),data:channelValues,backgroundColor:[colors.blue,colors.gold]}]},options:baseOptions(state.language,['revenue','profit'].includes(channelMetric))});
  const creatureMap={};sales.forEach(s=>{const key=s.creatureId||s.creatureCanonicalName;const row=creatureMap[key]||(creatureMap[key]={name:saleName(state,s),profit:0,count:0});row.profit+=s.profit;row.count++;});const top=Object.values(creatureMap).sort((a,b)=>b.profit-a.profit).slice(0,10);
  makeChart('chart-top-creatures',{type:'bar',data:{labels:top.map(x=>x.name),datasets:[{label:t(state,'dashboard.profit'),data:top.map(x=>x.profit),backgroundColor:colors.green}]},options:{...baseOptions(state.language,true),indexAxis:'y',plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:ctx=>{const row=top[ctx.dataIndex];return `${formatKamas(ctx.raw,state.language)} · ${row?.count||0} · ${formatKamas(row?.count?row.profit/row.count:0,state.language)}`;}}}}}});
  makeChart('chart-roi',{type:'bubble',data:{datasets:[{label:t(state,'dashboard.roi'),data:sales.map(s=>({x:s.originCost+s.upCost+(s.additionalCosts||0),y:s.profit,r:Math.max(5,Math.min(18,Math.sqrt(Math.max(1,s.salePrice))/100)),name:s.creatureCanonicalName,salePrice:s.salePrice})),backgroundColor:colors.purple}]},options:{...baseOptions(state.language,true),plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:ctx=>`${ctx.raw.name}: ${formatKamas(ctx.raw.y,state.language)} · ${formatKamas(ctx.raw.salePrice,state.language)}`}}},scales:{x:{title:{display:true,text:t(state,'dashboard.investment')},ticks:{callback:v=>formatCompactKamas(v,state.language)}},y:{title:{display:true,text:t(state,'dashboard.profit')},ticks:{callback:v=>formatCompactKamas(v,state.language)}}}}});
  const methodMap={};sales.forEach(s=>{const key=s.upMethod||'vitaminizedFood';const row=methodMap[key]||(methodMap[key]={cost:0,profit:0,revenue:0,count:0});row.cost+=s.upCost;row.profit+=s.profit;row.revenue+=s.salePrice;row.count++;});const methodEntries=Object.entries(methodMap);
  const methodMetric=f.methodMetric||'averageCost';const methodValues=methodEntries.map(([,v])=>methodMetric==='averageProfit'?(v.count?v.profit/v.count:0):methodMetric==='averageMargin'?(v.revenue?v.profit/v.revenue*100:0):methodMetric==='quantity'?v.count:(v.count?v.cost/v.count:0));makeChart('chart-methods',{type:'bar',data:{labels:methodEntries.map(([key])=>t(state,`simulation.${methodKeys[key]||'resources'}`)),datasets:[{label:t(state,`dashboard.${methodMetric}`),data:methodValues,backgroundColor:colors.gold}]},options:baseOptions(state.language,['averageCost','averageProfit'].includes(methodMetric))});
  const ranges=[{label:t(state,'dashboard.negative'),test:p=>p<0},{label:t(state,'dashboard.nearZero'),test:p=>p>=0&&p<=50000},{label:t(state,'dashboard.lowProfit'),test:p=>p>50000&&p<=250000},{label:t(state,'dashboard.mediumProfit'),test:p=>p>250000&&p<=1000000},{label:t(state,'dashboard.highProfit'),test:p=>p>1000000}];
  makeChart('chart-distribution',{type:'bar',data:{labels:ranges.map(x=>x.label),datasets:[{label:t(state,'dashboard.salesCount'),data:ranges.map(r=>sales.filter(s=>r.test(s.profit)).length),backgroundColor:[colors.red,colors.gray,colors.sand,colors.blue,colors.green]}]},options:baseOptions(state.language,false)});
}
