import * as d3 from 'd3';

function formatFloat(v, d = 2) { return Number.isFinite(v) ? v.toLocaleString('ca-ES', { minimumFractionDigits: d, maximumFractionDigits: d }) : 'N/D'; }

function topBar(containerSel, rows, valueAccessor, titleLabel) {
    const top = rows
        .filter(d => Number.isFinite(valueAccessor(d)))
        .sort((a, b) => (Number.isFinite(valueAccessor(b)) ? valueAccessor(b) : -Infinity) - (Number.isFinite(valueAccessor(a)) ? valueAccessor(a) : -Infinity))
        .slice(0, 10);

    const container = d3.select(containerSel);
    const margin = { top: 20, right: 16, bottom: 20, left: 180 };
    const containerWidth = container.node()?.getBoundingClientRect().width || 800;
    const width = Math.max(600, containerWidth) - margin.left - margin.right;
    const height = 28 * top.length + margin.top + margin.bottom;

    container.html('');
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, d3.max(top, valueAccessor) || 1]).nice().range([0, width]);
    const y = d3.scaleBand().domain(top.map(d => d.comarca)).range([0, height - margin.top - margin.bottom]).padding(0.15);

    svg.selectAll('rect')
        .data(top)
        .enter().append('rect')
        .attr('x', 0)
        .attr('y', d => y(d.comarca))
        .attr('width', d => x(valueAccessor(d)))
        .attr('height', y.bandwidth())
        .attr('fill', '#73003c')
        .append('title')
        .text(d => `${d.comarca}: ${formatFloat(valueAccessor(d))}`);

    svg.append('g').call(d3.axisLeft(y));
    svg.append('g').attr('transform', `translate(0,${y.range()[1]})`).call(d3.axisBottom(x).ticks(5));
    svg.append('text').attr('x', 0).attr('y', -6).style('font-weight', '600').text(titleLabel);
}

export function createSlide4TopSelectiva(data) {
    const yearCtrl = d3.select('#pressure-year-3');
    const yearDisp = d3.select('#pressure-year-display-3');
    const provCtrl = d3.select('#pressure-provincia-3');
    let isActive = false;

    function render() {
        const y = +yearCtrl.property('value');
        yearDisp.text(y);
        const p = provCtrl.property('value') || 'Totes';
        const rows = data.filter(d => d.any === y && (p === 'Totes' || d.provincia === p));
        topBar('#chart-4-2', rows, d => d.kg_selectiva_per_hab_dia, 'Top recollida selectiva kg/hab./dia');
    }

    function renderIfActive() {
        if (!isActive) return;
        render();
    }

    function handleSlideChange(ev) {
        isActive = ev?.detail?.slide === 4;
        if (isActive) render();
    }

    window.addEventListener('slideChanged', handleSlideChange);
    yearCtrl.on('input', renderIfActive);
    provCtrl.on('change', renderIfActive);

    yearCtrl.property('value', 2006);
    provCtrl.property('value', 'Totes');
}
