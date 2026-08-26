/**
 * Chart.js Visualization Engine
 * Manages responsive executive dashboard charts.
 */

window.chartInstances = {};

window.updateDashboardCharts = function(sites) {
    if (!sites || sites.length === 0) return;

    // Aggregate by Region
    const regionMap = {};
    sites.forEach(s => {
        if (!regionMap[s.region]) {
            regionMap[s.region] = { billing: 0, expense: 0, consumption: 0 };
        }
        regionMap[s.region].billing += s.activeBilling;
        regionMap[s.region].expense += s.activeExpense;
        regionMap[s.region].consumption += s.activeConsumption;
    });

    const regions = Object.keys(regionMap).sort();
    const billings = regions.map(r => regionMap[r].billing);
    const expenses = regions.map(r => regionMap[r].expense);
    const consumptions = regions.map(r => regionMap[r].consumption);

    // 1. Region Financial Overview Bar Chart
    const ctxBar = document.getElementById('chartRegionOverview')?.getContext('2d');
    if (ctxBar) {
        if (window.chartInstances.regionOverview) {
            window.chartInstances.regionOverview.destroy();
        }

        window.chartInstances.regionOverview = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: regions,
                datasets: [
                    {
                        label: 'Total Billing',
                        data: billings,
                        backgroundColor: '#3b82f6',
                        borderRadius: 6
                    },
                    {
                        label: 'Manpower Expense',
                        data: expenses,
                        backgroundColor: '#ef4444',
                        borderRadius: 6
                    },
                    {
                        label: 'Consumption Value',
                        data: consumptions,
                        backgroundColor: '#a855f7',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + window.formatRupee(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#9ca3af' },
                        grid: { color: '#1f2937' }
                    },
                    y: {
                        ticks: { 
                            color: '#9ca3af',
                            callback: function(val) { return '₹' + (val / 100000).toFixed(1) + 'L'; }
                        },
                        grid: { color: '#1f2937' }
                    }
                }
            }
        });
    }

    // 2. Region Consumption Value Donut Chart
    const ctxDonut = document.getElementById('chartRegionConsumptionDonut')?.getContext('2d');
    if (ctxDonut) {
        if (window.chartInstances.regionDonut) {
            window.chartInstances.regionDonut.destroy();
        }

        const donutColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

        window.chartInstances.regionDonut = new Chart(ctxDonut, {
            type: 'doughnut',
            data: {
                labels: regions,
                datasets: [{
                    data: consumptions,
                    backgroundColor: donutColors.slice(0, regions.length),
                    borderWidth: 2,
                    borderColor: '#111827'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ' Consumption: ' + window.formatRupee(context.raw);
                            }
                        }
                    }
                },
                cutout: '68%'
            }
        });
    }
};

window.updateMonthlyTrendsChart = function(monthlyTotals) {
    const ctxLine = document.getElementById('chartMonthlyTrends')?.getContext('2d');
    if (!ctxLine) return;

    if (window.chartInstances.monthlyTrends) {
        window.chartInstances.monthlyTrends.destroy();
    }

    const labels = monthlyTotals.map(m => m.label || m.key);
    const billings = monthlyTotals.map(m => m.billing);
    const expenses = monthlyTotals.map(m => m.expense);
    const consumptions = monthlyTotals.map(m => m.consumption);

    window.chartInstances.monthlyTrends = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Billing',
                    data: billings,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 3
                },
                {
                    label: 'Manpower Expense',
                    data: expenses,
                    borderColor: '#ef4444',
                    backgroundColor: 'transparent',
                    tension: 0.3,
                    borderWidth: 2,
                    borderDash: [5, 5]
                },
                {
                    label: 'Consumption Value',
                    data: consumptions,
                    borderColor: '#a855f7',
                    backgroundColor: 'transparent',
                    tension: 0.3,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 12 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + window.formatRupee(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: '#1f2937' }
                },
                y: {
                    ticks: { 
                        color: '#9ca3af',
                        callback: function(val) { return '₹' + (val / 100000).toFixed(1) + 'L'; }
                    },
                    grid: { color: '#1f2937' }
                }
            }
        }
    });
};
