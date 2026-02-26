<template>
    <div class="temps-tab">
        <div v-for="(tower, tIdx) in towers" :key="tIdx" class="tower-section">
            <div v-if="towers.length > 1" class="tower-title">Tower {{ tIdx + 1 }}</div>
            <div v-for="entry in tower" :key="entry.name" class="module-block">
                <div class="temp-grid">
                    <div class="module-label">
                        <span class="module-name">{{ entry.name }}</span>
                    </div>
                    <div
                        v-for="(t, i) in entry.mod.cell_temps"
                        :key="i"
                        class="temp-cell"
                    >
                        <span class="sensor-num">S{{ i + 1 }}</span>
                        <span class="temp-val" :class="tempHighlight(t, entry.mod.cell_temps)">{{ t }}°C</span>
                    </div>
                    <div v-if="!entry.mod.cell_temps || entry.mod.cell_temps.length === 0" class="no-data">
                        No temperature data
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'TempsTab',
    props: {
        data: Object
    },
    computed: {
        towerCount() {
            return this.data.summary ? (this.data.summary.towers || 1) : 1;
        },
        towers() {
            const mods = this.data.modules || {};
            const entries = Object.keys(mods).sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); }).map(name => ({ name, mod: mods[name] }));
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
        tempHighlight(t, allTemps) {
            if (t == null || !allTemps || allTemps.length === 0) return '';
            const valid = allTemps.filter(v => v != null && v > 0);
            const unique = [...new Set(valid)].sort((a, b) => a - b);
            if (unique.length < 2) return '';
            const tMin = unique[0];
            const tMax = unique[unique.length - 1];
            const minOutlier = (unique[1] - unique[0]) >= 2;
            const maxOutlier = (unique[unique.length - 1] - unique[unique.length - 2]) >= 2;
            if (t === tMax && maxOutlier) return 'temp-hot';
            if (t === tMin && minOutlier) return 'temp-cold';
            return '';
        }
    }
}
</script>

<style scoped>
.temps-tab {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 1048px;
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

.temp-grid {
    display: grid;
    grid-template-columns: auto repeat(8, 1fr);
    gap: 5px;
    align-items: center;
}

.module-label {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    min-width: 40px;
}

.module-name {
    font-size: 12px;
    font-weight: 700;
    color: #10B981;
    white-space: nowrap;
}

.temp-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 2px;
    border-radius: 4px;
    background: #1e2938;
}

.sensor-num {
    font-size: 12px;
    color: #8892b0;
}

.temp-val {
    font-size: 14px;
    font-weight: 600;
    color: #ccd6f6;
}

.temp-val.temp-cold {
    color: #4361ee;
}

.temp-val.temp-hot {
    color: #ff6b6b;
}

.no-data {
    grid-column: 1 / -1;
    text-align: center;
    color: #8892b0;
    font-size: 12px;
    padding: 8px;
}

@media (max-width: 600px) {
    .temp-grid {
        grid-template-columns: auto repeat(4, 1fr);
    }
    .module-label {
        grid-row: 1 / 3;
    }
}
</style>
