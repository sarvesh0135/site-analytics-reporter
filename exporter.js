/**
 * Multi-Sheet & Month-Wise Excel Exporter Module
 * Uses SheetJS to generate clean, executive Excel workbooks client-side.
 */

window.exportToExcel = function() {
    const sites = window.filteredDataset && window.filteredDataset.length > 0 
        ? window.filteredDataset 
        : window.activeDataset;

    if (!sites || sites.length === 0) {
        alert("No active dataset to export.");
        return;
    }

    const thresholdPct = parseFloat(document.getElementById('thresholdRange')?.value || '7.0');
    const activeMonth = window.selectedMonth || 'ALL';
    const monthTag = activeMonth !== 'ALL' ? `_${activeMonth}_2026` : '_Full_Year';

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // -------------------------------------------------------------
    // SHEET 1: Region High Consumption Sites (>7%)
    // -------------------------------------------------------------
    const calcMode = window.currentThresholdMode || 'REGION_SHARE';
    const highShareRows = sites.filter(s => {
        if (calcMode === 'EITHER') {
            return (s.activeRegionConsumptionSharePct >= thresholdPct || s.activeConsumptionToBillingPct >= thresholdPct);
        }
        return calcMode === 'REGION_SHARE' 
            ? (s.activeRegionConsumptionSharePct >= thresholdPct) 
            : (s.activeConsumptionToBillingPct >= thresholdPct);
    })
        .map(s => ({
            "S.No": s.sno,
            "Site Code": s.siteCode,
            "Region": s.region,
            "Site Name": s.siteName,
            "Customer Group": s.customerGroup,
            "Site Status": s.siteStatus,
            "Manager": s.manager,
            "Sr Manager": s.srManager,
            "Selected Month": activeMonth,
            "Billing": s.activeBilling,
            "Consumption Value": s.activeConsumption,
            "Region Total Consumption": s.activeRegionTotalConsumption,
            "Share of Region (%)": s.activeRegionConsumptionSharePct + "%",
            "Consumption / Billing (%)": s.activeConsumptionToBillingPct + "%",
            "Alert Level": `Exceeds ${thresholdPct}% Threshold`
        }));

    const ws1 = XLSX.utils.json_to_sheet(
        highShareRows.length > 0 
            ? highShareRows 
            : [{ "Status": `No sites exceed ${thresholdPct}% consumption share threshold for ${activeMonth}.` }]
    );
    XLSX.utils.book_append_sheet(wb, ws1, `High Consumption (>${thresholdPct}%)`);

    // -------------------------------------------------------------
    // SHEET 2: Region Summary Report
    // -------------------------------------------------------------
    const regionSummaryMap = {};
    sites.forEach(s => {
        if (!regionSummaryMap[s.region]) {
            regionSummaryMap[s.region] = {
                "Region": s.region,
                "Month": activeMonth,
                "Site Count": 0,
                "Billing": 0,
                "Manpower Expense": 0,
                "Consumption Value": 0
            };
        }
        regionSummaryMap[s.region]["Site Count"]++;
        regionSummaryMap[s.region]["Billing"] += s.activeBilling;
        regionSummaryMap[s.region]["Manpower Expense"] += s.activeExpense;
        regionSummaryMap[s.region]["Consumption Value"] += s.activeConsumption;
    });

    const regionSummaryRows = Object.values(regionSummaryMap).map(r => {
        const netProfit = r["Billing"] - (r["Manpower Expense"] + r["Consumption Value"]);
        const margin = r["Billing"] > 0 ? ((netProfit / r["Billing"]) * 100).toFixed(2) + "%" : "0%";
        return {
            ...r,
            "Net Profit": netProfit,
            "Gross Margin %": margin
        };
    });

    const ws2 = XLSX.utils.json_to_sheet(regionSummaryRows);
    XLSX.utils.book_append_sheet(wb, ws2, "Region Summary");

    // -------------------------------------------------------------
    // SHEET 3: Management Hierarchy Summary
    // -------------------------------------------------------------
    const hierarchyMap = {};
    sites.forEach(s => {
        const key = `${s.srManager} || ${s.manager}`;
        if (!hierarchyMap[key]) {
            hierarchyMap[key] = {
                "Sr Manager": s.srManager,
                "Manager": s.manager,
                "Month": activeMonth,
                "Site Count": 0,
                "Billing": 0,
                "Manpower Expense": 0,
                "Consumption Value": 0
            };
        }
        hierarchyMap[key]["Site Count"]++;
        hierarchyMap[key]["Billing"] += s.activeBilling;
        hierarchyMap[key]["Manpower Expense"] += s.activeExpense;
        hierarchyMap[key]["Consumption Value"] += s.activeConsumption;
    });

    const hierarchyRows = Object.values(hierarchyMap).map(h => {
        const netProfit = h["Billing"] - (h["Manpower Expense"] + h["Consumption Value"]);
        const margin = h["Billing"] > 0 ? ((netProfit / h["Billing"]) * 100).toFixed(2) + "%" : "0%";
        return {
            ...h,
            "Net Profit": netProfit,
            "Gross Margin %": margin
        };
    });

    const ws3 = XLSX.utils.json_to_sheet(hierarchyRows);
    XLSX.utils.book_append_sheet(wb, ws3, "Manager Hierarchy");

    // -------------------------------------------------------------
    // SHEET 4: Active Filtered Site Master Data
    // -------------------------------------------------------------
    const masterRows = sites.map(s => ({
        "S.No": s.sno,
        "Site Code": s.siteCode,
        "Region": s.region,
        "Site Name": s.siteName,
        "Customer Group": s.customerGroup,
        "Site Status": s.siteStatus,
        "Supervisor": s.supervisor,
        "Assistant Manager": s.assistantManager,
        "Manager": s.manager,
        "Sr Manager": s.srManager,
        "Month": activeMonth,
        "Billing": s.activeBilling,
        "Manpower Expense": s.activeExpense,
        "Consumption Value": s.activeConsumption,
        "Net Profit": s.activeNetProfit,
        "Gross Margin %": s.activeGrossMargin + "%",
        "Region Consumption Share %": s.activeRegionConsumptionSharePct + "%"
    }));

    const ws4 = XLSX.utils.json_to_sheet(masterRows);
    XLSX.utils.book_append_sheet(wb, ws4, "Filtered Site Master Data");

    // -------------------------------------------------------------
    // SHEET 5 (Bonus): Full Raw Monthly Breakdown (All Months)
    // -------------------------------------------------------------
    const fullMonthlyRows = sites.map(s => {
        const row = {
            "Site Code": s.siteCode,
            "Region": s.region,
            "Site Name": s.siteName,
            "Manager": s.manager,
            "Sr Manager": s.srManager,
            "Total Billing": s.totalBilling,
            "Total Expense": s.totalExpense,
            "Total Consumption": s.totalConsumption,
            "Avg Gross Margin": s.avgGrossMargin + "%"
        };

        // Attach monthly columns
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].forEach(m => {
            const mData = s.monthlyMetrics ? s.monthlyMetrics[m] : null;
            if (mData) {
                row[`${m} Billing`] = mData.billing;
                row[`${m} Expense`] = mData.expense;
                row[`${m} Consumption`] = mData.consumption;
            }
        });

        return row;
    });

    const ws5 = XLSX.utils.json_to_sheet(fullMonthlyRows);
    XLSX.utils.book_append_sheet(wb, ws5, "All Months Matrix");

    // Save File
    const filename = `Site_Analytics_Report${monthTag}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
};

window.downloadSpecificMonthReport = function(targetMonth) {
    const menu = document.getElementById('monthDownloadDropdown');
    if (menu) menu.classList.add('hidden');

    const selMonth = document.getElementById('filterMonth');
    if (selMonth) {
        selMonth.value = targetMonth;
        window.applyFilters();
    }


    window.exportToExcel();
};

/**
 * executeSelectedReportExport()
 * Called by the modal "Generate & Download Excel" button.
 * Reads the selected report type (REGION / DETAILED / SPECIFIC / WORKBOOK)
 * and target month from the modal, then exports the right Excel workbook.
 * 100% client-side – nothing leaves the browser.
 */
window.executeSelectedReportExport = function () {
    // 1. Read modal selections
    const selectedType = document.querySelector('input[name="reportType"]:checked')?.value || 'WORKBOOK';
    const modalMonth   = document.getElementById('modalMonthSelect')?.value || 'ALL';
    const modalRegion  = document.getElementById('modalRegionSelect')?.value || 'ALL';

    // 2. Temporarily set selectedMonth and recompute active metrics
    window.selectedMonth = modalMonth;
    const filterMonthEl  = document.getElementById('filterMonth');
    if (filterMonthEl) filterMonthEl.value = modalMonth;
    if (typeof window.applyFilters === 'function') window.applyFilters();

    let sites = (window.filteredDataset && window.filteredDataset.length > 0)
        ? window.filteredDataset
        : window.activeDataset;

    // Apply specific region filter if chosen in modal
    if (modalRegion !== 'ALL' && sites) {
        sites = sites.filter(s => s.region === modalRegion);
    }

    if (!sites || sites.length === 0) {
        alert(`No data available to export for Region: "${modalRegion}", Month: "${modalMonth}".`);
        window.closeReportModal();
        return;
    }

    const thresholdPct = parseFloat(document.getElementById('thresholdRange')?.value || '7.0');
    const regionPrefix = modalRegion !== 'ALL' ? `${modalRegion.replace(/\s+/g, '_')}_` : '';
    const monthLabel   = modalMonth !== 'ALL' ? `${modalMonth}_2026` : 'FullYear';
    const today        = new Date().toISOString().slice(0, 10);
    const wb           = XLSX.utils.book_new();

    /* ── helpers ─────────────────────────────────────────────────────── */
    function buildRegionRows(dataset) {
        const map = {};
        dataset.forEach(s => {
            if (!map[s.region]) map[s.region] = { Region: s.region, Month: modalMonth, 'Site Count': 0, Billing: 0, 'Manpower Expense': 0, 'Consumption Value': 0, 'Sites Above Threshold': 0 };
            const r = map[s.region];
            r['Site Count']++;
            r['Billing']            += s.activeBilling    || 0;
            r['Manpower Expense']   += s.activeExpense     || 0;
            r['Consumption Value']  += s.activeConsumption || 0;
            if ((s.activeConsumptionToBillingPct || 0) >= thresholdPct) r['Sites Above Threshold']++;
        });
        return Object.values(map).map(r => {
            const net = r['Billing'] - (r['Manpower Expense'] + r['Consumption Value']);
            return { ...r, 'Net Profit': net, 'Gross Margin %': r['Billing'] > 0 ? ((net / r['Billing']) * 100).toFixed(2) + '%' : '0%' };
        });
    }

    function buildHighRows(dataset) {
        return dataset.filter(s => (s.activeConsumptionToBillingPct || 0) >= thresholdPct).map(s => ({
            'S.No': s.sno, 'Site Code': s.siteCode, Region: s.region, 'Site Name': s.siteName,
            'Customer Group': s.customerGroup, 'Site Status': s.siteStatus, Manager: s.manager, 'Sr Manager': s.srManager,
            Month: modalMonth, Billing: s.activeBilling, 'Manpower Expense': s.activeExpense,
            'Consumption Value': s.activeConsumption,
            'Consumption / Billing (%)': (s.activeConsumptionToBillingPct || 0) + '%',
            'Share of Region (%)': (s.activeRegionConsumptionSharePct || 0) + '%',
            'Alert Level': `Exceeds ${thresholdPct}% Cons/Billing Threshold`
        }));
    }

    function buildDetailedRows(dataset) {
        return dataset.map(s => ({
            'S.No': s.sno, 'Site Code': s.siteCode, Region: s.region, 'Site Name': s.siteName,
            'Customer Group': s.customerGroup, 'Site Status': s.siteStatus,
            Supervisor: s.supervisor, 'Assistant Manager': s.assistantManager,
            Manager: s.manager, 'Sr Manager': s.srManager, Code: s.code,
            Month: modalMonth, Billing: s.activeBilling, 'Manpower Expense': s.activeExpense,
            'Consumption Value': s.activeConsumption, 'Net Profit': s.activeNetProfit,
            'Gross Margin %': (s.activeGrossMargin || 0) + '%',
            'Region Consumption Share %': (s.activeRegionConsumptionSharePct || 0) + '%',
            'Avg Monthly Billing': s.avgMonthlyBilling, 'Avg Monthly Consumption': s.avgMonthlyConsumption,
            'Avg Manpower Expense': s.avgManpowerExpense, 'Avg Expense': s.avgExpense,
            'Avg Gross Margin': (s.avgGrossMargin || 0) + '%'
        }));
    }

    function buildAllMonthsRows(dataset) {
        return dataset.map(s => {
            const row = {
                'Site Code': s.siteCode, Region: s.region, 'Site Name': s.siteName,
                Manager: s.manager, 'Sr Manager': s.srManager,
                'Total Billing': s.totalBilling, 'Total Expense': s.totalExpense,
                'Total Consumption': s.totalConsumption, 'Avg Gross Margin': (s.avgGrossMargin || 0) + '%'
            };
            ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'].forEach(m => {
                const d = s.monthlyMetrics ? s.monthlyMetrics[m] : null;
                if (d) { row[`${m} Billing`] = d.billing; row[`${m} Expense`] = d.expense; row[`${m} Consumption`] = d.consumption; }
            });
            return row;
        });
    }

    /* ── export logic per type ───────────────────────────────────────── */
    if (selectedType === 'REGION') {
        const rRows = buildRegionRows(sites);
        const hRows = buildHighRows(sites);
        const ws1 = XLSX.utils.json_to_sheet(rRows.length > 0 ? rRows : [{ Status: 'No region data.' }]);
        XLSX.utils.book_append_sheet(wb, ws1, 'Region Summary');
        const ws2 = XLSX.utils.json_to_sheet(hRows.length > 0 ? hRows : [{ Status: `No sites exceed ${thresholdPct}% threshold for ${modalMonth}.` }]);
        XLSX.utils.book_append_sheet(wb, ws2, `High Consumption (>${thresholdPct}%)`);
        XLSX.writeFile(wb, `${regionPrefix}RegionWise_Report_${monthLabel}_${today}.xlsx`);

    } else if (selectedType === 'DETAILED') {
        const dRows = buildDetailedRows(sites);
        const ws = XLSX.utils.json_to_sheet(dRows.length > 0 ? dRows : [{ Status: 'No data.' }]);
        XLSX.utils.book_append_sheet(wb, ws, 'Detailed Master Data');
        XLSX.writeFile(wb, `${regionPrefix}Detailed_Site_Report_${monthLabel}_${today}.xlsx`);

    } else if (selectedType === 'SPECIFIC') {
        const sRows = buildDetailedRows(sites);
        const ws = XLSX.utils.json_to_sheet(sRows.length > 0 ? sRows : [{ Status: 'No data matches current filters.' }]);
        XLSX.utils.book_append_sheet(wb, ws, 'Specific Filtered Data');
        const regionTag  = (window.activeRegionFilter  && window.activeRegionFilter  !== 'ALL') ? `_Rgn-${window.activeRegionFilter.replace(/\s+/g,'_')}`  : '';
        const managerTag = (window.activeManagerFilter && window.activeManagerFilter !== 'ALL') ? `_Mgr-${window.activeManagerFilter.replace(/\s+/g,'_')}` : '';
        const statusTag  = (window.activeStatusFilter  && window.activeStatusFilter  !== 'ALL') ? `_St-${window.activeStatusFilter.replace(/\s+/g,'_')}`   : '';
        XLSX.writeFile(wb, `${regionPrefix}Specific_Report${regionTag}${managerTag}${statusTag}_${monthLabel}_${today}.xlsx`);

    } else if (selectedType === 'ANALYSIS_REGION') {
        // ── Region Consumption Analysis (mirrors Tab 2) ───────────────
        const regionMap = {};
        sites.forEach(s => {
            if (!regionMap[s.region]) regionMap[s.region] = { sites: [], totalBilling: 0, totalConsumption: 0, totalExpense: 0 };
            regionMap[s.region].sites.push(s);
            regionMap[s.region].totalBilling     += s.activeBilling    || 0;
            regionMap[s.region].totalConsumption += s.activeConsumption|| 0;
            regionMap[s.region].totalExpense     += s.activeExpense     || 0;
        });

        // Sheet 1: Region summary
        const regSummaryRows = Object.keys(regionMap).sort().map(rName => {
            const rg = regionMap[rName];
            const net = rg.totalBilling - (rg.totalExpense + rg.totalConsumption);
            const flaggedCount = rg.sites.filter(s => (s.activeConsumptionToBillingPct || 0) >= thresholdPct).length;
            return {
                Region: rName, Month: modalMonth, 'Total Sites': rg.sites.length,
                'Total Billing': rg.totalBilling, 'Total Manpower Expense': rg.totalExpense,
                'Total Consumption Value': rg.totalConsumption, 'Net Profit': net,
                'Gross Margin %': rg.totalBilling > 0 ? ((net / rg.totalBilling) * 100).toFixed(2) + '%' : '0%',
                [`Sites ≥${thresholdPct}% Cons/Billing`]: flaggedCount
            };
        });

        // Sheet 2: Site-level flagged breakdown
        const siteRows = [];
        Object.keys(regionMap).sort().forEach(rName => {
            const rg = regionMap[rName];
            rg.sites
                .filter(s => (s.activeConsumptionToBillingPct || 0) >= thresholdPct)
                .sort((a, b) => (b.activeConsumptionToBillingPct || 0) - (a.activeConsumptionToBillingPct || 0))
                .forEach(s => {
                    const share = rg.totalConsumption > 0 ? ((s.activeConsumption / rg.totalConsumption) * 100).toFixed(2) : '0';
                    const billShare = s.activeBilling > 0 ? ((s.activeConsumption / s.activeBilling) * 100).toFixed(2) : '0';
                    siteRows.push({
                        Region: rName, Month: modalMonth, 'Site Code': s.siteCode, 'Site Name': s.siteName,
                        'Customer Group': s.customerGroup, 'Site Status': s.siteStatus,
                        Manager: s.manager, 'Sr Manager': s.srManager,
                        Billing: s.activeBilling, 'Manpower Expense': s.activeExpense,
                        'Consumption Value': s.activeConsumption,
                        'Consumption / Billing (%)': billShare + '%',
                        'Share of Region (%)': share + '%',
                        'Alert': `≥${thresholdPct}% Cons/Billing — HIGH`
                    });
                });
        });

        const wsA = XLSX.utils.json_to_sheet(regSummaryRows.length > 0 ? regSummaryRows : [{ Status: 'No data.' }]);
        XLSX.utils.book_append_sheet(wb, wsA, 'Region Summary');
        const wsB = XLSX.utils.json_to_sheet(siteRows.length > 0 ? siteRows : [{ Status: `No sites exceed ${thresholdPct}% threshold for ${modalMonth}.` }]);
        XLSX.utils.book_append_sheet(wb, wsB, `Sites ≥${thresholdPct}% Cons-Billing`);
        XLSX.writeFile(wb, `${regionPrefix}Analysis_RegionConsumption_${monthLabel}_${today}.xlsx`);

    } else if (selectedType === 'ANALYSIS_FINANCIAL') {
        // ── Financial & Profitability Analysis (mirrors Tab 3) ────────
        const finRows = sites.map(s => {
            let healthStatus;
            if ((s.activeGrossMargin || 0) >= 20)       healthStatus = 'Healthy (≥20%)';
            else if ((s.activeGrossMargin || 0) >= 5)   healthStatus = 'Moderate (5–20%)';
            else                                         healthStatus = 'Critical (<5%)';
            return {
                'Site Code': s.siteCode, 'Site Name': s.siteName, Region: s.region,
                'Customer Group': s.customerGroup, 'Site Status': s.siteStatus,
                Manager: s.manager, 'Sr Manager': s.srManager, Month: modalMonth,
                Billing: s.activeBilling, 'Manpower Expense': s.activeExpense,
                'Consumption Value': s.activeConsumption, 'Net Profit': s.activeNetProfit,
                'Gross Margin %': (s.activeGrossMargin || 0) + '%',
                'Profitability Status': healthStatus
            };
        }).sort((a, b) => parseFloat(a['Gross Margin %']) - parseFloat(b['Gross Margin %']));

        // Summary row at top
        const totalBilling = sites.reduce((t, s) => t + (s.activeBilling || 0), 0);
        const totalExpense  = sites.reduce((t, s) => t + (s.activeExpense  || 0), 0);
        const totalCons     = sites.reduce((t, s) => t + (s.activeConsumption || 0), 0);
        const totalProfit   = totalBilling - (totalExpense + totalCons);
        const summaryRow = [{
            'Site Code': '── PORTFOLIO TOTALS ──', 'Site Name': '', Region: '', 'Customer Group': '',
            'Site Status': '', Manager: '', 'Sr Manager': '', Month: modalMonth,
            Billing: totalBilling, 'Manpower Expense': totalExpense,
            'Consumption Value': totalCons, 'Net Profit': totalProfit,
            'Gross Margin %': totalBilling > 0 ? ((totalProfit / totalBilling) * 100).toFixed(2) + '%' : '0%',
            'Profitability Status': `${sites.length} Sites Total`
        }];

        const wsF = XLSX.utils.json_to_sheet([...summaryRow, ...finRows]);
        XLSX.utils.book_append_sheet(wb, wsF, 'Financial & Profitability');
        XLSX.writeFile(wb, `${regionPrefix}Analysis_Financial_Profitability_${monthLabel}_${today}.xlsx`);

    } else if (selectedType === 'ANALYSIS_HIERARCHY') {
        // ── Management Hierarchy Analysis (mirrors Tab 4) ─────────────
        const srMap = {};
        sites.forEach(s => {
            const sr  = s.srManager || 'Unassigned';
            const mgr = s.manager   || 'Unassigned';
            if (!srMap[sr]) srMap[sr] = {};
            if (!srMap[sr][mgr]) srMap[sr][mgr] = [];
            srMap[sr][mgr].push(s);
        });

        // Sr Manager summary sheet
        const srRows = Object.keys(srMap).sort().map(sr => {
            const mgrCount = Object.keys(srMap[sr]).length;
            let srBilling = 0, srExpense = 0, srCons = 0, srSites = 0;
            Object.values(srMap[sr]).forEach(mSites => mSites.forEach(s => {
                srBilling += s.activeBilling || 0; srExpense += s.activeExpense || 0;
                srCons += s.activeConsumption || 0; srSites++;
            }));
            const net = srBilling - (srExpense + srCons);
            return { 'Sr Manager': sr, Month: modalMonth, 'Managers Under': mgrCount,
                'Total Sites': srSites, Billing: srBilling, 'Manpower Expense': srExpense,
                'Consumption Value': srCons, 'Net Profit': net,
                'Gross Margin %': srBilling > 0 ? ((net / srBilling) * 100).toFixed(2) + '%' : '0%' };
        });

        // Manager-level detailed sheet
        const mgrRows = [];
        Object.keys(srMap).sort().forEach(sr => {
            Object.keys(srMap[sr]).sort().forEach(mgr => {
                const mSites = srMap[sr][mgr];
                const mBill = mSites.reduce((t,s) => t + (s.activeBilling||0), 0);
                const mExp  = mSites.reduce((t,s) => t + (s.activeExpense||0), 0);
                const mCons = mSites.reduce((t,s) => t + (s.activeConsumption||0), 0);
                const mNet  = mBill - (mExp + mCons);
                mgrRows.push({ 'Sr Manager': sr, Manager: mgr, Month: modalMonth,
                    Sites: mSites.length, Billing: mBill, 'Manpower Expense': mExp,
                    'Consumption Value': mCons, 'Net Profit': mNet,
                    'Gross Margin %': mBill > 0 ? ((mNet / mBill) * 100).toFixed(2) + '%' : '0%' });
                // Then individual site rows indented
                mSites.forEach(s => mgrRows.push({
                    'Sr Manager': '',  Manager: `   ↳ ${s.siteCode}`, Month: modalMonth,
                    Sites: '', Billing: s.activeBilling, 'Manpower Expense': s.activeExpense,
                    'Consumption Value': s.activeConsumption, 'Net Profit': s.activeNetProfit,
                    'Gross Margin %': (s.activeGrossMargin || 0) + '%'
                }));
            });
        });

        const wsH1 = XLSX.utils.json_to_sheet(srRows.length > 0 ? srRows : [{ Status: 'No data.' }]);
        XLSX.utils.book_append_sheet(wb, wsH1, 'Sr Manager Summary');
        const wsH2 = XLSX.utils.json_to_sheet(mgrRows.length > 0 ? mgrRows : [{ Status: 'No data.' }]);
        XLSX.utils.book_append_sheet(wb, wsH2, 'Manager Site Breakdown');
        XLSX.writeFile(wb, `${regionPrefix}Analysis_ManagementHierarchy_${monthLabel}_${today}.xlsx`);

    } else if (selectedType === 'ANALYSIS_TRENDS') {
        // ── Monthly Trends Analysis (mirrors Tab 5) ─ always all months
        const allSites = window.activeDataset || sites;
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'];
        const monthFull = { Jan:'January', Feb:'February', Mar:'March', Apr:'April', May:'May', Jun:'June', Jul:'July', Aug:'August' };
        const trendRows = months.map(m => {
            let billing = 0, expense = 0, cons = 0;
            allSites.forEach(s => {
                const d = s.monthlyMetrics ? s.monthlyMetrics[m] : null;
                if (d) { billing += d.billing || 0; expense += d.expense || 0; cons += d.consumption || 0; }
            });
            const profit = billing - (expense + cons);
            return {
                Month: `${monthFull[m]} 2026`, 'Total Billing': billing,
                'Total Manpower Expense': expense, 'Total Consumption Value': cons,
                'Total Cost': expense + cons, 'Net Profit': profit,
                'Gross Margin %': billing > 0 ? ((profit / billing) * 100).toFixed(2) + '%' : '0%',
                'Sites Reporting': allSites.filter(s => s.monthlyMetrics && s.monthlyMetrics[m] && (s.monthlyMetrics[m].billing > 0 || s.monthlyMetrics[m].expense > 0)).length
            };
        }).filter(r => r['Total Billing'] > 0 || r['Total Manpower Expense'] > 0);

        const wsT = XLSX.utils.json_to_sheet(trendRows.length > 0 ? trendRows : [{ Status: 'No monthly data found.' }]);
        XLSX.utils.book_append_sheet(wb, wsT, 'Monthly Trends Jan–Aug');
        XLSX.writeFile(wb, `${regionPrefix}Analysis_MonthlyTrends_${today}.xlsx`);

    } else if (selectedType === 'ANALYSIS_OVERVIEW') {
        // ── Executive KPI Overview (mirrors Tab 1 KPI cards) ─────────
        const totalBilling = sites.reduce((t, s) => t + (s.activeBilling    || 0), 0);
        const totalExpense  = sites.reduce((t, s) => t + (s.activeExpense    || 0), 0);
        const totalCons     = sites.reduce((t, s) => t + (s.activeConsumption|| 0), 0);
        const totalProfit   = totalBilling - (totalExpense + totalCons);
        const overallMargin = totalBilling > 0 ? ((totalProfit / totalBilling) * 100).toFixed(2) : '0';
        const highSites     = sites.filter(s => (s.activeConsumptionToBillingPct || 0) >= thresholdPct).length;
        const healthySites  = sites.filter(s => (s.activeGrossMargin || 0) >= 20).length;
        const criticalSites = sites.filter(s => (s.activeGrossMargin || 0) < 5).length;

        const kpiRows = [
            { 'KPI Metric': 'Report Month', Value: modalMonth, Notes: 'Selected reporting period' },
            { 'KPI Metric': 'Total Active Sites', Value: sites.length, Notes: 'Sites in current filter selection' },
            { 'KPI Metric': 'Total Billing', Value: totalBilling, Notes: '₹ sum of all site billings' },
            { 'KPI Metric': 'Total Manpower Expense', Value: totalExpense, Notes: '₹ sum of all manpower costs' },
            { 'KPI Metric': 'Total Consumption Value', Value: totalCons, Notes: '₹ sum of material consumption' },
            { 'KPI Metric': 'Total Cost (Expense + Consumption)', Value: totalExpense + totalCons, Notes: 'Combined operational cost' },
            { 'KPI Metric': 'Net Profit', Value: totalProfit, Notes: 'Billing − Total Cost' },
            { 'KPI Metric': 'Portfolio Gross Margin %', Value: overallMargin + '%', Notes: '(Net Profit / Billing) × 100' },
            { 'KPI Metric': `High Consumption Sites (≥${thresholdPct}% of billing)`, Value: highSites, Notes: 'Sites flagged for high consumption relative to billing' },
            { 'KPI Metric': 'Healthy Sites (Margin ≥20%)', Value: healthySites, Notes: 'Sites with strong gross margin' },
            { 'KPI Metric': 'Critical Sites (Margin <5%)', Value: criticalSites, Notes: 'Sites needing urgent review' },
            { 'KPI Metric': 'Threshold Used', Value: thresholdPct + '%', Notes: 'Consumption/Billing threshold setting' },
        ];

        const wsO = XLSX.utils.json_to_sheet(kpiRows);
        XLSX.utils.book_append_sheet(wb, wsO, 'Executive KPI Overview');
        XLSX.writeFile(wb, `${regionPrefix}Analysis_ExecutiveKPI_${monthLabel}_${today}.xlsx`);

    } else {

        // WORKBOOK – full 5-sheet executive workbook
        const allSites = window.activeDataset || sites;
        const hRows  = buildHighRows(allSites);
        const rRows  = buildRegionRows(allSites);
        const dRows  = buildDetailedRows(sites);
        const mRows  = buildAllMonthsRows(allSites);

        const hierarchyMap = {};
        allSites.forEach(s => {
            const key = `${s.srManager}||${s.manager}`;
            if (!hierarchyMap[key]) hierarchyMap[key] = { 'Sr Manager': s.srManager, Manager: s.manager, Month: modalMonth, 'Site Count': 0, Billing: 0, 'Manpower Expense': 0, 'Consumption Value': 0 };
            hierarchyMap[key]['Site Count']++;
            hierarchyMap[key]['Billing']           += s.activeBilling    || 0;
            hierarchyMap[key]['Manpower Expense']  += s.activeExpense     || 0;
            hierarchyMap[key]['Consumption Value'] += s.activeConsumption || 0;
        });
        const hierRows = Object.values(hierarchyMap).map(h => {
            const net = h['Billing'] - (h['Manpower Expense'] + h['Consumption Value']);
            return { ...h, 'Net Profit': net, 'Gross Margin %': h['Billing'] > 0 ? ((net / h['Billing']) * 100).toFixed(2) + '%' : '0%' };
        });

        const ws1 = XLSX.utils.json_to_sheet(hRows.length > 0 ? hRows : [{ Status: `No sites exceed ${thresholdPct}% threshold.` }]);
        XLSX.utils.book_append_sheet(wb, ws1, `High Consumption (>${thresholdPct}%)`);
        const ws2 = XLSX.utils.json_to_sheet(rRows.length > 0 ? rRows : [{ Status: 'No region data.' }]);
        XLSX.utils.book_append_sheet(wb, ws2, 'Region Summary');
        const ws3 = XLSX.utils.json_to_sheet(hierRows.length > 0 ? hierRows : [{ Status: 'No hierarchy data.' }]);
        XLSX.utils.book_append_sheet(wb, ws3, 'Manager Hierarchy');
        const ws4 = XLSX.utils.json_to_sheet(dRows.length > 0 ? dRows : [{ Status: 'No data.' }]);
        XLSX.utils.book_append_sheet(wb, ws4, 'Filtered Site Master Data');
        const ws5 = XLSX.utils.json_to_sheet(mRows.length > 0 ? mRows : [{ Status: 'No monthly data.' }]);
        XLSX.utils.book_append_sheet(wb, ws5, 'All Months Matrix');

        XLSX.writeFile(wb, `${regionPrefix}Executive_Workbook_${monthLabel}_${today}.xlsx`);
    }

    window.closeReportModal();
};

