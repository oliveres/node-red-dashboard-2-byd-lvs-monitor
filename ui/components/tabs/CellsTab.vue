<template>
    <div class="cells-tab">
        <div v-for="(tower, tIdx) in towers" :key="tIdx" class="tower-section">
            <div v-if="towers.length > 1" class="tower-title">Tower {{ tIdx + 1 }}</div>
            <div v-for="entry in tower" :key="entry.name" class="module-block">
                <div class="cell-grid">
                    <div class="module-label">
                        <span class="module-name">{{ entry.name }}</span>
                        <span v-if="balancingCount(entry.mod) > 0" class="bal-badge">Bal {{ balancingCount(entry.mod) }}</span>
                    </div>
                    <div
                        v-for="(v, i) in entry.mod.cell_voltages"
                        :key="i"
                        :class="['cell', { 'cell-balancing-border': entry.mod.balancing && entry.mod.balancing[i] }]"
                    >
                        <span class="cell-num">{{ i + 1 }}</span>
                        <span class="cell-val" :class="cellHighlight(v, entry.mod.cell_voltages, entry.mod, i)">{{ formatVoltage(v) }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CellsTab',
    props: {
        data: Object
    },
    computed: {
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
        }
    },
    methods: {
        balancingCount(mod) {
            if (!mod.balancing) return 0;
            return mod.balancing.filter(b => b > 0).length;
        },
        cellHighlight(voltage, allVoltages, mod, cellIdx) {
            if (!allVoltages || allVoltages.length === 0 || voltage == null) return '';
            const unique = [...new Set(allVoltages)].sort((a, b) => a - b);
            if (unique.length < 2) return '';
            const vMin = unique[0];
            const vMax = unique[unique.length - 1];
            // Outlier threshold: >=5 mV (or 0.005 V) gap to second nearest
            const scale = vMin < 10 ? 1000 : 1; // V vs mV
            const minOutlier = (unique[1] - unique[0]) * scale >= 5;
            const maxOutlier = (unique[unique.length - 1] - unique[unique.length - 2]) * scale >= 5;
            if (voltage === vMin && minOutlier) return 'cell-min';
            if (voltage === vMax && maxOutlier) return 'cell-max';
            return '';
        },
        formatVoltage(v) {
            if (v == null) return '—';
            // If in V (< 10), show 3 decimals; else show as mV integer
            return v < 10 ? v.toFixed(3) : v;
        }
    }
}
</script>

<style scoped>
.cells-tab {
    display: flex;
    flex-direction: column;
    max-width: 1250px;
    gap: 16px;
}

.tower-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.tower-title {
    font-size: 13px;
    font-weight: 600;
    color: #ccd6f6;
    margin-bottom: -4px;
}

.module-block {
    background: #12161f;
    border-radius: 6px;
    padding: 8px;
}

.cell-grid {
    display: grid;
    grid-template-columns: auto repeat(16, 1fr);
    gap: 5px;
    align-items: center;
}

.module-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 0 4px;
    min-width: 40px;
}

.module-name {
    font-size: 12px;
    font-weight: 700;
    color: #10B981;
    white-space: nowrap;
}

.bal-badge {
    font-size: 10px;
    font-weight: 400;
    color: #8892b0;
    background: #8892b022;
    padding: 1px 4px;
    border-radius: 3px;
    white-space: nowrap;
}



.cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 2px;
    border-radius: 4px;
    background: #1e2938;
    min-width: 0;
}

.cell-num {
    font-size: 12px;
    color: #8892b0;
}

.cell-val {
    font-size: 14px;
    font-weight: 600;
    color: #ccd6f6;
}

.cell-val.cell-min {
    color: #22d3ee;
}

.cell-val.cell-max {
    color: #ff6b6b;
}

.cell-balancing-border {
    outline: 1px solid #f97316;
    outline-offset: -1px;
}

@media (max-width: 600px) {
    .cell-grid {
        grid-template-columns: auto repeat(8, 1fr);
    }
    .module-label {
        grid-row: 1 / 3;
    }
}
</style>
