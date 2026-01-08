import * as d3 from 'd3';

export function createSlide5ProvinciesPercentSeries(data) {
    const tmp = new Map();
    data.forEach(d => {
        const key = `${d.provincia}__${d.any}`;
        if (!tmp.has(key)) tmp.set(key, { provincia: d.provincia, year: d.any, sel: 0, tot: 0 });
        const o = tmp.get(key);
        o.sel += (d.tones_recollida_selectiva || 0);
        o.tot += (d.tones_recollida_selectiva || 0) + (d.tones_recollida_no_selectiva || 0);
    });
    const byProv = new Map();
    Array.from(tmp.values()).forEach(({ provincia, year, sel, tot }) => {
        if (!byProv.has(provincia)) byProv.set(provincia, []);
        byProv.get(provincia).push({ year, value: tot > 0 ? (sel / tot) * 100 : NaN });
    });
    byProv.forEach(arr => arr.sort((a, b) => a.year - b.year));

    let isActive = false;

    function render() {
        const container = d3.select('#chart-5-2');
        const margin = { top: 20, right: 16, bottom: 36, left: 56 };
        const containerWidth = container.node()?.getBoundingClientRect().width || 800;
        const width = Math.max(600, containerWidth) - margin.left - margin.right;
        const height = 320 - margin.top - margin.bottom;

        container.html('');
        const svg = container.append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom)
            .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const allYears = Array.from(new Set([].concat(...Array.from(byProv.values()).map(v => v.map(x => x.year))))).sort();
        const x = d3.scaleLinear().domain(d3.extent(allYears)).range([0, width]);
        const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

        svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format('d')));
        svg.append('g').call(d3.axisLeft(y));
        svg.append('text').attr('x', -height / 2).attr('y', -44).attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').attr('fill', '#333').text('Percentatge selectiva (%)');

        const color = d3.scaleOrdinal(d3.schemeTableau10).domain(Array.from(byProv.keys()));
        const line = d3.line().x(d => x(d.year)).y(d => y(d.value));

        Array.from(byProv.entries()).forEach(([k, arr]) => {
            svg.append('path').datum(arr).attr('fill', 'none').attr('stroke', color(k)).attr('stroke-width', 2).attr('d', line);
        });

        const legend = svg.append('g').attr('transform', `translate(0, ${-6})`);
        Array.from(byProv.keys()).forEach((k, i) => {
            const g = legend.append('g').attr('transform', `translate(${i * 160},0)`);
            g.append('rect').attr('width', 12).attr('height', 12).attr('fill', color(k)).attr('rx', 2);
            g.append('text').attr('x', 18).attr('y', 10).style('font-size', '12px').text(k);
        });
    }

    function handleSlideChange(ev) {
        isActive = ev?.detail?.slide === 5;
        if (isActive) render();
    }

    window.addEventListener('slideChanged', handleSlideChange);
}
