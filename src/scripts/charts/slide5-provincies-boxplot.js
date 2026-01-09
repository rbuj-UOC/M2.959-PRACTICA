import * as d3 from 'd3';

export function createSlide5ProvinciesBoxplot(data) {
    const container = d3.select('#chart-5-boxplots');
    const metricSelect = d3.select('#violin-metric');
    const yearSlider = d3.select('#violin-year');
    const yearDisplay = d3.select('#violin-year-display');
    const yearLabel = d3.select('#violin-year-label');

    // Configurar el control d'any - inicialment deshabilitat per mètriques constants
    yearSlider.property('disabled', true);
    yearSlider.property('value', 2006);
    yearDisplay.text(2006);

    const metrics = {
        'poblacio': {
            label: 'Població de les comarques (habitants)',
            accessor: d => d.poblacio,
            format: d3.format(','),
            yearDependent: true
        },
        'densitat': {
            label: 'Densitat demogràfica de les comarques (hab/km²)',
            accessor: d => d.poblacio / d.superficie_km2,
            format: d3.format('.1f'),
            yearDependent: true
        },
        'superficie': {
            label: 'Superfície de les comarques (km²)',
            accessor: d => d.superficie_km2,
            format: d3.format(','),
            yearDependent: false
        },
        'tones_selectiva': {
            label: 'Recollida selectiva de les comarques (tones)',
            accessor: d => d.tones_recollida_selectiva,
            format: d3.format(','),
            yearDependent: true
        },
        'tones_no_selectiva': {
            label: 'Recollida no selectiva de les comarques (tones)',
            accessor: d => d.tones_recollida_no_selectiva,
            format: d3.format(','),
            yearDependent: true
        }
    };

    function drawChart() {
        const selectedMetric = metricSelect.property('value');
        const metricInfo = metrics[selectedMetric];
        const selectedYear = +yearSlider.property('value');

        // Habilitar/deshabilitar el control d'any segons la mètrica
        const sliderDisabled = !metricInfo.yearDependent;
        yearSlider.property('disabled', sliderDisabled);
        yearSlider.style('display', sliderDisabled ? 'none' : 'block');
        yearLabel.style('display', sliderDisabled ? 'none' : 'block');

        // Filtrar dades per l'any seleccionat (o usar l'últim any disponible si és constant)
        const year = metricInfo.yearDependent ? selectedYear : 2021;
        const filteredData = data.filter(d => d.any === year && metricInfo.accessor(d) > 0);

        // Agrupar per província
        const provincies = ['Barcelona', 'Girona', 'Lleida', 'Tarragona'];
        const dataByProvincia = provincies.map(provincia => ({
            provincia,
            values: filteredData
                .filter(d => d.provincia === provincia)
                .map(metricInfo.accessor)
                .filter(v => Number.isFinite(v))
        }));

        container.html('');

        const margin = { top: 40, right: 50, bottom: 60, left: 80 };
        const containerWidth = container.node()?.getBoundingClientRect().width || 800;
        const width = Math.max(600, containerWidth) - margin.left - margin.right;
        const height = 500;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Crear escales
        const x = d3.scaleBand()
            .domain(provincies)
            .range([0, width])
            .padding(0.2);

        // Trobar el rang global de valors
        const allValues = dataByProvincia.flatMap(d => d.values);
        const yMin = d3.min(allValues);
        const yMax = d3.max(allValues);

        // Escala Y: logarítmica per a 'poblacio' i 'densitat' amb ticks en potències de 10; lineal per a la resta
        const useLogY = selectedMetric === 'poblacio' || selectedMetric === 'densitat';
        let y;
        if (useLogY) {
            const minVal = (Number.isFinite(yMin) && yMin > 0) ? yMin : 1;
            const maxVal = (Number.isFinite(yMax) && yMax > 0) ? yMax : 10;
            let lowerPow = Math.pow(10, Math.floor(Math.log10(minVal)));
            let upperPow = Math.pow(10, Math.ceil(Math.log10(maxVal)));
            if (!(upperPow > lowerPow)) upperPow = lowerPow * 10;
            y = d3.scaleLog()
                .domain([lowerPow, upperPow])
                .range([height, 0]);
        } else {
            const y0 = Number.isFinite(yMin) ? yMin : 0;
            const y1 = Number.isFinite(yMax) ? yMax : 100;
            y = d3.scaleLinear()
                .domain([y0 * 0.95, y1 * 1.05])
                .range([height, 0])
                .nice();
        }

        // Color scale
        const colorScale = d3.scaleOrdinal()
            .domain(provincies)
            .range(['#E31B23', '#FFC702', '#7AB800', '#006699']); // Barcelona (vermell), Girona (groc), Lleida (verd), Tarragona (blau) - Paleta UOC

        // Dibuixar cada boxplot
        dataByProvincia.forEach(({ provincia, values }) => {
            if (values.length === 0) return;

            const xPos = x(provincia);
            const boxWidth = x.bandwidth() * 0.6;
            const boxX = xPos + x.bandwidth() / 2;

            // Calcular estadístiques
            const sortedValues = values.slice().sort(d3.ascending);
            const q1 = d3.quantile(sortedValues, 0.25);
            const median = d3.quantile(sortedValues, 0.5);
            const q3 = d3.quantile(sortedValues, 0.75);
            const iqr = q3 - q1;

            // Whiskers: 1.5 * IQR
            const lowerWhisker = Math.max(d3.min(sortedValues), q1 - 1.5 * iqr);
            const upperWhisker = Math.min(d3.max(sortedValues), q3 + 1.5 * iqr);

            // Outliers
            const outliers = sortedValues.filter(v => v < lowerWhisker || v > upperWhisker);

            // Línia inferior del whisker
            svg.append('line')
                .attr('x1', boxX)
                .attr('x2', boxX)
                .attr('y1', y(q1))
                .attr('y2', y(lowerWhisker))
                .attr('stroke', '#000078')
                .attr('stroke-width', 1.5);

            // Cap inferior del whisker
            svg.append('line')
                .attr('x1', boxX - boxWidth / 4)
                .attr('x2', boxX + boxWidth / 4)
                .attr('y1', y(lowerWhisker))
                .attr('y2', y(lowerWhisker))
                .attr('stroke', '#000078')
                .attr('stroke-width', 1.5);

            // Línia superior del whisker
            svg.append('line')
                .attr('x1', boxX)
                .attr('x2', boxX)
                .attr('y1', y(q3))
                .attr('y2', y(upperWhisker))
                .attr('stroke', '#000078')
                .attr('stroke-width', 1.5);

            // Cap superior del whisker
            svg.append('line')
                .attr('x1', boxX - boxWidth / 4)
                .attr('x2', boxX + boxWidth / 4)
                .attr('y1', y(upperWhisker))
                .attr('y2', y(upperWhisker))
                .attr('stroke', '#000078')
                .attr('stroke-width', 1.5);

            // Caixa (Q1-Q3)
            svg.append('rect')
                .attr('x', boxX - boxWidth / 2)
                .attr('y', y(q3))
                .attr('width', boxWidth)
                .attr('height', y(q1) - y(q3))
                .attr('fill', colorScale(provincia))
                .attr('opacity', 0.7)
                .attr('stroke', '#000078')
                .attr('stroke-width', 2);

            // Mediana
            svg.append('line')
                .attr('x1', boxX - boxWidth / 2)
                .attr('x2', boxX + boxWidth / 2)
                .attr('y1', y(median))
                .attr('y2', y(median))
                .attr('stroke', '#000078')
                .attr('stroke-width', 3);

            // Outliers
            svg.selectAll(`.outlier-${provincia}`)
                .data(outliers)
                .enter()
                .append('circle')
                .attr('class', `outlier-${provincia}`)
                .attr('cx', boxX)
                .attr('cy', d => y(d))
                .attr('r', 3)
                .attr('fill', colorScale(provincia))
                .attr('opacity', 0.6)
                .attr('stroke', '#000078')
                .attr('stroke-width', 1);
        });

        // Afegir eixos
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('font-size', '12px');

        const formatLocale = (v) => {
            if (!Number.isFinite(v)) return '';
            const opts = selectedMetric === 'densitat'
                ? { minimumFractionDigits: 1, maximumFractionDigits: 1 }
                : { maximumFractionDigits: 0 };
            return v.toLocaleString('ca-ES', opts);
        };

        if (useLogY) {
            const [d0, d1] = y.domain();
            const e0 = Math.round(Math.log10(d0));
            const e1 = Math.round(Math.log10(d1));
            const tickVals = d3.range(e0, e1 + 1).map(e => Math.pow(10, e));
            svg.append('g')
                .call(d3.axisLeft(y).tickValues(tickVals).tickFormat(formatLocale));
        } else {
            svg.append('g')
                .call(d3.axisLeft(y).tickFormat(formatLocale));
        }

        // Etiquetes dels eixos
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + 45)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('fill', '#000078')
            .text('Província');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -60)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('fill', '#000078')
            .text(metricInfo.label);

        // Títol
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -15)
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .attr('font-weight', 'bold')
            .style('fill', '#000078')
            .text(`Distribució de ${metricInfo.label} per província`);
    }

    // Event listeners
    metricSelect.on('change', drawChart);
    yearSlider.on('input', function () {
        yearDisplay.text(this.value);
        drawChart();
    });

    // Dibuixar gràfic inicial
    drawChart();
}
