<template>
    <div class="byd-dashboard" :id="'byd-dash-' + id">
        <div class="byd-tabs">
            <button
                v-for="tab in tabs"
                :key="tab.id"
                :class="['byd-tab', { active: activeTab === tab.id }]"
                @click="activeTab = tab.id"
            >
                {{ tab.label }}
            </button>
        </div>
        <div class="byd-content">
            <HelpTab v-if="activeTab === 'help'" />
            <div v-else-if="!latestData" class="byd-no-data">
                Waiting for data, please wait...
            </div>
            <template v-else>
                <OverviewTab v-if="activeTab === 'overview'" :data="latestData" :connected="socketConnected" />
                <ModulesTab v-if="activeTab === 'overview'" :data="latestData" />
                <CellsTab v-if="activeTab === 'cells'" :data="latestData" />
                <TempsTab v-if="activeTab === 'temps'" :data="latestData" />
                <HistoryTab v-if="activeTab === 'history'" :history="historyData" :data="latestData" :id="id" :tower-count="towerCount" @request-history="onRequestHistory" />
                <EnergyTab v-if="activeTab === 'energy'" :data="latestData" />
                <DriftLogTab v-if="activeTab === 'drift'" :drift="driftData" :id="id" :tower-count="towerCount" @request-drift-log="onRequestDriftLog" />
            </template>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'

import OverviewTab from './tabs/OverviewTab.vue'
import ModulesTab from './tabs/ModulesTab.vue'
import CellsTab from './tabs/CellsTab.vue'
import TempsTab from './tabs/TempsTab.vue'
import HistoryTab from './tabs/HistoryTab.vue'
import EnergyTab from './tabs/EnergyTab.vue'
import DriftLogTab from './tabs/DriftLogTab.vue'
import HelpTab from './tabs/HelpTab.vue'

export default {
    name: 'BydLvsDashboard',
    inject: ['$socket', '$dataTracker'],
    components: {
        OverviewTab,
        ModulesTab,
        CellsTab,
        TempsTab,
        HistoryTab,
        EnergyTab,
        DriftLogTab,
        HelpTab
    },
    props: {
        id: String,
        props: Object,
        state: Object
    },
    data() {
        return {
            activeTab: 'overview',
            historyData: null,
            driftData: null,
            socketConnected: true,
            tabs: [
                { id: 'overview', label: 'Overview' },
                { id: 'cells', label: 'Cell Voltages' },
                { id: 'history', label: 'Graphs' },
                { id: 'temps', label: 'Temps' },
                { id: 'energy', label: 'Energy Throughput' },
                { id: 'drift', label: 'Drift Log' },
                { id: 'help', label: 'Help' }
            ]
        }
    },
    computed: {
        ...mapState('data', ['messages']),
        latestData() {
            const msg = this.messages[this.id];
            if (!msg || !msg.payload) return null;
            // If it's history data, don't use as live data
            if (msg.payload._history) return this._lastLiveData || null;
            return msg.payload;
        },
        towerCount() {
            const data = this.latestData;
            return data && data.summary ? (data.summary.towers || 1) : 1;
        },
    },
    watch: {
        messages: {
            deep: true,
            handler() {
                const msg = this.messages[this.id];
                if (!msg || !msg.payload) return;
                if (!msg.payload._history) {
                    this._lastLiveData = msg.payload;
                }
            }
        }
    },
    mounted() {
        // Expand parent group to fill remaining viewport height
        var group = this.$el;
        while (group && !(group.classList && group.classList.contains('nrdb-ui-group'))) {
            group = group.parentElement;
        }
        if (!group) return;
        var card = group.querySelector(':scope > .v-card');
        var self = this;
        var page = group.parentElement;
        var pagePadBottom = page ? parseInt(getComputedStyle(page).paddingBottom) || 0 : 0;
        function applyHeight() {
            var top = group.getBoundingClientRect().top;
            var h = 'calc(100vh - ' + (Math.round(top) + pagePadBottom) + 'px)';
            group.style.minHeight = h;
            if (card) {
                card.style.height = '100%';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                var cardText = card.querySelector('.v-card-text');
                if (cardText) {
                    cardText.style.flex = '1';
                    cardText.style.display = 'flex';
                    cardText.style.flexDirection = 'column';
                }
                var layoutGrid = card.querySelector('.nrdb-layout-group--grid');
                if (layoutGrid) {
                    layoutGrid.style.flex = '1';
                    layoutGrid.style.display = 'flex';
                    layoutGrid.style.flexDirection = 'column';
                }
                var widget = card.querySelector('.nrdb-ui-widget');
                if (widget) {
                    widget.style.flex = '1';
                    widget.style.display = 'flex';
                    widget.style.flexDirection = 'column';
                }
            }
        }
        applyHeight();
        self._resizeHandler = applyHeight;
        window.addEventListener('resize', self._resizeHandler);
    },
    created() {
        this.$dataTracker(this.id);

        this.socketConnected = this.$socket.connected;
        this._onConnect = () => {
            this.socketConnected = true;
            this.$socket.emit('byd-widget-init', this.id, {});
        };
        this._onDisconnect = () => { this.socketConnected = false; };
        this.$socket.on('connect', this._onConnect);
        this.$socket.on('disconnect', this._onDisconnect);

        // Listen for cached history data from server (before requesting it)
        this._historyHandler = (data) => {
            if (data && data._history) {
                this.historyData = data;
            }
        };
        this.$socket.on('byd-history-data:' + this.id, this._historyHandler);

        // Listen for drift log data
        this._driftHandler = (data) => {
            if (data && data._driftLog) {
                this.driftData = data;
            }
        };
        this.$socket.on('byd-drift-log-data:' + this.id, this._driftHandler);

        // Request cached history from server
        this.$socket.emit('byd-widget-init', this.id, {});
    },
    unmounted() {
        if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
        if (this._onConnect) this.$socket.off('connect', this._onConnect);
        if (this._onDisconnect) this.$socket.off('disconnect', this._onDisconnect);
        if (this._historyHandler) {
            this.$socket.off('byd-history-data:' + this.id, this._historyHandler);
        }
        if (this._driftHandler) {
            this.$socket.off('byd-drift-log-data:' + this.id, this._driftHandler);
        }
    },
    methods: {
        onRequestHistory(request) {
            this.$socket.emit('byd-request-history', this.id, {
                payload: request
            });
        },
        onRequestDriftLog(request) {
            this.$socket.emit('byd-request-drift-log', this.id, {
                payload: request
            });
        }
    }
}
</script>

<style scoped>
.byd-dashboard {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #e0e0e0;
    background: #0a0d16;
    border-radius: 8px;
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.byd-tabs {
    display: flex;
    background: #12161f;
    flex-shrink: 0;
    overflow-x: auto;
    scrollbar-width: none;
}

.byd-tabs::-webkit-scrollbar {
    display: none;
}

.byd-tab {
    padding: 12px 18px;
    border: none;
    background: transparent;
    color: #8892b0;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    transition: color 0.2s, box-shadow 0.2s;
}

.byd-tab:hover {
    color: #ccd6f6;
}

.byd-tab.active {
    color: #10B981;
    box-shadow: inset 0 -2px 0 #10B981;
}

.byd-content {
    flex: 1;
    overflow-y: auto;
    padding: 25px;
}

.byd-no-data {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 300px;
    color: #8892b0;
    font-size: 15px;
}
</style>
