module.exports = function (RED) {

    var fs = require('fs');
    var path = require('path');

    // In-memory ring buffer: array of { ts, cells: { BMS1: [v1..v16], BMS2: [...] } }
    // Shared across all dashboard node instances, survives redeploy
    var HISTORY_BUFFER = [];
    var MAX_AGE_MS = 86400000; // 24 hours

    // Drift detection state (shared across instances, survives redeploy)
    var DRIFT_LOG = [];            // In-memory mirror of JSONL file
    var DRIFT_TODAY = {};          // Daily peaks: "BMS3|7|high" → record
    var DRIFT_TODAY_DATE = null;   // "YYYY-MM-DD" for flush detection
    var DRIFT_LOG_PATH = null;     // Set on first node init
    var MAX_DRIFT_AGE_DAYS = 90;
    function pushToBuffer(data) {
        var ts = data.timestamp ? new Date(data.timestamp).getTime() : Date.now();
        var entry = { ts: ts, cells: {} };
        for (var modName in data.modules) {
            var mod = data.modules[modName];
            if (mod.cell_voltages) {
                entry.cells[modName] = mod.cell_voltages.slice();
            }
        }
        HISTORY_BUFFER.push(entry);

        // Trim entries older than 24h
        var cutoff = Date.now() - MAX_AGE_MS;
        while (HISTORY_BUFFER.length > 0 && HISTORY_BUFFER[0].ts < cutoff) {
            HISTORY_BUFFER.shift();
        }
    }

    function queryFromBuffer(from, to) {
        var filtered = [];
        for (var i = 0; i < HISTORY_BUFFER.length; i++) {
            var e = HISTORY_BUFFER[i];
            if (e.ts > from && e.ts <= to) filtered.push(e);
        }
        if (filtered.length === 0) return null;

        // Shared timestamps array
        var ts = new Array(filtered.length);
        for (var i = 0; i < filtered.length; i++) {
            ts[i] = filtered[i].ts;
        }

        // Collect all module names across all entries
        var modNames = {};
        for (var i = 0; i < filtered.length; i++) {
            for (var m in filtered[i].cells) {
                if (!modNames[m]) modNames[m] = filtered[i].cells[m].length;
            }
        }

        // Compact format: cells[modName] = array of 16 flat voltage arrays
        var cells = {};
        for (var modName in modNames) {
            var numCells = modNames[modName];
            var modArr = new Array(numCells);
            for (var c = 0; c < numCells; c++) {
                modArr[c] = new Array(filtered.length);
            }
            for (var s = 0; s < filtered.length; s++) {
                var voltages = filtered[s].cells[modName];
                for (var c = 0; c < numCells; c++) {
                    modArr[c][s] = voltages ? voltages[c] : null;
                }
            }
            cells[modName] = modArr;
        }

        return { _history: true, ts: ts, cells: cells };
    }

    // ── Drift detection functions ──

    function initDriftLog(userDir) {
        if (DRIFT_LOG_PATH) return; // Already initialized
        DRIFT_LOG_PATH = path.join(userDir, 'byd-drift-log.jsonl');
        try {
            if (fs.existsSync(DRIFT_LOG_PATH)) {
                var content = fs.readFileSync(DRIFT_LOG_PATH, 'utf8');
                var lines = content.split('\n');
                var cutoff = Date.now() - MAX_DRIFT_AGE_DAYS * 86400000;
                DRIFT_LOG = [];
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i].trim();
                    if (!line) continue;
                    try {
                        var record = JSON.parse(line);
                        if (record.ts >= cutoff) {
                            DRIFT_LOG.push(record);
                        }
                    } catch (_) {
                        // Skip corrupt lines
                    }
                }
                // Rewrite compacted file
                var compacted = DRIFT_LOG.map(function (r) { return JSON.stringify(r); }).join('\n');
                if (compacted) compacted += '\n';
                fs.writeFileSync(DRIFT_LOG_PATH, compacted, 'utf8');
            }
        } catch (_) {
            // File read/write error — start fresh
        }
    }

    function computeMedian(arr) {
        if (arr.length === 0) return 0;
        var sorted = arr.slice().sort(function (a, b) { return a - b; });
        var mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
        return sorted[mid];
    }

    function detectDrifts(data, highThreshold, lowThreshold) {
        if (!data || !data.modules) return;

        var ts = data.timestamp ? new Date(data.timestamp).getTime() : Date.now();
        var today = new Date(ts).toISOString().slice(0, 10); // "YYYY-MM-DD"

        // Check date change → flush previous day's peaks
        if (DRIFT_TODAY_DATE && DRIFT_TODAY_DATE !== today) {
            flushDriftPeaks();
        }
        DRIFT_TODAY_DATE = today;

        // Determine SOC state for low-drift direction
        // If summary unavailable (Modbus failure), defaults to 'low-discharged';
        // in practice, if summary fails, modules likely also fail (same connection)
        var soc = data.summary ? data.summary.soc : null;
        var lowDir = (soc != null && soc >= 50) ? 'low-charged' : 'low-discharged';

        for (var modName in data.modules) {
            var mod = data.modules[modName];
            if (!mod.cell_voltages || mod.cell_voltages.length === 0) continue;

            var voltages = mod.cell_voltages;

            // Normalize to mV for threshold comparison
            var isMv = voltages[0] > 100;
            var voltagesMv = isMv ? voltages : voltages.map(function (v) { return Math.round(v * 1000); });

            var median = computeMedian(voltagesMv);

            for (var cellIdx = 0; cellIdx < voltagesMv.length; cellIdx++) {
                var v = voltagesMv[cellIdx];
                if (v - median >= highThreshold) {
                    updateDriftPeak(modName, cellIdx, 'high', voltages[cellIdx], v - median, mod, ts);
                }
                if (median - v >= lowThreshold) {
                    updateDriftPeak(modName, cellIdx, lowDir, voltages[cellIdx], median - v, mod, ts);
                }
            }
        }
    }

    function updateDriftPeak(modName, cellIdx, dir, voltage, delta, mod, ts) {
        var key = modName + '|' + cellIdx + '|' + dir;
        var existing = DRIFT_TODAY[key];

        // Keep peak only if more extreme (delta is always positive regardless of direction)
        if (existing && delta <= existing._delta) return;

        var cellVoltages = mod.cell_voltages || [];
        DRIFT_TODAY[key] = {
            ts: ts,
            serial: mod.serial || null,
            module: modName,
            cell: cellIdx + 1,
            dir: dir,
            voltage: voltage,
            soc: mod.soc,
            module_v: mod.bat_voltage,
            min_v: cellVoltages.length > 0 ? Math.min.apply(null, cellVoltages) : null,
            max_v: cellVoltages.length > 0 ? Math.max.apply(null, cellVoltages) : null,
            current: mod.current,
            min_t: mod.min_temp,
            max_t: mod.max_temp,
            _delta: delta // Internal, not persisted
        };
    }

    function flushDriftPeaks() {
        var keys = Object.keys(DRIFT_TODAY);
        if (keys.length === 0) return;

        var lines = '';
        for (var i = 0; i < keys.length; i++) {
            var record = DRIFT_TODAY[keys[i]];
            // Clone without _delta
            var persisted = {
                ts: record.ts,
                serial: record.serial,
                module: record.module,
                cell: record.cell,
                dir: record.dir,
                voltage: record.voltage,
                soc: record.soc,
                module_v: record.module_v,
                min_v: record.min_v,
                max_v: record.max_v,
                current: record.current,
                min_t: record.min_t,
                max_t: record.max_t
            };
            DRIFT_LOG.push(persisted);
            lines += JSON.stringify(persisted) + '\n';
        }

        DRIFT_TODAY = {};

        if (DRIFT_LOG_PATH && lines) {
            try {
                fs.appendFileSync(DRIFT_LOG_PATH, lines, 'utf8');
            } catch (_) {
                // File write error — data still in DRIFT_LOG memory
            }
        }

        trimDriftLog();
    }

    function trimDriftLog() {
        var cutoff = Date.now() - MAX_DRIFT_AGE_DAYS * 86400000;
        while (DRIFT_LOG.length > 0 && DRIFT_LOG[0].ts < cutoff) {
            DRIFT_LOG.shift();
        }
    }

    function queryDriftLog(from, to) {
        var entries = [];

        // From persisted log
        for (var i = 0; i < DRIFT_LOG.length; i++) {
            var r = DRIFT_LOG[i];
            if (r.ts >= from && r.ts <= to) {
                entries.push(r);
            }
        }

        // From today's unflushed peaks
        var keys = Object.keys(DRIFT_TODAY);
        for (var j = 0; j < keys.length; j++) {
            var record = DRIFT_TODAY[keys[j]];
            if (record.ts >= from && record.ts <= to) {
                entries.push({
                    ts: record.ts,
                    serial: record.serial,
                    module: record.module,
                    cell: record.cell,
                    dir: record.dir,
                    voltage: record.voltage,
                    soc: record.soc,
                    module_v: record.module_v,
                    min_v: record.min_v,
                    max_v: record.max_v,
                    current: record.current,
                    min_t: record.min_t,
                    max_t: record.max_t
                });
            }
        }

        return { _driftLog: true, entries: entries };
    }

    function BydLvsDashboardNode(config) {
        RED.nodes.createNode(this, config);

        var node = this;

        // Expose buffer reference for backup/restore via Function nodes
        node.context().global.set('_byd_history_buffer', HISTORY_BUFFER);

        // Initialize drift log (once across all instances)
        initDriftLog(RED.settings.userDir);

        var group = RED.nodes.getNode(config.group);
        if (!group) {
            node.error('No group configured');
            return;
        }

        var base = group.getBase();

        var evts = {
            onAction: true,
            beforeSend: function (msg) {
                var updates = msg.ui_update;
                if (updates) {
                    var props = ['activeTab'];
                    for (var p = 0; p < props.length; p++) {
                        if (typeof updates[props[p]] !== 'undefined') {
                            base.stores.state.set(base, node, msg, props[p], updates[props[p]]);
                        }
                    }
                }
                return msg;
            },
            onInput: function (msg) {
                base.stores.data.save(base, node, msg);

                // Accumulate cell voltages into in-memory buffer
                if (msg.payload && msg.payload.modules) {
                    pushToBuffer(msg.payload);

                    // Drift detection
                    try {
                        var highTh = parseInt(config.driftHighThreshold) || 50;
                        var lowTh = parseInt(config.driftLowThreshold) || 50;
                        detectDrifts(msg.payload, highTh, lowTh);
                    } catch (_) {
                        // Never let drift detection crash the dashboard node
                    }

                    var modules = HISTORY_BUFFER.length > 0 ? (Object.keys(HISTORY_BUFFER[0].cells).length || 1) : 1;
                    var bytes = HISTORY_BUFFER.length * modules * 16 * 8 + HISTORY_BUFFER.length * 64;
                    var mb = (bytes / 1048576).toFixed(1);
                    node.status({ fill: 'green', shape: 'dot', text: HISTORY_BUFFER.length + ' samples, ~' + mb + ' MB' });
                }
            },
            onSocket: {
                'byd-request-history': function (conn, id, msg) {
                    var p = (msg && msg.payload) || {};
                    var from = p.from || (Date.now() - 3600000);
                    var to = p.to || Date.now();
                    var result = queryFromBuffer(from, to);
                    if (result) {
                        conn.emit('byd-history-data:' + node.id, result);
                    }
                },
                'byd-request-drift-log': function (conn, id, msg) {
                    var p = (msg && msg.payload) || {};
                    var from = p.from || (Date.now() - 604800000); // default 7d
                    var to = p.to || Date.now();
                    var result = queryDriftLog(from, to);
                    conn.emit('byd-drift-log-data:' + node.id, result);
                },
                'byd-widget-init': function (conn, id) {
                    // Send last 1h history on connect
                    var result = queryFromBuffer(Date.now() - 3600000, Date.now());
                    if (result) {
                        conn.emit('byd-history-data:' + node.id, result);
                    }
                    // Send last 24h drift data on connect
                    var driftResult = queryDriftLog(Date.now() - 86400000, Date.now());
                    conn.emit('byd-drift-log-data:' + node.id, driftResult);
                }
            }
        };

        // Flush drift peaks on redeploy/close
        node.on('close', function () {
            try {
                flushDriftPeaks();
            } catch (_) {
                // ignore
            }
        });

        group.register(node, config, evts);
    }

    RED.nodes.registerType('byd-lvs-dashboard', BydLvsDashboardNode);
};
