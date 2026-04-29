# node-red-dashboard-2-byd-lvs-monitor

Dashboard widget for BYD Battery-Box LVS battery monitoring. Displays live data, cell voltages, temperatures, and historical charts using [Node-RED Dashboard 2.0](https://dashboard.flowfuse.com/).

## Why this exists

VenusOS and VRM show the current min/max cell voltage and which cell 
triggered the most recent alarm (in the "0103" format — module 1, 
cell 3). What they don't show is history: was yesterday's alarm the 
same cell, or a different one? Per BYD, occasional high cell voltage 
warnings near top-of-charge can be normal LFP behaviour. The useful 
diagnostic signal is whether the same cell IDs keep showing up, or 
the alarms scatter randomly across the install.

This tool tracks per-cell drift over time and visualises it as 
heatmaps, so recurring patterns become visible. It's meant to give 
you awareness, not to diagnose faults — that's still for BYD's 
official tools and authorised service partners.

## Prerequisites

- [Node-RED Dashboard 2.0](https://dashboard.flowfuse.com/) (`@flowfuse/node-red-dashboard`)
- [node-red-contrib-byd-lvs-monitor](https://github.com/oliveres/node-red-contrib-byd-lvs-monitor) — Modbus data acquisition

Install both via the Palette Manager before installing this widget.

## Installation

Install via the Node-RED Palette Manager: search for `node-red-dashboard-2-byd-lvs-monitor`.

Or install manually:

```bash
cd ~/.node-red
npm install node-red-dashboard-2-byd-lvs-monitor
```

## Tabs

| Tab | Description |
|-----|-------------|
| **Overview** | SOC gauge, pack voltage, current, temperature range, module details |
| **Cell Voltages** | Color-coded heatmap of all cell voltages per module |
| **Graphs** | 24-hour rolling history charts with time range presets (30min–24h) |
| **Temps** | Temperature grid per module with min/max highlighting |
| **Energy Throughput** | Charge/discharge energy counters, estimated cycles, warranty status |
| **Drift Log** | Cell voltage drift heatmap with relative coloring (high drift, low drift near full charge/discharge) |
| **Help** | Built-in data interpretation guide (EN/CS/DE) |

## Setup

1. Install this package and the main [node-red-contrib-byd-lvs-monitor](https://github.com/oliveres/node-red-contrib-byd-lvs-monitor) package
2. Import the example flow: **Menu → Import → Examples → node-red-dashboard-2-byd-lvs-monitor**
3. Configure the BYD LVS config node with your BMU IP address and port
4. Deploy and open the dashboard

History charts build up automatically from incoming scans (last 24 hours kept in memory, lost on Node-RED restart).

## Screenshots

<img width="1465" height="893" alt="main" src="https://github.com/user-attachments/assets/eafbe0d0-dbfc-45c9-ac2d-ac8e09318f24" />
<img width="1466" height="893" alt="high" src="https://github.com/user-attachments/assets/3a7fe4a5-e24b-43f5-a0b1-985fcdc99201" />

## Compatibility

- Node-RED >= 3.0.0
- Node-RED Dashboard 2.0
- Node.js >= 14

## Disclaimer

This software is NOT an official BYD diagnostic tool. It is provided "AS IS" without warranty of any kind.

The Ethernet port and its Modbus protocol on the BYD BMU are not documented in the product manual for diagnostic use by end-users or installers. Their availability and open accessibility are purely coincidental and may change with firmware updates without notice. The consequences of frequent or continuous Modbus polling on the BMU are unknown.

By using this software, you acknowledge and agree that:
- The author assumes NO liability for any damages, loss of warranty, or other consequences whatsoever
- You waive all claims for compensation arising from its use
- You accept full responsibility for any decisions made based on information provided by this software
- Incorrect readings may occur due to register misinterpretation, communication errors, or firmware differences

Data interpretation by this tool (including but not limited to warranty estimates, cycle counts, efficiency calculations, and cell drift analysis) reflects the author's understanding and may not be accurate. Always consult official BYD documentation or an authorized service partner for definitive assessments.

By your first use of this software, you irrevocably accept all of the above terms.

BYD and Battery-Box are registered trademarks of BYD Company Limited.

## Acknowledgments

This project would not exist without the prior reverse-engineering work
done by the Home Assistant and IoT communities. The Modbus register map
and protocol decoding builds on:

- **[sarnau/BYD-Battery-Box-Infos](https://github.com/sarnau/BYD-Battery-Box-Infos)** —
  the foundational reference documenting BYD Battery-Box internals, including
  the BMU Modbus protocol over TCP.
- **[redpomodoro/byd_battery_box](https://github.com/redpomodoro/byd_battery_box)** —
  Home Assistant integration that demonstrated practical decoding of cell-level
  data from the BMU.
- **[christianh17/ioBroker.bydhvs](https://github.com/christianh17/ioBroker.bydhvs)** —
  ioBroker adapter with additional register interpretations and cross-checks.

This package ports those findings to Node-RED, fixes several decoding issues
encountered along the way, and adds historical drift tracking, SOH and cycle
estimation, warranty utilisation tracking, and the SOC warranty timer that
weren't part of the prior projects.

If you find this useful, consider also starring the projects above —
they did the hard work of figuring out the protocol in the first place.

## License

MIT
