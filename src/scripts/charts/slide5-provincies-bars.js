import * as d3 from 'd3';

function formatFloat(v, d = 2) { return Number.isFinite(v) ? v.toLocaleString('ca-ES', { minimumFractionDigits: d, maximumFractionDigits: d }) : 'N/D'; }

function aggProvAvg(data, year, accessor) {
    const m = new Map();
    data.filter(d => d.any === year).forEach(d => {
        const w = d.poblacio || 0; const v = accessor(d);
        if (!Number.isFinite(v) || !Number.isFinite(w) || w <= 0) return;
        if (!m.has(d.provincia)) m.set(d.provincia, { w: 0, s: 0 });
        const o = m.get(d.provincia); o.w += w; o.s += v * w;
    });
    return Array.from(m.entries()).map(([prov, { w, s }]) => ({ provincia: prov, value: w > 0 ? s / w : NaN }));
}

export function createSlide5ProvinciesBars(data) {
    const yearCtrl = d3.select('#comparisons-year');
    const yearDisp = d3.select('#comparisons-year-display');
    let isActive = false;

    function render() {
        const year = +yearCtrl.property('value');
        yearDisp.text(year);
        const sel = aggProvAvg(data, year, d => d.kg_selectiva_per_hab_dia);
        const no = aggProvAvg(data, year, d => d.kg_no_selectiva_per_hab_dia);
        const provs = Array.from(new Set([...sel.map(d => d.provincia), ...no.map(d => d.provincia)])).sort();
        const rows = provs.map(p => ({ provincia: p, sel: (sel.find(x => x.provincia === p) || {}).value, no: (no.find(x => x.provincia === p) || {}).value }));

        const container = d3.select('#chart-5-provincies-bars');
        const margin = { top: 24, right: 16, bottom: 36, left: 60 };
        const containerWidth = container.node()?.getBoundingClientRect().width || 800;
        const width = Math.max(600, containerWidth) - margin.left - margin.right;
        const height = 320 - margin.top - margin.bottom;
        container.html('');
        const svg = container.append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const x0 = d3.scaleBand().domain(provs).range([0, width]).padding(0.2);
        const x1 = d3.scaleBand().domain(['sel', 'no']).range([0, x0.bandwidth()]).padding(0.1);
        const y = d3.scaleLinear().domain([0, d3.max(rows, d => Math.max(d.sel || 0, d.no || 0)) || 1]).nice().range([height, 0]);
        const color = d3.scaleOrdinal().domain(['sel', 'no']).range(['#73003c', '#e98300']);

        svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x0));
        svg.append('g').call(d3.axisLeft(y));

        svg.append('text').attr('x', -height / 2).attr('y', -48).attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').attr('fill', '#333').text('kg/hab./dia');

        const g = svg.selectAll('g.group').data(rows).enter().append('g').attr('class', 'group').attr('transform', d => `translate(${x0(d.provincia)},0)`);

        g.selectAll('rect').data(d => ['sel', 'no'].map(k => ({ k, v: d[k] }))).enter().append('rect')
            .attr('x', d => x1(d.k))
            .attr('y', d => y(d.v || 0))
            .attr('width', x1.bandwidth())
            .attr('height', d => height - y(d.v || 0))
            .attr('fill', d => color(d.k))
            .append('title').text(d => `${d.k === 'sel' ? 'Selectiva' : 'Rebuig'}: ${formatFloat(d.v)} kg/hab/dia`);

        const legend = svg.append('g').attr('transform', `translate(0, -8)`);
        [['sel', 'Recollida selectiva'], ['no', 'Rebuig']].forEach((it, i) => {
            const lg = legend.append('g').attr('transform', `translate(${i * 160},0)`);
            lg.append('rect').attr('width', 12).attr('height', 12).attr('fill', color(it[0])).attr('rx', 2);
            lg.append('text').attr('x', 18).attr('y', 10).style('font-size', '12px').text(it[1]);
        });
    }

    function renderIfActive() {
        if (!isActive) return;
        render();
    }

    function handleSlideChange(ev) {
        isActive = ev?.detail?.slide === 5;
        if (isActive) render();
    }

    window.addEventListener('slideChanged', handleSlideChange);
    yearCtrl.on('input', renderIfActive);
    yearCtrl.property('value', 2006);
}
