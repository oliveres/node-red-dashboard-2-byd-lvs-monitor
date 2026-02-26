<template>
    <div class="history-tab">
        <div class="range-bar">
            <div class="range-presets">
                <button v-for="p in presets" :key="p.value"
                    :class="['range-btn', { active: selectedRange === p.value }]"
                    @click="selectRange(p.value)">{{ p.label }}</button>
                <span class="mode-separator"></span>
                <button :class="['range-btn', { active: displayMode === 'all' }]" @click="setDisplayMode('all')">All cells</button>
                <button :class="['range-btn', { active: displayMode === 'median' }]" @click="setDisplayMode('median')">Min/Med/Max</button>
                <span v-if="timeAgo" class="last-update">Last update: {{ timeAgo }}</span>
                <span v-if="loading" class="loading-text">Loading, please wait...</span>
                <span v-if="chartLoadError" class="error-text">Chart library failed to load. Check your internet connection and reload the page.</span>
            </div>
        </div>
        <div v-if="!history || !history.cells" class="no-data">
            <p>No historical data available.</p>
            <p class="hint">
                Historical data builds up automatically from live scans (last 24 hours).
            </p>
        </div>
        <template v-else>
            <div v-for="(tower, tIdx) in towerGroups" :key="tIdx" class="tower-section">
                <div v-if="towerGroups.length > 1" class="tower-title">Tower {{ tIdx + 1 }}</div>
                <div class="chart-row" v-for="modName in tower" :key="modName">
                    <div class="chart-title">{{ modName }} — Cell Voltages</div>
                    <div class="chart-body">
                        <div class="chart-container">
                            <canvas :ref="'chart-' + modName"></canvas>
                        </div>
                        <div class="chart-stats">
                            <div class="stat-title">Last cell values</div>
                            <div class="stat-row"><span class="stat-label max-color">Max</span><span class="stat-val max-color">{{ fmtVoltage(getStats(modName).max, getStats(modName).isMv) }}</span></div>
                            <div class="stat-row stat-delta"><span class="stat-label">Δ</span><span class="stat-val">{{ fmtDelta(getStats(modName).driftMax, getStats(modName).isMv) }}</span></div>
                            <div class="stat-row"><span class="stat-label">Median</span><span class="stat-val">{{ fmtVoltage(getStats(modName).median, getStats(modName).isMv) }}</span></div>
                            <div class="stat-row stat-delta"><span class="stat-label">Δ</span><span class="stat-val">{{ fmtDelta(getStats(modName).driftMin, getStats(modName).isMv) }}</span></div>
                            <div class="stat-row"><span class="stat-label min-color">Min</span><span class="stat-val min-color">{{ fmtVoltage(getStats(modName).min, getStats(modName).isMv) }}</span></div>
                            <div class="stat-separator"></div>
                            <div class="stat-title">Last module values</div>
                            <div class="stat-row"><span class="stat-label">Voltage</span><span class="stat-val">{{ fmtModuleVal(modName, 'bat_voltage', 'V', 1) }}</span></div>
                            <div class="stat-row"><span class="stat-label">Current</span><span class="stat-val" :class="currentColor(modName)">{{ fmtModuleVal(modName, 'current', 'A', 1) }}</span></div>
                            <div class="stat-row"><span class="stat-label">SOC</span><span class="stat-val">{{ fmtModuleVal(modName, 'soc', '%', 1) }}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script>
// Singleton promise for Chart.js loading (shared across instances, survives HMR)
let _chartJsLoadPromise = null;

export default {
    name: 'HistoryTab',
    props: {
        history: Object,
        data: Object,
        id: String,
        towerCount: { type: Number, default: 1 }
    },
    emits: ['request-history'],
    data() {
        return {
            chartInstances: {},
            selectedRange: '1h',
            displayMode: 'all',
            loading: false,
            chartLoadError: false,
            now: Date.now()
        }
    },
    computed: {
        timeAgo() {
            if (!this.data || !this.data.timestamp) return '';
            var seconds = Math.floor((this.now - new Date(this.data.timestamp).getTime()) / 1000);
            if (seconds < 0) return 'just now';
            if (seconds < 60) return seconds + 's ago';
            var minutes = Math.floor(seconds / 60);
            return minutes + 'm ' + (seconds % 60) + 's ago';
        },
        presets() {
            return [
                { label: '30min', value: '30min' },
                { label: '1h', value: '1h' },
                { label: '2h', value: '2h' },
                { label: '6h', value: '6h' },
                { label: '12h', value: '12h' },
                { label: '24h', value: '24h' }
            ];
        },
        moduleNames() {
            if (!this.history || !this.history.cells) return [];
            return Object.keys(this.history.cells).sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); });
        },
        towerGroups() {
            const names = this.moduleNames;
            if (this.towerCount <= 1 || names.length === 0) return [names];
            const perTower = Math.ceil(names.length / this.towerCount);
            const result = [];
            for (let t = 0; t < this.towerCount; t++) {
                const group = names.slice(t * perTower, (t + 1) * perTower);
                if (group.length > 0) result.push(group);
            }
            return result;
        },
        moduleStatsMap() {
            if (!this.history || !this.history.cells) return {};
            var emptyEntry = { max: null, driftMax: null, median: null, driftMin: null, min: null, isMv: false };
            if (!this.history.ts || this.history.ts.length === 0) {
                var result0 = {};
                for (var m in this.history.cells) result0[m] = emptyEntry;
                return result0;
            }
            var lastIdx = this.history.ts.length - 1;
            var result = {};
            for (var modName in this.history.cells) {
                var cellData = this.history.cells[modName];
                var values = [];
                for (var c = 0; c < cellData.length; c++) {
                    var v = cellData[c][lastIdx];
                    if (v != null) values.push(v);
                }
                if (values.length === 0) {
                    result[modName] = { max: null, driftMax: null, median: null, driftMin: null, min: null, isMv: false };
                    continue;
                }
                var sorted = values.slice().sort(function (a, b) { return a - b; });
                var min = sorted[0];
                var max = sorted[sorted.length - 1];
                var mid = Math.floor(sorted.length / 2);
                var median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
                var isMv = min > 100;
                result[modName] = {
                    max: max,
                    driftMax: max - median,
                    median: median,
                    driftMin: median - min,
                    min: min,
                    isMv: isMv
                };
            }
            return result;
        }
    },
    watch: {
        history: {
            deep: true,
            handler() {
                if (!this.history || !this.history.cells) {
                    this.loading = false;
                    clearTimeout(this._loadingTimeout);
                    return;
                }
                this.chartLoadError = false;
                clearTimeout(this._loadingTimeout);
                this.loadChartJs().then(() => {
                    this.$nextTick(() => this.renderCharts());
                }).catch(() => {
                    this.chartLoadError = true;
                    this.loading = false;
                });
            }
        },
        data() {
            // Throttle: max one auto-request per 60s from live data updates
            var now = Date.now();
            if (this._lastAutoRequest && (now - this._lastAutoRequest < 60000)) return;
            this._lastAutoRequest = now;
            this.requestHistory(this.rangeToRequest(this.selectedRange));
        }
    },
    mounted() {
        this._lastAutoRequest = Date.now();
        this._nowTimer = setInterval(() => { this.now = Date.now(); }, 1000);
        this.requestHistory(this.rangeToRequest('1h'));
        if (this.history && this.history.cells) {
            this.loadChartJs().then(() => this.renderCharts()).catch(() => {
                this.chartLoadError = true;
            });
        }
    },
    unmounted() {
        if (this._nowTimer) clearInterval(this._nowTimer);
        clearTimeout(this._loadingTimeout);
        for (const inst of Object.values(this.chartInstances)) {
            inst.destroy();
        }
        this.chartInstances = {};
    },
    methods: {
        rangeMsMap() {
            return { '30min': 1800000, '1h': 3600000, '2h': 7200000, '6h': 21600000, '12h': 43200000, '24h': 86400000 };
        },
        rangeToRequest(range) {
            const now = Date.now();
            const ms = this.rangeMsMap();
            const spanMs = ms[range] || 3600000;
            return { from: now - spanMs, to: now };
        },
        selectRange(val) {
            this.selectedRange = val;
            clearTimeout(this._loadingTimeout);
            if (['2h', '6h', '12h', '24h'].includes(val)) {
                this.loading = true;
                this._loadingTimeout = setTimeout(() => { this.loading = false; }, 10000);
            } else {
                this.loading = false;
            }
            this._lastAutoRequest = Date.now();
            this.requestHistory(this.rangeToRequest(val));
        },
        requestHistory(req) {
            this.$emit('request-history', req);
        },
        setDisplayMode(mode) {
            this.displayMode = mode;
            this.$nextTick(() => this.renderCharts());
        },
        loadChartJs() {
            if (window.Chart) return Promise.resolve();
            if (_chartJsLoadPromise) return _chartJsLoadPromise;
            _chartJsLoadPromise = new Promise(function (resolve, reject) {
                var script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
                script.onload = function () {
                    var adapter = document.createElement('script');
                    adapter.src = 'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3/dist/chartjs-adapter-date-fns.bundle.min.js';
                    adapter.onload = resolve;
                    adapter.onerror = reject;
                    document.head.appendChild(adapter);
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
            return _chartJsLoadPromise;
        },
        fmtVoltage(val, isMv) {
            if (val == null) return '—';
            if (isMv) return (val / 1000).toFixed(3) + ' V';
            return val.toFixed(3) + ' V';
        },
        fmtDelta(val, isMv) {
            if (val == null) return '—';
            if (!isMv) val = val * 1000;
            return Math.round(val) + ' mV';
        },
        getStats(modName) {
            return this.moduleStatsMap[modName] || { max: null, driftMax: null, median: null, driftMin: null, min: null, isMv: false };
        },
        currentColor(modName) {
            if (!this.data || !this.data.modules || !this.data.modules[modName]) return '';
            var val = this.data.modules[modName].current;
            if (val > 0) return 'charging';
            if (val < 0) return 'discharging';
            return '';
        },
        fmtModuleVal(modName, field, unit, decimals) {
            if (!this.data || !this.data.modules || !this.data.modules[modName]) return '—';
            var val = this.data.modules[modName][field];
            if (val == null || typeof val !== 'number') return '—';
            return val.toFixed(decimals) + ' ' + unit;
        },
        renderCharts() {
            if (!window.Chart || !this.history || !this.history.cells) return;

            // Register custom tooltip positioner (once)
            const Tooltip = window.Chart.registry.plugins.get('tooltip');
            if (Tooltip && !Tooltip.positioners.leftOffset) {
                Tooltip.positioners.leftOffset = function(elements, eventPosition) {
                    return { x: eventPosition.x - 75, y: 0 };
                };
            }

            for (const modName of this.moduleNames) {
                const cellData = this.history.cells[modName];
                if (!cellData) continue;

                const refKey = 'chart-' + modName;
                const canvasArr = this.$refs[refKey];
                const canvas = Array.isArray(canvasArr) ? canvasArr[0] : canvasArr;
                if (!canvas) continue;

                if (this.chartInstances[modName]) {
                    this.chartInstances[modName].destroy();
                }

                // Detect mV vs V from first data point
                const firstVal = cellData[0] && cellData[0][0] ? cellData[0][0] : 0;
                const isMv = firstVal > 100;

                const datasets = [];
                const cellNums = Array.from({length: cellData.length}, (_, i) => i);
                const ts = this.history.ts;

                // Find min/max cell by last data point
                let minCell = null, maxCell = null;
                let minVal = Infinity, maxVal = -Infinity;
                for (const cellNum of cellNums) {
                    const voltages = cellData[cellNum];
                    if (voltages && voltages.length > 0) {
                        const last = voltages[voltages.length - 1];
                        if (last == null) continue;
                        if (last < minVal) { minVal = last; minCell = cellNum; }
                        if (last > maxVal) { maxVal = last; maxCell = cellNum; }
                    }
                }

                if (this.displayMode === 'median') {
                    // Max cell trace (top in tooltip)
                    if (maxCell != null) {
                        const maxPoints = cellData[maxCell].map((v, j) => ({ x: ts[j], y: v }));
                        datasets.push({ label: 'Cell ' + (maxCell + 1), data: maxPoints, borderColor: '#ff6b6b', backgroundColor: '#ff6b6b', pointBackgroundColor: '#ff6b6b', borderWidth: 1, pointRadius: 0, fill: false, tension: 0, spanGaps: true });
                    }
                    // Median trace (computed per timestamp)
                    const medianPoints = new Array(ts.length);
                    for (let j = 0; j < ts.length; j++) {
                        const vals = [];
                        for (let c = 0; c < cellData.length; c++) {
                            if (cellData[c][j] != null) vals.push(cellData[c][j]);
                        }
                        if (vals.length === 0) {
                            medianPoints[j] = { x: ts[j], y: null };
                            continue;
                        }
                        vals.sort((a, b) => a - b);
                        const mid = Math.floor(vals.length / 2);
                        medianPoints[j] = { x: ts[j], y: vals.length % 2 === 0 ? (vals[mid - 1] + vals[mid]) / 2 : vals[mid] };
                    }
                    datasets.push({ label: 'Median', data: medianPoints, borderColor: '#ccd6f6', backgroundColor: '#ccd6f6', pointBackgroundColor: '#ccd6f6', borderWidth: 1, pointRadius: 0, fill: false, tension: 0, spanGaps: true });
                    // Min cell trace (bottom in tooltip)
                    if (minCell != null) {
                        const minPoints = cellData[minCell].map((v, j) => ({ x: ts[j], y: v }));
                        datasets.push({ label: 'Cell ' + (minCell + 1), data: minPoints, borderColor: '#22d3ee', backgroundColor: '#22d3ee', pointBackgroundColor: '#22d3ee', borderWidth: 1, pointRadius: 0, fill: false, tension: 0, spanGaps: true });
                    }
                } else {
                    for (const cellNum of cellNums) {
                        const voltages = cellData[cellNum];
                        const points = new Array(voltages.length);
                        for (let j = 0; j < voltages.length; j++) {
                            points[j] = { x: ts[j], y: voltages[j] };
                        }
                        let color = '#8892b066';
                        if (cellNum === minCell) color = '#22d3ee';
                        else if (cellNum === maxCell) color = '#ff6b6b';
                        datasets.push({
                            label: 'Cell ' + (cellNum + 1),
                            data: points,
                            borderColor: color,
                            backgroundColor: color,
                            pointBackgroundColor: color,
                            borderWidth: 1,
                            pointRadius: 0,
                            fill: false,
                            tension: 0,
                            spanGaps: true
                        });
                    }
                }

                const ctx = canvas.getContext('2d');
                this.chartInstances[modName] = new window.Chart(ctx, {
                    type: 'line',
                    data: { datasets },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        interaction: {
                            mode: 'index',
                            intersect: false
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                position: 'leftOffset',
                                caretSize: 0,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                boxWidth: 5,
                                boxHeight: 5,
                                boxPadding: 3,
                                bodySpacing: 1
                            }
                        },
                        scales: {
                            x: {
                                type: 'time',
                                time: {
                                    displayFormats: {
                                        second: 'HH:mm:ss',
                                        minute: 'HH:mm',
                                        hour: 'HH:mm'
                                    },
                                    tooltipFormat: 'HH:mm:ss'
                                },
                                ticks: {
                                    color: '#8892b0',
                                    font: { size: 12 },
                                    maxRotation: 0,
                                    autoSkip: true,
                                    maxTicksLimit: 10
                                },
                                grid: { color: '#1a1a2e' }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: isMv ? 'mV' : 'V',
                                    color: '#8892b0',
                                    font: { size: 12 }
                                },
                                ticks: { color: '#8892b0', font: { size: 12 } },
                                grid: { color: '#1a1a2e' }
                            }
                        }
                    }
                });
            }
            this.loading = false;
        }
    }
}
</script>

<style scoped>
.history-tab {
    display: flex;
    flex-direction: column;
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

.last-update {
    font-size: 12px;
    color: #5a6580;
    margin-left: 10px;
}

.loading-text {
    font-size: 12px;
    color: #f97316;
    margin-left: 6px;
}

.error-text {
    font-size: 12px;
    color: #ff6b6b;
    margin-left: 6px;
}

.mode-separator {
    width: 1px;
    height: 20px;
    background: #333944;
    margin: 0 4px;
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

.tower-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.tower-title {
    font-size: 13px;
    font-weight: 600;
    color: #ccd6f6;
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

.hint code {
    background: #12161f;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 11px;
}

.chart-row {
    background: #12161f;
    border-radius: 6px;
    padding: 10px;
}

.chart-title {
    font-size: 12px;
    font-weight: 600;
    color: #10B981;
    margin-bottom: 6px;
}

.chart-body {
    display: flex;
    gap: 0;
}

.chart-container {
    position: relative;
    height: 300px;
    flex: 1;
    min-width: 0;
    border-right: 1px solid #1a1a2e;
}

.chart-container canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100% !important;
}

.chart-stats {
    width: 155px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 2px;
    padding: 13px 15px;
    margin: 0 0 0 12px;
    background: #151B27;
    border-radius: 6px;
}

.stat-title {
    font-size: 12px;
    font-weight: 600;
    color: #8892b0;
    margin-bottom: 4px;
}

.stat-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #ccd6f6;
}

.stat-delta {
    padding-left: 8px;
    font-size: 12px;
    color: #8892b0;
}

.stat-label {
    white-space: nowrap;
}

.stat-val {
    font-family: monospace;
    text-align: right;
    white-space: nowrap;
}

.stat-separator {
    height: 1px;
    background: #333944;
    margin: 26px 0;
}

.max-color { color: #ff6b6b; }
.min-color { color: #22d3ee; }
.charging { color: #f97316; }
.discharging { color: #10B981; }
</style>
