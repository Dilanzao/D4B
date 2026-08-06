import { escapeHtml, icon, t } from '../../../components/common.js';
import { formatKamas } from '../../../utils/currency.js';

function freshnessClass(line) {
  if (line.communityPriceFreshness === 'STALE' || Number(line.communityPriceAgeDays) > 7) return 'stale';
  if (line.communityPriceFreshness === 'WARNING' || Number(line.communityPriceAgeDays) > 3) return 'warning';
  return 'fresh';
}

function ageText(state, line) {
  const days=Math.max(0,Number(line.communityPriceAgeDays)||0);
  if (!line.communityPriceRegisteredAt) return t(state,'v310.prices.noPrice');
  if (days===0) return t(state,'v310.prices.updatedToday');
  if (days===1) return t(state,'v310.prices.updatedOneDay');
  return t(state,'v310.prices.updatedDays',{count:days});
}

export function renderCommunityPriceBox(state, line) {
  const logged=Boolean(state.account?.user);
  const configured=state.account?.apiConfigured !== false;
  const value=Number(line.communityPriceUnit)||0;
  const status=line.priceSyncStatus||'idle';
  const source=line.communityPriceSource==='PROPRIOS'||line.communityPriceIsOwn?t(state,'v310.prices.ownSource'):t(state,'v310.prices.communitySource');
  if (!logged) {
    return `<div class="community-price-box signed-out">${icon('user',16)}<span>${escapeHtml(t(state,'v310.prices.loginToUse'))}</span><button type="button" data-action="route" data-route="login">${escapeHtml(t(state,'v310.account.enter'))}</button></div>`;
  }
  if (!configured) {
    return `<div class="community-price-box warning">${icon('alert',16)}<span>${escapeHtml(t(state,'v310.account.apiNotConfiguredTitle'))}</span></div>`;
  }
  return `<div class="community-price-box ${freshnessClass(line)}">
    <div class="community-price-main"><span class="community-price-label">${escapeHtml(t(state,'v310.prices.referencePrice'))}</span><strong>${value>0?formatKamas(value,state.language):escapeHtml(t(state,'v310.prices.noPrice'))}</strong><small>${escapeHtml(source)} · ${escapeHtml(ageText(state,line))}</small></div>
    <div class="community-price-actions">
      ${value>0?`<button type="button" class="button ghost compact" data-action="use-community-price" data-id="${escapeHtml(line.id)}">${escapeHtml(t(state,'v310.prices.usePrice'))}</button>`:''}
      ${status==='dirty'?`<span class="price-sync dirty">${escapeHtml(t(state,'v310.prices.pendingSend'))}</span>`:''}
      ${status==='saving'?`<span class="price-sync saving">${escapeHtml(t(state,'v310.prices.saving'))}</span>`:''}
      ${status==='saved'?`<span class="price-sync saved">${icon('check',14)} ${escapeHtml(t(state,'v310.prices.saved'))}</span>`:''}
      ${status==='error'?`<span class="price-sync error">${escapeHtml(t(state,'v310.prices.saveError'))}</span>`:''}
    </div>
  </div>`;
}

export function renderCraftServerContext(state, project) {
  const serverName=project.serverNameSnapshot||state.account?.selectedServer?.name||state.account?.user?.serverId||'';
  if (!state.account?.user) return `<div class="craft-server-context signed-out">${icon('user',17)}<span>${escapeHtml(t(state,'v310.prices.loginProjectInfo'))}</span><button class="button ghost compact" data-action="route" data-route="login">${escapeHtml(t(state,'v310.account.enter'))}</button></div>`;
  return `<div class="craft-server-context">${icon('server',17)}<div><small>${escapeHtml(t(state,'v310.prices.projectServer'))}</small><strong>${escapeHtml(serverName||t(state,'v310.account.selectServer'))}</strong></div><button class="button ghost compact" data-action="refresh-community-prices">${icon('refresh',15)} ${escapeHtml(t(state,'v310.prices.refresh'))}</button></div>`;
}
