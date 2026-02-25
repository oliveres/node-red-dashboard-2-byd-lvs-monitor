<template>
    <div class="overview">
        <div class="overview-top">
            <div class="gauge-container">
                <svg viewBox="0 0 120 120" class="gauge-svg">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#2a2a4a" stroke-width="10" />
                    <circle
                        cx="60" cy="60" r="52"
                        fill="none"
                        :stroke="socColor"
                        stroke-width="10"
                        stroke-linecap="round"
                        :stroke-dasharray="socDash"
                        stroke-dashoffset="0"
                        transform="rotate(-90 60 60)"
                    />
                    <text x="60" y="58" text-anchor="middle" class="gauge-value">{{ soc }}%</text>
                    <text x="60" y="74" text-anchor="middle" class="gauge-label">SOC</text>
                </svg>
            </div>
            <div class="status-cards-wrapper">
                <div class="meta-row">
                    <span class="meta-item">Host: {{ data.host }}</span>
                    <span v-if="summary.bmu_serial" class="meta-item">SN: {{ summary.bmu_serial }}</span>
                </div>
                <div class="status-cards">
                <div class="card">
                    <span class="card-label">Pack Voltage</span>
                    <span class="card-value">{{ fmt(summary.pack_voltage, 1) }} V</span>
                </div>
                <div class="card">
                    <span class="card-label">Power</span>
                    <span class="card-value" :class="currentClass">{{ fmtPower }} W</span>
                </div>
                <div class="card">
                    <span class="card-label">Current</span>
                    <span class="card-value" :class="currentClass">{{ fmt(summary.current, 1) }} A</span>
                </div>
                <div class="card">
                    <span class="card-label">Cell Min / Max Voltage</span>
                    <span class="card-value">{{ fmtCellV(cellMinMax.min) }} / {{ fmtCellV(cellMinMax.max) }}</span>
                </div>
                <div class="card">
                    <span class="card-label">Temp (min/max)</span>
                    <span class="card-value">{{ summary.min_temp }}°C / {{ summary.max_temp }}°C</span>
                </div>
                <div class="card">
                    <span class="card-label">Overall SoH</span>
                    <span class="card-value">{{ summary.soh }}%</span>
                </div>
                <div class="card">
                    <span class="card-label">Towers / Modules</span>
                    <span class="card-value">{{ summary.towers }} / {{ moduleCount }}</span>
                </div>
            </div>
            <div class="meta-row">
                <span class="meta-item" :class="connected ? 'status-ok' : 'status-disconnected'">{{ connected ? 'Connected' : 'Disconnected' }}</span>
                <span class="meta-item">Last update: {{ timeAgo }}</span>
            </div>
            </div>
        </div>
        <div v-if="hasErrors" class="error-banner">
            Errors/warnings detected in modules
        </div>
    </div>
</template>

<script>
export default {
    name: 'OverviewTab',
    props: {
        data: Object,
        connected: { type: Boolean, default: true }
    },
    data() {
        return {
            now: Date.now(),
            _timer: null
        }
    },
    computed: {
        summary() {
            return this.data.summary || {};
        },
        soc() {
            return this.summary.soc != null ? this.summary.soc : 0;
        },
        socColor() {
            if (this.soc > 30) return '#10B981';
            if (this.soc > 15) return '#ffd93d';
            return '#ff6b6b';
        },
        socDash() {
            const circumference = 2 * Math.PI * 52;
            const filled = (this.soc / 100) * circumference;
            return filled + ' ' + circumference;
        },
        currentClass() {
            if (this.summary.current > 0) return 'charging';
            if (this.summary.current < 0) return 'discharging';
            return '';
        },
        moduleCount() {
            return this.data.modules ? Object.keys(this.data.modules).length : 0;
        },
        timeAgo() {
            if (!this.data.timestamp) return '';
            const seconds = Math.floor((this.now - new Date(this.data.timestamp).getTime()) / 1000);
            if (seconds < 0) return 'just now';
            if (seconds < 60) return seconds + 's ago';
            const minutes = Math.floor(seconds / 60);
            return minutes + 'm ' + (seconds % 60) + 's ago';
        },
        fmtPower() {
            const v = this.summary.pack_voltage;
            const a = this.summary.current;
            if (v == null || a == null) return '—';
            return (v * a).toFixed(0);
        },
        cellMinMax() {
            if (!this.data.modules) return { min: null, max: null };
            let min = Infinity, max = -Infinity;
            for (const mod of Object.values(this.data.modules)) {
                if (!mod.cell_voltages) continue;
                for (const v of mod.cell_voltages) {
                    if (v < min) min = v;
                    if (v > max) max = v;
                }
            }
            return { min: min === Infinity ? null : min, max: max === -Infinity ? null : max };
        },
        hasErrors() {
            if (!this.data.modules) return false;
            return Object.values(this.data.modules).some(
                m => m.errors > 0
            );
        }
    },
    mounted() {
        this._timer = setInterval(() => { this.now = Date.now(); }, 1000);
    },
    unmounted() {
        if (this._timer) clearInterval(this._timer);
    },
    methods: {
        fmt(val, decimals) {
            if (val == null) return '—';
            return typeof val === 'number' ? val.toFixed(decimals != null ? decimals : 0) : val;
        },
        fmtCellV(v) {
            if (v == null) return '—';
            if (v > 100) return v;
            return v.toFixed(3);
        }
    }
}
</script>

<style scoped>
.overview {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.overview-top {
    display: flex;
    gap: 16px;
    align-items: flex-start;
}

.gauge-container {
    flex-shrink: 0;
    width: 140px;
    height: 140px;
    align-self: center;
}

.gauge-svg {
    width: 100%;
    height: 100%;
}

.gauge-value {
    fill: #e0e0e0;
    font-size: 22px;
    font-weight: 700;
}

.gauge-label {
    fill: #8892b0;
    font-size: 11px;
    font-weight: 500;
}

.status-cards-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 5px;
}

.status-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 8px;
    max-width: 1094px;
}

.card {
    background: #12161f;
    border-radius: 6px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.card-label {
    font-size: 11px;
    color: #8892b0;
}

.card-value {
    font-size: 16px;
    font-weight: 600;
    color: #ccd6f6;
}

.card-value.charging {
    color: #f97316;
}

.card-value.discharging {
    color: #10B981;
}

.meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 12px;
    color: #8892b0;
    padding: 4px 0;
}

.meta-item {
    white-space: nowrap;
}

.status-ok {
    color: #10B981;
}

.status-disconnected {
    color: #ff6b6b;
}

.error-banner {
    background: #ff6b6b22;
    border: 1px solid #ff6b6b;
    border-radius: 6px;
    padding: 8px 12px;
    color: #ff6b6b;
    font-size: 13px;
    font-weight: 500;
    max-width: 1250px;
}
</style>
