/**
 * Generator for realistic benchmark sample data matching user's exact schema.
 * Contains 30 sites across 5 Regions (North, South, East, West, Central)
 * with Jan 2026 to July/Aug 2026 data.
 */

window.generateSampleDataset = function() {
    const regions = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL'];
    const customerGroups = ['IT Parks', 'Manufacturing', 'Healthcare', 'Retail Outlets', 'Commercial Hubs', 'Residential Complexes'];
    const siteStatuses = ['Active', 'Active', 'Active', 'Under Review', 'Active'];
    
    const srManagers = ['Rajesham V.', 'Sunil Kumar', 'Anitha Rao', 'Vikramaditya Singh'];
    const managers = ['Praveen Sharma', 'Deepak Verma', 'Sanjay Patel', 'Ritu Gupta', 'Manish Joshi'];
    const assistantManagers = ['Amit Roy', 'Kavita Reddy', 'Nikhil Nair', 'Suresh Das', 'Neha Kapoor'];
    const supervisors = ['Ramesh Babu', 'Ganesh Chary', 'Srinivas K.', 'Mahesh Y.', 'Dharmendra P.', 'Kalyan M.'];

    const salesModels = ['Fixed Rate', 'Manpower + Material', 'Unit Rate', 'SLA Based'];
    const serviceProviders = ['Apex Facility Services', 'ProTouch Managed Services', 'Standard Operations Solutions', 'Integrated FM Pvt Ltd'];

    const sites = [];
    let sno = 1;

    regions.forEach(region => {
        // Generate 6 sites per region
        for (let i = 1; i <= 6; i++) {
            const siteCode = `ST-${region.substring(0, 2)}-${100 + i}`;
            const siteName = `${region} Site Alpha-${i} (${customerGroups[i % customerGroups.length]})`;
            const custGroup = customerGroups[i % customerGroups.length];
            const status = siteStatuses[i % siteStatuses.length];
            const salesModel = salesModels[i % salesModels.length];
            const serviceProvider = serviceProviders[i % serviceProviders.length];

            const srMgr = srManagers[i % srManagers.length];
            const mgr = managers[i % managers.length];
            const am = assistantManagers[i % assistantManagers.length];
            const sup = supervisors[i % supervisors.length];

            // Base financial scale
            // Make site 1 and site 2 in each region have disproportionately higher consumption to trigger >7% threshold
            const isHighConsumptionSite = (i === 1 || i === 2);
            const baseBilling = 350000 + Math.floor(Math.random() * 250000);
            const baseExpense = Math.floor(baseBilling * (0.45 + Math.random() * 0.20));
            
            // High consumption site consumes 12% - 22% of total region consumption value
            const baseConsumption = isHighConsumptionSite 
                ? Math.floor(baseBilling * (0.28 + Math.random() * 0.15))
                : Math.floor(baseBilling * (0.04 + Math.random() * 0.05));

            const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'June', 'July', 'Aug'];
            
            const siteRow = {
                "S.no": sno++,
                "Site code": siteCode,
                "Sales Model": salesModel,
                "Region": region,
                "Service Provider": serviceProvider,
                "Site name": siteName,
                "Customer Group": custGroup,
                "Site Status": status,
                "Supervisor": sup,
                "ASSISTANT MANAGER": am,
                "MANAGER": mgr,
                "SR MANAGER": srMgr
            };

            let sumBilling = 0;
            let sumExpense = 0;
            let sumConsumption = 0;
            let countMonths = 0;

            months.forEach(m => {
                // Variations across months
                const monthFactor = 0.9 + Math.random() * 0.25;
                const mBilling = Math.round(baseBilling * monthFactor);
                const mExpense = Math.round(baseExpense * monthFactor);
                const mConsumption = Math.round(baseConsumption * monthFactor);

                const mName = m.toUpperCase();
                siteRow[`${mName} 2026 BILLING`] = mBilling;
                siteRow[`${mName} 2026 EXPENSE`] = mExpense;
                siteRow[`${mName} 2026 Consumption Value`] = mConsumption;

                sumBilling += mBilling;
                sumExpense += mExpense;
                sumConsumption += mConsumption;
                countMonths++;
            });

            const avgBilling = Math.round(sumBilling / countMonths);
            const avgExpense = Math.round(sumExpense / countMonths);
            const avgConsumption = Math.round(sumConsumption / countMonths);
            const totalCost = avgExpense + avgConsumption;
            const avgGrossMargin = avgBilling > 0 ? Number((((avgBilling - totalCost) / avgBilling) * 100).toFixed(2)) : 0;

            siteRow["Code"] = siteCode;
            siteRow["Average Monthly Consumption"] = avgConsumption;
            siteRow["Average Monthly Billing"] = avgBilling;
            siteRow["Average Manpower Expense"] = avgExpense;
            siteRow["AVERAGE EXPENSE"] = avgExpense + avgConsumption;
            siteRow["AVG GROSS MARGIN"] = avgGrossMargin;

            sites.push(siteRow);
        }
    });

    return sites;
};