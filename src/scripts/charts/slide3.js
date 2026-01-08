import * as d3 from 'd3';

function formatNumber(num) {
    if (!Number.isFinite(num)) return '0';
    return num.toLocaleString('ca-ES');
}

function scatter(containerSel, data, allData, xAccessor, yAccessor, xLabel, yLabel) {
    const container = d3.select(containerSel);
    const margin = { top: 16, right: 16, bottom: 44, left: 56 };
    const containerWidth = container.node()?.getBoundingClientRect().width || 800;
    const width = Math.max(600, containerWidth) - margin.left - margin.right;
    const height = 360 - margin.top - margin.bottom;

    container.html('');
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const xs = data.map(xAccessor).filter(Number.isFinite);
    const ys = data.map(yAccessor).filter(Number.isFinite);
    if (xs.length === 0 || ys.length === 0) {
        container.append('p').style('text-align', 'center').style('padding', '1rem').text('No hi ha dades per aquesta selecció.');
        return;
    }

    // Calcular dominis basats en totes les dades per coherència entre diferents crides
    const allXs = allData.map(xAccessor).filter(Number.isFinite);
    const allYs = allData.map(yAccessor).filter(Number.isFinite);

    const x = d3.scaleLinear().domain(d3.extent(allXs)).nice().range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(allYs) || 1]).nice().range([height, 0]);

    svg.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x));
    svg.append('g').call(d3.axisLeft(y));

    svg.append('text').attr('x', width / 2).attr('y', height + 36).attr('text-anchor', 'middle').attr('fill', '#333').text(xLabel);
    svg.append('text').attr('x', -height / 2).attr('y', -44).attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').attr('fill', '#333').text(yLabel);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    // Creació del tooltip
    let tooltip = d3.select('body').select('.tooltip');
    if (tooltip.empty()) {
        tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
    }

    svg.selectAll('circle')
        .data(data)
        .enter().append('circle')
        .attr('cx', d => x(xAccessor(d)))
        .attr('cy', d => y(yAccessor(d)))
        .attr('r', d => Math.max(3, Math.min(10, Math.sqrt((d.poblacio || 0) / 5000))))
        .attr('fill', d => color(d.provincia))
        .attr('opacity', 0.8)
        .on('mousemove', (event, d) => {
            const xVal = xAccessor(d);
            const yVal = yAccessor(d);
            tooltip
                .style('opacity', 1)
                .style('left', `${event.pageX + 12}px`)
                .style('top', `${event.pageY - 12}px`)
                .html(`
                    <div class="tooltip-title">${d.comarca}</div>
                    <div class="tooltip-content">
                        <div><strong>Província:</strong> ${d.provincia}</div>
                        <div><strong>${xLabel}:</strong> ${xVal.toFixed(2)}%</div>
                        <div><strong>${yLabel}:</strong> ${yVal.toFixed(2)}</div>
                        <div><strong>Població:</strong> ${formatNumber(d.poblacio)}</div>
                        <div><strong>Any:</strong> ${d.any}</div>
                    </div>
                `);
        })
        .on('mouseleave', () => {
            tooltip.style('opacity', 0);
        });

    // Per trobar i etiquetar el punt amb el percentatge més alt
    let maxIndex = -1;
    let maxPercentage = -Infinity;
    data.forEach((d, i) => {
        const val = xAccessor(d);
        if (Number.isFinite(val) && val > maxPercentage) {
            maxPercentage = val;
            maxIndex = i;
        }
    });

    if (maxIndex !== -1) {
        const maxData = data[maxIndex];
        const cx = x(maxPercentage);
        const cy = y(yAccessor(maxData));
        const metricValue = yAccessor(maxData);

        // Afegir una etiqueta a sota del punt
        const label = svg.append('g');

        // Nom de la comarca
        label.append('text')
            .attr('x', cx)
            .attr('y', cy + 18)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .attr('fill', '#333')
            .style('pointer-events', 'none')
            .text(maxData.comarca);

        // Percentatge de població i valor de la mètrica
        // label.append('text')
        //     .attr('x', cx)
        //     .attr('y', cy + 32)
        //     .attr('text-anchor', 'middle')
        //     .style('font-size', '11px')
        //     .attr('fill', '#666')
        //     .style('pointer-events', 'none')
        //     .text(`${maxPercentage.toFixed(2)}% • ${metricValue.toFixed(2)}`);
    }
}

const metricAccessors = {
    selectiva: d => d.kg_selectiva_per_hab_dia,
    no_selectiva: d => d.kg_no_selectiva_per_hab_dia,
    total: d => d.kg_per_hab_dia,
    percent_selectiva: d => {
        const total = (d.tones_recollida_selectiva || 0) + (d.tones_recollida_no_selectiva || 0);
        return total > 0 ? (d.tones_recollida_selectiva / total) * 100 : 0;
    }
};

const metricLabels = {
    selectiva: 'Recollida selectiva kg/hab./dia',
    no_selectiva: 'Rebuig kg/hab./dia',
    total: 'Total kg/hab./dia',
    percent_selectiva: 'Percentatge recollida selectiva (%)'
};

function getAgeRanges() {
    return [
        { label: '0-15', male: 'poblacio_masculina_0_15', female: 'poblacio_femenina_0_15' },
        { label: '16-24', male: 'poblacio_masculina_16_24', female: 'poblacio_femenina_16_24' },
        { label: '25-44', male: 'poblacio_masculina_25_44', female: 'poblacio_femenina_25_44' },
        { label: '45-64', male: 'poblacio_masculina_45_64', female: 'poblacio_femenina_45_64' },
        { label: '64+', male: 'poblacio_masculina_64_120', female: 'poblacio_femenina_64_120' }
    ];
}

function aggregateDataForPyramid(data, year, provincia, comarca) {
    const filtered = data.filter(d =>
        d.any === year &&
        (provincia === 'Totes' || d.provincia === provincia) &&
        (comarca === 'Totes' || d.comarca === comarca)
    );

    const ageRanges = getAgeRanges();
    const pyramidData = ageRanges.map(range => ({
        label: range.label,
        male: filtered.reduce((sum, d) => sum + (d[range.male] || 0), 0),
        female: filtered.reduce((sum, d) => sum + (d[range.female] || 0), 0)
    }));

    return pyramidData;
}

function drawPyramid(data, year, provincia, comarca) {
    const pyramidData = aggregateDataForPyramid(data, year, provincia, comarca);
    const container = d3.select('#chart-3-population-pyramid');
    const margin = { top: 20, right: 20, bottom: 36, left: 60 };
    const containerWidth = container.node()?.getBoundingClientRect().width || 800;
    const width = Math.max(600, containerWidth) - margin.left - margin.right;
    const height = 380 - margin.top - margin.bottom;

    container.html('');
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const maxValue = Math.max(...pyramidData.flatMap(d => [d.male, d.female]));
    const x = d3.scaleLinear()
        .domain([-maxValue, maxValue])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(pyramidData.map(d => d.label))
        .range([height, 0])
        .padding(0.3);

    // Dibuixar barres homes (esquerra)
    svg.selectAll('.bar-male')
        .data(pyramidData)
        .enter()
        .append('rect')
        .attr('class', 'bar-male')
        .attr('x', d => x(-d.male))
        .attr('y', d => y(d.label))
        .attr('width', d => x(0) - x(-d.male))
        .attr('height', y.bandwidth())
        .attr('fill', '#000078')
        .attr('opacity', 0.8)
        .append('title')
        .text(d => `Homes ${d.label}: ${formatNumber(d.male)}`);

    // Dibuixar barres dones (dreta)
    svg.selectAll('.bar-female')
        .data(pyramidData)
        .enter()
        .append('rect')
        .attr('class', 'bar-female')
        .attr('x', d => x(0))
        .attr('y', d => y(d.label))
        .attr('width', d => x(d.female) - x(0))
        .attr('height', y.bandwidth())
        .attr('fill', '#73EDFF')
        .attr('opacity', 0.8)
        .append('title')
        .text(d => `Dones ${d.label}: ${formatNumber(d.female)}`);

    // Eix Y (etiquetes d'edat)
    svg.append('g')
        .call(d3.axisLeft(y));

    // Eix X
    const xAxis = d3.axisBottom(x)
        .tickFormat(d => Math.abs(d) > 0 ? Math.abs(d).toLocaleString('ca-ES') : '0');

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);

    // Etiquetes
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 32)
        .attr('text-anchor', 'middle')
        .attr('fill', '#333')
        .text('Població');

    svg.append('text')
        .attr('x', -height / 2)
        .attr('y', -48)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .attr('fill', '#333')
        .text('Rang d\'edats');

    // Llegenda
    const legend = svg.append('g')
        .attr('transform', `translate(0, -8)`);

    legend.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', '#000078')
        .attr('opacity', 0.8)
        .attr('rx', 2);

    legend.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .style('font-size', '12px')
        .text('Homes');

    legend.append('rect')
        .attr('x', 100)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', '#73EDFF')
        .attr('opacity', 0.8)
        .attr('rx', 2);

    legend.append('text')
        .attr('x', 118)
        .attr('y', 10)
        .style('font-size', '12px')
        .text('Dones');
}

function drawDemographicPatterns(data, provincia, metric) {
    const metricAccessor = metricAccessors[metric];
    const metricLabel = metricLabels[metric];

    const ageRanges = [
        {
            label: '0-15',
            male: 'poblacio_masculina_0_15',
            female: 'poblacio_femenina_0_15',
            container: '#chart-3-age0-15',
            yearInputSel: '#age0-15-year',
            yearDisplaySel: '#age0-15-year-display'
        },
        {
            label: '16-24',
            male: 'poblacio_masculina_16_24',
            female: 'poblacio_femenina_16_24',
            container: '#chart-3-age16-24',
            yearInputSel: '#age16-24-year',
            yearDisplaySel: '#age16-24-year-display'
        },
        {
            label: '25-44',
            male: 'poblacio_masculina_25_44',
            female: 'poblacio_femenina_25_44',
            container: '#chart-3-age25-44',
            yearInputSel: '#age25-44-year',
            yearDisplaySel: '#age25-44-year-display'
        },
        {
            label: '45-64',
            male: 'poblacio_masculina_45_64',
            female: 'poblacio_femenina_45_64',
            container: '#chart-3-age45-64',
            yearInputSel: '#age45-64-year',
            yearDisplaySel: '#age45-64-year-display'
        },
        {
            label: '64+',
            male: 'poblacio_masculina_64_120',
            female: 'poblacio_femenina_64_120',
            container: '#chart-3-age64plus',
            yearInputSel: '#age64plus-year',
            yearDisplaySel: '#age64plus-year-display'
        }
    ];

    ageRanges.forEach(range => {
        const yearCtrl = d3.select(range.yearInputSel);
        const yearDisplay = d3.select(range.yearDisplaySel);
        const yearVal = +yearCtrl.property('value');
        yearDisplay.text(yearVal);

        // Preparar totes les dades per al càlcul dels dominis globals
        const allDataForDomain = data
            .filter(d => (provincia === 'Totes' || d.provincia === provincia))
            .map(d => ({
                ...d,
                pctAge: d.poblacio > 0 ? ((d[range.male] + d[range.female]) / d.poblacio) * 100 : NaN
            }));

        // Prepara les dades filtrant per any i província/comarca
        const rows = data
            .filter(d => d.any === yearVal && (provincia === 'Totes' || d.provincia === provincia))
            .map(d => ({
                ...d,
                pctAge: d.poblacio > 0 ? ((d[range.male] + d[range.female]) / d.poblacio) * 100 : NaN
            }));

        scatter(range.container, rows, allDataForDomain, d => d.pctAge, metricAccessor, `% població ${range.label}`, metricLabel);
    });
}

export function createSlide3(data) {
    // Obtenir tots els controls de la secció de la piràmide de població
    const yearCtrl = d3.select('#population-pyramid-year');
    const yearDisp = d3.select('#population-pyramid-year-display');
    const provCtrl = d3.select('#population-pyramid-provincia');
    const comarcaCtrl = d3.select('#population-pyramid-comarca');
    const metricCtrl = d3.select('#demo-patterns-metric');

    let isActive = false;

    function updateComarques() {
        const selectedProvincia = provCtrl.property('value') || 'Totes';
        let comarques = [];

        if (selectedProvincia === 'Totes') {
            comarques = Array.from(new Set(data.map(d => d.comarca))).sort();
        } else {
            comarques = Array.from(new Set(data.filter(d => d.provincia === selectedProvincia).map(d => d.comarca))).sort();
        }

        comarcaCtrl.html('<option value="Totes">Totes</option>')
            .selectAll('option')
            .data(comarques)
            .enter()
            .append('option')
            .attr('value', d => d)
            .text(d => d);

        comarcaCtrl.property('value', 'Totes');
    }

    function renderAll() {
        const year = +yearCtrl.property('value');
        const provincia = provCtrl.property('value') || 'Totes';
        const comarca = comarcaCtrl.property('value') || 'Totes';
        const metric = metricCtrl.property('value') || 'selectiva';

        yearDisp.text(year);
        drawPyramid(data, year, provincia, comarca);
        drawDemographicPatterns(data, provincia, metric);
    }

    function renderIfActive() {
        if (!isActive) return;
        renderAll();
    }

    function handleSlideChange(ev) {
        isActive = ev?.detail?.slide === 3;
        if (isActive) renderAll();
    }

    window.addEventListener('slideChanged', handleSlideChange);
    yearCtrl.on('input', renderIfActive);
    provCtrl.on('change', () => {
        updateComarques();
        renderIfActive();
    });
    comarcaCtrl.on('change', renderIfActive);
    metricCtrl.on('change', renderIfActive);

    // Controls d'any per rang d'edat
    const ageYearControls = [
        '#age0-15-year',
        '#age16-24-year',
        '#age25-44-year',
        '#age45-64-year',
        '#age64plus-year'
    ];

    ageYearControls.forEach(sel => {
        const ctrl = d3.select(sel);
        if (!ctrl.empty()) {
            ctrl.on('input', renderIfActive);
            ctrl.property('value', 2006);
        }
    });

    // Inicialitzar
    yearCtrl.property('value', 2006);
    provCtrl.property('value', 'Totes');
    metricCtrl.property('value', 'selectiva');
    updateComarques();
}
