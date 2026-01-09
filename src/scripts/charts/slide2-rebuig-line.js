import * as d3 from 'd3';

function formatFloat(v, d = 2) {
    return Number.isFinite(v) ? v.toLocaleString('ca-ES', { minimumFractionDigits: d, maximumFractionDigits: d }) : 'N/D';
}

function groupByProvYear(data, valueAccessor) {
    const m = new Map();
    data.forEach(d => {
        const key = `${d.provincia}__${d.any}`;
        const w = d.poblacio || 0;
        const v = valueAccessor(d);
        if (!Number.isFinite(v) || !Number.isFinite(w) || w <= 0) return;
        if (!m.has(key)) m.set(key, { provincia: d.provincia, year: d.any, wsum: 0, wval: 0 });
        const obj = m.get(key);
        obj.wsum += w;
        obj.wval += v * w;
    });
    const byProv = new Map();
    Array.from(m.values()).forEach(({ provincia, year, wsum, wval }) => {
        const value = wsum > 0 ? wval / wsum : NaN;
        if (!byProv.has(provincia)) byProv.set(provincia, []);
        byProv.get(provincia).push({ year, value });
    });
    byProv.forEach(arr => arr.sort((a, b) => a.year - b.year));
    return byProv;
}

function drawLineSeries(containerSel, seriesMap, selectedProvincia, yLabel) {
    const container = d3.select(containerSel);
    const margin = { top: 20, right: 20, bottom: 36, left: 56 };
    const containerWidth = container.node()?.getBoundingClientRect().width || 800;
    const width = Math.max(600, containerWidth) - margin.left - margin.right;
    const height = 380 - margin.top - margin.bottom;

    container.html('');
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const provs = selectedProvincia === 'Totes' ? Array.from(seriesMap.keys()) : [selectedProvincia];
    const dataSeries = provs.map(p => ({ key: p, values: seriesMap.get(p) || [] }))
        .filter(s => s.values && s.values.length);

    const allYears = Array.from(new Set(dataSeries.flatMap(s => s.values.map(v => v.year)))).sort();
    if (dataSeries.length === 0 || allYears.length === 0) {
        container.append('p').style('text-align', 'center').style('padding', '1rem').text('No hi ha dades per aquesta selecció.');
        return;
    }

    const x = d3.scaleLinear().domain(d3.extent(allYears)).range([0, width]);
    const y = d3.scaleLinear()
        .domain([0, d3.max(dataSeries, s => d3.max(s.values, v => v.value)) || 1])
        .nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeTableau10)
        .domain(provs)
        .range(['#E31B23', '#FFC702', '#7AB800', '#006699']);

    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value));

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format('d')));

    svg.append('g')
        .call(d3.axisLeft(y));

    svg.append('text')
        .attr('x', -height / 2)
        .attr('y', -40)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .attr('fill', '#000078')
        .text(yLabel);

    const seriesG = svg.selectAll('.serie')
        .data(dataSeries)
        .enter().append('g')
        .attr('class', 'serie');

    seriesG.append('path')
        .attr('fill', 'none')
        .attr('stroke', d => color(d.key))
        .attr('stroke-width', 2)
        .attr('d', d => line(d.values));

    seriesG.selectAll('circle')
        .data(d => d.values.map(v => ({ ...v, key: d.key })))
        .enter().append('circle')
        .attr('cx', d => x(d.year))
        .attr('cy', d => y(d.value))
        .attr('r', 2.5)
        .attr('fill', d => color(d.key))
        .append('title')
        .text(d => `${d.key} • ${d.year}: ${formatFloat(d.value)} kg/hab/dia`);

    // Afegir llegenda centrada a la part superior
    if (selectedProvincia === 'Totes') {
        const legendWidth = provs.length * 160;
        const legendX = (width - legendWidth) / 2;
        const legend = svg.append('g').attr('transform', `translate(${legendX}, -6)`);
        provs.forEach((k, i) => {
            const g = legend.append('g').attr('transform', `translate(${i * 160},0)`);
            g.append('rect').attr('width', 12).attr('height', 12).attr('fill', color(k)).attr('rx', 2);
            g.append('text').attr('x', 18).attr('y', 10).style('font-size', '12px').text(k);
        });
    }
}

export function createSlide2RebuigLine(data) {
    const provSel = d3.select('#sustained-provincia-2');
    const byProvKgNo = groupByProvYear(data, d => d.kg_no_selectiva_per_hab_dia);
    let isActive = false;

    function render() {
        drawLineSeries('#chart-sustained-no-selective', byProvKgNo, provSel.property('value') || 'Totes', 'Rebuig kg/hab./dia');
    }

    function renderIfActive() {
        if (!isActive) return;
        render();
    }

    function handleSlideChange(ev) {
        isActive = ev?.detail?.slide === 2;
        if (isActive) render();
    }

    window.addEventListener('slideChanged', handleSlideChange);
    provSel.on('change', renderIfActive);
    provSel.property('value', 'Totes');
}
