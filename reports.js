/**
 * Report Views Renderer Module
 * Generates custom reports for Region Consumption (>7%), Financials, Hierarchy, and MoM Trends.
 */

// Utility for currency formatting (Indian Rupee style)
window.formatRupee = function(amount) {
    if (isNaN(amount) || amount === null) return "\u20B90";
    return "\u20B9" + Math.round(amount).toLocaleString('en-IN');
};

/**
 * REPORT 1: Region Consumption (>7% Threshold)
 */
window.renderRegionConsumptionReport = function(sites, thresholdPct = 7.0) {
    const container = document.getElementById('regionConsumptionContainer');
    if (!container) return;

    if (!sites || sites.length === 0) {
        container.innerHTML = `<div class="glass-panel p-8 text-center text-gray-400">No site records found matching current filters.</div>`;
        return;
    }

    // Group sites by Region
    const regionMap = {};
    sites.forEach(site => {
        if (!regionMap[site.region]) {
            regionMap[site.region] = [];
        }
        regionMap[site.region].push(site);
    });

    let totalHighShareSitesCount = 0;
    let html = '';

    const monthLabel = window.selectedMonth && window.selectedMonth !== 'ALL' 
        ? `Month: ${window.selectedMonth} 2026` 
        : `Overall (Jan-Jul/Aug 2026)`;

    Object.keys(regionMap).sort().forEach(regionName => {
        const regSites = regionMap[regionName];
        const regTotalConsumption = regSites.reduce((sum, s) => sum + (s.activeConsumption || 0), 0);
        const regTotalBilling = regSites.reduce((sum, s) => sum + (s.activeBilling || 0), 0);

        // Calculation mode: SITE_BILLING (default) vs REGION_SHARE
        const calcMode = window.currentThresholdMode || 'SITE_BILLING';

        const highShareSites = regSites.filter(s => {
            const regShare = regTotalConsumption > 0 ? (s.activeConsumption / regTotalConsumption) * 100 : 0;
            const billShare = s.activeBilling > 0 ? (s.activeConsumption / s.activeBilling) * 100 : 0;

            if (calcMode === 'EITHER') {
                return regShare >= thresholdPct || billShare >= thresholdPct;
            }
            return calcMode === 'REGION_SHARE' ? regShare >= thresholdPct : billShare >= thresholdPct;
        }).sort((a, b) => {
            const billShareA = a.activeBilling > 0 ? (a.activeConsumption / a.activeBilling) * 100 : 0;
            const billShareB = b.activeBilling > 0 ? (b.activeConsumption / b.activeBilling) * 100 : 0;
            const regShareA = regTotalConsumption > 0 ? (a.activeConsumption / regTotalConsumption) * 100 : 0;
            const regShareB = regTotalConsumption > 0 ? (b.activeConsumption / regTotalConsumption) * 100 : 0;
            return calcMode === 'REGION_SHARE' ? regShareB - regShareA : billShareB - billShareA;
        });

        const viewFilter = window.currentRegionViewFilter || 'ALERTS_ONLY';

        const allRegionSitesSorted = [...regSites].sort((a, b) => {
            const regShareA = regTotalConsumption > 0 ? (a.activeConsumption / regTotalConsumption) * 100 : 0;
            const regShareB = regTotalConsumption > 0 ? (b.activeConsumption / regTotalConsumption) * 100 : 0;
            return regShareB - regShareA;
        });

        const displaySites = viewFilter === 'ALL_SITES' ? allRegionSitesSorted : highShareSites;

        totalHighShareSitesCount += highShareSites.length;

        html += `
            <div class="glass-panel rounded-xl overflow-hidden border border-gray-800">
                <!-- Region Header Bar -->
                <div class="bg-gray-900/90 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-800">
                    <div class="flex items-center space-x-3">
                        <div class="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                            <i class="fa-solid fa-earth-americas"></i>
                        </div>
                        <div>
                            <h4 class="text-base font-bold text-white flex items-center gap-2">
                                Region: ${regionName}
                                <span class="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                                    ${monthLabel}
                                </span>
                            </h4>
                            <p class="text-xs text-gray-400">Total Region Sites: <span class="font-bold text-white">${regSites.length}</span> | Consumption: <span class="font-bold text-purple-400">${formatRupee(regTotalConsumption)}</span> | Billing: <span class="font-bold text-gray-300">${formatRupee(regTotalBilling)}</span></p>
                        </div>
                    </div>

                    <div class="flex items-center space-x-2">
                        <span class="text-xs text-gray-400">High Consumption Sites (&ge;${thresholdPct}%):</span>
                        <span class="px-3 py-1 rounded-full ${highShareSites.length > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30 font-extrabold' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium'} text-xs">
                            ${highShareSites.length} / ${regSites.length} ${highShareSites.length === 1 ? 'Site' : 'Sites'}
                        </span>
                    </div>
                </div>

                <!-- Sites Table -->
                <div class="overflow-auto max-h-[70vh] rounded-xl">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead class="bg-gray-950 text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-800 sticky top-0 z-10 shadow-md">
                            <tr>
                                <th class="py-3 px-4 bg-gray-950">Site Code & Name</th>
                                <th class="py-3 px-4 bg-gray-950">Customer Group</th>
                                <th class="py-3 px-4 bg-gray-950">Manager / Sr Manager</th>
                                <th class="py-3 px-4 bg-gray-950 text-right">Billing</th>
                                <th class="py-3 px-4 bg-gray-950 text-right">Consumption Value</th>
                                <th class="py-3 px-4 bg-gray-950 text-right">Consumption / Billing (%)</th>
                                <th class="py-3 px-4 bg-gray-950 text-right">Share of Region (%)</th>
                                <th class="py-3 px-4 bg-gray-950 text-center">Alert Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-800/40 text-gray-300">
        `;

        if (displaySites.length === 0) {
            html += `
                <tr>
                    <td colspan="8" class="py-6 px-4 text-center text-gray-500 italic">
                        <i class="fa-solid fa-circle-check text-emerald-400 mr-2"></i>
                        No sites in ${regionName} have consumption/billing &ge; ${thresholdPct}% for ${monthLabel}.
                    </td>
                </tr>
            `;
        } else {
            displaySites.forEach(s => {
                const regShare = regTotalConsumption > 0 ? Number(((s.activeConsumption / regTotalConsumption) * 100).toFixed(2)) : 0;
                const billShare = s.activeBilling > 0 ? Number(((s.activeConsumption / s.activeBilling) * 100).toFixed(2)) : 0;

                const isHighShare = calcMode === 'EITHER'
                    ? (regShare >= thresholdPct || billShare >= thresholdPct)
                    : (calcMode === 'REGION_SHARE' ? regShare >= thresholdPct : billShare >= thresholdPct);

                const rowBg = isHighShare ? 'bg-red-500/10 hover:bg-red-500/15' : 'hover:bg-gray-800/40';

                const alertBadge = isHighShare
                    ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold"><i class="fa-solid fa-triangle-exclamation text-xs"></i> &ge; ${thresholdPct}% High Alert</span>`
                    : `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-[10px] font-medium"><i class="fa-solid fa-circle-check text-emerald-400 text-[10px]"></i> Normal (&lt;${thresholdPct}%)</span>`;

                html += `
                    <tr class="${rowBg} transition">
                        <td class="py-3.5 px-4 font-semibold text-white">
                            <button onclick="openSiteDetailModal('${s.siteCode}')" class="text-left group/btn focus:outline-none" title="Click for calculation breakdown">
                                <div class="text-white group-hover/btn:underline text-xs font-bold flex items-center gap-1.5">
                                    ${s.siteName} <i class="fa-solid fa-calculator text-[10px] text-gray-500 group-hover/btn:text-brand-400"></i>
                                </div>
                                <div class="text-brand-400 text-[10px] font-mono">${s.siteCode}</div>
                            </button>
                        </td>
                        <td class="py-3.5 px-4 text-gray-400">${s.customerGroup}</td>
                        <td class="py-3.5 px-4">
                            <div class="text-gray-200">${s.manager}</div>
                            <div class="text-[11px] text-gray-500">Sr: ${s.srManager}</div>
                        </td>
                        <td class="py-3.5 px-4 text-right font-mono">${formatRupee(s.activeBilling)}</td>
                        <td class="py-3.5 px-4 text-right font-mono font-bold text-purple-400">${formatRupee(s.activeConsumption)}</td>
                        <td class="py-3.5 px-4 text-right">
                            <div class="font-extrabold ${isHighShare ? 'text-red-400' : 'text-gray-300'} font-mono text-xs">${billShare}%</div>
                            <div class="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1">
                                <div class="${isHighShare ? 'bg-red-500' : 'bg-brand-500'} h-full rounded-full" style="width: ${Math.min(billShare, 100)}%"></div>
                            </div>
                        </td>
                        <td class="py-3.5 px-4 text-right font-mono ${isHighShare ? 'text-amber-300 font-bold' : 'text-gray-400'}">
                            ${regShare}%
                        </td>
                        <td class="py-3.5 px-4 text-center">
                            ${alertBadge}
                        </td>
                    </tr>
                `;
            });
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Update alert count badge in executive summary
    const badgeCount = document.getElementById('badgeHighShareCount');
    if (badgeCount) {
        badgeCount.innerText = `${totalHighShareSitesCount} ${totalHighShareSitesCount === 1 ? 'Site' : 'Sites'}`;
    }
};

/**
 * REPORT 2: Financial Performance & Profitability
 */
window.renderFinancialReport = function(sites) {
    const tbody = document.getElementById('tblFinancialBody');
    if (!tbody) return;

    // Fix: Default sites if invoked without arguments from inline HTML onchange
    if (!sites || !Array.isArray(sites)) {
        sites = (window.filteredDataset && window.filteredDataset.length > 0)
            ? window.filteredDataset
            : (window.activeDataset || []);
    }

    const filterVal = document.getElementById('filterProfitability')?.value || 'ALL';

    let filtered = sites;
    if (filterVal === 'HEALTHY') filtered = sites.filter(s => (s.activeGrossMargin || 0) >= 20);
    else if (filterVal === 'MODERATE') filtered = sites.filter(s => (s.activeGrossMargin || 0) >= 5 && (s.activeGrossMargin || 0) < 20);
    else if (filterVal === 'CRITICAL') filtered = sites.filter(s => (s.activeGrossMargin || 0) < 5);

    if (!filtered || filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="py-6 text-center text-gray-500">No sites found matching profitability filter "${filterVal}".</td></tr>`;
        return;
    }

    const displayLimit = 200;
    const renderItems = filtered.slice(0, displayLimit);

    tbody.innerHTML = renderItems.map(s => {
        let statusBadge = '';
        const margin = s.activeGrossMargin || 0;
        if (margin >= 20) {
            statusBadge = `<span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">Healthy (&ge;20%)</span>`;
        } else if (margin >= 5) {
            statusBadge = `<span class="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">Moderate (5-20%)</span>`;
        } else {
            statusBadge = `<span class="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">Critical (&lt;5%)</span>`;
        }

        return `
            <tr class="hover:bg-gray-800/40 transition">
                <td class="py-3 px-4">
                    <button onclick="openSiteDetailModal('${s.siteCode}')" class="text-left group/btn focus:outline-none" title="Click to view calculation breakdown">
                        <div class="text-white group-hover/btn:underline text-xs font-semibold flex items-center gap-1.5">
                            ${s.siteName} <i class="fa-solid fa-calculator text-[10px] text-gray-500 group-hover/btn:text-brand-400"></i>
                        </div>
                        <div class="text-brand-400 text-[10px] font-mono">${s.siteCode}</div>
                    </button>
                </td>
                <td class="py-3 px-4 font-medium text-gray-300">${s.region}</td>
                <td class="py-3 px-4 text-gray-400">${s.customerGroup}</td>
                <td class="py-3 px-4 text-right font-mono">${formatRupee(s.activeBilling)}</td>
                <td class="py-3 px-4 text-right font-mono text-red-400">${formatRupee(s.activeExpense)}</td>
                <td class="py-3 px-4 text-right font-mono text-purple-400">${formatRupee(s.activeConsumption)}</td>
                <td class="py-3 px-4 text-right font-mono font-bold ${s.activeNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                    ${formatRupee(s.activeNetProfit)}
                </td>
                <td class="py-3 px-4 text-right font-mono font-bold ${margin >= 15 ? 'text-emerald-400' : margin >= 5 ? 'text-amber-400' : 'text-red-400'}">
                    ${margin}%
                </td>
                <td class="py-3 px-4 text-center">${statusBadge}</td>
            </tr>
        `;
    }).join('');

    // Render the 3 Advanced Financial Analyses
    renderCostStructureAnalysis(filtered);
    renderProfitParetoAnalysis(filtered);
    renderPortfolioBenchmarkAnalysis(filtered);
};

/** ── Helper 1: Cost Structure Analysis ───────────────────────────── */
function renderCostStructureAnalysis(sites) {
    const container = document.getElementById('costStructureContainer');
    if (!container) return;

    if (!sites || sites.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-xs py-4 text-center">No site records.</div>';
        return;
    }

    const rows = sites.slice(0, 200).map(s => {
        const totalCost = (s.activeExpense || 0) + (s.activeConsumption || 0);
        const laborPct  = totalCost > 0 ? Number(((s.activeExpense / totalCost) * 100).toFixed(1)) : 0;
        const matPct    = totalCost > 0 ? Number(((s.activeConsumption / totalCost) * 100).toFixed(1)) : 0;

        let costProfile = '';
        if (laborPct >= 75) costProfile = '<span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">Labor-Heavy (&ge;75%)</span>';
        else if (matPct >= 25) costProfile = '<span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">Material-Intensive (&ge;25%)</span>';
        else costProfile = '<span class="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">Balanced Cost</span>';

        return `
            <tr class="hover:bg-gray-800/40 transition">
                <td class="py-2.5 px-3 font-mono">
                    <button onclick="openSiteDetailModal('${s.siteCode}')" class="text-left hover:underline">
                        <div class="font-bold text-white">${s.siteName}</div>
                        <div class="text-brand-400 font-mono text-[10px]">${s.siteCode}</div>
                    </button>
                </td>
                <td class="py-2.5 px-3 text-gray-300">${s.region}</td>
                <td class="py-2.5 px-3 text-right font-mono">${formatRupee(s.activeBilling)}</td>
                <td class="py-2.5 px-3 text-right font-mono text-red-400">${formatRupee(s.activeExpense)} (${laborPct}%)</td>
                <td class="py-2.5 px-3 text-right font-mono text-purple-400">${formatRupee(s.activeConsumption)} (${matPct}%)</td>
                <td class="py-2.5 px-3 text-right font-mono font-bold text-amber-300">${formatRupee(totalCost)}</td>
                <td class="py-2.5 px-3 text-center">${costProfile}</td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="overflow-auto max-h-[70vh] rounded-xl border border-gray-800/80">
            <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-gray-950 text-gray-400 uppercase tracking-wider text-[10px] sticky top-0 z-10 shadow-md border-b border-gray-800">
                    <tr>
                        <th class="py-2 px-3 bg-gray-950">Site Code & Name</th>
                        <th class="py-2 px-3 bg-gray-950">Region</th>
                        <th class="py-2 px-3 bg-gray-950 text-right">Billing</th>
                        <th class="py-2 px-3 bg-gray-950 text-right">Manpower Exp (Labor %)</th>
                        <th class="py-2 px-3 bg-gray-950 text-right">Consumption (Material %)</th>
                        <th class="py-2 px-3 bg-gray-950 text-right">Total Operating Cost</th>
                        <th class="py-2 px-3 bg-gray-950 text-center">Cost Driver Tag</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-800/40 text-gray-300">
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

/** ── Helper 2: Profit Pareto Analysis ───────────────────────────── */
function renderProfitParetoAnalysis(sites) {
    const container = document.getElementById('profitParetoContainer');
    if (!container) return;

    if (!sites || sites.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-xs py-4 text-center">No site records.</div>';
        return;
    }

    const sortedByProfit = [...sites].sort((a, b) => b.activeNetProfit - a.activeNetProfit);
    const topEngines = sortedByProfit.filter(s => (s.activeGrossMargin || 0) >= 20);
    const stable     = sortedByProfit.filter(s => (s.activeGrossMargin || 0) >= 5 && (s.activeGrossMargin || 0) < 20);
    const lossDrag   = sortedByProfit.filter(s => s.activeNetProfit < 0 || (s.activeGrossMargin || 0) < 5);

    const renderCardList = (siteList, title, colorClass, iconClass, description) => `
        <div class="bg-gray-900/80 rounded-xl p-4 border border-gray-800 space-y-3">
            <div class="flex items-center justify-between border-b border-gray-800 pb-2">
                <h5 class="font-bold text-xs ${colorClass} flex items-center gap-1.5">
                    <i class="${iconClass}"></i> ${title} (${siteList.length})
                </h5>
                <span class="text-[10px] text-gray-500 font-mono">${siteList.length} Sites</span>
            </div>
            <p class="text-[11px] text-gray-400">${description}</p>
            <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                ${siteList.length === 0 ? '<div class="text-gray-500 text-[11px] italic">No sites in this tier.</div>' :
                    siteList.slice(0, 10).map(s => `
                        <button onclick="openSiteDetailModal('${s.siteCode}')" class="w-full text-left p-2 rounded bg-gray-950/60 hover:bg-gray-800 transition flex items-center justify-between text-xs group">
                            <div>
                                <span class="font-bold text-white group-hover:underline block">${s.siteName}</span>
                                <span class="text-[11px] text-brand-400 font-mono block">${s.siteCode} · ${s.region}</span>
                            </div>
                            <div class="text-right font-mono">
                                <span class="font-bold ${s.activeNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} block">${formatRupee(s.activeNetProfit)}</span>
                                <span class="text-[10px] text-gray-500 block">${s.activeGrossMargin}% margin</span>
                            </div>
                        </button>
                    `).join('')
                }
            </div>
        </div>
    `;

    container.innerHTML = `
        ${renderCardList(topEngines, 'Core Profit Engines', 'text-emerald-400', 'fa-solid fa-rocket', 'Top margin sites generating maximum organizational net cash flow.')}
        ${renderCardList(stable, 'Stable Performers', 'text-amber-400', 'fa-solid fa-scale-balanced', 'Acceptable margin sites maintaining positive net operational profit.')}
        ${renderCardList(lossDrag, 'Loss Drag / Cash Drain', 'text-red-400', 'fa-solid fa-triangle-exclamation', 'Sites with margin &lt; 5% or negative net profit requiring urgent review.')}
    `;
}

/** ── Helper 3: Portfolio Benchmark Analysis ─────────────────────── */
function renderPortfolioBenchmarkAnalysis(sites) {
    const container = document.getElementById('portfolioBenchmarkContainer');
    if (!container) return;

    if (!sites || sites.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-xs py-4 text-center">No site records.</div>';
        return;
    }

    const totalBill = sites.reduce((t, s) => t + s.activeBilling, 0);
    const totalCost = sites.reduce((t, s) => t + (s.activeExpense + s.activeConsumption), 0);
    const avgBillPerSite = Math.round(totalBill / sites.length);
    const avgCostPerSite = Math.round(totalCost / sites.length);

    const rows = sites.slice(0, 200).map(s => {
        const sCost = s.activeExpense + s.activeConsumption;
        const billDiff = s.activeBilling - avgBillPerSite;
        const costDiff = sCost - avgCostPerSite;

        let statusTag = '';
        if (s.activeBilling < avgBillPerSite && sCost > avgCostPerSite) {
            statusTag = '<span class="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold">Low Revenue / High Cost</span>';
        } else if (s.activeBilling >= avgBillPerSite && sCost <= avgCostPerSite) {
            statusTag = '<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">Top Outperformer</span>';
        } else if (s.activeBilling >= avgBillPerSite) {
            statusTag = '<span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">High Scale Site</span>';
        } else {
            statusTag = '<span class="px-2 py-0.5 rounded bg-gray-800 text-gray-300">Small Scale Site</span>';
        }

        return `
            <tr class="hover:bg-gray-800/40 transition">
                <td class="py-2.5 px-3 font-mono">
                    <button onclick="openSiteDetailModal('${s.siteCode}')" class="text-left hover:underline">
                        <div class="font-bold text-white">${s.siteName}</div>
                        <div class="text-brand-400 font-mono text-[10px]">${s.siteCode}</div>
                    </button>
                </td>
                <td class="py-2.5 px-3 text-gray-300">${s.region}</td>
                <td class="py-2.5 px-3 text-right font-mono">${formatRupee(s.activeBilling)}</td>
                <td class="py-2.5 px-3 text-right font-mono ${billDiff >= 0 ? 'text-emerald-400' : 'text-amber-400'}">
                    ${billDiff >= 0 ? '+' : ''}${formatRupee(billDiff)}
                </td>
                <td class="py-2.5 px-3 text-right font-mono text-purple-400">${formatRupee(sCost)}</td>
                <td class="py-2.5 px-3 text-right font-mono ${costDiff <= 0 ? 'text-emerald-400' : 'text-red-400'}">
                    ${costDiff >= 0 ? '+' : ''}${formatRupee(costDiff)}
                </td>
                <td class="py-2.5 px-3 text-center">${statusTag}</td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="mb-3 text-xs text-gray-400 flex flex-wrap items-center justify-between gap-2">
            <span>Portfolio Averages: Billing = <strong class="text-white">${formatRupee(avgBillPerSite)}</strong> / site | Operating Cost = <strong class="text-amber-300">${formatRupee(avgCostPerSite)}</strong> / site</span>
            <span class="text-[11px] text-gray-500">Variance = Site Metric − Portfolio Avg</span>
        </div>
        <div class="overflow-auto max-h-[70vh] rounded-xl border border-gray-800/80">
            <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-gray-950 text-gray-400 uppercase tracking-wider text-[10px] sticky top-0 z-10 shadow-md border-b border-gray-800">
                    <tr>
                        <th class="py-2 px-3 bg-gray-950">Site Code & Name</th>
                        <th class="py-2 px-3 bg-gray-950">Region</th>
                        <th class="py-2 px-3 bg-gray-950 text-right">Site Billing</th>
                        <th class="py-2 px-3 bg-gray-950 text-right">Revenue Variance vs Avg</th>
                        <th class="py-2 px-3 bg-gray-950 text-right">Total Operating Cost</th>
                        <th class="py-2 px-3 bg-gray-950 text-right">Cost Variance vs Avg</th>
                        <th class="py-2 px-3 bg-gray-950 text-center">Benchmark Diagnosis</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-800/40 text-gray-300">
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * REPORT 3: Management Hierarchy Report
 */
window.renderHierarchyReport = function(sites) {
    const container = document.getElementById('hierarchyContainer');
    if (!container) return;

    if (!sites || sites.length === 0) {
        container.innerHTML = `<div class="glass-panel p-8 text-center text-gray-400">No site records found.</div>`;
        return;
    }

    // Group by SR MANAGER -> MANAGER
    const srMap = {};
    sites.forEach(s => {
        const sr = s.srManager || 'Unassigned Sr Manager';
        const mgr = s.manager || 'Unassigned Manager';

        if (!srMap[sr]) srMap[sr] = {};
        if (!srMap[sr][mgr]) srMap[sr][mgr] = [];

        srMap[sr][mgr].push(s);
    });

    let html = '';

    Object.keys(srMap).sort().forEach(srName => {
        const mgrGroup = srMap[srName];
        let srTotalBilling = 0;
        let srTotalExpense = 0;
        let srTotalConsumption = 0;
        let srSiteCount = 0;

        Object.values(mgrGroup).forEach(siteList => {
            siteList.forEach(s => {
                srTotalBilling += s.activeBilling;
                srTotalExpense += s.activeExpense;
                srTotalConsumption += s.activeConsumption;
                srSiteCount++;
            });
        });

        const srNetProfit = srTotalBilling - (srTotalExpense + srTotalConsumption);
        const srMargin = srTotalBilling > 0 ? Number(((srNetProfit / srTotalBilling) * 100).toFixed(2)) : 0;

        html += `
            <div class="glass-panel rounded-xl overflow-hidden border border-gray-800">
                <!-- Sr Manager Banner -->
                <div class="bg-gradient-to-r from-indigo-950/80 to-gray-900 p-4 border-b border-gray-800 flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-base">
                            <i class="fa-solid fa-user-tie"></i>
                        </div>
                        <div>
                            <h4 class="text-base font-bold text-white flex items-center gap-2">
                                SR MANAGER: ${srName}
                                <span class="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                                    ${srSiteCount} Sites
                                </span>
                            </h4>
                            <p class="text-xs text-gray-400">Managing ${Object.keys(mgrGroup).length} Managers</p>
                        </div>
                    </div>

                    <div class="flex items-center space-x-6 text-xs">
                        <div>
                            <span class="text-gray-400 block">Billing</span>
                            <span class="font-mono font-bold text-white text-sm">${formatRupee(srTotalBilling)}</span>
                        </div>
                        <div>
                            <span class="text-gray-400 block">Total Expenses</span>
                            <span class="font-mono font-bold text-red-400 text-sm">${formatRupee(srTotalExpense + srTotalConsumption)}</span>
                        </div>
                        <div>
                            <span class="text-gray-400 block">Gross Margin</span>
                            <span class="font-mono font-bold ${srMargin >= 15 ? 'text-emerald-400' : 'text-amber-400'} text-sm">${srMargin}%</span>
                        </div>
                    </div>
                </div>

                <!-- Managers Table under Sr Manager -->
                <div class="p-4 space-y-4">
        `;

        Object.keys(mgrGroup).sort().forEach(mgrName => {
            const mgrSites = mgrGroup[mgrName];
            const mgrBilling = mgrSites.reduce((sum, s) => sum + s.activeBilling, 0);
            const mgrExpense = mgrSites.reduce((sum, s) => sum + s.activeExpense, 0);
            const mgrConsumption = mgrSites.reduce((sum, s) => sum + s.activeConsumption, 0);
            const mgrNet = mgrBilling - (mgrExpense + mgrConsumption);
            const mgrMargin = mgrBilling > 0 ? Number(((mgrNet / mgrBilling) * 100).toFixed(2)) : 0;

            html += `
                <div class="bg-gray-900/60 rounded-lg p-3 border border-gray-800 space-y-2">
                    <div class="flex items-center justify-between text-xs border-b border-gray-800 pb-2">
                        <div class="font-bold text-gray-200 flex items-center gap-2">
                            <i class="fa-solid fa-user-gear text-brand-400"></i>
                            MANAGER: ${mgrName}
                            <span class="text-[11px] font-normal text-gray-400">(${mgrSites.length} sites)</span>
                        </div>
                        <div class="flex items-center space-x-4 font-mono text-xs">
                            <span class="text-gray-300">Billing: <strong class="text-white">${formatRupee(mgrBilling)}</strong></span>
                            <span class="text-purple-400">Cons: <strong>${formatRupee(mgrConsumption)}</strong></span>
                            <span class="${mgrMargin >= 15 ? 'text-emerald-400' : 'text-amber-400'} font-bold">Margin: ${mgrMargin}%</span>
                        </div>
                    </div>

                    <div class="overflow-auto max-h-[50vh] rounded-xl border border-gray-800/80">
                        <table class="w-full text-left text-[11px] border-collapse">
                            <thead class="bg-gray-950 text-gray-500 uppercase tracking-wider sticky top-0 z-10 shadow-md border-b border-gray-800">
                                <tr>
                                    <th class="py-1.5 px-2 bg-gray-950">Site</th>
                                    <th class="py-1.5 px-2 bg-gray-950">Assistant Manager</th>
                                    <th class="py-1.5 px-2 bg-gray-950">Supervisor</th>
                                    <th class="py-1.5 px-2 bg-gray-950 text-right">Billing</th>
                                    <th class="py-1.5 px-2 bg-gray-950 text-right">Manpower Exp</th>
                                    <th class="py-1.5 px-2 bg-gray-950 text-right">Consumption</th>
                                    <th class="py-1.5 px-2 bg-gray-950 text-right">Margin %</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-800/40 text-gray-300">
            `;

            mgrSites.forEach(s => {
                html += `
                    <tr>
                        <td class="py-1.5 px-2 font-mono">
                            <button onclick="openSiteDetailModal('${s.siteCode}')" class="text-left hover:underline focus:outline-none" title="Click for calculation audit">
                                <div class="font-semibold text-white">${s.siteName}</div>
                                <div class="text-brand-400 font-mono text-[10px] flex items-center gap-1">${s.siteCode} <i class="fa-solid fa-calculator text-[9px] text-gray-500"></i></div>
                            </button>
                        </td>
                        <td class="py-1.5 px-2 text-gray-400">${s.assistantManager}</td>
                        <td class="py-1.5 px-2 text-gray-400">${s.supervisor}</td>
                        <td class="py-1.5 px-2 text-right font-mono">${formatRupee(s.activeBilling)}</td>
                        <td class="py-1.5 px-2 text-right font-mono text-red-400">${formatRupee(s.activeExpense)}</td>
                        <td class="py-1.5 px-2 text-right font-mono text-purple-400">${formatRupee(s.activeConsumption)}</td>
                        <td class="py-1.5 px-2 text-right font-mono font-bold ${s.activeGrossMargin >= 15 ? 'text-emerald-400' : 'text-amber-400'}">${s.activeGrossMargin}%</td>
                    </tr>
                `;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
};

/**
 * REPORT 4: Monthly Trends Report
 */
window.renderMonthlyTrendsReport = function(sites) {
    const tbody = document.getElementById('tblMonthlyTrendsBody');
    if (!tbody) return;

    // Dynamically discover all month keys present in the loaded dataset
    const monthsSet = new Set(window.MONTH_NAMES || []);
    sites.forEach(s => {
        if (s.monthlyMetrics) {
            Object.keys(s.monthlyMetrics).forEach(m => monthsSet.add(m));
        }
    });

    const longNames = {
        'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
        'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
        'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
    };

    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const cleanMonthName = (mStr) => {
        if (!mStr || typeof mStr !== 'string') return "";
        const clean = mStr.trim().toLowerCase();
        if (clean.startsWith('jan')) return 'Jan';
        if (clean.startsWith('feb')) return 'Feb';
        if (clean.startsWith('mar')) return 'Mar';
        if (clean.startsWith('apr')) return 'Apr';
        if (clean.startsWith('may')) return 'May';
        if (clean.startsWith('jun')) return 'Jun';
        if (clean.startsWith('jul')) return 'Jul';
        if (clean.startsWith('aug')) return 'Aug';
        if (clean.startsWith('sep')) return 'Sep';
        if (clean.startsWith('oct')) return 'Oct';
        if (clean.startsWith('nov')) return 'Nov';
        if (clean.startsWith('dec')) return 'Dec';
        return mStr;
    };

    const months = Array.from(monthsSet).filter(Boolean).sort((a, b) => {
        try {
            const partsA = String(a).split(' ');
            const partsB = String(b).split(' ');
            const yearA = parseInt(partsA[1]) || 2026;
            const yearB = parseInt(partsB[1]) || 2026;
            if (yearA !== yearB) return yearA - yearB;
            
            const idxA = monthOrder.indexOf(cleanMonthName(partsA[0]));
            const idxB = monthOrder.indexOf(cleanMonthName(partsB[0]));
            return idxA - idxB;
        } catch (err) {
            console.error("Sorting error:", err);
            return 0;
        }
    }).map(m => {
        try {
            const parts = String(m).split(' ');
            const shortName = cleanMonthName(parts[0]);
            const yearStr = parts[1] ? ' ' + parts[1] : '';
            const label = (longNames[shortName] || shortName) + yearStr;
            return { key: m, label: label };
        } catch (err) {
            return { key: m, label: String(m) };
        }
    });

    const monthlyTotals = months.map(({ key, label }) => {
        let billing = 0;
        let expense = 0;
        let consumption = 0;

        sites.forEach(s => {
            const mData = s.monthlyMetrics ? s.monthlyMetrics[key] : null;
            if (mData) {
                billing     += mData.billing     || 0;
                expense     += mData.expense     || 0;
                consumption += mData.consumption || 0;
            }
        });

        const profit = billing - (expense + consumption);
        const margin = billing > 0 ? Number(((profit / billing) * 100).toFixed(2)) : 0;

        return { key, label, billing, expense, consumption, profit, margin };
    });

    // Only render months that have at least some data
    const activeMonths = monthlyTotals.filter(mt => mt.billing > 0 || mt.expense > 0 || mt.consumption > 0);

    if (activeMonths.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-gray-500 italic">
            <i class="fa-solid fa-circle-info mr-2 text-gray-600"></i>
            No monthly data found. Make sure your file has month-specific billing/expense/consumption columns.
        </td></tr>`;
        return;
    }

    tbody.innerHTML = activeMonths.map(mt => `
        <tr class="hover:bg-gray-800/40 transition">
            <td class="py-3 px-4 font-bold text-white">${mt.label}</td>
            <td class="py-3 px-4 text-right font-mono font-semibold text-white">${formatRupee(mt.billing)}</td>
            <td class="py-3 px-4 text-right font-mono text-red-400">${formatRupee(mt.expense)}</td>
            <td class="py-3 px-4 text-right font-mono text-purple-400">${formatRupee(mt.consumption)}</td>
            <td class="py-3 px-4 text-right font-mono font-bold ${mt.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}">${formatRupee(mt.profit)}</td>
            <td class="py-3 px-4 text-right font-mono font-bold ${mt.margin >= 15 ? 'text-emerald-400' : mt.margin >= 5 ? 'text-amber-400' : 'text-red-400'}">${mt.margin}%</td>
        </tr>
    `).join('');

    // Trigger Chart update
    if (window.updateMonthlyTrendsChart) {
        window.updateMonthlyTrendsChart(activeMonths);
    }
};

/**
 * ── INTERACTIVE SITE DETAIL & CALCULATION AUDIT MODAL ────────────────
 */
window.openSiteDetailModal = function(siteCode) {
    // 1. Search filteredDataset first (which has activeBilling/Expense/Consumption), then activeDataset
    const dataset = (window.filteredDataset && window.filteredDataset.length > 0)
        ? window.filteredDataset
        : (window.activeDataset || []);

    let site = dataset.find(s => 
        String(s.siteCode).trim().toLowerCase() === String(siteCode).trim().toLowerCase() ||
        String(s.siteName).trim().toLowerCase() === String(siteCode).trim().toLowerCase()
    );

    if (!site && window.activeDataset) {
        site = window.activeDataset.find(s => 
            String(s.siteCode).trim().toLowerCase() === String(siteCode).trim().toLowerCase() ||
            String(s.siteName).trim().toLowerCase() === String(siteCode).trim().toLowerCase()
        );
    }

    if (!site) {
        alert("Site details not found for " + siteCode);
        return;
    }

    const mName = selMonth !== 'ALL' 
        ? `Month: ${selMonth}${/20\d{2}/.test(selMonth) ? '' : ' 2026'}` 
        : 'Jan–Aug 2026 (Aggregated)';

    // 2. Compute b, e, c reliably
    let b = 0, e = 0, c = 0;

    if (selMonth !== 'ALL' && site.monthlyMetrics && site.monthlyMetrics[selMonth]) {
        b = site.monthlyMetrics[selMonth].billing || 0;
        e = site.monthlyMetrics[selMonth].expense || 0;
        c = site.monthlyMetrics[selMonth].consumption || 0;
    } else {
        // Fallback: active metrics -> total metrics -> sum of monthlyMetrics
        b = site.activeBilling !== undefined && site.activeBilling > 0 ? site.activeBilling : (site.totalBilling || 0);
        e = site.activeExpense !== undefined && site.activeExpense > 0 ? site.activeExpense : (site.totalExpense || 0);
        c = site.activeConsumption !== undefined && site.activeConsumption > 0 ? site.activeConsumption : (site.totalConsumption || 0);

        if (b === 0 && e === 0 && c === 0 && site.monthlyMetrics) {
            Object.values(site.monthlyMetrics).forEach(m => {
                b += m.billing || 0;
                e += m.expense || 0;
                c += m.consumption || 0;
            });
        }
    }

    const totalCost = e + c;
    const profit = b - totalCost;
    const marginPct = b > 0 ? ((profit / b) * 100).toFixed(2) : '0.00';
    const consPct   = b > 0 ? ((c / b) * 100).toFixed(2) : '0.00';
    const regShare  = (site.activeRegionTotalConsumption || site.totalConsumption) > 0 
        ? ((c / (site.activeRegionTotalConsumption || site.totalConsumption)) * 100).toFixed(2) 
        : '0.00';

    document.getElementById('modalSiteTitle').innerText = `${site.siteCode} — ${site.siteName}`;
    document.getElementById('modalSiteSubtitle').innerText = `Region: ${site.region} | Customer: ${site.customerGroup} | Manager: ${site.manager} | ${mName}`;

    let healthBadge = '';
    if (parseFloat(marginPct) >= 20)      healthBadge = '<span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs">Healthy Margin (&ge;20%)</span>';
    else if (parseFloat(marginPct) >= 5)  healthBadge = '<span class="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs">Moderate Margin (5–20%)</span>';
    else                                   healthBadge = '<span class="px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs">Critical Margin (&lt;5%)</span>';

    // Compute Advanced Executive Analysis Metrics for this site
    const allSites = (window.filteredDataset && window.filteredDataset.length > 0) ? window.filteredDataset : (window.activeDataset || []);
    const totalPortfolioBill = allSites.reduce((sum, s) => sum + (s.activeBilling || 0), 0);
    const totalPortfolioCost = allSites.reduce((sum, s) => sum + ((s.activeExpense || 0) + (s.activeConsumption || 0)), 0);
    const siteCount = allSites.length || 1;
    const portfolioAvgBill = Math.round(totalPortfolioBill / siteCount);
    const portfolioAvgCost = Math.round(totalPortfolioCost / siteCount);

    const billVariance = b - portfolioAvgBill;
    const costVariance = totalCost - portfolioAvgCost;
    const laborSharePct = totalCost > 0 ? ((e / totalCost) * 100).toFixed(1) : '0.0';
    const matSharePct   = totalCost > 0 ? ((c / totalCost) * 100).toFixed(1) : '0.0';

    let costDriverTag = '';
    if (parseFloat(laborSharePct) >= 75) costDriverTag = 'Labor-Heavy (≥75%)';
    else if (parseFloat(matSharePct) >= 25) costDriverTag = 'Material-Intensive (≥25%)';
    else costDriverTag = 'Balanced Cost';

    let benchmarkTag = '';
    if (b < portfolioAvgBill && totalCost > portfolioAvgCost) benchmarkTag = 'Low Revenue / High Cost';
    else if (b >= portfolioAvgBill && totalCost <= portfolioAvgCost) benchmarkTag = 'Top Outperformer';
    else if (b >= portfolioAvgBill) benchmarkTag = 'High Scale Site';
    else benchmarkTag = 'Small Scale Site';

    let html = `
        <!-- Status & Hierarchy Banner -->
        <div class="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-gray-900 border border-gray-800">
            <div>
                <span class="text-[11px] text-gray-400 block uppercase font-bold tracking-wider">Management Hierarchy</span>
                <span class="text-xs text-gray-200">
                    Sr Manager: <strong class="text-white">${site.srManager}</strong> &nbsp;|&nbsp;
                    Manager: <strong class="text-white">${site.manager}</strong> &nbsp;|&nbsp;
                    AM: <strong>${site.assistantManager}</strong> &nbsp;|&nbsp;
                    Supervisor: <strong>${site.supervisor}</strong>
                </span>
            </div>
            <div>${healthBadge}</div>
        </div>

        <!-- Numbers KPI Summary Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-gray-900/80 p-3.5 rounded-xl border border-gray-800">
                <span class="text-[11px] text-gray-400 block flex items-center justify-between">
                    Billing (B)
                    <button onclick="openMetricGuideModal('billing')" class="text-gray-500 hover:text-amber-400" title="Click for formula"><i class="fa-solid fa-circle-question"></i></button>
                </span>
                <span class="text-base font-bold font-mono text-white mt-1 block">${formatRupee(b)}</span>
            </div>
            <div class="bg-gray-900/80 p-3.5 rounded-xl border border-gray-800">
                <span class="text-[11px] text-gray-400 block flex items-center justify-between">
                    Manpower Exp (E)
                    <button onclick="openMetricGuideModal('expense')" class="text-gray-500 hover:text-amber-400" title="Click for formula"><i class="fa-solid fa-circle-question"></i></button>
                </span>
                <span class="text-base font-bold font-mono text-red-400 mt-1 block">${formatRupee(e)}</span>
            </div>
            <div class="bg-gray-900/80 p-3.5 rounded-xl border border-gray-800">
                <span class="text-[11px] text-gray-400 block flex items-center justify-between">
                    Consumption (C)
                    <button onclick="openMetricGuideModal('consumption')" class="text-gray-500 hover:text-amber-400" title="Click for formula"><i class="fa-solid fa-circle-question"></i></button>
                </span>
                <span class="text-base font-bold font-mono text-purple-400 mt-1 block">${formatRupee(c)}</span>
            </div>
            <div class="bg-gray-900/80 p-3.5 rounded-xl border border-gray-800">
                <span class="text-[11px] text-gray-400 block flex items-center justify-between">
                    Net Profit
                    <button onclick="openMetricGuideModal('netprofit')" class="text-gray-500 hover:text-amber-400" title="Click for formula"><i class="fa-solid fa-circle-question"></i></button>
                </span>
                <span class="text-base font-bold font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'} mt-1 block">${formatRupee(profit)}</span>
            </div>
        </div>

        <!-- STEP-BY-STEP CALCULATION AUDIT BOX -->
        <div class="bg-gray-900/90 rounded-xl p-4 border border-brand-500/30 space-y-3">
            <h4 class="text-xs font-extrabold text-brand-300 uppercase tracking-wider flex items-center justify-between">
                <span class="flex items-center gap-2"><i class="fa-solid fa-square-root-variable text-brand-400"></i> Exact Calculation Audit for ${site.siteCode} (${mName})</span>
                <span class="text-[10px] text-gray-400 font-normal">All Metric & Benchmark Formulas</span>
            </h4>

            <div class="space-y-2 text-xs divide-y divide-gray-800/60 font-mono">
                <div class="pt-2 flex flex-wrap justify-between items-center">
                    <span class="text-gray-400 font-sans">1. Total Cost (Manpower Exp + Consumption):</span>
                    <span class="text-white">${formatRupee(e)} + ${formatRupee(c)} = <strong class="text-amber-300">${formatRupee(totalCost)}</strong></span>
                </div>
                <div class="pt-2 flex flex-wrap justify-between items-center">
                    <span class="text-gray-400 font-sans">2. Net Profit (Billing − Total Cost):</span>
                    <span class="text-white">${formatRupee(b)} − ${formatRupee(totalCost)} = <strong class="${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}">${formatRupee(profit)}</strong></span>
                </div>
                <div class="pt-2 flex flex-wrap justify-between items-center">
                    <span class="text-gray-400 font-sans">3. Gross Margin % (Net Profit ÷ Billing × 100):</span>
                    <span class="text-white">(${formatRupee(profit)} ÷ ${formatRupee(b)}) × 100 = <strong class="${parseFloat(marginPct) >= 15 ? 'text-emerald-400' : 'text-amber-400'}">${marginPct}%</strong></span>
                </div>
                <div class="pt-2 flex flex-wrap justify-between items-center">
                    <span class="text-gray-400 font-sans">4. Site Consumption / Billing % (Consumption ÷ Billing × 100):</span>
                    <span class="text-white">(${formatRupee(c)} ÷ ${formatRupee(b)}) × 100 = <strong class="${parseFloat(consPct) >= 7 ? 'text-red-400' : 'text-emerald-400'}">${consPct}% ${parseFloat(consPct) >= 7 ? '⚠️ (&ge;7% Threshold Alert)' : ''}</strong></span>
                </div>
                <div class="pt-2 flex flex-wrap justify-between items-center">
                    <span class="text-gray-400 font-sans">5. Region Share % (Site Cons ÷ Region Total Cons × 100):</span>
                    <span class="text-white">(${formatRupee(c)} ÷ ${formatRupee(site.activeRegionTotalConsumption || c)}) × 100 = <strong class="text-indigo-300">${regShare}%</strong></span>
                </div>

                <!-- ADVANCED EXECUTIVE FINANCIAL CALCULATIONS -->
                <div class="pt-2.5 flex flex-wrap justify-between items-center border-t border-purple-500/30">
                    <span class="text-purple-300 font-sans font-semibold">6. Cost Structure Share (Labor % & Material %):</span>
                    <span class="text-white">
                        Labor: (${formatRupee(e)} ÷ ${formatRupee(totalCost)}) × 100 = <strong>${laborSharePct}%</strong> | 
                        Material: (${formatRupee(c)} ÷ ${formatRupee(totalCost)}) × 100 = <strong>${matSharePct}%</strong> 
                        <span class="text-purple-300 text-[11px] ml-1 font-sans">(${costDriverTag})</span>
                    </span>
                </div>
                <div class="pt-2 flex flex-wrap justify-between items-center">
                    <span class="text-indigo-300 font-sans font-semibold">7. Portfolio Billing Variance (Site Billing − Portfolio Avg Billing):</span>
                    <span class="text-white">
                        ${formatRupee(b)} − ${formatRupee(portfolioAvgBill)} = 
                        <strong class="${billVariance >= 0 ? 'text-emerald-400' : 'text-amber-400'}">${billVariance >= 0 ? '+' : ''}${formatRupee(billVariance)}</strong>
                    </span>
                </div>
                <div class="pt-2 flex flex-wrap justify-between items-center">
                    <span class="text-indigo-300 font-sans font-semibold">8. Portfolio Cost Variance (Site Operating Cost − Portfolio Avg Cost):</span>
                    <span class="text-white">
                        ${formatRupee(totalCost)} − ${formatRupee(portfolioAvgCost)} = 
                        <strong class="${costVariance <= 0 ? 'text-emerald-400' : 'text-red-400'}">${costVariance >= 0 ? '+' : ''}${formatRupee(costVariance)}</strong>
                        <span class="text-gray-400 text-[11px] ml-1 font-sans">(${benchmarkTag})</span>
                    </span>
                </div>
            </div>
        </div>

        <!-- Month-by-Month Matrix Table -->
        <div class="space-y-2">
            <h4 class="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-calendar-days text-amber-400"></i>
                Month-by-Month Performance History
            </h4>
            <div class="overflow-x-auto rounded-xl border border-gray-800">
                <table class="w-full text-left text-xs font-mono">
                    <thead class="bg-gray-900 text-gray-400 uppercase text-[10px]">
                        <tr>
                            <th class="py-2 px-3">Month</th>
                            <th class="py-2 px-3 text-right">Billing</th>
                            <th class="py-2 px-3 text-right">Manpower Exp</th>
                            <th class="py-2 px-3 text-right">Consumption</th>
                            <th class="py-2 px-3 text-right">Net Profit</th>
                            <th class="py-2 px-3 text-right">Margin %</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800/40 text-gray-300">
    `;

    const mKeys = site.monthlyMetrics ? Object.keys(site.monthlyMetrics) : [];
    const monthOrderList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const cleanMonthNameLocal = (mStr) => {
        if (!mStr || typeof mStr !== 'string') return "";
        const clean = mStr.trim().toLowerCase();
        if (clean.startsWith('jan')) return 'Jan';
        if (clean.startsWith('feb')) return 'Feb';
        if (clean.startsWith('mar')) return 'Mar';
        if (clean.startsWith('apr')) return 'Apr';
        if (clean.startsWith('may')) return 'May';
        if (clean.startsWith('jun')) return 'Jun';
        if (clean.startsWith('jul')) return 'Jul';
        if (clean.startsWith('aug')) return 'Aug';
        if (clean.startsWith('sep')) return 'Sep';
        if (clean.startsWith('oct')) return 'Oct';
        if (clean.startsWith('nov')) return 'Nov';
        if (clean.startsWith('dec')) return 'Dec';
        return mStr;
    };

    const sortedMKeys = mKeys.filter(Boolean).sort((a, b) => {
        const partsA = String(a).split(' ');
        const partsB = String(b).split(' ');
        const yearA = parseInt(partsA[1]) || 2026;
        const yearB = parseInt(partsB[1]) || 2026;
        if (yearA !== yearB) return yearA - yearB;
        return monthOrderList.indexOf(cleanMonthNameLocal(partsA[0])) - monthOrderList.indexOf(cleanMonthNameLocal(partsB[0]));
    });

    const monthFull = { 
        Jan:'January', Feb:'February', Mar:'March', Apr:'April', May:'May', Jun:'June', 
        Jul:'July', Aug:'August', Sep:'September', Oct:'October', Nov:'November', Dec:'December' 
    };

    sortedMKeys.forEach(mKey => {
        const m = site.monthlyMetrics[mKey];
        if (m && (m.billing > 0 || m.expense > 0 || m.consumption > 0)) {
            const mProfit = m.billing - (m.expense + m.consumption);
            const mMargin = m.billing > 0 ? ((mProfit / m.billing) * 100).toFixed(2) : '0.00';
            
            const parts = mKey.split(' ');
            const shortName = cleanMonthNameLocal(parts[0]);
            const yearStr = parts[1] ? ' ' + parts[1] : '';
            const longLabel = (monthFull[shortName] || shortName) + yearStr;

            html += `
                <tr class="hover:bg-gray-900/60 transition">
                    <td class="py-2 px-3 font-sans font-bold text-white">${longLabel}</td>
                    <td class="py-2 px-3 text-right">${formatRupee(m.billing)}</td>
                    <td class="py-2 px-3 text-right text-red-400">${formatRupee(m.expense)}</td>
                    <td class="py-2 px-3 text-right text-purple-400">${formatRupee(m.consumption)}</td>
                    <td class="py-2 px-3 text-right font-bold ${mProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}">${formatRupee(mProfit)}</td>
                    <td class="py-2 px-3 text-right font-bold ${parseFloat(mMargin) >= 15 ? 'text-emerald-400' : 'text-amber-400'}">${mMargin}%</td>
                </tr>
            `;
        }
    });

    html += `
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 📖 FINANCIAL TERMINOLOGY GLOSSARY -->
        <div class="bg-gray-900/60 rounded-xl p-4 border border-gray-800 space-y-3 text-xs text-gray-300">
            <h4 class="font-bold text-indigo-300 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <i class="fa-solid fa-book-open text-indigo-400"></i>
                Financial Terminology &amp; Formula Explanations
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="bg-gray-950/80 p-3 rounded-lg border border-gray-800 space-y-1">
                    <span class="font-bold text-white block">💵 Billing (B)</span>
                    <p class="text-[11px] text-gray-400">Total gross revenue invoiced to the client for services rendered at this site.</p>
                </div>
                <div class="bg-gray-950/80 p-3 rounded-lg border border-gray-800 space-y-1">
                    <span class="font-bold text-red-400 block">👷 Manpower Expense (E)</span>
                    <p class="text-[11px] text-gray-400">Direct labor costs including supervisor pay, staff salaries, wages, and overtime deployed at this site.</p>
                </div>
                <div class="bg-gray-950/80 p-3 rounded-lg border border-gray-800 space-y-1">
                    <span class="font-bold text-purple-400 block">📦 Material Consumption (C)</span>
                    <p class="text-[11px] text-gray-400">Cost of physical inventory, raw materials, cleaning supplies, or spare parts consumed at this site.</p>
                </div>
                <div class="bg-gray-950/80 p-3 rounded-lg border border-gray-800 space-y-1">
                    <span class="font-bold text-emerald-400 block">💰 Net Profit</span>
                    <p class="text-[11px] text-gray-400">Money remaining after paying all manpower and material costs: <strong>Billing − (Expense + Consumption)</strong>.</p>
                </div>
                <div class="bg-gray-950/80 p-3 rounded-lg border border-gray-800 space-y-1 sm:col-span-2">
                    <span class="font-bold text-amber-400 block">📈 Gross Margin (%)</span>
                    <p class="text-[11px] text-gray-400">Percentage of revenue retained as net profit: <strong>(Net Profit ÷ Billing) × 100</strong>. Measures site operational efficiency. Healthy &ge; 20%, Moderate 5–20%, Critical &lt; 5%.</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById('siteDetailModalBody').innerHTML = html;
    document.getElementById('siteDetailModal').classList.remove('hidden');
};

window.closeSiteDetailModal = function() {
    const modal = document.getElementById('siteDetailModal');
    if (modal) modal.classList.add('hidden');
};

/**
 * ── METRIC FORMULA & DEFINITIONS GUIDE MODAL ─────────────────────────
 */
window.openMetricGuideModal = function(targetMetric = 'all') {
    const guideHtml = `
        <div class="space-y-4 text-xs text-gray-300">
            <!-- Billing -->
            <div class="p-3.5 rounded-xl bg-gray-900 border border-gray-800 space-y-1.5">
                <h4 class="font-bold text-white text-xs flex items-center gap-1.5">
                    <i class="fa-solid fa-file-invoice-dollar text-emerald-400"></i> 1. Billing (Gross Revenue)
                </h4>
                <p class="text-gray-300 leading-relaxed">
                    <strong>What it is:</strong> Total monetary amount invoiced to the client for contract services at a specific site.
                </p>
                <div class="bg-gray-950 p-2.5 rounded border border-gray-800 font-mono text-[11px] text-gray-300">
                    Billing = Invoiced Site Revenue for the selected period
                </div>
            </div>

            <!-- Manpower Expense -->
            <div class="p-3.5 rounded-xl bg-gray-900 border border-gray-800 space-y-1.5">
                <h4 class="font-bold text-red-400 text-xs flex items-center gap-1.5">
                    <i class="fa-solid fa-users"></i> 2. Manpower Expense (Direct Labor)
                </h4>
                <p class="text-gray-300 leading-relaxed">
                    <strong>What it is:</strong> Total labor cost required to operate the site, including worker wages, supervisor salaries, assistant manager allocations, and overtime.
                </p>
                <div class="bg-gray-950 p-2.5 rounded border border-gray-800 font-mono text-[11px] text-red-300">
                    Manpower Expense = Direct Labor Salaries + Wages + OT + Staff Allowances
                </div>
            </div>

            <!-- Material Consumption -->
            <div class="p-3.5 rounded-xl bg-gray-900 border border-gray-800 space-y-1.5">
                <h4 class="font-bold text-purple-400 text-xs flex items-center gap-1.5">
                    <i class="fa-solid fa-boxes-stacked"></i> 3. Material Consumption Value (Cons)
                </h4>
                <p class="text-gray-300 leading-relaxed">
                    <strong>What it is:</strong> Cost of raw materials, chemical supplies, spare parts, tools, or consumable inventory used up at the site during operations.
                </p>
                <div class="bg-gray-950 p-2.5 rounded border border-gray-800 font-mono text-[11px] text-purple-300">
                    Consumption Value = Inventory/Material Cost used at site
                </div>
            </div>

            <!-- Total Operating Cost & Net Profit -->
            <div class="p-3.5 rounded-xl bg-gray-900 border border-gray-800 space-y-1.5">
                <h4 class="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                    <i class="fa-solid fa-calculator"></i> 4. Total Operating Cost &amp; Net Profit
                </h4>
                <p class="text-gray-300 leading-relaxed">
                    <strong>Total Operating Cost:</strong> Combined expenses required to keep the site running ($\text{Manpower Exp} + \text{Material Consumption}$).
                </p>
                <p class="text-gray-300 leading-relaxed">
                    <strong>Net Profit:</strong> Revenue left over after covering all manpower and material costs. A negative net profit means the site is operating at a loss.
                </p>
                <div class="bg-gray-950 p-2.5 rounded border border-gray-800 font-mono text-[11px] text-emerald-300 space-y-1">
                    <div>Total Cost = Manpower Expense + Material Consumption</div>
                    <div>Net Profit = Billing − Total Operating Cost</div>
                </div>
            </div>

            <!-- Gross Margin % -->
            <div class="p-3.5 rounded-xl bg-gray-900 border border-gray-800 space-y-1.5">
                <h4 class="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                    <i class="fa-solid fa-chart-line"></i> 5. Gross Margin (%)
                </h4>
                <p class="text-gray-300 leading-relaxed">
                    <strong>What it is:</strong> The percentage of billing converted into net profit. Indicates operational profitability and pricing health.
                </p>
                <div class="bg-gray-950 p-2.5 rounded border border-gray-800 font-mono text-[11px] text-amber-300">
                    Gross Margin % = (Net Profit ÷ Billing) × 100
                </div>
                <div class="grid grid-cols-3 gap-2 text-[10px] font-bold mt-2">
                    <div class="p-2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-center">
                        <div>Healthy</div>
                        <div>&ge; 20% Margin</div>
                    </div>
                    <div class="p-2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-center">
                        <div>Moderate</div>
                        <div>5% – 20% Margin</div>
                    </div>
                    <div class="p-2 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-center">
                        <div>Critical</div>
                        <div>&lt; 5% Margin / Loss</div>
                    </div>
                </div>
            </div>

            <!-- Consumption / Billing % -->
            <div class="p-3.5 rounded-xl bg-gray-900 border border-gray-800 space-y-1.5">
                <h4 class="font-bold text-indigo-400 text-xs flex items-center gap-1.5">
                    <i class="fa-solid fa-triangle-exclamation"></i> 6. Consumption / Billing % (&ge;7% Alert Threshold)
                </h4>
                <p class="text-gray-300 leading-relaxed">
                    <strong>What it is:</strong> Tells you what percentage of site billing is spent on material consumption alone.
                </p>
                <div class="bg-gray-950 p-2.5 rounded border border-gray-800 font-mono text-[11px] text-indigo-300">
                    Consumption / Billing % = (Consumption Value ÷ Site Billing) × 100
                </div>
                <p class="text-[11px] text-amber-400 italic mt-1">
                    * If Consumption / Billing &ge; 7%, the site is flagged with a HIGH Consumption Alert so managers can investigate potential material waste or leakage.
                </p>
            </div>
        </div>
    `;

    document.getElementById('metricGuideModalBody').innerHTML = guideHtml;
    document.getElementById('metricGuideModal').classList.remove('hidden');
};

window.closeMetricGuideModal = function() {
    const modal = document.getElementById('metricGuideModal');
    if (modal) modal.classList.add('hidden');
};
