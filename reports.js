<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site Analytics & Executive Report Generator</title>
    
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- FontAwesome & Google Fonts -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    
    <!-- Chart.js for data visualization -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <!-- SheetJS for Excel Reading and Exporting -->
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <script>
        if (typeof XLSX === 'undefined') {
            document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"><\/script>');
        }
    </script>

    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                        mono: ['"JetBrains Mono"', 'monospace'],
                    },
                    colors: {
                        brand: {
                            50: '#f0f7ff',
                            100: '#e0effe',
                            500: '#3b82f6',
                            600: '#2563eb',
                            700: '#1d4ed8',
                            900: '#1e3a8a',
                        },
                        dark: {
                            bg: '#0B0F19',
                            card: '#111827',
                            border: '#1F2937',
                            hover: '#374151',
                        }
                    }
                }
            }
        }
    </script>
    
    <style>
        body {
            background-color: #0B0F19;
            color: #F3F4F6;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* Glassmorphism utilities */
        .glass-panel {
            background: rgba(17, 24, 39, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        
        .glass-panel-accent {
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(17, 24, 39, 0.7));
            backdrop-filter: blur(12px);
            border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .glass-card-alert {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(17, 24, 39, 0.8));
            backdrop-filter: blur(12px);
            border: 1px solid rgba(239, 68, 68, 0.3);
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #0B0F19;
        }
        ::-webkit-scrollbar-thumb {
            background: #1F2937;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #374151;
        }

        /* Print styles */
        @media print {
            body { background: white; color: black; }
            .no-print { display: none !important; }
            .glass-panel { border: 1px solid #ccc; background: white; color: black; box-shadow: none; }
        }
    </style>
</head>
<body class="min-h-screen flex flex-col antialiased selection:bg-brand-500 selection:text-white">

    <!-- Top Navigation Bar -->
    <header class="sticky top-0 z-50 glass-panel border-b border-gray-800/80 px-6 py-3.5">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            
            <!-- Logo & Title -->
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
                    <i class="fa-solid fa-chart-line text-white text-lg"></i>
                </div>
                <div>
                    <h1 class="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                        Site Analytics & Reporter
                        <span class="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-medium border border-brand-500/30">v2026.1</span>
                    </h1>
                    <p class="text-xs text-gray-400">Billing, Expense & Region Consumption Reporting</p>
                </div>
            </div>

            <!-- Privacy Indicator Badge -->
            <div class="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <i class="fa-solid fa-shield-halved text-emerald-400"></i>
                <span>100% Client-Side Privacy (Data Never Leaves Computer)</span>
            </div>

            <!-- Action Controls: Upload & Sample Data -->
            <div class="flex items-center space-x-3 no-print">
                <button id="btnLoadSample" onclick="loadSampleData()" class="px-3.5 py-2 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition flex items-center gap-2 shadow-sm">
                    <i class="fa-solid fa-wand-magic-sparkles text-amber-400"></i>
                    <span>Load Demo Data</span>
                </button>

                <button onclick="openMetricGuideModal()" class="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-2 shadow-sm">
                    <i class="fa-solid fa-circle-question text-indigo-400"></i>
                    <span>Calculation Guide</span>
                </button>

                <label for="excelFileInput" class="cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white transition flex items-center gap-2 shadow-md shadow-brand-600/30">
                    <i class="fa-solid fa-file-excel"></i>
                    <span>Upload Excel File</span>
                </label>
                <input type="file" id="excelFileInput" accept=".xlsx, .xls, .csv" style="position:absolute; width:1px; height:1px; opacity:0; overflow:hidden; z-index:-1;" onchange="handleFileUpload(event)">

                <!-- OneDrive Import Button -->
                <button onclick="openPasteModal()" class="px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-700/30 hover:bg-sky-600/40 text-sky-300 border border-sky-500/40 transition flex items-center gap-2 shadow-sm" title="Import data copied from OneDrive/SharePoint Excel Online">
                    <i class="fa-brands fa-microsoft text-sky-400"></i>
                    <span>Import from OneDrive</span>
                </button>

                <button id="btnCustomExport" onclick="openReportModal()" class="px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition flex items-center gap-2 shadow-md shadow-emerald-600/30 disabled:opacity-50" disabled>
                    <i class="fa-solid fa-file-export text-sm"></i>
                    <span>Download Report Options...</span>
                </button>

                <!-- Month-Wise Report Download Menu -->
                <div class="relative inline-block text-left no-print">
                    <button id="btnMonthDownloadMenu" onclick="toggleMonthDownloadMenu(event)" class="px-3.5 py-2 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50" disabled>
                        <i class="fa-solid fa-calendar-day text-amber-400"></i>
                        <span>Quick Month Export</span>
                        <i class="fa-solid fa-chevron-down text-[10px] ml-0.5"></i>
                    </button>
                    
                    <!-- Dropdown Menu Box -->
                    <div id="monthDownloadDropdown" class="hidden absolute right-0 mt-2 w-64 glass-panel rounded-xl shadow-2xl border border-gray-700 py-2 z-50 divide-y divide-gray-800">
                        <div class="px-4 py-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                            <span>Select Month (.xlsx)</span>
                            <i class="fa-solid fa-calendar-check"></i>
                        </div>
                        <div class="py-1 space-y-0.5 px-1 max-h-64 overflow-y-auto">
                            <button onclick="downloadSpecificMonthReport('Jan')" class="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-amber-500/20 hover:text-amber-300 rounded-lg flex items-center justify-between transition">
                                <span class="font-medium"><i class="fa-regular fa-file-excel text-emerald-400 mr-2"></i> January 2026</span>
                                <i class="fa-solid fa-download text-gray-400 text-xs"></i>
                            </button>
                            <button onclick="downloadSpecificMonthReport('Feb')" class="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-amber-500/20 hover:text-amber-300 rounded-lg flex items-center justify-between transition">
                                <span class="font-medium"><i class="fa-regular fa-file-excel text-emerald-400 mr-2"></i> February 2026</span>
                                <i class="fa-solid fa-download text-gray-400 text-xs"></i>
                            </button>
                            <button onclick="downloadSpecificMonthReport('Mar')" class="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-amber-500/20 hover:text-amber-300 rounded-lg flex items-center justify-between transition">
                                <span class="font-medium"><i class="fa-regular fa-file-excel text-emerald-400 mr-2"></i> March 2026</span>
                                <i class="fa-solid fa-download text-gray-400 text-xs"></i>
                            </button>
                            <button onclick="downloadSpecificMonthReport('Apr')" class="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-amber-500/20 hover:text-amber-300 rounded-lg flex items-center justify-between transition">
                                <span class="font-medium"><i class="fa-regular fa-file-excel text-emerald-400 mr-2"></i> April 2026</span>
                                <i class="fa-solid fa-download text-gray-400 text-xs"></i>
                            </button>
                            <button onclick="downloadSpecificMonthReport('May')" class="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-amber-500/20 hover:text-amber-300 rounded-lg flex items-center justify-between transition">
                                <span class="font-medium"><i class="fa-regular fa-file-excel text-emerald-400 mr-2"></i> May 2026</span>
                                <i class="fa-solid fa-download text-gray-400 text-xs"></i>
                            </button>
                            <button onclick="downloadSpecificMonthReport('Jun')" class="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-amber-500/20 hover:text-amber-300 rounded-lg flex items-center justify-between transition">
                                <span class="font-medium"><i class="fa-regular fa-file-excel text-emerald-400 mr-2"></i> June 2026</span>
                                <i class="fa-solid fa-download text-gray-400 text-xs"></i>
                            </button>
                            <button onclick="downloadSpecificMonthReport('Jul')" class="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-amber-500/20 hover:text-amber-300 rounded-lg flex items-center justify-between transition">
                                <span class="font-medium"><i class="fa-regular fa-file-excel text-emerald-400 mr-2"></i> July 2026</span>
                                <i class="fa-solid fa-download text-gray-400 text-xs"></i>
                            </button>
                            <button onclick="downloadSpecificMonthReport('Aug')" class="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-amber-500/20 hover:text-amber-300 rounded-lg flex items-center justify-between transition">
                                <span class="font-medium"><i class="fa-regular fa-file-excel text-emerald-400 mr-2"></i> August 2026</span>
                                <i class="fa-solid fa-download text-gray-400 text-xs"></i>
                            </button>
                        </div>
                        <div class="pt-1 px-1">
                            <button onclick="downloadSpecificMonthReport('ALL')" class="w-full text-left px-3 py-2 text-xs font-bold text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 rounded-lg flex items-center justify-between transition border border-brand-500/30">
                                <span><i class="fa-solid fa-layer-group text-brand-400 mr-2"></i> All Months (Full Workbook)</span>
                                <i class="fa-solid fa-download text-brand-400 text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">

        <!-- File Upload Dropzone (When No Data Loaded) -->
        <div id="dropzoneContainer" class="glass-panel rounded-2xl p-10 text-center border-2 border-dashed border-gray-700 hover:border-brand-500 transition-all duration-300">
            <div class="max-w-md mx-auto space-y-4">
                <div class="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 mx-auto flex items-center justify-center text-brand-400 text-2xl">
                    <i class="fa-solid fa-cloud-arrow-up"></i>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-white">Upload your Site Billing & Consumption Excel Sheet</h3>
                    <p class="text-xs text-gray-400 mt-1">Upload an <strong class="text-gray-300">.xlsx file</strong> from your computer, or <strong class="text-sky-300">import directly from OneDrive / SharePoint</strong> by pasting copied rows. Supports Jan–Aug 2026 Billing, Expense & Consumption fields.</p>
                </div>
                
                <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
                    <label for="excelFileInput" class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-lg shadow-brand-600/30 cursor-pointer inline-flex items-center justify-center gap-2">
                        <i class="fa-solid fa-file-excel text-sm"></i>
                        <span>Select Excel File (.xlsx)</span>
                    </label>
                    <button onclick="openPasteModal()" class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-700/30 hover:bg-sky-600/40 text-sky-300 text-xs font-bold border border-sky-500/40 transition shadow-lg inline-flex items-center justify-center gap-2">
                        <i class="fa-brands fa-microsoft text-sky-400"></i>
                        <span>Import from OneDrive / SharePoint</span>
                    </button>
                    <button onclick="loadSampleData()" class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold border border-gray-700 transition inline-flex items-center justify-center gap-2">
                        <i class="fa-solid fa-bolt text-amber-400"></i>
                        <span>Explore Demo Sample Data</span>
                    </button>
                </div>

                <div class="mt-6 pt-4 border-t border-gray-800 text-left">
                    <p class="text-xs font-semibold text-gray-400 mb-2">Supported Schema Headers:</p>
                    <div class="flex flex-wrap gap-1.5 text-[11px] text-gray-500">
                        <span class="px-2 py-0.5 rounded bg-gray-800/80 border border-gray-700/50">Site code</span>
                        <span class="px-2 py-0.5 rounded bg-gray-800/80 border border-gray-700/50">Region</span>
                        <span class="px-2 py-0.5 rounded bg-gray-800/80 border border-gray-700/50">Site name</span>
                        <span class="px-2 py-0.5 rounded bg-gray-800/80 border border-gray-700/50">Customer Group</span>
                        <span class="px-2 py-0.5 rounded bg-gray-800/80 border border-gray-700/50">Site Status</span>
                        <span class="px-2 py-0.5 rounded bg-gray-800/80 border border-gray-700/50">Supervisor</span>
                        <span class="px-2 py-0.5 rounded bg-gray-800/80 border border-gray-700/50">ASSISTANT MANAGER</span>
                        <span class="px-2 py-0.5 rounded bg-gray-800/80 border border-gray-700/50">MANAGER</span>
                        <span class="px-2 py-0.5 rounded bg-gray-800/80 border border-gray-700/50">SR MANAGER</span>
                        <span class="px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">JAN-JUL/AUG 2026 BILLING, EXPENSE & Consumption Value</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Dashboard View (Hidden until data loaded) -->
        <div id="dashboardContent" class="hidden space-y-6">

            <!-- Sticky Top Filter & Tab Navigation Control Bar -->
            <div class="sticky top-0 z-30 bg-gray-950/95 backdrop-blur-md pt-2 pb-2 space-y-3 shadow-2xl border-b border-gray-800/80 -mx-4 px-4 sm:-mx-6 sm:px-6">
                <!-- Data Overview Header Bar -->
                <div class="glass-panel rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-brand-500 shadow-md">
                    <div class="flex items-center space-x-4">
                        <div>
                            <span class="text-xs uppercase tracking-wider text-gray-400 font-semibold">Active Dataset</span>
                            <h2 id="datasetTitle" class="text-base font-bold text-white">Sample Dataset (Jan - July 2026)</h2>
                        </div>
                        <div class="h-8 w-px bg-gray-800"></div>
                        <div>
                            <span class="text-xs uppercase tracking-wider text-gray-400 font-semibold">Total Sites</span>
                            <p id="statTotalSites" class="text-base font-bold text-brand-400">0</p>
                        </div>
                        <div class="h-8 w-px bg-gray-800"></div>
                        <div>
                            <span class="text-xs uppercase tracking-wider text-gray-400 font-semibold">Regions</span>
                            <p id="statTotalRegions" class="text-base font-bold text-indigo-400">0</p>
                        </div>
                    </div>

                    <!-- Global Filters -->
                    <div class="flex flex-wrap items-center space-x-3 text-xs gap-y-2">
                        <!-- Global Universal Site Search -->
                        <div>
                            <label class="text-brand-300 font-bold block mb-1 flex items-center gap-1">
                                <i class="fa-solid fa-magnifying-glass text-brand-400"></i> Search Site (All Tabs):
                            </label>
                            <div class="relative">
                                <input type="text" id="globalSiteSearch" oninput="applyFilters()" placeholder="Search code, name..." class="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg pl-7 pr-2.5 py-1.5 focus:outline-none focus:border-brand-500 w-44">
                                <i class="fa-solid fa-search absolute left-2.5 top-2 text-gray-500 text-[10px]"></i>
                            </div>
                        </div>

                        <div>
                            <label class="text-amber-400 font-bold block mb-1 flex items-center gap-1">
                                <i class="fa-solid fa-calendar-days"></i> Month Filter:
                            </label>
                            <select id="filterMonth" onchange="applyFilters()" class="bg-amber-500/10 text-amber-300 font-bold border border-amber-500/40 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400">
                                <option value="ALL">All Months (Total/Avg)</option>
                                <option value="Jan">January 2026</option>
                                <option value="Feb">February 2026</option>
                                <option value="Mar">March 2026</option>
                                <option value="Apr">April 2026</option>
                                <option value="May">May 2026</option>
                                <option value="Jun">June 2026</option>
                                <option value="Jul">July 2026</option>
                                <option value="Aug">August 2026</option>
                            </select>
                        </div>

                        <div>
                            <label class="text-gray-400 font-medium block mb-1">Filter Region:</label>
                            <select id="filterRegion" onchange="applyFilters()" class="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-500">
                                <option value="ALL">All Regions</option>
                            </select>
                        </div>

                        <div>
                            <label class="text-gray-400 font-medium block mb-1">Site Status:</label>
                            <select id="filterStatus" onchange="applyFilters()" class="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-500">
                                <option value="ALL">All Statuses</option>
                            </select>
                        </div>

                        <div>
                            <label class="text-gray-400 font-medium block mb-1">Sr Manager:</label>
                            <select id="filterSrManager" onchange="applyFilters()" class="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-500">
                                <option value="ALL">All Sr Managers</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation Bar -->
                <div class="flex items-center space-x-2 border-b border-gray-800 pb-1 overflow-x-auto no-print">
                    <button onclick="switchTab('overview')" id="tab-overview" class="tab-btn px-4 py-2.5 text-xs font-bold rounded-lg transition flex items-center gap-2 bg-brand-600 text-white shadow-md">
                        <i class="fa-solid fa-chart-pie"></i>
                        <span>Executive Summary</span>
                    </button>
                    <button onclick="switchTab('regionConsumption')" id="tab-regionConsumption" class="tab-btn px-4 py-2.5 text-xs font-semibold rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition flex items-center gap-2">
                        <i class="fa-solid fa-triangle-exclamation text-amber-400"></i>
                        <span>Region Consumption (>7%)</span>
                    </button>
                    <button onclick="switchTab('financial')" id="tab-financial" class="tab-btn px-4 py-2.5 text-xs font-semibold rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition flex items-center gap-2">
                        <i class="fa-solid fa-sack-dollar text-emerald-400"></i>
                        <span>Financial & Profitability</span>
                    </button>
                    <button onclick="switchTab('hierarchy')" id="tab-hierarchy" class="tab-btn px-4 py-2.5 text-xs font-semibold rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition flex items-center gap-2">
                        <i class="fa-solid fa-sitemap text-indigo-400"></i>
                        <span>Management Hierarchy</span>
                    </button>
                    <button onclick="switchTab('trends')" id="tab-trends" class="tab-btn px-4 py-2.5 text-xs font-semibold rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition flex items-center gap-2">
                        <i class="fa-solid fa-arrow-trend-up text-cyan-400"></i>
                        <span>Monthly Trends</span>
                    </button>
                    <button onclick="switchTab('datatable')" id="tab-datatable" class="tab-btn px-4 py-2.5 text-xs font-semibold rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition flex items-center gap-2">
                        <i class="fa-solid fa-table"></i>
                        <span>All Sites Master Data</span>
                    </button>
                </div>
            </div>


            <!-- TAB 1: EXECUTIVE OVERVIEW -->
            <div id="view-overview" class="tab-view space-y-6">
                <!-- Summary Key Metric Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-xl space-y-2 relative overflow-hidden">
                        <div class="absolute -right-4 -bottom-4 text-brand-500/10 text-7xl"><i class="fa-solid fa-indian-rupee-sign"></i></div>
                        <span class="text-xs uppercase tracking-wider text-gray-400 font-semibold">Total Billing (Jan-Jul)</span>
                        <h3 id="kpiTotalBilling" class="text-2xl font-extrabold text-white">₹0</h3>
                        <p class="text-xs text-gray-400 flex items-center gap-1">
                            Avg monthly: <span id="kpiAvgBilling" class="font-semibold text-gray-200">₹0</span>
                        </p>
                    </div>

                    <div class="glass-panel p-5 rounded-xl space-y-2 relative overflow-hidden">
                        <div class="absolute -right-4 -bottom-4 text-red-500/10 text-7xl"><i class="fa-solid fa-receipt"></i></div>
                        <span class="text-xs uppercase tracking-wider text-gray-400 font-semibold">Total Manpower Expense</span>
                        <h3 id="kpiTotalExpense" class="text-2xl font-extrabold text-white">₹0</h3>
                        <p class="text-xs text-gray-400 flex items-center gap-1">
                            Expense Ratio: <span id="kpiExpenseRatio" class="font-semibold text-red-400">0%</span>
                        </p>
                    </div>

                    <div class="glass-panel p-5 rounded-xl space-y-2 relative overflow-hidden">
                        <div class="absolute -right-4 -bottom-4 text-purple-500/10 text-7xl"><i class="fa-solid fa-boxes-packing"></i></div>
                        <span class="text-xs uppercase tracking-wider text-gray-400 font-semibold">Total Consumption Value</span>
                        <h3 id="kpiTotalConsumption" class="text-2xl font-extrabold text-white">₹0</h3>
                        <p class="text-xs text-gray-400 flex items-center gap-1">
                            Consumption Ratio: <span id="kpiConsumptionRatio" class="font-semibold text-purple-400">0%</span>
                        </p>
                    </div>

                    <div class="glass-panel p-5 rounded-xl space-y-2 relative overflow-hidden">
                        <div class="absolute -right-4 -bottom-4 text-emerald-500/10 text-7xl"><i class="fa-solid fa-chart-line"></i></div>
                        <span class="text-xs uppercase tracking-wider text-gray-400 font-semibold">Avg Gross Margin</span>
                        <h3 id="kpiGrossMargin" class="text-2xl font-extrabold text-emerald-400">0%</h3>
                        <p class="text-xs text-gray-400 flex items-center gap-1">
                            Net Gross Profit: <span id="kpiGrossProfit" class="font-semibold text-gray-200">₹0</span>
                        </p>
                    </div>
                </div>

                <!-- Alert Banner for >7% High Consumption Sites -->
                <div class="glass-card-alert p-4 rounded-xl flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 text-lg">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <div>
                            <h4 class="text-sm font-bold text-white flex items-center gap-2">
                                High Region Consumption Alert (>7% Share)
                                <span id="badgeHighShareCount" class="px-2 py-0.5 text-xs rounded-full bg-red-500 text-white font-extrabold">0 Sites</span>
                            </h4>
                            <p class="text-xs text-gray-300 mt-0.5">Sites contributing over 7% of their region's overall consumption value require cost audit.</p>
                        </div>
                    </div>
                    <button onclick="switchTab('regionConsumption')" class="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition">
                        View Detailed Report &rarr;
                    </button>
                </div>

                <!-- Charts Section -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="glass-panel p-5 rounded-xl space-y-4">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-bold text-white flex items-center gap-2">
                                <i class="fa-solid fa-chart-bar text-brand-400"></i>
                                Region-Wise Financial Distribution
                            </h3>
                            <span class="text-[11px] text-gray-400">Billing vs Expense vs Consumption</span>
                        </div>
                        <div class="h-72">
                            <canvas id="chartRegionOverview"></canvas>
                        </div>
                    </div>

                    <div class="glass-panel p-5 rounded-xl space-y-4">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-bold text-white flex items-center gap-2">
                                <i class="fa-solid fa-chart-pie text-purple-400"></i>
                                Region Consumption Value Share
                            </h3>
                            <span class="text-[11px] text-gray-400">% Share by Region</span>
                        </div>
                        <div class="h-72">
                            <canvas id="chartRegionConsumptionDonut"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB 2: REGION CONSUMPTION REPORT (>7% THRESHOLD) -->
            <div id="view-regionConsumption" class="tab-view space-y-6 hidden">
                
                <!-- Report Controls Bar -->
                <div class="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 class="text-base font-bold text-white flex items-center gap-2">
                            <i class="fa-solid fa-filter-circle-dollar text-amber-400"></i>
                            Region-Wise Consumption Report (>7% Share Threshold)
                        </h3>
                        <p class="text-xs text-gray-400">Identifies sites consuming a high proportion of their region's overall material consumption value.</p>
                    </div>

                    <!-- Custom Threshold Slider & Calculation Mode Switcher -->
                    <div class="flex flex-wrap items-center space-x-3 gap-y-2 bg-gray-900/80 px-4 py-2 rounded-lg border border-gray-800">
                        <div class="flex items-center space-x-2">
                            <label class="text-xs font-semibold text-gray-300">View Filter:</label>
                            <select id="regionViewFilterSelect" onchange="updateRegionViewFilter(this.value)" class="bg-gray-800 text-brand-300 text-xs font-bold border border-gray-700 rounded px-2 py-1 focus:outline-none">
                                <option value="ALERTS_ONLY">Only Alert Sites (&ge;7%)</option>
                                <option value="ALL_SITES">All Regional Sites (Highlight High Consumption)</option>
                            </select>
                        </div>
                        <div class="flex items-center space-x-2">
                            <label class="text-xs font-semibold text-gray-300">Mode:</label>
                            <select id="thresholdModeSelect" onchange="updateThresholdMode(this.value)" class="bg-gray-800 text-amber-300 text-xs font-bold border border-gray-700 rounded px-2 py-1 focus:outline-none">
                                <option value="SITE_BILLING" selected>% of Site Billing (Consumption / Billing &ge; 7%)</option>
                                <option value="REGION_SHARE">% of Region Total Consumption</option>
                                <option value="EITHER">Any Threshold (Region Share OR Site Billing &ge;7%)</option>
                            </select>
                        </div>
                        <div class="flex items-center space-x-2">
                            <label for="thresholdRange" class="text-xs font-semibold text-gray-300">Threshold:</label>
                            <input type="range" id="thresholdRange" min="1" max="25" value="7" step="0.5" oninput="updateThresholdValue(this.value)" class="w-24 accent-amber-500 cursor-pointer">
                            <span id="thresholdDisplay" class="text-xs font-extrabold text-amber-400 min-w-[36px]">7.0%</span>
                        </div>
                    </div>
                </div>

                <!-- Region Consumption Cards & Tables Container -->
                <div id="regionConsumptionContainer" class="space-y-6">
                    <!-- Dynamically populated per region -->
                </div>
            </div>

            <!-- TAB 3: FINANCIAL PERFORMANCE & PROFITABILITY -->
            <div id="view-financial" class="tab-view space-y-6 hidden">
                <div class="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 class="text-base font-bold text-white flex items-center gap-2">
                            <i class="fa-solid fa-coins text-emerald-400"></i>
                            Site Financial & Profitability Breakdown
                        </h3>
                        <p class="text-xs text-gray-400">Analysis of Gross Margin, Manpower Expenses, and Material Consumption per Site.</p>
                    </div>

                    <div class="flex items-center space-x-3 text-xs">
                        <label class="text-gray-400 font-medium">Profit Filter:</label>
                        <select id="filterProfitability" onchange="renderFinancialReport()" class="bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-1.5">
                            <option value="ALL">All Profit Levels</option>
                            <option value="HEALTHY">Healthy (Margin > 20%)</option>
                            <option value="MODERATE">Moderate (Margin 5% - 20%)</option>
                            <option value="CRITICAL">Critical / Loss (Margin < 5%)</option>
                        </select>
                    </div>
                </div>

                <!-- Profitability Table -->
                <div class="glass-panel rounded-xl overflow-hidden">
                    <div class="overflow-auto max-h-[70vh] rounded-xl">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead class="bg-gray-950 text-gray-300 uppercase tracking-wider font-semibold border-b border-gray-800 sticky top-0 z-10 shadow-md">
                                <tr>
                                    <th class="py-3 px-4 bg-gray-950">Site Code & Name</th>
                                    <th class="py-3 px-4 bg-gray-950">Region</th>
                                    <th class="py-3 px-4 bg-gray-950">Customer Group</th>
                                    <th class="py-3 px-4 bg-gray-950 text-right">Avg Monthly Billing</th>
                                    <th class="py-3 px-4 bg-gray-950 text-right">Avg Manpower Exp</th>
                                    <th class="py-3 px-4 bg-gray-950 text-right">Avg Consumption</th>
                                    <th class="py-3 px-4 bg-gray-950 text-right">Total Net Profit</th>
                                    <th class="py-3 px-4 bg-gray-950 text-right">Gross Margin %</th>
                                    <th class="py-3 px-4 bg-gray-950 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody id="tblFinancialBody" class="divide-y divide-gray-800/50 text-gray-300">
                                <!-- Dynamic rows -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ── ADVANCED FINANCIAL ANALYSES SECTION ───────────────── -->
                <div class="space-y-6 pt-4">
                    <!-- Section Divider Header -->
                    <div class="flex items-center gap-2">
                        <div class="h-px flex-1 bg-gradient-to-r from-emerald-500/60 to-transparent"></div>
                        <span class="text-xs font-extrabold text-emerald-400 uppercase tracking-widest px-2">
                            <i class="fa-solid fa-brain mr-1.5"></i> Advanced Executive Financial Analyses
                        </span>
                        <div class="h-px flex-1 bg-gradient-to-l from-emerald-500/60 to-transparent"></div>
                    </div>

                    <!-- Analysis 1: Cost Structure & Burn Analysis -->
                    <div class="glass-panel p-5 rounded-xl space-y-4 border border-gray-800">
                        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
                            <div>
                                <h4 class="text-sm font-bold text-white flex items-center gap-2">
                                    <i class="fa-solid fa-chart-pie text-purple-400"></i>
                                    1. Cost Structure &amp; Burn Driver Analysis (Manpower vs Material Share)
                                </h4>
                                <p class="text-xs text-gray-400">Diagnoses whether site cost is driven by Labor (Manpower) or Material Consumption with cost driver tags.</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-[11px] px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                                    Formula: Labor % = (Exp ÷ Cost) × 100
                                </span>
                                <button onclick="toggleAnalysisDesc('costStructureDesc')" class="text-[11px] px-2.5 py-1 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600 transition flex items-center gap-1">
                                    <i class="fa-solid fa-circle-info"></i> How it's calculated
                                </button>
                            </div>
                        </div>
                        <!-- Expandable Description -->
                        <div id="costStructureDesc" class="hidden bg-gray-900/70 rounded-xl border border-purple-500/20 p-4 text-xs space-y-3">
                            <div class="font-bold text-purple-300 flex items-center gap-2"><i class="fa-solid fa-book-open"></i> What is Cost Structure & Burn Driver Analysis?</div>
                            <p class="text-gray-300 leading-relaxed">This analysis breaks down <strong class="text-white">how your total operating cost is split</strong> between two types of expenses at each site — <span class="text-red-400 font-semibold">Manpower (Labor)</span> and <span class="text-purple-400 font-semibold">Material Consumption</span>. It helps identify what is "burning" your money at each site.</p>
                            <div class="border-t border-gray-700 pt-3">
                                <div class="font-semibold text-white mb-2">📐 Step-by-Step Calculation:</div>
                                <div class="space-y-1.5 text-gray-300">
                                    <div class="flex gap-2"><span class="text-purple-400 font-mono w-5">1.</span><span><strong>Total Operating Cost</strong> = Manpower Expense (E) + Material Consumption (C)</span></div>
                                    <div class="flex gap-2"><span class="text-purple-400 font-mono w-5">2.</span><span><strong>Labor %</strong> = (Manpower Expense ÷ Total Cost) × 100</span></div>
                                    <div class="flex gap-2"><span class="text-purple-400 font-mono w-5">3.</span><span><strong>Material %</strong> = (Consumption ÷ Total Cost) × 100 &nbsp;<em class="text-gray-500">(= 100% − Labor %)</em></span></div>
                                </div>
                            </div>
                            <div class="border-t border-gray-700 pt-3">
                                <div class="font-semibold text-white mb-2">🏷️ Cost Driver Tags Explained:</div>
                                <div class="space-y-1.5">
                                    <div class="flex gap-2 items-center"><span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">Labor-Heavy (≥75%)</span><span class="text-gray-400">→ Over 75% of cost is manpower salary. Review staffing levels or billing rates.</span></div>
                                    <div class="flex gap-2 items-center"><span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">Material-Intensive (≥25%)</span><span class="text-gray-400">→ 25%+ of cost is material/supplies. Check consumption control & vendor costs.</span></div>
                                    <div class="flex gap-2 items-center"><span class="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">Balanced Cost</span><span class="text-gray-400">→ Cost is well-distributed. Labor &lt;75% and Material &lt;25%. Healthy structure.</span></div>
                                </div>
                            </div>
                            <div class="border-t border-gray-700 pt-3 text-gray-400">
                                <i class="fa-solid fa-lightbulb text-amber-400 mr-1"></i>
                                <strong class="text-amber-300">How to use this:</strong> Sites tagged as <em>Labor-Heavy</em> need headcount or salary review. Sites tagged <em>Material-Intensive</em> need procurement & usage audits.
                            </div>
                        </div>
                        <div id="costStructureContainer" class="overflow-x-auto">
                            <!-- Populated dynamically by JS -->
                        </div>
                    </div>

                    <!-- Analysis 2: Profit Pareto & Loss Drag Breakdown -->
                    <div class="glass-panel p-5 rounded-xl space-y-4 border border-gray-800">
                        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
                            <div>
                                <h4 class="text-sm font-bold text-white flex items-center gap-2">
                                    <i class="fa-solid fa-ranking-star text-amber-400"></i>
                                    2. Profitability Pareto Analysis (Core Profit Drivers vs Loss Drag)
                                </h4>
                                <p class="text-xs text-gray-400">Categorizes sites into Core Profit Engines, Stable Performers, and Loss Drag sites needing urgent action.</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                                    Pareto Rule: Profit Contribution &amp; Margin Tiers
                                </span>
                                <button onclick="toggleAnalysisDesc('profitParetoDesc')" class="text-[11px] px-2.5 py-1 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600 transition flex items-center gap-1">
                                    <i class="fa-solid fa-circle-info"></i> How it's calculated
                                </button>
                            </div>
                        </div>
                        <!-- Expandable Description -->
                        <div id="profitParetoDesc" class="hidden bg-gray-900/70 rounded-xl border border-amber-500/20 p-4 text-xs space-y-3">
                            <div class="font-bold text-amber-300 flex items-center gap-2"><i class="fa-solid fa-book-open"></i> What is Profitability Pareto Analysis?</div>
                            <p class="text-gray-300 leading-relaxed">Based on the <strong class="text-white">Pareto Principle (80/20 rule)</strong> — a small number of sites usually generate most of the profit. This analysis identifies <strong>which sites are your profit engines</strong>, which are stable, and which are <span class="text-red-400 font-semibold">draining cash</span>.</p>
                            <div class="border-t border-gray-700 pt-3">
                                <div class="font-semibold text-white mb-2">📐 Step-by-Step Calculation:</div>
                                <div class="space-y-1.5 text-gray-300">
                                    <div class="flex gap-2"><span class="text-amber-400 font-mono w-5">1.</span><span><strong>Net Profit</strong> = Billing (B) − Manpower Expense (E) − Consumption (C)</span></div>
                                    <div class="flex gap-2"><span class="text-amber-400 font-mono w-5">2.</span><span><strong>Gross Margin %</strong> = (Net Profit ÷ Billing) × 100</span></div>
                                    <div class="flex gap-2"><span class="text-amber-400 font-mono w-5">3.</span><span>Sites are <strong>ranked by Net Profit</strong> (highest to lowest) and placed in tiers by margin %</span></div>
                                </div>
                            </div>
                            <div class="border-t border-gray-700 pt-3">
                                <div class="font-semibold text-white mb-2">🏷️ Tier Classification:</div>
                                <div class="space-y-2">
                                    <div class="flex gap-2 items-start"><span class="mt-0.5">🚀</span><div><span class="text-emerald-400 font-bold">Core Profit Engines</span><span class="text-gray-400"> → Gross Margin ≥ 20%. Top-performing sites generating maximum net cash. Protect and scale these.</span></div></div>
                                    <div class="flex gap-2 items-start"><span class="mt-0.5">⚖️</span><div><span class="text-amber-400 font-bold">Stable Performers</span><span class="text-gray-400"> → Gross Margin between 5%–20%. Healthy but with room for margin improvement.</span></div></div>
                                    <div class="flex gap-2 items-start"><span class="mt-0.5">⚠️</span><div><span class="text-red-400 font-bold">Loss Drag / Cash Drain</span><span class="text-gray-400"> → Margin &lt; 5% or negative Net Profit. These sites cost more than they earn. Urgent review needed.</span></div></div>
                                </div>
                            </div>
                            <div class="border-t border-gray-700 pt-3 text-gray-400">
                                <i class="fa-solid fa-lightbulb text-amber-400 mr-1"></i>
                                <strong class="text-amber-300">How to use this:</strong> Focus resources on <em>Core Profit Engines</em>. Investigate <em>Loss Drag</em> sites immediately — check if billing rates cover costs or if expenses can be reduced.
                            </div>
                        </div>
                        <div id="profitParetoContainer" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <!-- Populated dynamically by JS -->
                        </div>
                    </div>

                    <!-- Analysis 3: Portfolio Benchmarking & Revenue Variance -->
                    <div class="glass-panel p-5 rounded-xl space-y-4 border border-gray-800">
                        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
                            <div>
                                <h4 class="text-sm font-bold text-white flex items-center gap-2">
                                    <i class="fa-solid fa-scale-balanced text-indigo-400"></i>
                                    3. Portfolio Benchmarking &amp; Revenue Variance Analysis
                                </h4>
                                <p class="text-xs text-gray-400">Compares site billing &amp; operating cost against the portfolio average metrics per site.</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                                    Variance = Site Metric − Portfolio Avg
                                </span>
                                <button onclick="toggleAnalysisDesc('portfolioBenchmarkDesc')" class="text-[11px] px-2.5 py-1 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600 transition flex items-center gap-1">
                                    <i class="fa-solid fa-circle-info"></i> How it's calculated
                                </button>
                            </div>
                        </div>
                        <!-- Expandable Description -->
                        <div id="portfolioBenchmarkDesc" class="hidden bg-gray-900/70 rounded-xl border border-indigo-500/20 p-4 text-xs space-y-3">
                            <div class="font-bold text-indigo-300 flex items-center gap-2"><i class="fa-solid fa-book-open"></i> What is Portfolio Benchmarking & Variance Analysis?</div>
                            <p class="text-gray-300 leading-relaxed">This analysis <strong class="text-white">compares every site against the portfolio average</strong>. Instead of looking at absolute numbers, it shows whether a site is performing <span class="text-emerald-400 font-semibold">above</span> or <span class="text-red-400 font-semibold">below</span> your organization's average billing and cost levels.</p>
                            <div class="border-t border-gray-700 pt-3">
                                <div class="font-semibold text-white mb-2">📐 Step-by-Step Calculation:</div>
                                <div class="space-y-1.5 text-gray-300">
                                    <div class="flex gap-2"><span class="text-indigo-400 font-mono w-5">1.</span><span><strong>Portfolio Avg Billing</strong> = Total Billing of all sites ÷ Number of sites</span></div>
                                    <div class="flex gap-2"><span class="text-indigo-400 font-mono w-5">2.</span><span><strong>Portfolio Avg Cost</strong> = Total (Expense + Consumption) of all sites ÷ Number of sites</span></div>
                                    <div class="flex gap-2"><span class="text-indigo-400 font-mono w-5">3.</span><span><strong>Billing Variance</strong> = Site Billing − Portfolio Avg Billing &nbsp;<em class="text-emerald-400">(+ = above avg)</em></span></div>
                                    <div class="flex gap-2"><span class="text-indigo-400 font-mono w-5">4.</span><span><strong>Cost Variance</strong> = Site Cost − Portfolio Avg Cost &nbsp;<em class="text-red-400">(+ = above avg cost = worse)</em></span></div>
                                </div>
                            </div>
                            <div class="border-t border-gray-700 pt-3">
                                <div class="font-semibold text-white mb-2">🏷️ Performance Tags Explained:</div>
                                <div class="space-y-2">
                                    <div class="flex gap-2 items-start"><div><span class="text-emerald-400 font-bold">Top Outperformer</span><span class="text-gray-400"> → Billing above avg AND cost below avg. Best possible situation — high revenue, lean cost.</span></div></div>
                                    <div class="flex gap-2 items-start"><div><span class="text-blue-400 font-bold">High Scale Site</span><span class="text-gray-400"> → Billing above avg but cost also above avg. Large site with high activity — monitor cost control.</span></div></div>
                                    <div class="flex gap-2 items-start"><div><span class="text-gray-300 font-bold">Small Scale Site</span><span class="text-gray-400"> → Billing below avg but cost is managed. Small site — may need billing growth strategy.</span></div></div>
                                    <div class="flex gap-2 items-start"><div><span class="text-red-400 font-bold">Low Revenue / High Cost</span><span class="text-gray-400"> → Worst case: billing below avg AND cost above avg. Requires immediate attention.</span></div></div>
                                </div>
                            </div>
                            <div class="border-t border-gray-700 pt-3 text-gray-400">
                                <i class="fa-solid fa-lightbulb text-amber-400 mr-1"></i>
                                <strong class="text-amber-300">How to use this:</strong> Green variance = you are beating the portfolio average. Red variance = you are underperforming. Focus review sessions on <em>Low Revenue / High Cost</em> sites first.
                            </div>
                        </div>
                        <div id="portfolioBenchmarkContainer" class="overflow-x-auto">
                            <!-- Populated dynamically by JS -->
                        </div>
                    </div>

                </div>
            </div>

            <!-- TAB 4: MANAGEMENT HIERARCHY -->
            <div id="view-hierarchy" class="tab-view space-y-6 hidden">
                <div class="glass-panel p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <h3 class="text-base font-bold text-white flex items-center gap-2">
                            <i class="fa-solid fa-users-gear text-indigo-400"></i>
                            Management Hierarchy Performance Matrix
                        </h3>
                        <p class="text-xs text-gray-400">Aggregated financial control metrics by Sr Manager, Manager, AM, and Supervisor.</p>
                    </div>
                </div>

                <!-- Hierarchy Cards / Accordion -->
                <div id="hierarchyContainer" class="space-y-6">
                    <!-- Populated dynamically -->
                </div>
            </div>

            <!-- TAB 5: MONTHLY TRENDS -->
            <div id="view-trends" class="tab-view space-y-6 hidden">
                <div class="glass-panel p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <h3 class="text-base font-bold text-white flex items-center gap-2">
                            <i class="fa-solid fa-arrow-trend-up text-cyan-400"></i>
                            Month-over-Month (MoM) Performance Trajectory
                        </h3>
                        <p class="text-xs text-gray-400">Tracking monthly billing, manpower cost, and consumption trends from Jan to Aug 2026.</p>
                    </div>
                </div>

                <div class="glass-panel p-5 rounded-xl space-y-4">
                    <div class="h-80">
                        <canvas id="chartMonthlyTrends"></canvas>
                    </div>
                </div>

                <!-- Monthly Breakdown Table -->
                <div class="glass-panel rounded-xl overflow-hidden">
                    <div class="p-4 border-b border-gray-800 font-bold text-sm text-white">Monthly Financial Totals</div>
                    <div class="overflow-auto max-h-[70vh] rounded-xl">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead class="bg-gray-950 text-gray-300 uppercase tracking-wider font-semibold border-b border-gray-800 sticky top-0 z-10 shadow-md">
                                <tr>
                                    <th class="py-3 px-4 bg-gray-950">Month</th>
                                    <th class="py-3 px-4 bg-gray-950 text-right">Total Billing</th>
                                    <th class="py-3 px-4 bg-gray-950 text-right">Total Manpower Expense</th>
                                    <th class="py-3 px-4 bg-gray-950 text-right">Total Consumption Value</th>
                                    <th class="py-3 px-4 bg-gray-950 text-right">Gross Profit</th>
                                    <th class="py-3 px-4 bg-gray-950 text-right">Gross Margin %</th>
                                </tr>
                            </thead>
                            <tbody id="tblMonthlyTrendsBody" class="divide-y divide-gray-800/50 text-gray-300">
                                <!-- Dynamic rows -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- TAB 6: MASTER DATA TABLE -->
            <div id="view-datatable" class="tab-view space-y-6 hidden">
                <div class="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                    <div class="relative w-72">
                        <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-400 text-xs"></i>
                        <input type="text" id="masterSearch" onkeyup="searchMasterTable()" placeholder="Search site code, name, manager..." class="w-full bg-gray-900 text-xs text-gray-200 border border-gray-800 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-brand-500">
                    </div>
                    <div class="text-xs text-gray-400">
                        Showing <span id="masterRowCount" class="font-bold text-white">0</span> site records
                    </div>
                </div>

                <div class="glass-panel rounded-xl overflow-hidden">
                    <div class="overflow-auto max-h-[70vh] rounded-xl">
                        <table class="w-full text-left border-collapse text-xs whitespace-nowrap">
                            <thead class="bg-gray-950 text-gray-300 uppercase tracking-wider font-semibold sticky top-0 border-b border-gray-800 z-10 shadow-md">
                                <tr id="masterTheadRow" class="bg-gray-950">
                                    <th class="py-3 px-3 bg-gray-950">S.no</th>
                                    <th class="py-3 px-3 bg-gray-950">Site Code</th>
                                    <th class="py-3 px-3 bg-gray-950">Region</th>
                                    <th class="py-3 px-3 bg-gray-950">Site Name</th>
                                    <th class="py-3 px-3 bg-gray-950">Customer Group</th>
                                    <th class="py-3 px-3 bg-gray-950">Site Status</th>
                                    <th class="py-3 px-3">Supervisor</th>
                                    <th class="py-3 px-3">Assistant Manager</th>
                                    <th class="py-3 px-3">Manager</th>
                                    <th class="py-3 px-3">Sr Manager</th>
                                    <th class="py-3 px-3 text-right">Total Billing</th>
                                    <th class="py-3 px-3 text-right">Total Expense</th>
                                    <th class="py-3 px-3 text-right">Total Consumption</th>
                                    <th class="py-3 px-3 text-right">Avg Margin %</th>
                                </tr>
                            </thead>
                            <tbody id="masterTbody" class="divide-y divide-gray-800/50 text-gray-300">
                                <!-- Dynamic master rows -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    </main>

    <!-- Footer -->
    <footer class="glass-panel border-t border-gray-800/80 px-6 py-4 mt-auto no-print text-center text-xs text-gray-500 flex flex-wrap items-center justify-between gap-2 max-w-7xl w-full mx-auto">
        <p>Site Billing, Expense & Consumption Report Suite &bull; Secure Local Browser Processing</p>
        <p class="flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Data Protected & Standardized
        </p>
    </footer>

    <!-- Report Export Hub Modal -->
    <div id="reportExportModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div class="glass-panel w-full max-w-2xl rounded-2xl border border-gray-700 shadow-2xl flex flex-col" style="max-height:92vh;">

            <!-- Modal Header -->
            <div class="flex items-center justify-between border-b border-gray-800 px-6 py-4 flex-shrink-0">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg">
                        <i class="fa-solid fa-file-excel"></i>
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-white">Download Excel Report</h3>
                        <p class="text-xs text-gray-400">Choose a specific analysis or data export — month-wise</p>
                    </div>
                </div>
                <button onclick="closeReportModal()" class="text-gray-400 hover:text-white text-xl px-2">&times;</button>
            </div>

            <!-- Scrollable Body -->
            <div class="overflow-y-auto flex-1 px-6 py-5 space-y-6">

                <!-- ── SECTION A: ANALYSIS REPORTS ─────────────────────── -->
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="h-px flex-1 bg-gradient-to-r from-brand-500/60 to-transparent"></div>
                        <span class="text-[11px] font-extrabold text-brand-400 uppercase tracking-widest px-2">📊 Analysis Reports</span>
                        <div class="h-px flex-1 bg-gradient-to-l from-brand-500/60 to-transparent"></div>
                    </div>
                    <p class="text-[11px] text-gray-500">Download exactly one focused analysis — the same data shown on each dashboard tab.</p>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                        <!-- Region Consumption >7% Analysis -->
                        <label class="cursor-pointer flex items-start space-x-3 p-3 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-amber-500/50 transition group">
                            <input type="radio" name="reportType" value="ANALYSIS_REGION" class="mt-1 accent-amber-500">
                            <div>
                                <span class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                    <i class="fa-solid fa-earth-americas text-amber-400"></i> Region Consumption Analysis
                                </span>
                                <span class="text-[11px] text-gray-500 block mt-0.5">Sites &gt;7% consumption/billing — region totals + flagged sites, sorted by consumption/billing %.</span>
                            </div>
                        </label>

                        <!-- Financial & Profitability Analysis -->
                        <label class="cursor-pointer flex items-start space-x-3 p-3 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-emerald-500/50 transition group">
                            <input type="radio" name="reportType" value="ANALYSIS_FINANCIAL" class="mt-1 accent-emerald-500">
                            <div>
                                <span class="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                                    <i class="fa-solid fa-chart-line text-emerald-400"></i> Financial & Profitability Analysis
                                </span>
                                <span class="text-[11px] text-gray-500 block mt-0.5">Site-wise billing, manpower expense, consumption, net profit & gross margin with health status.</span>
                            </div>
                        </label>

                        <!-- Management Hierarchy Analysis -->
                        <label class="cursor-pointer flex items-start space-x-3 p-3 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-indigo-500/50 transition group">
                            <input type="radio" name="reportType" value="ANALYSIS_HIERARCHY" class="mt-1 accent-indigo-500">
                            <div>
                                <span class="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                                    <i class="fa-solid fa-sitemap text-indigo-400"></i> Management Hierarchy Analysis
                                </span>
                                <span class="text-[11px] text-gray-500 block mt-0.5">Sr Manager → Manager rollup: site counts, billing, expenses, gross margin per manager.</span>
                            </div>
                        </label>

                        <!-- Monthly Trends Analysis -->
                        <label class="cursor-pointer flex items-start space-x-3 p-3 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-sky-500/50 transition group">
                            <input type="radio" name="reportType" value="ANALYSIS_TRENDS" class="mt-1 accent-sky-500">
                            <div>
                                <span class="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                                    <i class="fa-solid fa-chart-area text-sky-400"></i> Monthly Trends Analysis (Jan–Aug)
                                </span>
                                <span class="text-[11px] text-gray-500 block mt-0.5">Month-over-month totals for billing, expenses, consumption, net profit & gross margin.</span>
                            </div>
                        </label>

                        <!-- Executive KPI Summary -->
                        <label class="cursor-pointer flex items-start space-x-3 p-3 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-pink-500/50 transition group sm:col-span-2">
                            <input type="radio" name="reportType" value="ANALYSIS_OVERVIEW" class="mt-1 accent-pink-500">
                            <div>
                                <span class="text-xs font-bold text-pink-300 flex items-center gap-1.5">
                                    <i class="fa-solid fa-gauge-high text-pink-400"></i> Executive KPI Overview Summary
                                </span>
                                <span class="text-[11px] text-gray-500 block mt-0.5">One-page summary: total sites, total billing, total expenses, net profit, gross margin %, and high-consumption site count for the selected month.</span>
                            </div>
                        </label>

                    </div>
                </div>

                <!-- ── SECTION B: DATA REPORTS ─────────────────────────── -->
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="h-px flex-1 bg-gradient-to-r from-gray-600/60 to-transparent"></div>
                        <span class="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest px-2">📁 Data Reports</span>
                        <div class="h-px flex-1 bg-gradient-to-l from-gray-600/60 to-transparent"></div>
                    </div>
                    <p class="text-[11px] text-gray-500">Download raw or combined data — all site records in spreadsheet form.</p>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                        <!-- Detailed Master Report -->
                        <label class="cursor-pointer flex items-start space-x-3 p-3 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-brand-500/50 transition">
                            <input type="radio" name="reportType" value="DETAILED" class="mt-1 accent-blue-500">
                            <div>
                                <span class="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                                    <i class="fa-solid fa-table-list text-blue-400"></i> Detailed Master Site Data
                                </span>
                                <span class="text-[11px] text-gray-500 block mt-0.5">All sites with every column — billing, expense, consumption, averages, margin.</span>
                            </div>
                        </label>

                        <!-- Specific Filtered Report -->
                        <label class="cursor-pointer flex items-start space-x-3 p-3 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-violet-500/50 transition">
                            <input type="radio" name="reportType" value="SPECIFIC" class="mt-1 accent-violet-500">
                            <div>
                                <span class="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                                    <i class="fa-solid fa-filter text-violet-400"></i> Specific Filtered Data
                                </span>
                                <span class="text-[11px] text-gray-500 block mt-0.5">Only what's in your current filter selection (Region / Status / Sr Manager).</span>
                            </div>
                        </label>

                        <!-- Complete Executive Workbook -->
                        <label class="cursor-pointer flex items-start space-x-3 p-3 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-teal-500/50 transition sm:col-span-2">
                            <input type="radio" name="reportType" value="WORKBOOK" checked class="mt-1 accent-teal-500">
                            <div>
                                <span class="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                                    <i class="fa-solid fa-boxes-packing text-teal-400"></i> Complete Executive Workbook (All Sheets)
                                </span>
                                <span class="text-[11px] text-gray-500 block mt-0.5">5-sheet workbook combining all analyses + master data + monthly matrix in one file.</span>
                            </div>
                        </label>

                    </div>
                </div>

                <!-- Region & Month Selection -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <!-- Target Region Dropdown -->
                    <div class="space-y-1.5">
                        <label for="modalRegionSelect" class="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                            <i class="fa-solid fa-earth-americas text-indigo-400"></i> Target Region:
                        </label>
                        <select id="modalRegionSelect" class="w-full bg-gray-900 text-xs font-bold text-indigo-300 border border-indigo-500/40 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-400">
                            <option value="ALL">All Regions (Full Portfolio)</option>
                        </select>
                    </div>

                    <!-- Target Month Dropdown -->
                    <div class="space-y-1.5">
                        <label for="modalMonthSelect" class="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                            <i class="fa-solid fa-calendar-days text-amber-400"></i> Target Month:
                        </label>
                        <select id="modalMonthSelect" class="w-full bg-gray-900 text-xs font-bold text-amber-300 border border-amber-500/40 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400">
                            <option value="ALL">All Months (Jan–Aug Cumulative)</option>
                            <option value="Jan">January 2026</option>
                            <option value="Feb">February 2026</option>
                            <option value="Mar">March 2026</option>
                            <option value="Apr">April 2026</option>
                            <option value="May">May 2026</option>
                            <option value="Jun">June 2026</option>
                            <option value="Jul">July 2026</option>
                            <option value="Aug">August 2026</option>
                        </select>
                    </div>
                </div>
                <p class="text-[11px] text-gray-600 px-1">Filter by specific Region (e.g. Delhi) and Month to download a focused single-region report.</p>

            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-between border-t border-gray-800 px-6 py-4 flex-shrink-0 gap-3">
                <p class="text-[11px] text-gray-600 flex items-center gap-1.5">
                    <i class="fa-solid fa-shield-halved text-emerald-600"></i>
                    100% local — your data never leaves this device
                </p>
                <div class="flex items-center gap-3">
                    <button onclick="closeReportModal()" class="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition">
                        Cancel
                    </button>
                    <button onclick="executeSelectedReportExport()" class="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-2">
                        <i class="fa-solid fa-download text-sm"></i>
                        <span>Generate &amp; Download Excel</span>
                    </button>
                </div>
            </div>

        </div>
    </div>

    <!-- ── SITE BREAKDOWN & CALCULATION AUDIT MODAL ────────────────── -->
    <div id="siteDetailModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div class="bg-gray-950 border border-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/60 sticky top-0 backdrop-blur">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-mono font-bold text-sm">
                        <i class="fa-solid fa-building"></i>
                    </div>
                    <div>
                        <h3 id="modalSiteTitle" class="text-base font-bold text-white">Site Details</h3>
                        <p id="modalSiteSubtitle" class="text-xs text-gray-400">Calculation breakdown &amp; performance analysis</p>
                    </div>
                </div>
                <button onclick="closeSiteDetailModal()" class="text-gray-400 hover:text-white text-xl px-2 py-1">&times;</button>
            </div>

            <!-- Modal Content Body -->
            <div id="siteDetailModalBody" class="p-6 space-y-6">
                <!-- Dynamically filled by JS -->
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 border-t border-gray-800 flex justify-end bg-gray-900/40">
                <button onclick="closeSiteDetailModal()" class="px-5 py-2 text-xs font-semibold rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition">
                    Close
                </button>
            </div>
        </div>
    </div>

    <!-- ── METRIC FORMULA & DEFINITION GUIDE MODAL ─────────────────── -->
    <div id="metricGuideModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div class="bg-gray-950 border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div class="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/60 sticky top-0 backdrop-blur">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
                        <i class="fa-solid fa-calculator"></i>
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-white">Metrics &amp; Calculation Guide</h3>
                        <p class="text-xs text-gray-400">How every metric in this dashboard is computed</p>
                    </div>
                </div>
                <button onclick="closeMetricGuideModal()" class="text-gray-400 hover:text-white text-xl px-2 py-1">&times;</button>
            </div>

            <div id="metricGuideModalBody" class="p-6 space-y-5 text-xs text-gray-300">
                <!-- Dynamically filled by JS -->
            </div>

            <div class="px-6 py-4 border-t border-gray-800 flex justify-end bg-gray-900/40">
                <button onclick="closeMetricGuideModal()" class="px-5 py-2 text-xs font-semibold rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition">
                    Close
                </button>
            </div>
        </div>
    </div>

    <!-- ── ONEDRIVE IMPORT MODAL (URL + Paste Tabs) ──────────────────────── -->
    <div id="pasteImportModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div class="bg-gray-950 border border-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col">

            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/60 rounded-t-2xl">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 text-lg">
                        <i class="fa-brands fa-microsoft"></i>
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-white">Import from OneDrive / SharePoint</h3>
                        <p class="text-xs text-gray-400">Load data directly from your shared Excel file</p>
                    </div>
                </div>
                <button onclick="closePasteModal()" class="text-gray-400 hover:text-white text-xl px-2 py-1">&times;</button>
            </div>

            <!-- Tab Switcher -->
            <div class="flex border-b border-gray-800 bg-gray-900/40">
                <button id="tabBtnLink" onclick="switchImportTab('link')"
                    class="flex-1 px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 border-sky-500 text-sky-300 transition">
                    <i class="fa-solid fa-link"></i> Direct Link (Recommended)
                </button>
                <button id="tabBtnPaste" onclick="switchImportTab('paste')"
                    class="flex-1 px-4 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 border-transparent text-gray-400 hover:text-gray-200 transition">
                    <i class="fa-solid fa-clipboard"></i> Paste Data (Fallback)
                </button>
            </div>

            <!-- TAB: Direct Link -->
            <div id="importTabLink" class="p-6 space-y-4">

                <!-- How to get link instructions -->
                <div class="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4 text-xs space-y-2">
                    <p class="font-bold text-sky-300 flex items-center gap-2">
                        <i class="fa-solid fa-circle-info"></i> How to get your OneDrive share link:
                    </p>
                    <ol class="list-decimal list-inside space-y-1.5 text-gray-300 pl-1">
                        <li>Open <strong>OneDrive</strong> or <strong>SharePoint</strong> in your browser</li>
                        <li>Right-click the Excel file → click <strong>"Share"</strong></li>
                        <li>Set permissions to <strong>"Anyone with the link can view"</strong></li>
                        <li>Click <strong>"Copy Link"</strong> and paste it below</li>
                    </ol>
                    <p class="text-amber-300/80 flex items-start gap-1.5 pt-1">
                        <i class="fa-solid fa-triangle-exclamation mt-0.5 flex-shrink-0"></i>
                        <span>If the link requires login or has restricted access, use the <strong>Paste Data</strong> tab instead.</span>
                    </p>
                </div>

                <div class="space-y-2">
                    <label class="text-xs font-semibold text-gray-300 flex items-center gap-2">
                        <i class="fa-solid fa-link text-sky-400"></i> OneDrive / SharePoint File Link:
                    </label>
                    <input type="url" id="urlImportInput"
                        placeholder="https://onedrive.live.com/... or https://companyname.sharepoint.com/..."
                        class="w-full bg-gray-900 text-gray-200 border border-gray-700 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-sky-500 placeholder-gray-600">
                </div>

                <div id="urlImportStatus" class="hidden bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 text-xs text-blue-300 flex items-center gap-2">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span id="urlImportStatusText">Fetching file from OneDrive...</span>
                </div>

                <p class="text-[11px] text-gray-500 flex items-center gap-1.5">
                    <i class="fa-solid fa-shield-halved text-emerald-500"></i>
                    Data is processed 100% locally — it never leaves your browser
                </p>
            </div>

            <!-- TAB: Paste Data (hidden by default) -->
            <div id="importTabPaste" class="p-6 space-y-4 hidden">
                <div class="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs space-y-2">
                    <p class="font-bold text-amber-300 flex items-center gap-2">
                        <i class="fa-solid fa-clipboard"></i> How to paste data from Excel Online:
                    </p>
                    <ol class="list-decimal list-inside space-y-1.5 text-gray-300 pl-1">
                        <li>Open the Excel file in <strong>OneDrive / SharePoint Online</strong></li>
                        <li>Select <strong>all rows</strong> including the header (Ctrl+A)</li>
                        <li>Press <strong>Ctrl+C</strong> to copy</li>
                        <li>Click the text area below and press <strong>Ctrl+V</strong> to paste</li>
                    </ol>
                </div>

                <div class="space-y-2">
                    <label class="text-xs font-semibold text-gray-300 flex items-center gap-2">
                        <i class="fa-solid fa-table text-amber-400"></i> Paste Excel Data Here:
                    </label>
                    <textarea id="pasteImportTextarea" rows="9"
                        placeholder="Paste your copied Excel rows here (tab-separated)..."
                        class="w-full bg-gray-900 text-gray-200 border border-gray-700 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-amber-500 resize-y placeholder-gray-600"></textarea>
                </div>

                <p class="text-[11px] text-gray-500 flex items-center gap-1.5">
                    <i class="fa-solid fa-shield-halved text-emerald-500"></i>
                    Data is processed 100% locally — it never leaves your browser
                </p>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 border-t border-gray-800 flex items-center justify-between bg-gray-900/40 rounded-b-2xl">
                <button onclick="closePasteModal()" class="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition">Cancel</button>
                <button id="importSubmitBtn" onclick="handleOneDriveImportSubmit()"
                    class="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-600/30 transition flex items-center gap-2">
                    <i class="fa-solid fa-cloud-arrow-down"></i>
                    <span>Load from OneDrive Link</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Modular Application Logic Scripts -->
    <script src="reports.js" onerror="this.onerror=null;this.src='js/reports.js'"></script>
    <script src="sampleData.js" onerror="this.onerror=null;this.src='js/sampleData.js'"></script>
    <script src="parser.js" onerror="this.onerror=null;this.src='js/parser.js'"></script>
    <script src="charts.js" onerror="this.onerror=null;this.src='js/charts.js'"></script>
    <script src="exporter.js" onerror="this.onerror=null;this.src='js/exporter.js'"></script>
    <script src="app.js" onerror="this.onerror=null;this.src='js/app.js'"></script>



</body>
</html>
