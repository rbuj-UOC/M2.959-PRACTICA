import * as d3 from 'd3';

function lineChart(containerSel, data, topN) {
    const container = d3.select(containerSel);
    const margin = { top: 20, right: 200, bottom: 40, left: 60 };
    const containerWidth = container.node()?.getBoundingClientRect().width || 800;
    const width = Math.max(600, containerWidth) - margin.left - margin.right;
    const height = 400;

    // Calculate improvement for each comarca (2021 - 2006)
    const comarques = {};
    data.forEach(d => {
        if (!comarques[d.comarca]) {
            comarques[d.comarca] = { comarca: d.comarca, years: {} };
        }
        comarques[d.comarca].years[d.any] = d.percentatge_selectiva;
    });

    // Calculate improvement
    const improvements = Object.values(comarques)
        .map(d => ({
            comarca: d.comarca,
            improvement: (d.years[2021] || 0) - (d.years[2006] || 0),
            years: d.years
        }))
        .filter(d => Number.isFinite(d.improvement))
        .sort((a, b) => b.improvement - a.improvement)
        .slice(0, topN);

    container.html('');
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const years = [2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021];

    const x = d3.scaleLinear()
        .domain([2006, 2021])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    // Create color scale
    const colors = d3.schemeCategory10;
    const colorScale = d3.scaleOrdinal()
        .domain(improvements.map((_, i) => i))
        .range(colors);

    // Draw lines
    const line = d3.line()
        .x(d => x(+d.year))
        .y(d => y(d.value));

    improvements.forEach((comarca, idx) => {
        const lineData = years
            .map(year => ({
                year,
                value: comarca.years[year]
            }))
            .filter(d => Number.isFinite(d.value));

        if (lineData.length > 0) {
            svg.append('path')
                .datum(lineData)
                .attr('fill', 'none')
                .attr('stroke', colorScale(idx))
                .attr('stroke-width', 2.5)
                .attr('d', line);

            // Add label at the right
            const lastPoint = lineData[lineData.length - 1];
            svg.append('text')
                .attr('x', width + 10)
                .attr('y', y(lastPoint.value) + 4)
                .attr('font-size', '12px')
                .attr('fill', colorScale(idx))
                .text(comarca.comarca);
        }
    });

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format('d')));

    svg.append('g')
        .call(d3.axisLeft(y).ticks(5));

    // Add axis labels
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 32)
        .attr('text-anchor', 'middle')
        .attr('fill', '#333')
        .text('Any');

    svg.append('text')
        .attr('x', -height / 2)
        .attr('y', -48)
        .attr('text-anchor', 'middle')
        .attr('fill', '#333')
        .attr('transform', 'rotate(-90)')
        .text('Percentatge selectiva (%)');
}

export function createSlide5TopImprovementLines(data) {
    const countCtrl = d3.select('#top-comarques-count');
    const countDisp = d3.select('#top-comarques-display');
    let isActive = false;

    function render() {
        const n = +countCtrl.property('value');
        countDisp.text(n);
        lineChart('#chart-5-1', data, n);
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
    countCtrl.on('input', renderIfActive);

    countCtrl.property('value', 5);
}
