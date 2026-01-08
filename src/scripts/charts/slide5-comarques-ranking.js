import * as d3 from 'd3';

function formatFloat(v, d = 2) { return Number.isFinite(v) ? v.toLocaleString('ca-ES', { minimumFractionDigits: d, maximumFractionDigits: d }) : 'N/D'; }

function rankingBar(containerSel, rows, accessor, title) {
    const sorted = rows.filter(d => Number.isFinite(accessor(d))).sort((a, b) => accessor(b) - accessor(a)).slice(0, 15);
    const container = d3.select(containerSel);
    const margin = { top: 20, right: 20, bottom: 20, left: 200 };
    const containerWidth = container.node()?.getBoundingClientRect().width || 800;
    const width = Math.max(600, containerWidth) - margin.left - margin.right;
    const height = 26 * sorted.length + margin.top + margin.bottom;

    container.html('');
    const svg = container.append('svg').attr('width', width + margin.left + margin.right).attr('height', height)
        .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, d3.max(sorted, accessor) || 1]).nice().range([0, width]);
    const y = d3.scaleBand().domain(sorted.map(d => d.comarca)).range([0, height - margin.top - margin.bottom]).padding(0.15);

    svg.selectAll('rect').data(sorted).enter().append('rect')
        .attr('x', 0).attr('y', d => y(d.comarca)).attr('width', d => x(accessor(d))).attr('height', y.bandwidth()).attr('fill', '#73000a')
        .append('title').text(d => `${d.comarca}: ${formatFloat(accessor(d))}`);

    svg.append('g').call(d3.axisLeft(y));
    svg.append('g').attr('transform', `translate(0,${y.range()[1]})`).call(d3.axisBottom(x).ticks(5));
    svg.append('text').attr('x', width / 2).attr('y', height - margin.top - margin.bottom + 36).attr('text-anchor', 'middle').attr('fill', '#333').text('kg/hab./dia');
    svg.append('text').attr('x', 0).attr('y', -6).style('font-weight', '600').text(title);
}

export function createSlide5ComarquesRanking(data) {
    const yearCtrl = d3.select('#comparisons-year-2');
    const yearDisp = d3.select('#comparisons-year-display-2');
    const provCtrl = d3.select('#comparisons-provincia');
    const metricCtrl = d3.select('#comparisons-metric');
    let isActive = false;

    function render() {
        const y = +yearCtrl.property('value');
        yearDisp.text(y);
        const p = provCtrl.property('value') || 'Totes';
        const m = metricCtrl.property('value') || 'kg_selectiva_per_hab_dia';
        const rows = data.filter(d => d.any === y && (p === 'Totes' || d.provincia === p));
        const acc = (d) => d[m];
        const title = m === 'kg_selectiva_per_hab_dia' ? 'Recollida selectiva kg/hab./dia' : (m === 'kg_no_selectiva_per_hab_dia' ? 'Rebuig kg/hab./dia' : 'Total kg/hab./dia');
        rankingBar('#chart-5-1', rows, acc, title);
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
    provCtrl.on('change', renderIfActive);
    metricCtrl.on('change', renderIfActive);

    yearCtrl.property('value', 2006);
    provCtrl.property('value', 'Totes');
    metricCtrl.property('value', 'kg_selectiva_per_hab_dia');
}
