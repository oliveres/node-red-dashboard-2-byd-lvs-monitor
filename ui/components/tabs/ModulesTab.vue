<template>
    <div class="modules-tab">
        <div v-for="(tower, tIdx) in towers" :key="tIdx" class="tower-section">
            <div v-if="towers.length > 1" class="tower-title">Tower {{ tIdx + 1 }}</div>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Battery Module</th>
                            <th>Serial</th>
                            <th>SoC</th>
                            <th>SoH</th>
                            <th>Voltage</th>
                            <th>Current</th>
                            <th>Power</th>
                            <th>Min Cell</th>
                            <th>Max Cell</th>
                            <th>Cell Drift</th>
                            <th>Temp</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(entry, eIdx) in tower"
                            :key="eIdx"
                            :class="{ 'row-error': entry.mod.errors > 0 }"
                        >
                            <td class="cell-name">{{ entry.name }}</td>
                            <td class="cell-serial">{{ entry.mod.serial || '—' }}</td>
                            <td>{{ fmt(entry.mod.soc, 1) }}%</td>
                            <td>{{ entry.mod.soh }}%</td>
                            <td>{{ fmt(entry.mod.bat_voltage, 1) }} V</td>
                            <td :class="entry.mod.current > 0 ? 'charging' : entry.mod.current < 0 ? 'discharging' : ''">{{ fmt(entry.mod.current, 1) }} A</td>
                            <td>{{ fmt(entry.mod.power, 1) }} W</td>
                            <td>{{ fmtCell(entry.mod.min_cell_v, entry.mod) }}</td>
                            <td :class="maxCellClass(entry.mod.max_cell_v)">{{ fmtCell(entry.mod.max_cell_v, entry.mod) }}</td>
                            <td>{{ fmtDiff(entry.mod.max_cell_v, entry.mod.min_cell_v) }}</td>
                            <td>{{ entry.mod.min_temp }} – {{ entry.mod.max_temp }}°C</td>
                            <td class="cell-err">
                                <span v-if="entry.mod.errors > 0" class="err-badge">E</span>
                                <span v-if="entry.mod.errors === 0" class="ok-badge">OK</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ModulesTab',
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

            if (this.towerCount <= 1) {
                return [entries];
            }

            const perTower = Math.ceil(entries.length / this.towerCount);
            const result = [];
            for (let t = 0; t < this.towerCount; t++) {
                const group = entries.slice(t * perTower, (t + 1) * perTower);
                if (group.length > 0) {
                    result.push(group);
                }
            }
            return result;
        }
    },
    methods: {
        fmt(val, decimals) {
            if (val == null) return '—';
            return typeof val === 'number' ? val.toFixed(decimals) : val;
        },
        isVoltMode(mod) {
            return mod.cell_voltages && mod.cell_voltages[0] < 100;
        },
        fmtCell(val, mod) {
            if (val == null) return '—';
            if (this.isVoltMode(mod)) return (val / 1000).toFixed(3) + ' V';
            return val + ' mV';
        },
        fmtDiff(max, min) {
            if (max == null || min == null) return '—';
            return (max - min) + ' mV';
        },
        maxCellClass(val) {
            if (val == null) return '';
            const mv = val > 100 ? val : val * 1000;
            if (mv >= 3750) return 'cell-red';
            if (mv >= 3700) return 'cell-orange';
            if (mv >= 3600) return 'cell-yellow';
            return '';
        }
    }
}
</script>

<style scoped>
.modules-tab {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.tower-title {
    font-size: 13px;
    font-weight: 600;
    color: #ccd6f6;
    margin-bottom: 6px;
}

.table-wrapper {
    overflow-x: auto;
}

table {
    width: 100%;
    max-width: 1250px;
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

.cell-serial {
    font-family: monospace;
    font-size: 11px;
    color: #8892b0;
}

.charging { color: #f97316; }
.discharging { color: #10B981; }

.cell-yellow { color: #ffd93d; }
.cell-orange { color: #f97316; }
.cell-red { color: #ff6b6b; }

.row-error {
    background: #ff6b6b11;
}

.err-badge {
    background: #ff6b6b;
    color: #fff;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 700;
}

.warn-badge {
    background: #ffd93d;
    color: #1a1a2e;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 700;
}

.ok-badge {
    color: #10B981;
    font-size: 11px;
    font-weight: 600;
}
</style>
