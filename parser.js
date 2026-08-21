/**
 * Data Parser & Normalizer Module (v2026.2 - Universal Resilient Engine)
 * Processes Excel raw rows, handles multi-line headers, handles standalone summary columns,
 * and dynamically normalizes site metrics regardless of future header/column format changes.
 */

if (typeof window.formatRupee !== 'function') {
    window.formatRupee = function(amount) {
        if (isNaN(amount) || amount === null || amount === undefined) return "₹0";
        return "₹" + Math.round(amount).toLocaleString('en-IN');
    };
}

window.MONTH_NAMES = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST'];

window.parseExcelFile = function(file, callback) {
    if (typeof XLSX === 'undefined') {
        alert("The Excel processing engine (SheetJS) is loading or unavailable. Please refresh the page and try again.");
        return;
    }

    const reader = new FileReader();

    reader.onerror = function() {
        alert("Error reading file from disk. Please try selecting the file again.");
        const titleEl = document.getElementById('datasetTitle');
        if (titleEl) titleEl.innerText = 'Upload your Site Billing & Consumption Excel Sheet';
    };

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            // Ultra-fast parsing: disable heavy formulas & styles
            const workbook = XLSX.read(data, {
                type: 'array',
                cellDates: true,
                cellStyles: false,
                cellFormulas: false
            });

            if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
                alert("The selected Excel file contains no readable worksheets.");
                const titleEl = document.getElementById('datasetTitle');
                if (titleEl) titleEl.innerText = 'Upload your Site Billing & Consumption Excel Sheet';
                return;
            }

            // Scan all worksheets for site data
            const sheetResults = [];

            workbook.SheetNames.forEach(name => {
                const sheet = workbook.Sheets[name];
                if (!sheet) return;
                try {
                    const allRows = XLSX.utils.sheet_to_json(sheet, {
                        header: 1,       // returns array of arrays
                        defval: "",
                        blankrows: false // skip blank spacer rows for speed
                    });

                    if (!allRows || allRows.length === 0) return;

                    // Auto-detect header row (scan first 25 rows)
                    const headerKeywords = [
                        'site', 'region', 'billing', 'expense', 'consumption',
                        'manager', 'status', 'customer', 'code', 'name', 'month',
                        'revenue', 'manpower', 'material', 'gross', 'net', 'profit', 'sno', 'sl'
                    ];
                    let headerRowIdx = -1;
                    let bestScore = 0;

                    const scanLimit = Math.min(25, allRows.length);
                    for (let i = 0; i < scanLimit; i++) {
                        const row = allRows[i];
                        if (!row || row.length === 0) continue;
                        const nonEmpty = row.filter(c => String(c).trim() !== '');
                        if (nonEmpty.length < 2) continue;

                        const score = nonEmpty.reduce((s, cell) => {
                            const cl = String(cell).trim().toLowerCase();
                            return s + (headerKeywords.some(kw => cl.includes(kw)) ? 1 : 0);
                        }, 0);

                        if (score > bestScore) {
                            bestScore = score;
                            headerRowIdx = i;
                        }
                    }

                    if (headerRowIdx === -1 || bestScore < 1) return;

                    const rawHeaders = allRows[headerRowIdx] || [];
                    const prevRow = headerRowIdx > 0 ? allRows[headerRowIdx - 1] : null;
                    const colIndexMap = {};

                    rawHeaders.forEach((h, colIdx) => {
                        let hClean = String(h || '').trim();
                        let parentH = prevRow && prevRow[colIdx] ? String(prevRow[colIdx]).trim() : '';

                        if (parentH && parentH !== hClean && !parentH.toLowerCase().includes('site') && !parentH.toLowerCase().includes('sno')) {
                            if (hClean && hClean !== '__EMPTY') {
                                hClean = `${parentH}_${hClean}`;
                            } else if (parentH) {
                                hClean = parentH;
                            }
                        }

                        if (hClean !== '' && hClean !== '__EMPTY') {
                            if (colIndexMap[hClean] !== undefined) {
                                colIndexMap[`${hClean}_col${colIdx}`] = colIdx;
                            } else {
                                colIndexMap[hClean] = colIdx;
                            }
                        }
                    });

                    const dataRows = allRows.slice(headerRowIdx + 1);
                    
                    // Collect all non-empty rows across the entire sheet (no artificial truncations)
                    const validDataRows = dataRows.filter(row => row && Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''));

                    if (validDataRows.length === 0) return;

                    const rawJson = validDataRows.map(row => {
                        const obj = {};
                        Object.entries(colIndexMap).forEach(([hName, colIdx]) => {
                            obj[hName] = row[colIdx] !== undefined ? row[colIdx] : "";
                        });
                        return obj;
                    });

                    const processed = window.normalizeRawData(rawJson);
                    if (processed.length > 0) {
                        sheetResults.push({ processed, sheetName: name, count: processed.length });
                    }
                } catch (sErr) {
                    console.warn(`[Parser] Error reading sheet '${name}':`, sErr);
                }
            });

            if (sheetResults.length === 0) {
                alert("Could not find site billing & consumption data in the uploaded Excel file.");
                const titleEl = document.getElementById('datasetTitle');
                if (titleEl) titleEl.innerText = 'Upload your Site Billing & Consumption Excel Sheet';
                return;
            }

            // Smart Selection:
            // 1. If any single sheet has > 500 sites, it is the master consolidated sheet!
            // 2. Otherwise, combine site records from all sheets.
            let finalSites = [];
            let loadedSourceName = '';

            const masterSheet = sheetResults.find(sr => sr.count > 500);
            if (masterSheet) {
                finalSites = masterSheet.processed;
                loadedSourceName = `${file.name} [${masterSheet.sheetName}]`;
            } else {
                // Combine all sheets
                sheetResults.forEach(sr => {
                    finalSites = finalSites.concat(sr.processed);
                });
                loadedSourceName = `${file.name} [Combined ${sheetResults.length} Sheets]`;
            }

            // Re-index site IDs
            finalSites.forEach((s, idx) => {
                s.id = idx + 1;
                s.sno = idx + 1;
            });

            console.log(`[Parser] Successfully loaded ${finalSites.length} sites from file '${file.name}'`);
            callback(finalSites, loadedSourceName);



        } catch (err) {
            console.error("Excel Parsing Error:", err);
            alert("Could not parse the selected Excel file. Please ensure it is a valid .xlsx or .xls file.\n\nError: " + err.message);
            const titleEl = document.getElementById('datasetTitle');
            if (titleEl) titleEl.innerText = 'Upload your Site Billing & Consumption Excel Sheet';
        }
    };
    reader.readAsArrayBuffer(file);
};





window.normalizeRawData = function(rows, customMapping = null) {
    if (!rows || rows.length === 0) return [];

    // Extract headers from first row keys
    const sample = rows[0];
    const keys = Object.keys(sample);

    if (!customMapping) {
        try {
            const saved = localStorage.getItem('site_analytics_custom_mapping');
            if (saved) customMapping = JSON.parse(saved);
        } catch (e) {}
    }

    const findKey = (candidates, exclude = []) => {
        return keys.find(k => {
            const clean = k.trim().toLowerCase();
            if (exclude.includes(k)) return false;
            return candidates.some(c => clean === c.toLowerCase() || clean.includes(c.toLowerCase()));
        }) || "";
    };

    const findKeyExact = (candidates, exclude = []) => {
        const exact = keys.find(k => {
            if (exclude.includes(k)) return false;
            const clean = k.trim().toLowerCase();
            return candidates.some(c => clean === c.toLowerCase());
        });
        if (exact) return exact;
        return keys.find(k => {
            if (exclude.includes(k)) return false;
            const clean = k.trim().toLowerCase();
            return candidates.some(c => clean.includes(c.toLowerCase()));
        }) || "";
    };

    const keySno        = customMapping?.sno || findKey(['s.no', 'sno', 'sl no', 'sr no', 's. no', 'serial', 'sl.no', 's_no', 'index', '#']);
    const keySiteCode   = customMapping?.siteCode || findKey(['site code', 'siteid', 'site_code', 'site id', 'site_id', 'site no', 'unit code', 'branch code', 'location code', 'site number', 'unit no', 'code', 'site_id']);
    const keyRegion     = customMapping?.region || findKey(['region', 'zone', 'state', 'circle', 'area', 'reg', 'territory', 'city']);
    
    const keySiteName = customMapping?.siteName || findKeyExact(
        ['site name', 'sitename', 'site_name', 'unit name', 'branch name', 'location name',
         'property name', 'facility name', 'client name', 'account name', 'project name', 'building name',
         'site', 'name', 'unit', 'location', 'property', 'facility', 'building', 'project', 'client', 'account'],
        [keySiteCode]
    );

    const keyCustGroup  = customMapping?.custGroup || findKey(['customer group', 'customergroup', 'customer_group', 'client group', 'client', 'customer', 'account']);
    const keyStatus     = customMapping?.status || findKey(['site status', 'sitestatus', 'status', 'active status']);
    const keySupervisor = customMapping?.supervisor || findKey(['supervisor', 'super visor', 'field supervisor']);

    const keySalesModel = customMapping?.salesModel || findKey(['sales model', 'sales_model', 'salesmodel', 'business model', 'model']);
    const keyServiceProvider = customMapping?.serviceProvider || findKey(['service provider', 'service_provider', 'serviceprovider', 'provider', 'vendor', 'contractor']);

    const keySrManager  = customMapping?.srManager || keys.find(k => {
        const cl = k.trim().toLowerCase();
        return (cl.includes('sr') || cl.includes('senior')) && cl.includes('manager');
    }) || findKey(['sr manager', 'sr. manager', 'senior manager', 'sr mgr']) || "";

    const keyAM = customMapping?.am || keys.find(k => {
        const cl = k.trim().toLowerCase();
        return cl.includes('assistant') && cl.includes('manager');
    }) || findKey(['assistant manager', 'assitant manager', 'ast manager', 'am']) || "";

    const keyManager = customMapping?.manager || keys.find(k => {
        const cl = k.trim().toLowerCase();
        return cl.includes('manager')
            && !cl.includes('sr') && !cl.includes('senior') && !cl.includes('assistant');
    }) || findKey(['manager', 'mgr', 'site manager']) || "";

    const monthKwList = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', '2024', '2025', '2026', '2027'];
    const isMonthColHeader = (k) => {
        const cl = k.trim().toLowerCase();
        return monthKwList.some(m => cl.includes(m));
    };

    const keyStandaloneBilling = customMapping?.billing || keys.find(k => {
        if (isMonthColHeader(k)) return false;
        const cl = k.trim().toLowerCase();
        if (cl.includes('%') || cl.includes('pct') || cl.includes('share')) return false;
        return ['total billing', 'billing value', 'billing amount', 'billed amount', 'gross billing'].some(kw => cl.includes(kw));
    }) || "";

    const keyStandaloneExpense = customMapping?.expense || keys.find(k => {
        if (isMonthColHeader(k)) return false;
        const cl = k.trim().toLowerCase();
        if (cl.includes('%') || cl.includes('pct') || cl.includes('share')) return false;
        return ['total manpower expense', 'total expense', 'manpower expense', 'manpower cost'].some(kw => cl.includes(kw));
    }) || "";

    const keyStandaloneCons = customMapping?.consumption || keys.find(k => {
        if (isMonthColHeader(k)) return false;
        const cl = k.trim().toLowerCase();
        if (cl.includes('%') || cl.includes('pct') || cl.includes('share') || cl.includes('ratio')) return false;
        return ['total consumption value', 'total consumption', 'consumption value', 'material consumption'].some(kw => cl.includes(kw));
    }) || "";

    const keySheetReplPct = keys.find(k => {
        const cl = k.trim().toLowerCase();
        return (cl.includes('replacement') || cl.includes('consumption') || cl.includes('material') || cl.includes('repl') || cl.includes('cons')) && (cl.includes('%') || cl.includes('pct') || cl.includes('share') || cl.includes('ratio'));
    }) || "";    const excludedMonthColKeys = [
        keySno, keySiteCode, keyRegion, keySiteName, keyCustGroup, keyStatus,
        keySupervisor, keyAM, keyManager, keySrManager, keySalesModel, keyServiceProvider,
        keyStandaloneBilling, keyStandaloneExpense, keyStandaloneCons, keySheetReplPct
    ].filter(k => k && k !== '');

    const monthsDetected = [];
    const monthPatterns = [
        { name: 'Jan', keys: ['january', 'jan', '01/', '01-', '/01/', '-01-', '01_', '_01_', '2026-01', '2027-01', 'month 1', 'month-1', 'm01'] },
        { name: 'Feb', keys: ['february', 'feb', '02/', '02-', '/02/', '-02-', '02_', '_02_', '2026-02', '2027-02', 'month 2', 'month-2', 'm02'] },
        { name: 'Mar', keys: ['march', 'mar', '03/', '03-', '/03/', '-03-', '03_', '_03_', '2026-03', '2027-03', 'month 3', 'month-3', 'm03'] },
        { name: 'Apr', keys: ['april', 'apr', '04/', '04-', '/04/', '-04-', '04_', '_04_', '2026-04', '2027-04', 'month 4', 'month-4', 'm04'] },
        { name: 'May', keys: ['may', '05/', '05-', '/05/', '-05-', '05_', '_05_', '2026-05', '2027-05', 'month 5', 'month-5', 'm05'] },
        { name: 'Jun', keys: ['june', 'jun', '06/', '06-', '/06/', '-06-', '06_', '_06_', '2026-06', '2027-06', 'month 6', 'month-6', 'm06'] },
        { name: 'Jul', keys: ['july', 'jul', '07/', '07-', '/07/', '-07-', '07_', '_07_', '2026-07', '2027-07', 'month 7', 'month-7', 'm07'] },
        { name: 'Aug', keys: ['august', 'aug', '08/', '08-', '/08/', '-08-', '08_', '_08_', '2026-08', '2027-08', 'month 8', 'month-8', 'm08'] },
        { name: 'Sep', keys: ['september', 'sept', 'sep', '09/', '09-', '/09/', '-09-', '09_', '_09_', '2026-09', '2027-09', 'month 9', 'month-9', 'm09'] },
        { name: 'Oct', keys: ['october', 'oct', '10/', '10-', '/10/', '-10-', '10_', '_10_', '2026-10', '2027-10', 'month 10', 'month-10', 'm10'] },
        { name: 'Nov', keys: ['november', 'nov', '11/', '11-', '/11/', '-11-', '11_', '_11_', '2026-11', '2027-11', 'month 11', 'month-11', 'm11'] },
        { name: 'Dec', keys: ['december', 'dec', '12/', '12-', '/12/', '-12-', '12_', '_12_', '2026-12', '2027-12', 'month 12', 'month-12', 'm12'] }
    ];

    const detectedMonthNames = [];

    monthPatterns.forEach(mp => {
        let bCol = "", eCol = "", cCol = "";
        keys.forEach(k => {
            const kLower = k.trim().toLowerCase();
            if (excludedMonthColKeys.includes(k) || ['remarks', 'notes', 'comment', 'description', 'detail'].some(x => kLower.includes(x))) {
                return;
            }

            const matchesMonth = mp.keys.some(mk => kLower.includes(mk));
            if (matchesMonth) {
                if (kLower.includes('bill') || kLower.includes('revenue') || kLower.includes('invoic') || kLower.includes('billed')) {
                    bCol = k;
                } else if (kLower.includes('exp') || kLower.includes('manpower') || kLower.includes('salary') || kLower.includes('wage') || kLower.includes('labor')) {
                    eCol = k;
                } else if (kLower.includes('consum') || kLower.includes('material') || kLower.includes('suppli') || kLower.includes('spare') || kLower.includes('replacement cost') || kLower.includes('replacement value') || kLower.includes('repl cost') || kLower.includes('repl value')) {
                    cCol = k;
                } else {
                    const isExactMonthHeader = mp.keys.some(mk => kLower === mk || kLower === mk + ' 2026' || kLower === mk + ' 2025' || kLower === mk + ' 2027');
                    if (isExactMonthHeader && !bCol) bCol = k;
                }
            }
        });

        if (bCol || eCol || cCol) {
            let yearLabel = '';
            const anyCol = bCol || eCol || cCol;
            const yearMatch = anyCol.match(/20\d{2}/);
            if (yearMatch) yearLabel = ' ' + yearMatch[0];

            const monthKey = mp.name + yearLabel;
            detectedMonthNames.push(monthKey);
            monthsDetected.push({
                name: monthKey,
                shortName: mp.name,
                billingCol: bCol,
                expenseCol: eCol,
                consumptionCol: cCol
            });
        }
    });

    if (detectedMonthNames.length > 0) {
        window.MONTH_NAMES = detectedMonthNames;
    }

    const keyAvgConsumption = findKey(['average monthly consumption', 'avg monthly consumption']);
    const keyAvgBilling     = findKey(['average monthly billing', 'avg monthly billing']);
    const keyAvgManpower    = findKey(['average manpower expense', 'avg manpower expense']);
    const keyAvgMargin      = findKey(['avg gross margin', 'average gross margin', 'gross margin']);

    const normalizedSites = rows.map((r, idx) => {
        const siteCode = String(r[keySiteCode] || `ST-SITE-${idx + 1}`).trim();
        const siteName = keySiteName ? String(r[keySiteName] || siteCode).trim() : siteCode;
        const region = String(r[keyRegion] || 'UNASSIGNED').trim().toUpperCase();
        const custGroup = String(r[keyCustGroup] || 'General').trim();
        const status = String(r[keyStatus] || 'Active').trim();
        const supervisor = String(r[keySupervisor] || 'N/A').trim();
        const am = String(r[keyAM] || 'N/A').trim();
        const manager = String(r[keyManager] || 'N/A').trim();
        const srManager = String(r[keySrManager] || 'N/A').trim();
        const salesModel = String(r[keySalesModel] || 'N/A').trim();
        const serviceProvider = String(r[keyServiceProvider] || 'N/A').trim();

        let totalBilling = 0;
        let totalExpense = 0;
        let totalConsumption = 0;
        let activeMonthCount = 0;

        const monthlyMetrics = {};

        monthsDetected.forEach(m => {
            const bVal = parseNumber(r[m.billingCol]);
            const eVal = parseNumber(r[m.expenseCol]);
            const cVal = parseNumber(r[m.consumptionCol]);

            const metricObj = {
                billing: bVal,
                expense: eVal,
                consumption: cVal,
                totalCost: eVal + cVal,
                netProfit: bVal - (eVal + cVal)
            };

            monthlyMetrics[m.name] = metricObj;
            if (m.shortName && !monthlyMetrics[m.shortName]) {
                monthlyMetrics[m.shortName] = metricObj;
            }

            totalBilling += bVal;
            totalExpense += eVal;
            totalConsumption += cVal;
            if (bVal > 0 || eVal > 0 || cVal > 0) activeMonthCount++;
        });

        if (customMapping && (customMapping.billing || customMapping.expense || customMapping.consumption)) {
            const bCustom = customMapping.billing ? parseNumber(r[customMapping.billing]) : 0;
            const eCustom = customMapping.expense ? parseNumber(r[customMapping.expense]) : 0;
            const cCustom = customMapping.consumption ? parseNumber(r[customMapping.consumption]) : 0;
            if (bCustom > 0 || eCustom > 0 || cCustom > 0) {
                totalBilling = bCustom;
                totalExpense = eCustom;
                totalConsumption = cCustom;
            }
        } else if (totalBilling === 0) {
            const bStandalone = parseNumber(r[keyStandaloneBilling]);
            const eStandalone = parseNumber(r[keyStandaloneExpense]);
            const cStandalone = parseNumber(r[keyStandaloneCons]);

            if (bStandalone > 0 || eStandalone > 0 || cStandalone > 0) {
                totalBilling = bStandalone;
                totalExpense = eStandalone;
                totalConsumption = cStandalone;
            }
        }

        const explicitPct = keySheetReplPct ? parseNumber(r[keySheetReplPct]) : 0;
        if (totalConsumption === 0 && explicitPct > 0 && totalBilling > 0) {
            totalConsumption = Math.round((totalBilling * explicitPct) / 100);
        }

        if (totalBilling === 0 && totalExpense === 0 && totalConsumption === 0) {
            const hasRealCode = keySiteCode && r[keySiteCode] && String(r[keySiteCode]).trim() !== '';
            const hasRealName = keySiteName && r[keySiteName] && String(r[keySiteName]).trim() !== '';
            if (hasRealCode || hasRealName) {
                const numCols = [];
                Object.entries(r).forEach(([k, val]) => {
                    const num = parseNumber(val);
                    if (num > 0 && !k.toLowerCase().includes('sno') && !k.toLowerCase().includes('code')) {
                        numCols.push({ key: k, val: num });
                    }
                });

                numCols.sort((a, b) => b.val - a.val);

                if (numCols.length >= 1) totalBilling = numCols[0].val;
                if (numCols.length >= 2) totalExpense = numCols[1].val;
                if (numCols.length >= 3) totalConsumption = numCols[2].val;
            }
        }

        const mCount = activeMonthCount || 1;

        const sheetAvgConsumption = parseNumber(r[keyAvgConsumption]);
        const sheetAvgBilling     = parseNumber(r[keyAvgBilling]);
        const sheetAvgExpense     = parseNumber(r[keyAvgManpower]);
        const sheetAvgMargin      = parseNumber(r[keyAvgMargin]);

        const avgBilling     = sheetAvgBilling > 0 ? sheetAvgBilling : Math.round(totalBilling / mCount);
        const avgExpense     = sheetAvgExpense > 0 ? sheetAvgExpense : Math.round(totalExpense / mCount);
        const avgConsumption = sheetAvgConsumption > 0 ? sheetAvgConsumption : Math.round(totalConsumption / mCount);
        const totalNetProfit = totalBilling - (totalExpense + totalConsumption);
        const avgGrossMargin = sheetAvgMargin !== 0 
            ? sheetAvgMargin 
            : (totalBilling > 0 ? Number(((totalNetProfit / totalBilling) * 100).toFixed(2)) : 0);

        return {
            id: idx + 1,
            sno: r[keySno] || idx + 1,
            siteCode,
            siteName,
            region,
            customerGroup: custGroup,
            salesModel,
            serviceProvider,
            siteStatus: status,
            supervisor,
            assistantManager: am,
            manager,
            srManager,

            totalBilling,
            totalExpense,
            totalConsumption,
            totalCost: totalExpense + totalConsumption,
            totalNetProfit,

            avgBilling,
            avgExpense,
            avgConsumption,
            avgGrossMargin,

            monthlyMetrics,
            rawRow: r
        };
    });

    // Filter out empty dummy rows and summary total header/footer rows
    const validSites = normalizedSites.filter(s => {
        const cLower = String(s.siteCode || '').toLowerCase();
        const nLower = String(s.siteName || '').toLowerCase();

        // Ignore total/summary header/footer rows
        if (cLower.includes('total') || nLower.includes('total') || cLower.includes('subtotal') || nLower.includes('subtotal') || cLower.includes('grand total')) {
            return false;
        }

        // Must have an explicit site code OR explicit site name OR actual non-zero financial numbers
        const hasRealCode = s.siteCode && !s.siteCode.startsWith('ST-SITE-');
        const hasRealName = s.siteName && s.siteName !== s.siteCode;
        const hasFinancials = s.totalBilling > 0 || s.totalExpense > 0 || s.totalConsumption > 0;

        return hasRealCode || hasRealName || hasFinancials;
    });

    // Re-index valid site IDs
    validSites.forEach((s, idx) => {
        s.id = idx + 1;
        if (!s.sno || typeof s.sno === 'number') s.sno = idx + 1;
    });

    // Compute Region Totals & Consumption Percentage Shares
    const regionTotals = {};
    validSites.forEach(s => {
        if (!regionTotals[s.region]) {
            regionTotals[s.region] = {
                totalBilling: 0,
                totalExpense: 0,
                totalConsumption: 0,
                siteCount: 0
            };
        }
        regionTotals[s.region].totalBilling += s.totalBilling;
        regionTotals[s.region].totalExpense += s.totalExpense;
        regionTotals[s.region].totalConsumption += s.totalConsumption;
        regionTotals[s.region].siteCount++;
    });

    // Attach region consumption share % to each site
    validSites.forEach(s => {
        const regTotalConsumption = regionTotals[s.region]?.totalConsumption || 1;
        s.regionTotalConsumption = regTotalConsumption;
        s.regionConsumptionSharePct = Number(((s.totalConsumption / regTotalConsumption) * 100).toFixed(2));
        
        // Also share of billing
        s.consumptionToBillingPct = s.totalBilling > 0 
            ? Number(((s.totalConsumption / s.totalBilling) * 100).toFixed(2)) 
            : 0;
    });

    return validSites;
};


function parseNumber(val) {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === 'number') return val;
    const str = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

/** ── ONEDRIVE ONLINE CLIPBOARD COPY-PASTE PARSER ───────────────────── */
window.parseClipboardData = function(text, callback) {
    try {
        if (!text || !text.trim()) {
            alert("No text pasted. Please copy data rows from Excel Online (OneDrive) and paste into the box.");
            return;
        }

        const workbook = XLSX.read(text, { type: 'string' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const allRows = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
            blankrows: true
        });

        if (!allRows || allRows.length === 0) {
            alert("Could not extract data rows from pasted text.");
            return;
        }

        let headerRowIdx = 0;
        let bestScore = -1;
        const headerKeywords = ['site', 'region', 'billing', 'expense', 'consumption', 'manager', 'status', 'customer', 'code', 'name'];

        const scanLimit = Math.min(10, allRows.length);
        for (let i = 0; i < scanLimit; i++) {
            const row = allRows[i];
            if (!row || row.length === 0) continue;
            const nonEmpty = row.filter(c => String(c).trim() !== '');
            if (nonEmpty.length < 2) continue;

            const score = nonEmpty.reduce((s, cell) => {
                const cl = String(cell).trim().toLowerCase();
                return s + (headerKeywords.some(kw => cl.includes(kw)) ? 1 : 0);
            }, 0);

            if (score > bestScore) {
                bestScore = score;
                headerRowIdx = i;
            }
        }

        const rawHeaders = allRows[headerRowIdx];
        const colIndexMap = {};
        rawHeaders.forEach((h, colIdx) => {
            const hClean = String(h || '').trim();
            if (hClean !== '' && hClean !== '__EMPTY') {
                colIndexMap[hClean] = colIdx;
            }
        });

        const dataRows = allRows.slice(headerRowIdx + 1);
        const rawJson = dataRows
            .filter(row => row && row.some(cell => String(cell).trim() !== ''))
            .map(row => {
                const obj = {};
                Object.entries(colIndexMap).forEach(([hName, colIdx]) => {
                    obj[hName] = row[colIdx] !== undefined ? row[colIdx] : "";
                });
                return obj;
            });

        const processedData = normalizeRawData(rawJson);
        if (processedData.length === 0) {
            alert("Pasted text was parsed, but no valid site records were recognized.");
            return;
        }

        callback(processedData, "OneDrive Online Pasted Data");
    } catch (err) {
        console.error("Clipboard parsing error:", err);
        alert("Could not parse the pasted text. Error: " + err.message);
    }
};

/** ── ONEDRIVE DIRECT URL PARSER ───────────────────────────────────── */
window.parseOneDriveUrl = function(url, callback) {
    if (!url || !url.trim()) {
        alert("Please enter a valid OneDrive/SharePoint URL.");
        return;
    }

    let downloadUrl = url.trim();
    if (downloadUrl.includes('onedrive.live.com') && !downloadUrl.includes('download')) {
        downloadUrl = downloadUrl.replace('/view.aspx', '/download.aspx').replace('redir?', 'download?');
    } else if (downloadUrl.includes('sharepoint.com') && !downloadUrl.includes('download=1')) {
        downloadUrl += downloadUrl.includes('?') ? '&download=1' : '?download=1';
    }

    fetch(downloadUrl)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
            return res.arrayBuffer();
        })
        .then(buffer => {
            const data = new Uint8Array(buffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", blankrows: true });
            
            let headerRowIdx = 0;
            let bestScore = -1;
            const headerKeywords = ['site', 'region', 'billing', 'expense', 'consumption', 'manager', 'status', 'customer', 'code', 'name'];

            const scanLimit = Math.min(10, allRows.length);
            for (let i = 0; i < scanLimit; i++) {
                const row = allRows[i];
                if (!row || row.length === 0) continue;
                const nonEmpty = row.filter(c => String(c).trim() !== '');
                if (nonEmpty.length < 2) continue;

                const score = nonEmpty.reduce((s, cell) => {
                    const cl = String(cell).trim().toLowerCase();
                    return s + (headerKeywords.some(kw => cl.includes(kw)) ? 1 : 0);
                }, 0);

                if (score > bestScore) {
                    bestScore = score;
                    headerRowIdx = i;
                }
            }

            const rawHeaders = allRows[headerRowIdx];
            const colIndexMap = {};
            rawHeaders.forEach((h, colIdx) => {
                const hClean = String(h || '').trim();
                if (hClean !== '' && hClean !== '__EMPTY') {
                    colIndexMap[hClean] = colIdx;
                }
            });

            const dataRows = allRows.slice(headerRowIdx + 1);
            const rawJson = dataRows
                .filter(row => row && row.some(cell => String(cell).trim() !== ''))
                .map(row => {
                    const obj = {};
                    Object.entries(colIndexMap).forEach(([hName, colIdx]) => {
                        obj[hName] = row[colIdx] !== undefined ? row[colIdx] : "";
                    });
                    return obj;
                });

            const processedData = normalizeRawData(rawJson);
            callback(processedData, "OneDrive Online File");
        })
        .catch(err => {
            console.error("OneDrive URL fetch error:", err);
            alert("Could not load file directly from URL. Please ensure link permissions allow downloading.\n\nTip: You can also use the 'Paste OneDrive Data' button to copy & paste rows directly from Excel Online!\n\nError: " + err.message);
        });
};