<template>
    <div class="energy-tab">
        <div class="summary-row" v-if="totals.charge > 0 || totals.discharge > 0">
            <div class="total-card charge">
                <span class="total-label">Total Charged</span>
                <span class="total-value">{{ totals.charge.toFixed(1) }} kWh</span>
            </div>
            <div class="total-card discharge">
                <span class="total-label">Total Discharged</span>
                <span class="total-value">{{ totals.discharge.toFixed(1) }} kWh</span>
            </div>
            <div class="total-card">
                <span class="total-label">Charge-Discharge Efficiency</span>
                <span class="total-value accent">{{ fmtSys(summary.sys_efficiency) }}%</span>
            </div>
            <div class="total-card">
                <span class="total-label">Estimated Cycles</span>
                <span class="total-value accent">{{ fmtSys(summary.sys_estimated_cycles) }}</span>
            </div>
            <div class="total-card">
                <span class="total-label">Remaining Throughput Warranty</span>
                <span class="total-value accent">{{ fmtSys(summary.sys_warranty_remaining_pct) }}%</span>
            </div>
        </div>
        <div v-for="(tower, tIdx) in towers" :key="tIdx" class="tower-section">
            <div v-if="towers.length > 1" class="tower-title">Tower {{ tIdx + 1 }}</div>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Battery<br>Module</th>
                            <th>Charged<br>Energy (kWh)</th>
                            <th>Discharged<br>Energy (kWh)</th>
                            <th>Charge-Discharge<br>Efficiency %</th>
                            <th>Estimated<br>Cycles</th>
                            <th>Remaining Throughput<br>Warranty (kWh)</th>
                            <th>Remaining Throughput<br>Warranty %</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="entry in tower" :key="entry.name">
                            <td class="cell-name">{{ entry.name }}</td>
                            <td class="charge-val">{{ fmt(entry.mod.charge_energy_kwh) }}</td>
                            <td class="discharge-val">{{ fmt(entry.mod.discharge_energy_kwh) }}</td>
                            <td>{{ fmt(entry.mod.round_trip_efficiency) }}</td>
                            <td>{{ fmt(entry.mod.estimated_cycles) }}</td>
                            <td>{{ fmtKwh(entry.mod.warranty_remaining_kwh) }}</td>
                            <td>{{ fmt(entry.mod.warranty_remaining_pct) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'EnergyTab',
    props: {
        data: Object
    },
    computed: {
        summary() {
            return this.data.summary || {};
        },
        towerCount() {
            return this.data.summary ? (this.data.summary.towers || 1) : 1;
        },
        towers() {
            const mods = this.data.modules || {};
            const entries = Object.keys(mods).sort().map(name => ({ name, mod: mods[name] }));
            if (this.towerCount <= 1) return [entries];
            const perTower = Math.ceil(entries.length / this.towerCount);
            const result = [];
            for (let t = 0; t < this.towerCount; t++) {
                const group = entries.slice(t * perTower, (t + 1) * perTower);
                if (group.length > 0) result.push(group);
            }
            return result;
        },
        totals() {
            let charge = 0;
            let discharge = 0;
            const mods = this.data.modules || {};
            for (const mod of Object.values(mods)) {
                charge += mod.charge_energy_kwh || 0;
                discharge += mod.discharge_energy_kwh || 0;
            }
            return { charge, discharge };
        },
    },
    methods: {
        fmt(val) {
            if (val == null) return '—';
            return val.toFixed(1);
        },
        fmtKwh(val) {
            if (val == null) return '—';
            return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
        },
        fmtSys(val) {
            if (val == null) return '—';
            return typeof val === 'number' ? val.toFixed(1) : val;
        },
    }
}
</script>

<style scoped>
.energy-tab {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 1250px;
}

.tower-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.tower-title {
    font-size: 13px;
    font-weight: 600;
    color: #ccd6f6;
}

.summary-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.total-card {
    flex: 1;
    min-width: 150px;
    background: #12161f;
    border-radius: 6px;
    padding: 12px 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.total-label {
    font-size: 11px;
    color: #8892b0;
}

.total-value {
    font-size: 20px;
    font-weight: 700;
}

.total-card.charge .total-value { color: #f97316; }
.total-card.discharge .total-value { color: #10B981; }
.total-value.accent { color: #ccd6f6; }

.table-wrapper {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

th {
    text-align: left;
    padding: 6px 8px;
    color: #8892b0;
    font-weight: 600;
    font-size: 11px;
    border-bottom: 1px solid #333944;
    line-height: 1.4;
}

td {
    padding: 6px 8px;
    border-bottom: 1px solid #333944;
    color: #ccd6f6;
}

.cell-name {
    font-weight: 600;
    color: #10B981;
}

.charge-val { color: #f97316; }
.discharge-val { color: #10B981; }


</style>
