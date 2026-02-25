<template>
    <div class="drift-tab">
        <div class="range-bar">
            <div class="range-presets">
                <button v-for="p in presets" :key="p.value"
                    :class="['range-btn', { active: selectedRange === p.value }]"
                    @click="selectRange(p.value)">{{ p.label }}</button>
                <span v-if="loading" class="loading-text">Loading, please wait...</span>
            </div>
        </div>

        <div v-if="!drift || !drift.entries || drift.entries.length === 0" class="no-data">
            <p>No drift events recorded yet.</p>
            <p class="hint">
                Drift events are logged when a cell voltage exceeds the module median
                by more than the configured threshold. Data builds up automatically.
            </p>
        </div>

        <template v-else>
            <!-- High Cell Voltage Drift -->
            <div class="drift-section">
                <div class="section-title section-high">High Cell Voltage Drift</div>
                <p class="section-hint">Cells that drifted above module median</p>
                <div v-for="(tower, tIdx) in towerGroups" :key="'high-' + tIdx" class="tower-section">
                    <div v-if="towerGroups.length > 1" class="tower-title">Tower {{ tIdx + 1 }}</div>
                    <div v-for="modName in tower" :key="'high-' + modName" class="module-block">
                        <div class="cell-grid">
                            <div class="module-label">
                                <span class="module-name">{{ modName }}</span>
                            </div>
                            <div
                                v-for="cellIdx in 16"
                                :key="cellIdx"
                                :class="['cell', heatColor(cellCount('high', modName, cellIdx), 'high')]"
                            >
                                <span class="cell-num">{{ cellIdx }}</span>
                                <span class="cell-val">{{ cellCount('high', modName, cellIdx) || '\u00b7' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Low Cell Voltage Drift (charged state) -->
            <div class="drift-section">
                <div class="section-title section-low">Low Cell Voltage Drift (near full charge)</div>
                <p class="section-hint">Cells lagging behind others at or near full charge &mdash; may indicate balancing abnormality</p>
                <div v-for="(tower, tIdx) in towerGroups" :key="'low-charged-' + tIdx" class="tower-section">
                    <div v-if="towerGroups.length > 1" class="tower-title">Tower {{ tIdx + 1 }}</div>
                    <div v-for="modName in tower" :key="'low-charged-' + modName" class="module-block">
                        <div class="cell-grid">
                            <div class="module-label">
                                <span class="module-name">{{ modName }}</span>
                            </div>
                            <div
                                v-for="cellIdx in 16"
                                :key="cellIdx"
                                :class="['cell', heatColor(cellCount('low-charged', modName, cellIdx), 'low-charged')]"
                            >
                                <span class="cell-num">{{ cellIdx }}</span>
                                <span class="cell-val">{{ cellCount('low-charged', modName, cellIdx) || '\u00b7' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Low Cell Voltage Drift (discharged state) -->
            <div class="drift-section">
                <div class="section-title section-low">Low Cell Voltage Drift (near full discharge)</div>
                <p class="section-hint">Cells with lower voltage than others at or near full discharge</p>
                <div v-for="(tower, tIdx) in towerGroups" :key="'low-discharged-' + tIdx" class="tower-section">
                    <div v-if="towerGroups.length > 1" class="tower-title">Tower {{ tIdx + 1 }}</div>
                    <div v-for="modName in tower" :key="'low-discharged-' + modName" class="module-block">
                        <div class="cell-grid">
                            <div class="module-label">
                                <span class="module-name">{{ modName }}</span>
                            </div>
                            <div
                                v-for="cellIdx in 16"
                                :key="cellIdx"
                                :class="['cell', heatColor(cellCount('low-discharged', modName, cellIdx), 'low-discharged')]"
                            >
                                <span class="cell-num">{{ cellIdx }}</span>
                                <span class="cell-val">{{ cellCount('low-discharged', modName, cellIdx) || '\u00b7' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script>
export default {
    name: 'DriftLogTab',
    props: {
        drift: Object,
        id: String,
        towerCount: { type: Number, default: 1 }
    },
    emits: ['request-drift-log'],
    data() {
        return {
            selectedRange: '7d',
            loading: false
        }
    },
    computed: {
        presets() {
            return [
                { label: '1d', value: '1d' },
                { label: '7d', value: '7d' },
                { label: '14d', value: '14d' },
                { label: '30d', value: '30d' },
                { label: '90d', value: '90d' }
            ];
        },
        moduleNames() {
            if (!this.drift || !this.drift.entries) return [];
            var names = {};
            for (var i = 0; i < this.drift.entries.length; i++) {
                names[this.drift.entries[i].module] = true;
            }
            return Object.keys(names).sort();
        },
        towerGroups() {
            var names = this.moduleNames;
            if (this.towerCount <= 1 || names.length === 0) return [names];
            var perTower = Math.ceil(names.length / this.towerCount);
            var result = [];
            for (var t = 0; t < this.towerCount; t++) {
                var group = names.slice(t * perTower, (t + 1) * perTower);
                if (group.length > 0) result.push(group);
            }
            return result;
        },
        highCounts() {
            return this.aggregateCounts('high');
        },
        lowChargedCounts() {
            return this.aggregateCounts('low-charged');
        },
        lowDischargedCounts() {
            return this.aggregateCounts('low-discharged');
        }
    },
    watch: {
        drift() {
            this.loading = false;
        }
    },
    mounted() {
        this.requestDriftLog();
        this.startAutoRefresh();
    },
    unmounted() {
        this.stopAutoRefresh();
    },
    methods: {
        rangeMsMap() {
            return {
                '1d': 86400000,
                '7d': 604800000,
                '14d': 1209600000,
                '30d': 2592000000,
                '90d': 7776000000
            };
        },
        selectRange(val) {
            this.selectedRange = val;
            if (['14d', '30d', '90d'].includes(val)) {
                this.loading = true;
            }
            this.requestDriftLog();
        },
        requestDriftLog() {
            var now = Date.now();
            var ms = this.rangeMsMap();
            var spanMs = ms[this.selectedRange] || 604800000;
            this.$emit('request-drift-log', { from: now - spanMs, to: now });
        },
        startAutoRefresh() {
            this.stopAutoRefresh();
            this._refreshTimer = setInterval(() => {
                this.requestDriftLog();
            }, 60000);
        },
        stopAutoRefresh() {
            if (this._refreshTimer) {
                clearInterval(this._refreshTimer);
                this._refreshTimer = null;
            }
        },
        aggregateCounts(dir) {
            var counts = {};
            if (!this.drift || !this.drift.entries) return counts;
            for (var i = 0; i < this.drift.entries.length; i++) {
                var e = this.drift.entries[i];
                if (e.dir !== dir) continue;
                if (!counts[e.module]) {
                    counts[e.module] = new Array(16).fill(0);
                }
                var idx = e.cell - 1; // cell is 1-indexed
                if (idx >= 0 && idx < 16) {
                    counts[e.module][idx]++;
                }
            }
            return counts;
        },
        cellCount(dir, modName, cellNum) {
            var countsMap = {
                'high': this.highCounts,
                'low-charged': this.lowChargedCounts,
                'low-discharged': this.lowDischargedCounts
            };
            var counts = countsMap[dir];
            if (!counts || !counts[modName]) return 0;
            return counts[modName][cellNum - 1] || 0; // cellNum is 1-indexed from template
        },
        heatColor(count, dir) {
            if (count === 0) return '';
            var median = this.medianCount(dir);
            if (median <= 4) return 'heat-1'; // not enough data for meaningful relative coloring
            var deviation = (count - median) / median;
            if (deviation <= 0.10) return 'heat-1';  // at median or ≤10% above
            if (deviation <= 0.20) return 'heat-2';   // 11-20% above median
            if (deviation <= 0.40) return 'heat-3';   // 21-40% above median
            return 'heat-4';                           // >40% above median
        },
        medianCount(dir) {
            var countsMap = {
                'high': this.highCounts,
                'low-charged': this.lowChargedCounts,
                'low-discharged': this.lowDischargedCounts
            };
            var counts = countsMap[dir];
            var all = [];
            for (var mod in counts) {
                for (var i = 0; i < counts[mod].length; i++) {
                    if (counts[mod][i] > 0) all.push(counts[mod][i]);
                }
            }
            if (all.length === 0) return 0;
            all.sort(function(a, b) { return a - b; });
            var mid = Math.floor(all.length / 2);
            return all.length % 2 === 0 ? (all[mid - 1] + all[mid]) / 2 : all[mid];
        }
    }
}
</script>

<style scoped>
.drift-tab {
    display: flex;
    flex-direction: column;
    max-width: 1250px;
    gap: 16px;
}

.range-bar {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.range-presets {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
}

.loading-text {
    font-size: 12px;
    color: #f97316;
    margin-left: 6px;
}

.range-btn {
    padding: 5px 12px;
    border: 1px solid #333944;
    border-radius: 4px;
    background: #12161f;
    color: #8892b0;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
}

.range-btn:hover {
    color: #ccd6f6;
    border-color: #4a5568;
}

.range-btn.active {
    color: #10B981;
    border-color: #10B981;
}

.no-data {
    text-align: center;
    padding: 24px;
    color: #8892b0;
}

.no-data p {
    margin: 4px 0;
}

.hint {
    font-size: 12px;
    color: #5a6580;
}

.drift-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.section-title {
    font-size: 13px;
    font-weight: 600;
}

.section-high {
    color: #ff6b6b;
}

.section-low {
    color: #22d3ee;
}

.section-hint {
    font-size: 11px;
    color: #5a6580;
    margin: -4px 0 4px 0;
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
    color: #8892b0;
}

.heat-1 {
    background: #10B98122;
}
.heat-1 .cell-val {
    color: #10B981;
}

.heat-2 {
    background: #ffd93d33;
}
.heat-2 .cell-val {
    color: #ffd93d;
}

.heat-3 {
    background: #f9731644;
}
.heat-3 .cell-val {
    color: #f97316;
}

.heat-4 {
    background: #ff6b6b55;
}
.heat-4 .cell-val {
    color: #ff6b6b;
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
