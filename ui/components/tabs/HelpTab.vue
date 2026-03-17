<template>
    <div class="help-tab">

        <div class="lang-bar">
            <div class="lang-buttons">
                <button v-for="l in langs" :key="l.id"
                    :class="['lang-btn', { active: lang === l.id }]"
                    @click="setLang(l.id)">{{ l.label }}</button>
            </div>
            <span class="version-label">v{{ version }}</span>
        </div>

        <section class="help-section">
            <h2>{{ t('aboutTitle') }}</h2>
            <p v-html="t('aboutP1')"></p>
            <p v-html="t('aboutP2')"></p>
        </section>

        <section class="help-section">
            <h2>{{ t('tabsTitle') }}</h2>

            <h3>{{ t('overviewH') }}</h3>
            <p v-html="t('overviewIntro')"></p>
            <ul>
                <li v-for="(item, i) in t('overviewItems')" :key="i" v-html="item"></li>
            </ul>
            <p v-html="t('overviewFooter')"></p>

            <h3>{{ t('cellsH') }}</h3>
            <p v-html="t('cellsIntro')"></p>
            <ul>
                <li v-for="(item, i) in t('cellsItems')" :key="i" v-html="item"></li>
            </ul>

            <h3>{{ t('graphsH') }}</h3>
            <p v-html="t('graphsIntro')"></p>
            <ul>
                <li v-for="(item, i) in t('graphsItems')" :key="i" v-html="item"></li>
            </ul>

            <h3>{{ t('tempsH') }}</h3>
            <p v-html="t('tempsIntro')"></p>
            <ul>
                <li v-for="(item, i) in t('tempsItems')" :key="i" v-html="item"></li>
            </ul>

            <h3>{{ t('energyH') }}</h3>
            <p v-html="t('energyIntro')"></p>
            <ul>
                <li v-for="(item, i) in t('energyItems')" :key="i" v-html="item"></li>
            </ul>

            <h3>{{ t('driftH') }}</h3>
            <p v-html="t('driftIntro')"></p>
            <p v-html="t('driftTablesIntro')"></p>
            <ul>
                <li v-for="(item, i) in t('driftTablesItems')" :key="i" v-html="item"></li>
            </ul>
            <h4>{{ t('driftReadH') }}</h4>
            <ul>
                <li v-for="(item, i) in t('driftReadItems')" :key="i" v-html="item"></li>
            </ul>
            <h4>{{ t('driftMeaningH') }}</h4>
            <ul>
                <li v-for="(item, i) in t('driftMeaningItems')" :key="i" v-html="item"></li>
            </ul>
            <p v-if="t('driftCapacity')" v-html="t('driftCapacity')"></p>
            <p v-html="t('driftPersistence')"></p>
        </section>

        <section class="help-section">
            <h2>{{ t('configTitle') }}</h2>
            <p v-html="t('configIntro')"></p>
            <ul>
                <li v-for="(item, i) in t('configItems')" :key="i" v-html="item"></li>
            </ul>
            <p v-html="t('configOther')"></p>
        </section>

        <section class="help-section">
            <h2>{{ t('notesTitle') }}</h2>
            <ul>
                <li v-for="(item, i) in t('notesItems')" :key="i" v-html="item"></li>
            </ul>
        </section>

        <section class="help-section disclaimer-section">
            <h2>{{ t('disclaimerTitle') }}</h2>
            <div v-for="(p, i) in t('disclaimerParagraphs')" :key="i" class="disclaimer-p" v-html="p"></div>
        </section>


    </div>
</template>

<script>
var C = {
    green: '#10B981',
    cyan: '#22d3ee',
    blue: '#4361ee',
    red: '#ff6b6b',
    orange: '#f97316',
    yellow: '#ffd93d'
};

function clr(color, text) {
    return '<span style="color:' + C[color] + '">' + text + '</span>';
}

var TRANSLATIONS = {
    en: {
        aboutTitle: 'About This Dashboard',
        aboutP1: 'This dashboard displays real-time data from BYD Battery-Box LVS batteries, read via Modbus RTU over TCP from the Battery Management Unit (BMU). Data is provided by the <b>BYD LVS read</b> node which polls the BMU at a configured interval.',
        aboutP2: 'The dashboard consists of 6 data tabs described below, plus this Help page.',

        tabsTitle: 'Tabs',

        overviewH: 'Overview',
        overviewIntro: 'Shows the current state of the entire battery system at a glance:',
        overviewItems: [
            '<b>SOC gauge</b> — State of Charge as a percentage circle. ' + clr('green', 'Green') + ' above 30%, ' + clr('yellow', 'yellow') + ' 15–30%, ' + clr('red', 'red') + ' below 15%.',
            '<b>Pack Voltage</b> — Total battery voltage in Volts.',
            '<b>Power</b> — Calculated as pack voltage × current. ' + clr('orange', 'Orange') + ' = charging, ' + clr('green', 'green') + ' = discharging.',
            '<b>Current</b> — Battery current in Amps (negative = discharging).',
            '<b>Cell Min/Max</b> — Lowest and highest cell voltage across all modules.',
            '<b>Temperature</b> — Min/max temperature range across all modules.',
            '<b>SoH</b> — State of Health (100% = new battery, decreases over time).',
            '<b>Towers / Modules</b> — Number of towers and BMS modules detected.',
            '<b>Connection</b> — ' + clr('green', 'Connected') + ' or ' + clr('red', 'Disconnected') + ' based on WebSocket status.',
            '<b>Errors</b> — Red banner if any module reports BMS error flags.'
        ],
        overviewFooter: 'Below the overview cards is a <b>module summary table</b> showing key values per module (serial number, SOC, SoH, voltage, current, power, min/max cell voltage, cell drift, temperature, status).',

        cellsH: 'Cell Voltages',
        cellsIntro: 'Displays all 16 cell voltages for each BMS module in a grid layout.',
        cellsItems: [
            'Voltage is shown in mV by default, or in V if "Convert mV to V" is enabled in the config node.',
            'The cell with the <b>lowest voltage</b> is highlighted in ' + clr('cyan', 'cyan') + ' (only if the gap to the 2nd lowest is &ge; 5 mV).',
            'The cell with the <b>highest voltage</b> is highlighted in ' + clr('red', 'red') + ' (only if the gap to the 2nd highest is &ge; 5 mV).',
            '<b>Balancing</b> — Cells actively being balanced by the BMS show an ' + clr('orange', 'orange outline border') + '. A badge "Bal N" indicates the count of balancing cells per module.'
        ],

        graphsH: 'Graphs',
        graphsIntro: 'Line charts showing cell voltage history for each module over time.',
        graphsItems: [
            'Time range presets: <b>30 min, 1h, 2h, 6h, 12h, 24h</b>.',
            'History is stored in an <b>in-memory buffer (24 hours)</b>. Data is <b>lost on Node-RED restart</b> — there is no persistent history storage.',
            'The min cell (at last data point) is drawn in ' + clr('cyan', 'cyan') + ', max cell in ' + clr('red', 'red') + ', other cells in gray.',
            'Charts update automatically when new data arrives from the read node.',
            'A "Loading, please wait..." indicator appears for presets 2h and longer while data is being loaded from the server.'
        ],

        tempsH: 'Temps',
        tempsIntro: 'Temperature readings from 8 sensors per module (sensors map to cells 1–8 in BYD BE Connect layout).',
        tempsItems: [
            'The <b>coldest sensor</b> is highlighted in ' + clr('blue', 'blue') + ' (gap &ge; 2 °C to 2nd coldest).',
            'The <b>hottest sensor</b> is highlighted in ' + clr('red', 'red') + ' (gap &ge; 2 °C to 2nd hottest).',
            'Sensors showing 0 °C are excluded from min/max highlighting (usually unused / not connected).'
        ],

        energyH: 'Energy Throughput',
        energyIntro: 'Lifetime energy statistics and warranty tracking per module.',
        energyItems: [
            '<b>Total Charged / Discharged</b> — Cumulative energy in kWh (' + clr('orange', 'orange') + ' for charge, ' + clr('green', 'green') + ' for discharge).',
            '<b>Charge-Discharge Efficiency</b> — Ratio of discharged to charged energy. Typical value is 95–98%.',
            '<b>Estimated Cycles</b> — Calculated as total discharged energy divided by module usable capacity (3.6 kWh per BYD LVS module).',
            '<b>Remaining Throughput Warranty</b> — Based on publicly available specifications of minimum energy throughput covered by warranty (11,880 kWh discharged energy per module). Shows remaining kWh and percentage. This is a simplified estimate and may differ from actual BYD warranty terms.'
        ],

        driftH: 'Drift Log',
        driftIntro: 'Tracks cell voltage drift — how much individual cells deviate from the module cell voltage median. Drift detection runs on every data scan. Only the peak (most extreme) drift per cell per day is recorded.',
        driftTablesIntro: 'The heatmap displays three separate tables:',
        driftTablesItems: [
            '<b style="color:' + C.red + '">High Cell Voltage Drift</b> — Cells whose voltage exceeded the module cell voltage median by more than the configured threshold.',
            '<b style="color:' + C.cyan + '">Low Cell Voltage Drift (near full charge)</b> — Cells lagging behind others at or near full charge. While all cells are charging, these cells are not reaching the same voltage level as the rest. Repeated occurrences on the same cell may suggest a pattern that warrants closer examination.',
            '<b style="color:' + C.cyan + '">Low Cell Voltage Drift (near full discharge)</b> — Cells with lower voltage than others at or near full discharge. These cells may be depleting faster than the rest of the module.'
        ],
        driftReadH: 'How to read the heatmap',
        driftReadItems: [
            'Rows = modules, columns = cells 1–16. Values = number of days the drift was detected in the selected range.',
            'Range presets: <b>1d, 7d, 14d, 30d, 90d</b>.',
            'Colors are <b>relative</b> — based on the drift occurrence median (median of non-zero event counts) for each table independently: ' + clr('green', 'green') + ' = up to 2&times; the occurrence median, ' + clr('yellow', 'yellow') + ' = up to 2.5&times;, ' + clr('orange', 'orange') + ' = up to 3&times;, ' + clr('red', 'red') + ' = more than 3&times; the occurrence median.',
            'If the drift occurrence median is still low (&le; 4), all non-zero cells show in ' + clr('green', 'green') + ' — not enough data for meaningful heatmap coloring. The heatmap activates automatically as data accumulates.'
        ],
        driftMeaningH: 'What drift means',
        driftMeaningItems: [
            '<b>Occasional random drift</b> across different cells is <b>normal</b> — the BMS balances cells continuously.',
            '<b>The same cell consistently drifting</b> over multiple days or weeks may be worth monitoring.',
            'Low drift near full charge is particularly significant — it suggests an unusual balancing pattern which may be worth discussing with a qualified technician.'
        ],
        driftCapacity: 'If the <b>same cell</b> repeatedly appears in both the <b style="color:' + C.red + '">High Cell Voltage Drift</b> and <b style="color:' + C.cyan + '">Low Cell Voltage Drift (near full discharge)</b> tables, it likely has a lower capacity than the other cells. It charges to a higher voltage sooner (high drift) and discharges to a lower voltage sooner (low drift). This pattern may indicate differences in cell characteristics.',
        driftPersistence: 'Drift data is persisted to a file and survives Node-RED restarts. Retention: 90 days (older entries are automatically removed).',

        configTitle: 'Configuration',
        configIntro: 'The dashboard node has two configurable drift thresholds (in the node properties dialog):',
        configItems: [
            '<b>High drift threshold (mV)</b> — Cell voltage above the module cell voltage median to trigger a high drift record. Default: 50 mV.',
            '<b>Low drift threshold (mV)</b> — Cell voltage below the module cell voltage median to trigger a low drift record. Default: 50 mV.'
        ],
        configOther: 'Other settings (BMU host, port, number of modules, towers, voltage unit) are configured in the <b>BYD LVS config</b> node shared with the read node.',

        notesTitle: 'Important Notes',
        notesItems: [
            '<b>History buffer</b> — Stores last 24 hours in memory. Data is lost when Node-RED restarts. There is no persistent history storage.',
            '<b>Connection limit</b> — The BYD BMU allows only one Modbus connection at a time. Do not run multiple read nodes or other Modbus tools simultaneously.',
            '<b>Scan duration</b> — Reading all modules takes approximately 2–3 seconds per module. Set the inject interval accordingly (e.g. 30s for 8 modules).',
            '<b>BMS warnings</b> — Warning registers (e.g. "Cells OverVoltage" at SOC 99%) are operational status flags, not faults. Only actual error flags are displayed. Your inverter/Victron handles alarms independently.'
        ],

        disclaimerTitle: 'Disclaimer',
        disclaimerParagraphs: [
            'This software is <b>NOT</b> an official BYD diagnostic tool. It is provided "AS IS" without warranty of any kind.',
            'The Ethernet port and its Modbus protocol on the BYD BMU are not documented in the product manual for diagnostic use by end-users or installers. Their availability and open accessibility are purely coincidental and may change with firmware updates without notice. The consequences of frequent or continuous Modbus polling on the BMU are unknown.',
            'By using this software, you acknowledge and agree that:<ul><li>The author assumes NO liability for any damages, loss of warranty, or other consequences whatsoever</li><li>You waive all claims for compensation arising from its use</li><li>You accept full responsibility for any decisions made based on information provided by this software</li><li>Incorrect readings may occur due to register misinterpretation, communication errors, or firmware differences</li></ul>',
            'Data interpretation by this tool (including but not limited to warranty estimates, cycle counts, efficiency calculations, and cell drift analysis) reflects the author\'s understanding and may not be accurate. Always consult official BYD documentation or an authorized service partner for definitive assessments.',
            '<b>By your first use of this software, you irrevocably accept all of the above terms.</b>',
            'BYD and Battery-Box are registered trademarks of BYD Company Limited.'
        ]
    },

    cs: {
        aboutTitle: 'O tomto dashboardu',
        aboutP1: 'Tento dashboard zobrazuje data z baterií BYD Battery-Box LVS v reálném čase, čtená přes Modbus RTU over TCP z Battery Management Unit (BMU). Data poskytuje node <b>BYD LVS read</b>, který pravidelně dotazuje BMU v nastaveném intervalu.',
        aboutP2: 'Dashboard se skládá ze 6 datových záložek popsaných níže a této stránky nápovědy.',

        tabsTitle: 'Záložky',

        overviewH: 'Overview (Přehled)',
        overviewIntro: 'Zobrazuje aktuální stav celého bateriového systému:',
        overviewItems: [
            '<b>SOC ukazatel</b> — Stav nabití jako procentuální kruh. ' + clr('green', 'Zelený') + ' nad 30 %, ' + clr('yellow', 'žlutý') + ' 15–30 %, ' + clr('red', 'červený') + ' pod 15 %.',
            '<b>Pack Voltage</b> — Celkové napětí baterie ve Voltech.',
            '<b>Power</b> — Vypočteno jako napětí × proud. ' + clr('orange', 'Oranžová') + ' = nabíjení, ' + clr('green', 'zelená') + ' = vybíjení.',
            '<b>Current</b> — Proud baterie v Ampérech (záporný = vybíjení).',
            '<b>Cell Min/Max</b> — Nejnižší a nejvyšší napětí článku ze všech modulů.',
            '<b>Temperature</b> — Rozsah min/max teploty ze všech modulů.',
            '<b>SoH</b> — Stav zdraví baterie (100 % = nová, klesá s časem).',
            '<b>Towers / Modules</b> — Počet věží a BMS modulů.',
            '<b>Connection</b> — ' + clr('green', 'Connected') + ' nebo ' + clr('red', 'Disconnected') + ' podle stavu WebSocket připojení.',
            '<b>Errors</b> — Červený banner pokud jakýkoli modul hlásí BMS chybu.'
        ],
        overviewFooter: 'Pod přehledovými kartami je <b>tabulka modulů</b> s klíčovými hodnotami pro každý modul (sériové číslo, SOC, SoH, napětí, proud, výkon, min/max napětí článků, drift článků, teplota, stav).',

        cellsH: 'Cell Voltages (Napětí článků)',
        cellsIntro: 'Zobrazuje všech 16 napětí článků pro každý BMS modul v mřížce.',
        cellsItems: [
            'Napětí je ve výchozím stavu v mV, nebo ve V pokud je zapnuto "Convert mV to V" v config node.',
            'Článek s <b>nejnižším napětím</b> je zvýrazněn ' + clr('cyan', 'tyrkysově') + ' (pouze pokud je rozdíl k 2. nejnižšímu &ge; 5 mV).',
            'Článek s <b>nejvyšším napětím</b> je zvýrazněn ' + clr('red', 'červeně') + ' (pouze pokud je rozdíl k 2. nejvyššímu &ge; 5 mV).',
            '<b>Balancování</b> — Články aktivně balancované BMS mají ' + clr('orange', 'oranžový okraj') + '. Odznak "Bal N" ukazuje počet balancovaných článků v modulu.'
        ],

        graphsH: 'Graphs (Grafy)',
        graphsIntro: 'Liniové grafy zobrazující historii napětí článků pro každý modul v čase.',
        graphsItems: [
            'Časové rozsahy: <b>30 min, 1h, 2h, 6h, 12h, 24h</b>.',
            'Historie je uložena v <b>paměťovém bufferu (24 hodin)</b>. Data jsou <b>ztracena při restartu Node-RED</b> — neexistuje trvalé úložiště.',
            'Min článek (v posledním bodě) je kreslen ' + clr('cyan', 'tyrkysově') + ', max článek ' + clr('red', 'červeně') + ', ostatní šedě.',
            'Grafy se automaticky aktualizují při příchodu nových dat z read node.',
            'Indikátor "Loading, please wait..." se zobrazí pro rozsahy 2h a delší během načítání dat ze serveru.'
        ],

        tempsH: 'Temps (Teploty)',
        tempsIntro: 'Teplotní senzory — 8 na modul (odpovídají článkům 1–8 v rozvržení BYD BE Connect).',
        tempsItems: [
            '<b>Nejchladnější senzor</b> je zvýrazněn ' + clr('blue', 'modře') + ' (rozdíl &ge; 2 °C k 2. nejchladnějšímu).',
            '<b>Nejteplejší senzor</b> je zvýrazněn ' + clr('red', 'červeně') + ' (rozdíl &ge; 2 °C k 2. nejteplejšímu).',
            'Senzory ukazující 0 °C jsou vyloučeny ze zvýraznění min/max (obvykle nepoužité / nepřipojené).'
        ],

        energyH: 'Energy Throughput (Průtok energie)',
        energyIntro: 'Celoživotní statistiky energie a sledování záruky pro každý modul.',
        energyItems: [
            '<b>Total Charged / Discharged</b> — Kumulativní energie v kWh (' + clr('orange', 'oranžová') + ' pro nabíjení, ' + clr('green', 'zelená') + ' pro vybíjení).',
            '<b>Charge-Discharge Efficiency</b> — Poměr vybité ku nabité energii. Typická hodnota je 95–98 %.',
            '<b>Estimated Cycles</b> — Vypočteno jako celková vybití energie dělená použitelnou kapacitou modulu (3,6 kWh na modul BYD LVS).',
            '<b>Remaining Throughput Warranty</b> — Na základě veřejně dostupných specifikací minimálního průtoku energie krytého zárukou (11 880 kWh vybité energie na modul). Zobrazuje zbývající kWh a procenta. Jedná se o zjednodušený odhad, který se může lišit od skutečných záručních podmínek BYD.'
        ],

        driftH: 'Drift Log (Záznam driftu)',
        driftIntro: 'Sleduje drift napětí článků — jak moc se jednotlivé články odchylují od mediánu napětí článků modulu. Detekce driftu probíhá při každém čtení dat. Zaznamenává se pouze špička (nejextrémnější) drift na článek za den.',
        driftTablesIntro: 'Heatmapa zobrazuje tři samostatné tabulky:',
        driftTablesItems: [
            '<b style="color:' + C.red + '">High Cell Voltage Drift</b> — Články, jejichž napětí překročilo medián napětí článků modulu o více než nastavený práh.',
            '<b style="color:' + C.cyan + '">Low Cell Voltage Drift (near full charge)</b> — Články zaostávající za ostatními při plném nebo téměř plném nabití. Zatímco se všechny články nabíjejí, tyto nedosahují stejné úrovně napětí jako ostatní. Opakovaný výskyt u stejného článku může naznačovat vzorec, který stojí za podrobnější zkoumání.',
            '<b style="color:' + C.cyan + '">Low Cell Voltage Drift (near full discharge)</b> — Články s nižším napětím než ostatní při plném nebo téměř plném vybití. Tyto články se mohou vybíjet rychleji než zbytek modulu.'
        ],
        driftReadH: 'Jak číst heatmapu',
        driftReadItems: [
            'Řádky = moduly, sloupce = články 1–16. Hodnoty = počet dní, kdy byl drift detekován ve zvoleném období.',
            'Časové rozsahy: <b>1d, 7d, 14d, 30d, 90d</b>.',
            'Barvy jsou <b>relativní</b> — založené na mediánu výskytů driftu (medián nenulových počtů) pro každou tabulku nezávisle: ' + clr('green', 'zelená') + ' = do 2&times; mediánu výskytů, ' + clr('yellow', 'žlutá') + ' = do 2,5&times;, ' + clr('orange', 'oranžová') + ' = do 3&times;, ' + clr('red', 'červená') + ' = více než 3&times; mediánu výskytů.',
            'Pokud je medián výskytů driftu stále nízký (&le; 4), všechny nenulové články se zobrazí ' + clr('green', 'zeleně') + ' — nedostatek dat pro smysluplné barvení heatmapy. Heatmapa se aktivuje automaticky s přibývajícími daty.'
        ],
        driftMeaningH: 'Co drift znamená',
        driftMeaningItems: [
            '<b>Občasný náhodný drift</b> napříč různými články je <b>normální</b> — BMS články průběžně balancuje.',
            '<b>Stejný článek opakovaně driftující</b> po více dní nebo týdnů stojí za sledování.',
            'Nízký drift při plném nabití je obzvláště významný — naznačuje neobvyklý vzorec balancování, který může stát za konzultaci s kvalifikovaným technikem.'
        ],
        driftCapacity: 'Pokud se <b>stejný článek</b> opakovaně objevuje v tabulkách <b style="color:' + C.red + '">High Cell Voltage Drift</b> i <b style="color:' + C.cyan + '">Low Cell Voltage Drift (near full discharge)</b>, pravděpodobně má nižší kapacitu než ostatní články. Nabíjí se na vyšší napětí dříve (high drift) a vybíjí se na nižší napětí dříve (low drift). Tento vzorec může naznačovat rozdíly v charakteristikách článků.',
        driftPersistence: 'Data driftu jsou uložena v souboru a přežijí restart Node-RED. Retence: 90 dní (starší záznamy jsou automaticky odstraněny).',

        configTitle: 'Konfigurace',
        configIntro: 'Dashboard node má dva konfigurovatelné prahy driftu (v dialogu vlastností node):',
        configItems: [
            '<b>High drift threshold (mV)</b> — Napětí článku nad mediánem napětí článků modulu pro záznam vysokého driftu. Výchozí: 50 mV.',
            '<b>Low drift threshold (mV)</b> — Napětí článku pod mediánem napětí článků modulu pro záznam nízkého driftu. Výchozí: 50 mV.'
        ],
        configOther: 'Ostatní nastavení (BMU host, port, počet modulů, věží, jednotka napětí) se konfigurují v <b>BYD LVS config</b> node sdíleném s read node.',

        notesTitle: 'Důležité poznámky',
        notesItems: [
            '<b>Buffer historie</b> — Uchovává posledních 24 hodin v paměti. Data jsou ztracena při restartu Node-RED. Neexistuje trvalé úložiště historie.',
            '<b>Limit připojení</b> — BYD BMU umožňuje pouze jedno Modbus připojení současně. Nespouštějte více read node nebo jiných Modbus nástrojů najednou.',
            '<b>Doba čtení</b> — Čtení všech modulů trvá přibližně 2–3 sekundy na modul. Nastavte interval inject node odpovídajícím způsobem (např. 30s pro 8 modulů).',
            '<b>BMS varování</b> — Varovné registry (např. "Cells OverVoltage" při SOC 99 %) jsou provozní stavové příznaky, nikoli poruchy. Zobrazeny jsou pouze skutečné chybové příznaky. Váš střídač / Victron zpracovává alarmy nezávisle.'
        ],

        disclaimerTitle: 'Disclaimer',
        disclaimerParagraphs: [
            'Tento software <b>NENÍ</b> oficiální diagnostický nástroj BYD. Je poskytován "TAK JAK JE" bez jakékoliv záruky.',
            'Ethernetový port a jeho Modbus protokol na BYD BMU nejsou v produktovém manuálu dokumentovány pro diagnostické použití koncovými uživateli nebo instalatéry. Jejich dostupnost a otevřená přístupnost jsou čistě náhodné a mohou se změnit s aktualizacemi firmware bez předchozího upozornění. Důsledky častého nebo nepřetržitého dotazování BMU přes Modbus nejsou známy.',
            'Používáním tohoto softwaru berete na vědomí a souhlasíte s tím, že:<ul><li>Autor nenese ŽÁDNOU odpovědnost za škody, ztrátu záruky nebo jiné následky jakéhokoliv druhu</li><li>Vzdáváte se veškerých nároků na náhradu škody vyplývající z jeho používání</li><li>Přijímáte plnou odpovědnost za jakákoliv rozhodnutí učiněná na základě informací poskytnutých tímto softwarem</li><li>Nesprávná čtení mohou nastat v důsledku chybné interpretace registrů, komunikačních chyb nebo rozdílů ve firmware</li></ul>',
            'Interpretace dat tímto nástrojem (včetně, ale nejen, odhadů záruky, počtu cyklů, výpočtů účinnosti a analýzy driftu článků) odráží chápání autora a nemusí být přesná. Vždy konzultujte oficiální dokumentaci BYD nebo autorizovaného servisního partnera pro závazná posouzení.',
            '<b>Prvním použitím tohoto softwaru neodvolatelně přijímáte všechny výše uvedené podmínky.</b>',
            'BYD a Battery-Box jsou registrované ochranné známky společnosti BYD Company Limited.'
        ]
    },

    de: {
        aboutTitle: 'Über dieses Dashboard',
        aboutP1: 'Dieses Dashboard zeigt Echtzeitdaten von BYD Battery-Box LVS Batterien an, die per Modbus RTU über TCP von der Battery Management Unit (BMU) gelesen werden. Die Daten werden vom <b>BYD LVS read</b>-Knoten bereitgestellt, der die BMU in einem konfigurierten Intervall abfragt.',
        aboutP2: 'Das Dashboard besteht aus 6 Daten-Tabs (unten beschrieben) und dieser Hilfeseite.',

        tabsTitle: 'Tabs',

        overviewH: 'Overview (Übersicht)',
        overviewIntro: 'Zeigt den aktuellen Zustand des gesamten Batteriesystems auf einen Blick:',
        overviewItems: [
            '<b>SOC-Anzeige</b> — Ladezustand als Prozentkreis. ' + clr('green', 'Grün') + ' über 30 %, ' + clr('yellow', 'gelb') + ' 15–30 %, ' + clr('red', 'rot') + ' unter 15 %.',
            '<b>Pack Voltage</b> — Gesamtbatteriespannung in Volt.',
            '<b>Power</b> — Berechnet als Spannung × Strom. ' + clr('orange', 'Orange') + ' = Laden, ' + clr('green', 'grün') + ' = Entladen.',
            '<b>Current</b> — Batteriestrom in Ampere (negativ = Entladen).',
            '<b>Cell Min/Max</b> — Niedrigste und höchste Zellspannung über alle Module.',
            '<b>Temperature</b> — Min/Max-Temperaturbereich über alle Module.',
            '<b>SoH</b> — Gesundheitszustand (100 % = neue Batterie, nimmt mit der Zeit ab).',
            '<b>Towers / Modules</b> — Anzahl der Türme und BMS-Module.',
            '<b>Connection</b> — ' + clr('green', 'Connected') + ' oder ' + clr('red', 'Disconnected') + ' basierend auf WebSocket-Status.',
            '<b>Errors</b> — Rotes Banner wenn ein Modul BMS-Fehler meldet.'
        ],
        overviewFooter: 'Unter den Übersichtskarten befindet sich eine <b>Modul-Tabelle</b> mit Schlüsselwerten pro Modul (Seriennummer, SOC, SoH, Spannung, Strom, Leistung, Min/Max-Zellspannung, Zell-Drift, Temperatur, Status).',

        cellsH: 'Cell Voltages (Zellspannungen)',
        cellsIntro: 'Zeigt alle 16 Zellspannungen für jedes BMS-Modul in einem Raster an.',
        cellsItems: [
            'Spannung wird standardmäßig in mV angezeigt, oder in V wenn "Convert mV to V" im Konfigurationsknoten aktiviert ist.',
            'Die Zelle mit der <b>niedrigsten Spannung</b> wird in ' + clr('cyan', 'Cyan') + ' hervorgehoben (nur wenn der Abstand zur 2. niedrigsten &ge; 5 mV beträgt).',
            'Die Zelle mit der <b>höchsten Spannung</b> wird in ' + clr('red', 'Rot') + ' hervorgehoben (nur wenn der Abstand zur 2. höchsten &ge; 5 mV beträgt).',
            '<b>Balancing</b> — Aktiv balancierte Zellen zeigen einen ' + clr('orange', 'orangefarbenen Rahmen') + '. Ein Badge "Bal N" zeigt die Anzahl der balancierenden Zellen pro Modul.'
        ],

        graphsH: 'Graphs (Diagramme)',
        graphsIntro: 'Liniendiagramme zeigen die Zellspannungshistorie für jedes Modul im Zeitverlauf.',
        graphsItems: [
            'Zeitbereich-Voreinstellungen: <b>30 min, 1h, 2h, 6h, 12h, 24h</b>.',
            'Die Historie wird in einem <b>Speicherpuffer (24 Stunden)</b> gespeichert. Daten gehen <b>bei einem Node-RED-Neustart verloren</b> — es gibt keinen persistenten Speicher.',
            'Die Min-Zelle (am letzten Datenpunkt) wird in ' + clr('cyan', 'Cyan') + ' gezeichnet, Max-Zelle in ' + clr('red', 'Rot') + ', andere Zellen in Grau.',
            'Diagramme werden automatisch aktualisiert, wenn neue Daten vom Read-Knoten eintreffen.',
            'Ein "Loading, please wait..."-Indikator erscheint bei Voreinstellungen ab 2h während die Daten vom Server geladen werden.'
        ],

        tempsH: 'Temps (Temperaturen)',
        tempsIntro: 'Temperaturwerte von 8 Sensoren pro Modul (Sensoren entsprechen Zellen 1–8 im BYD BE Connect Layout).',
        tempsItems: [
            'Der <b>kälteste Sensor</b> wird in ' + clr('blue', 'Blau') + ' hervorgehoben (Abstand &ge; 2 °C zum 2. kältesten).',
            'Der <b>wärmste Sensor</b> wird in ' + clr('red', 'Rot') + ' hervorgehoben (Abstand &ge; 2 °C zum 2. wärmsten).',
            'Sensoren die 0 °C anzeigen sind von der Min/Max-Hervorhebung ausgeschlossen (normalerweise unbenutzt / nicht angeschlossen).'
        ],

        energyH: 'Energy Throughput (Energiedurchsatz)',
        energyIntro: 'Lebensdauer-Energiestatistiken und Garantie-Tracking pro Modul.',
        energyItems: [
            '<b>Total Charged / Discharged</b> — Kumulierte Energie in kWh (' + clr('orange', 'Orange') + ' für Laden, ' + clr('green', 'Grün') + ' für Entladen).',
            '<b>Charge-Discharge Efficiency</b> — Verhältnis von entladener zu geladener Energie. Typischer Wert ist 95–98 %.',
            '<b>Estimated Cycles</b> — Berechnet als gesamte Entladeenergie geteilt durch die nutzbare Modulkapazität (3,6 kWh pro BYD LVS Modul).',
            '<b>Remaining Throughput Warranty</b> — Basierend auf öffentlich verfügbaren Spezifikationen des minimalen Energiedurchsatzes unter Garantie (11.880 kWh Entladeenergie pro Modul). Zeigt verbleibende kWh und Prozent. Dies ist eine vereinfachte Schätzung und kann von den tatsächlichen BYD-Garantiebedingungen abweichen.'
        ],

        driftH: 'Drift Log (Drift-Protokoll)',
        driftIntro: 'Verfolgt den Zellspannungsdrift — wie stark einzelne Zellen vom Zellspannungsmedian des Moduls abweichen. Die Drift-Erkennung läuft bei jedem Datenscan. Nur der Peak (extremste) Drift pro Zelle pro Tag wird aufgezeichnet.',
        driftTablesIntro: 'Die Heatmap zeigt drei separate Tabellen:',
        driftTablesItems: [
            '<b style="color:' + C.red + '">High Cell Voltage Drift</b> — Zellen deren Spannung den Zellspannungsmedian des Moduls um mehr als den konfigurierten Schwellenwert überstieg.',
            '<b style="color:' + C.cyan + '">Low Cell Voltage Drift (near full charge)</b> — Zellen die bei voller oder nahezu voller Ladung hinter den anderen zurückbleiben. Während alle Zellen geladen werden, erreichen diese nicht das gleiche Spannungsniveau wie die übrigen. Wiederholtes Auftreten bei derselben Zelle kann auf ein Muster hinweisen, das eine genauere Untersuchung verdient.',
            '<b style="color:' + C.cyan + '">Low Cell Voltage Drift (near full discharge)</b> — Zellen mit niedrigerer Spannung als andere bei voller oder nahezu voller Entladung. Diese Zellen können sich schneller entladen als der Rest des Moduls.'
        ],
        driftReadH: 'Wie man die Heatmap liest',
        driftReadItems: [
            'Zeilen = Module, Spalten = Zellen 1–16. Werte = Anzahl der Tage, an denen der Drift im gewählten Zeitraum erkannt wurde.',
            'Zeitbereiche: <b>1d, 7d, 14d, 30d, 90d</b>.',
            'Farben sind <b>relativ</b> — basierend auf dem Drift-Vorkommensmedian (Median der Nicht-Null-Zählungen) für jede Tabelle unabhängig: ' + clr('green', 'Grün') + ' = bis 2&times; des Vorkommensmedians, ' + clr('yellow', 'Gelb') + ' = bis 2,5&times;, ' + clr('orange', 'Orange') + ' = bis 3&times;, ' + clr('red', 'Rot') + ' = mehr als 3&times; des Vorkommensmedians.',
            'Wenn der Drift-Vorkommensmedian noch niedrig ist (&le; 4), werden alle Nicht-Null-Zellen in ' + clr('green', 'Grün') + ' angezeigt — nicht genug Daten für eine sinnvolle Heatmap-Einfärbung. Die Heatmap aktiviert sich automatisch mit zunehmenden Daten.'
        ],
        driftMeaningH: 'Was Drift bedeutet',
        driftMeaningItems: [
            '<b>Gelegentlicher zufälliger Drift</b> über verschiedene Zellen ist <b>normal</b> — das BMS balanciert Zellen kontinuierlich.',
            '<b>Dieselbe Zelle driftet wiederholt</b> über mehrere Tage oder Wochen — dies ist es wert, beobachtet zu werden.',
            'Niedriger Drift bei voller Ladung ist besonders bedeutsam — er deutet auf ein ungewöhnliches Balancing-Muster hin, das es wert sein kann, mit einem qualifizierten Techniker besprochen zu werden.'
        ],
        driftCapacity: 'Wenn <b>dieselbe Zelle</b> wiederholt in den Tabellen <b style="color:' + C.red + '">High Cell Voltage Drift</b> und <b style="color:' + C.cyan + '">Low Cell Voltage Drift (near full discharge)</b> erscheint, hat sie wahrscheinlich eine geringere Kapazität als die anderen Zellen. Sie lädt schneller auf eine höhere Spannung (High Drift) und entlädt sich schneller auf eine niedrigere Spannung (Low Drift). Dieses Muster kann auf Unterschiede in den Zelleigenschaften hinweisen.',
        driftPersistence: 'Drift-Daten werden in einer Datei gespeichert und überstehen Node-RED-Neustarts. Aufbewahrung: 90 Tage (ältere Einträge werden automatisch entfernt).',

        configTitle: 'Konfiguration',
        configIntro: 'Der Dashboard-Knoten hat zwei konfigurierbare Drift-Schwellenwerte (im Knoteneigenschaften-Dialog):',
        configItems: [
            '<b>High drift threshold (mV)</b> — Zellspannung über dem Zellspannungsmedian des Moduls um einen hohen Drift aufzuzeichnen. Standard: 50 mV.',
            '<b>Low drift threshold (mV)</b> — Zellspannung unter dem Zellspannungsmedian des Moduls um einen niedrigen Drift aufzuzeichnen. Standard: 50 mV.'
        ],
        configOther: 'Weitere Einstellungen (BMU-Host, Port, Modulanzahl, Türme, Spannungseinheit) werden im <b>BYD LVS config</b>-Knoten konfiguriert, der mit dem Leseknoten geteilt wird.',

        notesTitle: 'Wichtige Hinweise',
        notesItems: [
            '<b>Historie-Puffer</b> — Speichert die letzten 24 Stunden im Arbeitsspeicher. Daten gehen bei einem Node-RED-Neustart verloren. Es gibt keinen persistenten Historie-Speicher.',
            '<b>Verbindungslimit</b> — Die BYD BMU erlaubt nur eine Modbus-Verbindung gleichzeitig. Verwenden Sie nicht mehrere Leseknoten oder andere Modbus-Tools gleichzeitig.',
            '<b>Scan-Dauer</b> — Das Lesen aller Module dauert ungefähr 2–3 Sekunden pro Modul. Stellen Sie das Inject-Intervall entsprechend ein (z.B. 30s für 8 Module).',
            '<b>BMS-Warnungen</b> — Warnregister (z.B. "Cells OverVoltage" bei SOC 99 %) sind Betriebsstatus-Flags, keine Fehler. Nur tatsächliche Fehler-Flags werden angezeigt. Ihr Wechselrichter / Victron behandelt Alarme unabhängig.'
        ],

        disclaimerTitle: 'Haftungsausschluss',
        disclaimerParagraphs: [
            'Diese Software ist <b>KEIN</b> offizielles BYD-Diagnosetool. Sie wird "WIE BESEHEN" ohne jegliche Garantie bereitgestellt.',
            'Der Ethernet-Port und sein Modbus-Protokoll an der BYD BMU sind im Produkthandbuch nicht für die diagnostische Nutzung durch Endbenutzer oder Installateure dokumentiert. Ihre Verfügbarkeit und offene Zugänglichkeit sind rein zufällig und können sich mit Firmware-Updates ohne Vorankündigung ändern. Die Folgen häufiger oder kontinuierlicher Modbus-Abfragen an die BMU sind unbekannt.',
            'Durch die Verwendung dieser Software erkennen Sie an und stimmen zu, dass:<ul><li>Der Autor KEINE Haftung für Schäden, Garantieverlust oder andere Folgen jeglicher Art übernimmt</li><li>Sie auf alle Ansprüche auf Entschädigung aus der Nutzung verzichten</li><li>Sie die volle Verantwortung für alle Entscheidungen tragen, die auf Grundlage der von dieser Software bereitgestellten Informationen getroffen werden</li><li>Fehlerhafte Messwerte durch Fehlinterpretation von Registern, Kommunikationsfehler oder Firmware-Unterschiede auftreten können</li></ul>',
            'Die Dateninterpretation durch dieses Tool (einschließlich, aber nicht beschränkt auf Garantieschätzungen, Zyklenanzahl, Effizienzberechnungen und Zell-Drift-Analyse) spiegelt das Verständnis des Autors wider und ist möglicherweise nicht korrekt. Konsultieren Sie immer die offizielle BYD-Dokumentation oder einen autorisierten Servicepartner für verbindliche Beurteilungen.',
            '<b>Mit der erstmaligen Nutzung dieser Software akzeptieren Sie unwiderruflich alle oben genannten Bedingungen.</b>',
            'BYD und Battery-Box sind eingetragene Marken der BYD Company Limited.'
        ]
    }
};

export default {
    name: 'HelpTab',
    data: function () {
        var saved = null;
        try { saved = localStorage.getItem('byd-dashboard-help-lang'); } catch (e) { /* ignore */ }
        return {
            lang: saved && TRANSLATIONS[saved] ? saved : 'en',
            langs: [
                { id: 'en', label: 'EN' },
                { id: 'cs', label: 'CZ' },
                { id: 'de', label: 'DE' }
            ],
            version: __DASHBOARD_VERSION__
        };
    },
    methods: {
        t: function (key) {
            var tr = TRANSLATIONS[this.lang] || TRANSLATIONS.en;
            return tr[key] != null ? tr[key] : (TRANSLATIONS.en[key] || key);
        },
        setLang: function (id) {
            this.lang = id;
            try { localStorage.setItem('byd-dashboard-help-lang', id); } catch (e) { /* ignore */ }
        }
    }
}
</script>

<style scoped>
.help-tab {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.lang-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.lang-buttons {
    display: flex;
    gap: 6px;
}

.version-label {
    font-size: 12px;
    color: #5a6580;
    font-family: monospace;
}

.lang-btn {
    padding: 5px 14px;
    border: 1px solid #333944;
    border-radius: 4px;
    background: transparent;
    color: #8892b0;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
}

.lang-btn:hover {
    color: #ccd6f6;
    border-color: #8892b0;
}

.lang-btn.active {
    color: #10B981;
    border-color: #10B981;
    background: #10B98115;
}

.help-section {
    background: #12161f;
    border-radius: 8px;
    padding: 20px 24px;
}

h2 {
    margin: 0 0 14px 0;
    font-size: 16px;
    font-weight: 700;
    color: #ccd6f6;
    border-bottom: 1px solid #333944;
    padding-bottom: 8px;
}

h3 {
    margin: 18px 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: #10B981;
}

h3:first-child {
    margin-top: 0;
}

h4 {
    margin: 14px 0 6px 0;
    font-size: 13px;
    font-weight: 600;
    color: #ccd6f6;
}

p {
    margin: 0 0 10px 0;
    font-size: 13px;
    line-height: 1.6;
    color: #b0b8cc;
}

p:last-child {
    margin-bottom: 0;
}

ul {
    margin: 0 0 10px 0;
    padding-left: 20px;
}

ul:last-child {
    margin-bottom: 0;
}

li {
    font-size: 13px;
    line-height: 1.6;
    color: #b0b8cc;
    margin-bottom: 4px;
}

li:last-child {
    margin-bottom: 0;
}

.disclaimer-section {
    border: 1px solid #333944;
    background: #0e1219;
}

.disclaimer-section h2 {
    color: #f97316;
}

.disclaimer-section .disclaimer-p {
    color: #8892b0;
    font-size: 12px;
    line-height: 1.55;
    margin-bottom: 8px;
}

.disclaimer-section .disclaimer-p:last-child {
    margin-bottom: 0;
}

.disclaimer-section :deep(ul) {
    margin: 6px 0 0 0;
    padding-left: 24px;
    list-style-position: outside;
}

.disclaimer-section :deep(li) {
    margin-bottom: 3px;
}
</style>
