/**
 * Main Application Orchestrator & State Manager
 */

if (typeof window.formatRupee !== 'function') {
    window.formatRupee = function(amount) {
        if (isNaN(amount) || amount === null || amount === undefined) return "₹0";
        return "₹" + Math.round(amount).toLocaleString('en-IN');
    };
}

window.activeDataset = [];
window.filteredDataset = [];
window.currentThreshold = 7.0;

document.addEventListener('DOMContentLoaded', () => {
    // Check if user uploaded a file in a previous session that's cached in localStorage
    const cached = localStorage.getItem('site_analytics_cached_dataset');
    if (cached) {
        try {
            const payload = JSON.parse(cached);
            if (payload && payload.sites && payload.sites.length > 0) {
                // If cached payload contains > 5,000 corrupt/dummy sites, purge cache automatically
                if (payload.sites.length > 5000) {
                    localStorage.removeItem('site_analytics_cached_dataset');
                    window.loadSampleData();
                    return;
                }
                document.getElementById('datasetTitle').innerText = `Restored Session: ${payload.filename || 'Uploaded File'} (${payload.sites.length} Sites)`;
                window.setActiveDataset(payload.sites, payload.filename, false);
                return;
            }
        } catch (err) {
            console.warn('[Cache] Could not parse cached dataset:', err);
            localStorage.removeItem('site_analytics_cached_dataset');
        }
    }
    // Fallback to sample data if no valid cache
    window.loadSampleData();
});


window.loadSampleData = function() {
    const rawData = window.generateSampleDataset();
    const processed = window.normalizeRawData(rawData);
    
    document.getElementById('datasetTitle').innerText = 'Benchmark Sample Dataset (30 Sites, Jan-Aug 2026)';
    window.setActiveDataset(processed, 'Sample Data', false);
};

window.triggerFilePicker = function() {
    const input = document.getElementById('excelFileInput');
    if (input) {
        input.click();
    }
};

window.handleFileUpload = function(event) {
    const inputElement = (event && event.target) ? event.target : null;
    const file = inputElement && inputElement.files ? inputElement.files[0] : (event instanceof File ? event : null);
    if (!file) return;

    // Immediate user alert feedback
    alert("📄 Selected file: " + file.name + " (" + Math.round(file.size / 1024) + " KB)\n\nParsing site records now... Please wait.");

    const titleEl = document.getElementById('datasetTitle');
    if (titleEl) titleEl.innerText = `Processing Excel file: ${file.name}... Please wait...`;

    window.parseExcelFile(file, (processedData, fileName) => {
        alert("✅ Successfully loaded " + processedData.length + " sites from " + fileName + "!");
        if (titleEl) titleEl.innerText = `Uploaded: ${fileName} (${processedData.length} Sites)`;
        window.setActiveDataset(processedData, fileName, true);
        
        if (inputElement) {
            inputElement.value = '';
        }
    });
};



// Setup Drag & Drop handlers on dropzoneContainer
document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('dropzoneContainer');
    if (dropzone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.add('border-brand-500', 'bg-brand-500/10');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.remove('border-brand-500', 'bg-brand-500/10');
            }, false);
        });

        dropzone.addEventListener('drop', e => {
            const dt = e.dataTransfer;
            if (dt && dt.files && dt.files.length > 0) {
                window.handleFileUpload(dt.files[0]);
            }
        }, false);
    }
});


/** Toggle expandable description panel for Advanced Financial Analyses */
window.toggleAnalysisDesc = function(id) {
    const panel = document.getElementById(id);
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !isHidden);
    // Update the button text
    const btn = panel.previousElementSibling?.querySelector('button[onclick*="' + id + '"]');
    if (btn) {
        btn.innerHTML = isHidden
            ? '<i class="fa-solid fa-chevron-up"></i> Hide details'
            : '<i class="fa-solid fa-circle-info"></i> How it\'s calculated';
    }
};

window.openPasteModal = function() {
    const modal = document.getElementById('pasteImportModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Default to Paste Data — Direct Link doesn't work for corporate SharePoint
        switchImportTab('paste');
    }
};

window.closePasteModal = function() {
    const modal = document.getElementById('pasteImportModal');
    if (modal) modal.classList.add('hidden');
    // Reset status indicator
    const status = document.getElementById('urlImportStatus');
    if (status) status.classList.add('hidden');
};

/** Switch between "Direct Link" and "Paste Data" tabs inside the OneDrive modal */
window.switchImportTab = function(tab) {
    const linkTab  = document.getElementById('importTabLink');
    const pasteTab = document.getElementById('importTabPaste');
    const btnLink  = document.getElementById('tabBtnLink');
    const btnPaste = document.getElementById('tabBtnPaste');
    const submitBtn = document.getElementById('importSubmitBtn');

    if (tab === 'link') {
        linkTab?.classList.remove('hidden');
        pasteTab?.classList.add('hidden');
        btnLink?.classList.add('border-sky-500', 'text-sky-300');
        btnLink?.classList.remove('border-transparent', 'text-gray-400');
        btnPaste?.classList.add('border-transparent', 'text-gray-400');
        btnPaste?.classList.remove('border-sky-500', 'text-sky-300');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i><span>Load from OneDrive Link</span>';
        }
    } else {
        pasteTab?.classList.remove('hidden');
        linkTab?.classList.add('hidden');
        btnPaste?.classList.add('border-amber-500', 'text-amber-300');
        btnPaste?.classList.remove('border-transparent', 'text-gray-400');
        btnLink?.classList.add('border-transparent', 'text-gray-400');
        btnLink?.classList.remove('border-sky-500', 'text-sky-300');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fa-solid fa-file-import"></i><span>Import Pasted Data</span>';
        }
    }
};

/** Unified submit — dispatches to URL or Paste handler depending on active tab */
window.handleOneDriveImportSubmit = function() {
    const linkTabVisible = !document.getElementById('importTabLink')?.classList.contains('hidden');
    if (linkTabVisible) {
        submitUrlImport();
    } else {
        submitPasteImport();
    }
};

window.submitUrlImport = function() {
    const url = document.getElementById('urlImportInput')?.value?.trim();
    if (!url) {
        alert("Please paste a valid OneDrive or SharePoint share link into the input field.");
        return;
    }

    // Warn upfront if this looks like a corporate SharePoint link
    if (url.includes('sharepoint.com') && url.includes('/p/')) {
        const proceed = confirm(
            "⚠️ Corporate SharePoint links usually cannot be fetched directly due to login restrictions (CORS).\n\n" +
            "This may hang or fail. It is recommended to use the \"Paste Data\" tab instead.\n\n" +
            "Click OK to try anyway, or Cancel to switch to Paste Data."
        );
        if (!proceed) {
            switchImportTab('paste');
            return;
        }
    }

    // Show loading state
    const statusBox  = document.getElementById('urlImportStatus');
    const statusText = document.getElementById('urlImportStatusText');
    const submitBtn  = document.getElementById('importSubmitBtn');
    if (statusBox)  { statusBox.classList.remove('hidden'); }
    if (statusText) { statusText.textContent = 'Fetching file from OneDrive... (may take up to 12s)'; }
    if (submitBtn)  { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Loading...</span>'; }

    // 12-second timeout so it never hangs forever
    const timeoutId = setTimeout(() => {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i><span>Load from OneDrive Link</span>'; }
        if (statusBox) { statusBox.classList.add('hidden'); }
        alert(
            "⏱️ The link took too long to respond and was cancelled.\n\n" +
            "This usually means the file requires a company login (corporate SharePoint).\n\n" +
            "✅ Please use the \"Paste Data\" tab instead:\n" +
            "1. Open the file in OneDrive/SharePoint in your browser\n" +
            "2. Press Ctrl+A then Ctrl+C to copy all data\n" +
            "3. Switch to Paste Data tab and paste there"
        );
        switchImportTab('paste');
    }, 12000);

    window.parseOneDriveUrl(url, (processedData, fileName) => {
        clearTimeout(timeoutId);
        document.getElementById('datasetTitle').innerText = `OneDrive: ${fileName} (${processedData.length} Sites)`;
        window.setActiveDataset(processedData, fileName, true);
        window.closePasteModal();
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i><span>Load from OneDrive Link</span>'; }
    });
};

window.submitPasteImport = function() {
    const text = document.getElementById('pasteImportTextarea')?.value;
    if (!text || !text.trim()) {
        alert("Please paste data copied from your OneDrive Online Excel sheet into the text box.");
        return;
    }

    window.parseClipboardData(text, (processedData, fileName) => {
        document.getElementById('datasetTitle').innerText = `OneDrive Pasted Data (${processedData.length} Sites)`;
        window.setActiveDataset(processedData, fileName, true);
        window.closePasteModal();
    });
};

window.clearCachedData = function() {
    localStorage.removeItem('site_analytics_cached_dataset');
    alert("Cached session cleared. Loading demo benchmark data.");
    window.loadSampleData();
};

window.setActiveDataset = function(sites, sourceName = '', shouldCache = true) {
    window.activeDataset = sites || [];
    window.filteredDataset = sites || [];

    // Update dataset title in header bar
    const titleEl = document.getElementById('datasetTitle');
    if (titleEl) {
        titleEl.innerText = `${sourceName || 'Uploaded Dataset'} (${sites ? sites.length : 0} Sites)`;
    }


    // Cache dataset in localStorage for page refresh persistence
    if (shouldCache && sites && sites.length > 0) {
        try {
            const payload = {
                filename: sourceName || 'Uploaded Excel Data',
                timestamp: new Date().toISOString(),
                sites: sites
            };
            localStorage.setItem('site_analytics_cached_dataset', JSON.stringify(payload));
        } catch (e) {
            console.warn('[Cache] Quota exceeded or error saving to localStorage:', e);
        }
    }

    // Enable Export buttons
    const btnCustom = document.getElementById('btnCustomExport');
    if (btnCustom) btnCustom.disabled = false;

    const btnMonthMenu = document.getElementById('btnMonthDownloadMenu');
    if (btnMonthMenu) btnMonthMenu.disabled = false;

    // Show dashboard content, hide dropzone
    document.getElementById('dropzoneContainer').classList.add('hidden');
    document.getElementById('dashboardContent').classList.remove('hidden');

    // Populate filter dropdown options
    populateFilterDropdowns(sites);

    // Render current view
    applyFilters();
};

window.openReportModal = function() {
    const modal = document.getElementById('reportExportModal');
    if (modal) {
        // Populate modal region dropdown dynamically
        const regSelect = document.getElementById('modalRegionSelect');
        if (regSelect && window.activeDataset) {
            const currentVal = window.activeRegionFilter || 'ALL';
            const regions = Array.from(new Set(window.activeDataset.map(s => s.region))).filter(Boolean).sort();
            regSelect.innerHTML = `<option value="ALL">All Regions (Full Portfolio)</option>` +
                regions.map(r => `<option value="${r}">${r}</option>`).join('');
            regSelect.value = regions.includes(currentVal) ? currentVal : 'ALL';
        }
        modal.classList.remove('hidden');
    }
};

window.closeReportModal = function() {
    const modal = document.getElementById('reportExportModal');
    if (modal) modal.classList.add('hidden');
};

window.toggleMonthDownloadMenu = function(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('monthDownloadDropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
};

document.addEventListener('click', (e) => {
    const menu = document.getElementById('monthDownloadDropdown');
    const btn = document.getElementById('btnMonthDownloadMenu');
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

function populateFilterDropdowns(sites) {
    const selRegion = document.getElementById('filterRegion');
    const selStatus = document.getElementById('filterStatus');
    const selSrManager = document.getElementById('filterSrManager');

    const regions = new Set();
    const statuses = new Set();
    const srManagers = new Set();

    sites.forEach(s => {
        if (s.region) regions.add(s.region);
        if (s.siteStatus) statuses.add(s.siteStatus);
        if (s.srManager) srManagers.add(s.srManager);
    });

    selRegion.innerHTML = '<option value="ALL">All Regions</option>' + 
        Array.from(regions).sort().map(r => `<option value="${r}">${r}</option>`).join('');

    selStatus.innerHTML = '<option value="ALL">All Statuses</option>' + 
        Array.from(statuses).sort().map(st => `<option value="${st}">${st}</option>`).join('');

    selSrManager.innerHTML = '<option value="ALL">All Sr Managers</option>' + 
        Array.from(srManagers).sort().map(sr => `<option value="${sr}">${sr}</option>`).join('');
}

window.applyFilters = function() {
    const monthVal  = document.getElementById('filterMonth')?.value || 'ALL';
    const regVal    = document.getElementById('filterRegion')?.value || 'ALL';
    const statVal   = document.getElementById('filterStatus')?.value || 'ALL';
    const srVal     = document.getElementById('filterSrManager')?.value || 'ALL';
    const searchVal = document.getElementById('globalSiteSearch')?.value.trim().toLowerCase() || '';

    window.selectedMonth = monthVal;

    // Store active filter values globally for use in export filenames
    window.activeRegionFilter  = regVal;
    window.activeStatusFilter  = statVal;
    window.activeManagerFilter = srVal;

    // Filter sites by dropdown criteria and universal search query
    let rawFiltered = window.activeDataset.filter(s => {
        const matchesReg    = regVal  === 'ALL' || s.region     === regVal;
        const matchesStat   = statVal === 'ALL' || s.siteStatus === statVal;
        const matchesSr     = srVal   === 'ALL' || s.srManager  === srVal;
        const matchesSearch = !searchVal || 
            String(s.siteCode || '').toLowerCase().includes(searchVal) || 
            String(s.siteName || '').toLowerCase().includes(searchVal) ||
            String(s.code || '').toLowerCase().includes(searchVal);

        return matchesReg && matchesStat && matchesSr && matchesSearch;
    });


    // Map metrics for selected Month (or All Months aggregated)
    window.filteredDataset = rawFiltered.map(s => {
        let bVal = s.totalBilling;
        let eVal = s.totalExpense;
        let cVal = s.totalConsumption;

        if (monthVal !== 'ALL' && s.monthlyMetrics && s.monthlyMetrics[monthVal]) {
            bVal = s.monthlyMetrics[monthVal].billing;
            eVal = s.monthlyMetrics[monthVal].expense;
            cVal = s.monthlyMetrics[monthVal].consumption;
        }

        const netProf = bVal - (eVal + cVal);
        const margin = bVal > 0 ? Number(((netProf / bVal) * 100).toFixed(2)) : 0;

        return {
            ...s,
            activeBilling: bVal,
            activeExpense: eVal,
            activeConsumption: cVal,
            activeNetProfit: netProf,
            activeGrossMargin: margin
        };
    });

    // Recompute Region Consumption totals for active Month selection
    const regConsumptionTotals = {};
    window.filteredDataset.forEach(s => {
        if (!regConsumptionTotals[s.region]) regConsumptionTotals[s.region] = 0;
        regConsumptionTotals[s.region] += s.activeConsumption;
    });

    window.filteredDataset.forEach(s => {
        const regTotalCons = regConsumptionTotals[s.region] || 1;
        s.activeRegionTotalConsumption = regTotalCons;
        s.activeRegionConsumptionSharePct = regTotalCons > 0 
            ? Number(((s.activeConsumption / regTotalCons) * 100).toFixed(2)) 
            : 0;
        s.activeConsumptionToBillingPct = s.activeBilling > 0 
            ? Number(((s.activeConsumption / s.activeBilling) * 100).toFixed(2)) 
            : 0;
    });

    // Update Header Counts
    document.getElementById('statTotalSites').innerText = window.filteredDataset.length;
    
    const uniqueRegions = new Set(window.filteredDataset.map(s => s.region));
    document.getElementById('statTotalRegions').innerText = uniqueRegions.size;

    // Update Overview KPIs
    updateExecutiveKPIs(window.filteredDataset);

    // Refresh Active Tab Content
    refreshActiveTabContent();
};

function updateExecutiveKPIs(sites) {
    let totalBilling = 0;
    let totalExpense = 0;
    let totalConsumption = 0;

    sites.forEach(s => {
        totalBilling += s.activeBilling;
        totalExpense += s.activeExpense;
        totalConsumption += s.activeConsumption;
    });

    const avgBillingPerSite = sites.length > 0 ? Math.round(totalBilling / sites.length) : 0;
    const netProfit = totalBilling - (totalExpense + totalConsumption);
    const avgMargin = totalBilling > 0 ? ((netProfit / totalBilling) * 100).toFixed(2) : "0.00";

    const expenseRatio = totalBilling > 0 ? ((totalExpense / totalBilling) * 100).toFixed(1) : "0.0";
    const consumptionRatio = totalBilling > 0 ? ((totalConsumption / totalBilling) * 100).toFixed(1) : "0.0";

    const monthNameDisplay = window.selectedMonth && window.selectedMonth !== 'ALL' 
        ? `Month: ${window.selectedMonth} 2026` 
        : `Jan-Jul/Aug 2026`;

    document.getElementById('kpiTotalBilling').innerText = window.formatRupee(totalBilling);
    document.getElementById('kpiAvgBilling').innerText = `${window.formatRupee(avgBillingPerSite)} (${monthNameDisplay})`;
    document.getElementById('kpiTotalExpense').innerText = window.formatRupee(totalExpense);
    document.getElementById('kpiExpenseRatio').innerText = `${expenseRatio}% of Billing`;
    document.getElementById('kpiTotalConsumption').innerText = window.formatRupee(totalConsumption);
    document.getElementById('kpiConsumptionRatio').innerText = `${consumptionRatio}% of Billing`;

    document.getElementById('kpiGrossMargin').innerText = `${avgMargin}%`;
    document.getElementById('kpiGrossProfit').innerText = window.formatRupee(netProfit);

    // Update overview charts
    if (window.updateDashboardCharts) {
        window.updateDashboardCharts(sites);
    }
}

window.currentThresholdMode = 'SITE_BILLING';

window.updateThresholdValue = function(val) {
    window.currentThreshold = parseFloat(val);
    document.getElementById('thresholdDisplay').innerText = `${window.currentThreshold.toFixed(1)}%`;
    window.renderRegionConsumptionReport(window.filteredDataset, window.currentThreshold);
};

window.currentRegionViewFilter = 'ALERTS_ONLY';

window.updateRegionViewFilter = function(filter) {
    window.currentRegionViewFilter = filter;
    window.renderRegionConsumptionReport(window.filteredDataset, window.currentThreshold);
};

window.currentActiveTab = 'overview';

window.switchTab = function(tabName) {
    window.currentActiveTab = tabName;

    // Hide all tab views
    document.querySelectorAll('.tab-view').forEach(el => el.classList.add('hidden'));

    // Reset button styles
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-brand-600', 'text-white', 'shadow-md');
        btn.classList.add('text-gray-400', 'hover:text-white', 'hover:bg-gray-800/60');
    });

    // Show target view
    const targetView = document.getElementById(`view-${tabName}`);
    if (targetView) targetView.classList.remove('hidden');

    // Highlight target tab button
    const targetBtn = document.getElementById(`tab-${tabName}`);
    if (targetBtn) {
        targetBtn.classList.remove('text-gray-400', 'hover:text-white', 'hover:bg-gray-800/60');
        targetBtn.classList.add('bg-brand-600', 'text-white', 'shadow-md');
    }

    refreshActiveTabContent();
};

function refreshActiveTabContent() {
    const sites = window.filteredDataset || [];
    const activeTab = window.currentActiveTab || 'overview';

    // Lazy rendering: ONLY generate heavy HTML DOM tables for the tab the user is actively viewing!
    if (activeTab === 'regionConsumption') {
        window.renderRegionConsumptionReport(sites, window.currentThreshold);
    } else if (activeTab === 'financial') {
        window.renderFinancialReport(sites);
    } else if (activeTab === 'hierarchy') {
        window.renderHierarchyReport(sites);
    } else if (activeTab === 'trends') {
        window.renderMonthlyTrendsReport(sites);
    } else if (activeTab === 'datatable') {
        renderMasterTable(sites);
    }
}

window.masterDisplayLimit = 200;

function renderMasterTable(sites) {
    const tbody = document.getElementById('masterTbody');
    if (!tbody) return;

    document.getElementById('masterRowCount').innerText = sites.length;

    const limit = window.masterDisplayLimit || 200;
    const renderSites = sites.slice(0, limit);

    let rowsHtml = renderSites.map(s => `
        <tr class="hover:bg-gray-800/40 transition">
            <td class="py-2.5 px-3 font-mono text-gray-500">${s.sno}</td>
            <td class="py-2.5 px-3 font-mono font-bold text-brand-400">
                <button onclick="openSiteDetailModal('${s.siteCode}')" class="text-left group/btn focus:outline-none hover:underline flex items-center gap-1.5" title="Click for calculation audit">
                    <span>${s.siteCode}</span>
                    <i class="fa-solid fa-calculator text-[9px] text-gray-500 group-hover/btn:text-brand-400"></i>
                </button>
            </td>
            <td class="py-2.5 px-3 font-semibold text-gray-200">${s.region}</td>
            <td class="py-2.5 px-3 font-medium text-white">
                <button onclick="openSiteDetailModal('${s.siteCode}')" class="text-left hover:underline focus:outline-none" title="Click for calculation audit">
                    ${s.siteName}
                </button>
            </td>
            <td class="py-2.5 px-3 text-gray-400">${s.customerGroup}</td>
            <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px]">${s.siteStatus}</span></td>
            <td class="py-2.5 px-3 text-gray-400">${s.supervisor}</td>
            <td class="py-2.5 px-3 text-gray-400">${s.assistantManager}</td>
            <td class="py-2.5 px-3 text-gray-300 font-medium">${s.manager}</td>
            <td class="py-2.5 px-3 text-gray-300 font-medium">${s.srManager}</td>
            <td class="py-2.5 px-3 text-right font-mono text-white">${window.formatRupee(s.activeBilling)}</td>
            <td class="py-2.5 px-3 text-right font-mono text-red-400">${window.formatRupee(s.activeExpense)}</td>
            <td class="py-2.5 px-3 text-right font-mono text-purple-400">${window.formatRupee(s.activeConsumption)}</td>
            <td class="py-2.5 px-3 text-right font-mono font-bold ${s.activeGrossMargin >= 15 ? 'text-emerald-400' : 'text-amber-400'}">${s.activeGrossMargin}%</td>
        </tr>
    `).join('');

    if (sites.length > limit) {
        rowsHtml += `
            <tr id="loadMoreMasterRow">
                <td colspan="14" class="py-4 text-center bg-gray-900/60">
                    <button onclick="loadAllMasterRows()" class="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg transition">
                        ⚡ Showing first ${limit} of ${sites.length} sites — Click to load all ${sites.length} rows
                    </button>
                </td>
            </tr>
        `;
    }

    tbody.innerHTML = rowsHtml;
}

window.loadAllMasterRows = function() {
    window.masterDisplayLimit = 999999;
    renderMasterTable(window.filteredDataset || []);
};

window.searchMasterTable = function() {
    const q = document.getElementById('masterSearch').value.toLowerCase().trim();
    if (!q) {
        renderMasterTable(window.filteredDataset);
        return;
    }

    const filtered = window.filteredDataset.filter(s => {
        return s.siteCode.toLowerCase().includes(q) ||
            s.siteName.toLowerCase().includes(q) ||
            s.region.toLowerCase().includes(q) ||
            s.customerGroup.toLowerCase().includes(q) ||
            s.manager.toLowerCase().includes(q) ||
            s.srManager.toLowerCase().includes(q) ||
            s.supervisor.toLowerCase().includes(q);
    });

    renderMasterTable(filtered);
};
