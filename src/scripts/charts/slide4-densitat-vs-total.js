import * as d3 from 'd3';

function formatFloat(v, d = 2) {
    return Number.isFinite(v) ? v.toLocaleString('ca-ES', { minimumFractionDigits: d, maximumFractionDigits: d }) : 'N/D';
}

function scatterDensity(containerSel, rows, xAcc, yAcc, xLabel, yLabel, xDomain, yDomain) {
    const container = d3.select(containerSel);
    const margin = { top: 16, right: 16, bottom: 44, left: 60 };
    const containerWidth = container.node()?.getBoundingClientRect().width || 800;
    const width = Math.max(600, containerWidth) - margin.left - margin.right;
    const height = 360 - margin.top - margin.bottom;

    container.html('');
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Filtrar files amb ambdós valors vàlids
    const validRows = rows.filter(row => {
        const xVal = xAcc(row);
        const yVal = yAcc(row);
        return Number.isFinite(xVal) && Number.isFinite(yVal) && xVal > 0;
    });

    if (!validRows.length) {
        container.append('p').style('text-align', 'center').style('padding', '1rem').text('No hi ha dades per aquesta selecció.');
        return;
    }

    const xs = validRows.map(xAcc).filter(Number.isFinite);
    const ys = validRows.map(yAcc).filter(Number.isFinite);

    const x = d3.scaleLog()
        .domain(xDomain || [Math.max(0.1, d3.min(xs)), d3.max(xs)])
        .range([0, width]);
    const y = d3.scaleLinear()
        .domain(yDomain || [0, d3.max(ys)])
        .nice()
        .range([height, 0]);

    svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(6, '~g'));
    svg.append('g').call(d3.axisLeft(y));

    svg.append('text').attr('x', width / 2).attr('y', height + 36).attr('text-anchor', 'middle').attr('fill', '#333').text(xLabel);
    svg.append('text').attr('x', -height / 2).attr('y', -48).attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').attr('fill', '#333').text(yLabel);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    // Crea o selecciona el tooltip
    let tooltip = d3.select('body').select('.tooltip');
    if (tooltip.empty()) {
        tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
    }

    svg.selectAll('circle')
        .data(validRows)
        .enter().append('circle')
        .attr('cx', d => x(xAcc(d)))
        .attr('cy', d => y(yAcc(d)))
        .attr('r', d => Math.max(3, Math.min(10, Math.sqrt((d.poblacio || 0) / 5000))))
        .attr('fill', d => color(d.provincia))
        .attr('opacity', 0.8)
        .on('mousemove', (event, d) => {
            const dens = (d.poblacio || 0) / (d.superficie_km2 || 1);
            const yVal = yAcc(d);
            tooltip
                .style('opacity', 1)
                .style('left', `${event.pageX + 12}px`)
                .style('top', `${event.pageY - 12}px`)
                .html(`
                    <div class="tooltip-title">${d.comarca}</div>
                    <div class="tooltip-content">
                        <div><strong>Província:</strong> ${d.provincia}</div>
                        <div><strong>Densitat:</strong> ${formatFloat(dens, 1)} hab/km²</div>
                        <div><strong>${yLabel}:</strong> ${formatFloat(yVal, 2)}</div>
                        <div><strong>Població:</strong> ${(d.poblacio || 0).toLocaleString('ca-ES')}</div>
                        <div><strong>Any:</strong> ${d.any}</div>
                    </div>
                `);
        })
        .on('mouseleave', () => {
            tooltip.style('opacity', 0);
        });
}

export function createSlide4DensitatVsTotal(data) {
    const yearCtrl = d3.select('#pressure-year');
    const yearDisp = d3.select('#pressure-year-display');
    const provCtrl = d3.select('#pressure-provincia');
    const metricCtrl = d3.select('#pressure-metric');
    let isActive = false;

    // Definir mètriques
    const metrics = {
        'kg_per_hab_dia': {
            label: 'Total kg/hab./dia',
            accessor: d => d.kg_per_hab_dia
        },
        'percentatge_selectiva': {
            label: 'Percentatge recollida selectiva',
            accessor: d => d.percentatge_selectiva
        }
    };

    // Domini global per mantenir escales consistents
    const allRows = data.map(d => ({
        ...d,
        dens: (d.poblacio || 0) / (d.superficie_km2 || 1)
    }));
    const allXs = allRows.map(r => r.dens).filter(Number.isFinite);
    const globalXDomain = [Math.max(0.1, d3.min(allXs)), d3.max(allXs)];

    // Calcular dominis Y globals per cada mètrica
    const globalYDomains = {};
    Object.keys(metrics).forEach(key => {
        const allYs = allRows.map(r => metrics[key].accessor(r)).filter(Number.isFinite);
        globalYDomains[key] = [0, d3.max(allYs)];
    });

    function filter(year, provincia) {
        return data.filter(d => d.any === year && (provincia === 'Totes' || d.provincia === provincia));
    }

    function render() {
        const y = +yearCtrl.property('value');
        yearDisp.text(y);
        const p = provCtrl.property('value') || 'Totes';
        const metricKey = metricCtrl.property('value') || 'kg_per_hab_dia';
        const metric = metrics[metricKey];
        const rows = filter(y, p).map(d => ({
            ...d,
            dens: (d.poblacio || 0) / (d.superficie_km2 || 1)
        }));
        scatterDensity('#chart-4-0', rows, d => d.dens, metric.accessor, 'Densitat (hab/km²)', metric.label, globalXDomain, globalYDomains[metricKey]);
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
    metricCtrl.on('change', renderIfActive);

    yearCtrl.property('value', 2006);
    provCtrl.property('value', 'Totes');
    metricCtrl.property('value', 'kg_per_hab_dia');
}
