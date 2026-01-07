import * as d3 from 'd3';

export function createDemographicChart(data) {
    const container = d3.select('#chart-demographic');
    const provinciaSelect = d3.select('#demographic-provincia');
    const comarquesContainer = d3.select('#demographic-comarques');

    // Format numèric amb separador de milers
    const formatNumber = (value, decimals = 0) => {
        const fixed = Number(value).toFixed(decimals);
        const [intPart, decPart] = fixed.split('.');
        const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return decimals > 0 ? `${withThousands},${decPart}` : withThousands;
    };

    // Agrupar dades per província i comarca per any
    const dataByProvinciaComarca = {};

    data.forEach(d => {
        if (!dataByProvinciaComarca[d.provincia]) {
            dataByProvinciaComarca[d.provincia] = {};
        }
        if (!dataByProvinciaComarca[d.provincia][d.comarca]) {
            dataByProvinciaComarca[d.provincia][d.comarca] = {};
        }
        const year = d.any;
        if (!dataByProvinciaComarca[d.provincia][d.comarca][year]) {
            dataByProvinciaComarca[d.provincia][d.comarca][year] = d.poblacio_total;
        }
    });

    // Obtenir les comarques úniques per província
    const getComarques = (provincia) => {
        return Object.keys(dataByProvinciaComarca[provincia] || {}).sort();
    };

    // Actualitzar les comarques disponibles
    function updateComarques(provincia) {
        comarquesContainer.html('');

        // Si la província és "Totes", no es mostren les caselles
        if (provincia === 'Totes') {
            return;
        }

        const comarques = getComarques(provincia);

        comarques.forEach(comarca => {
            const label = comarquesContainer.append('label')
                .style('display', 'block')
                .style('margin', '0.5rem 0')
                .style('cursor', 'pointer');

            const checkbox = label.append('input')
                .attr('type', 'checkbox')
                .attr('value', comarca)
                .attr('id', `comarca-${comarca}`)
                .attr('data-comarca', comarca)
                .style('margin-right', '0.5rem');

            label.append('span')
                .text(comarca);
        });

        // Afegir l'event listener a totes les caselles de selecció
        comarquesContainer.selectAll('input[type="checkbox"]')
            .on('change', render);
    }

    function render() {
        const provincia = provinciaSelect.property('value');

        let chartData = [];

        // Obtenir els anys disponibles (2006-2021)
        const years = Array.from({ length: 16 }, (_, i) => 2006 + i);

        // Si es "Totes", mostrem la suma de la població de tota Catalunya
        if (provincia === 'Totes') {
            const values = years.map(year => {
                let totalPopulation = 0;

                // Sumar la població de totes les comarques de totes les províncies
                Object.keys(dataByProvinciaComarca).forEach(prov => {
                    Object.keys(dataByProvinciaComarca[prov]).forEach(comarca => {
                        totalPopulation += dataByProvinciaComarca[prov][comarca][year] || 0;
                    });
                });

                return { year, population: totalPopulation };
            });

            chartData = [{ comarca: 'Catalunya', values }];
        } else {
            // Obtenir les comarques sel·leccionades
            let selectedComarques = comarquesContainer.selectAll('input[type="checkbox"]:checked')
                .nodes()
                .map(node => node.value);

            // Si no hi ha cap comarca sel·leccionada, sel·leccionar totes de la província
            if (selectedComarques.length === 0) {
                selectedComarques = getComarques(provincia);
            }

            // Preparar dades per al gràfic
            chartData = selectedComarques.map(comarca => {
                const values = years.map(year => ({
                    year,
                    population: dataByProvinciaComarca[provincia][comarca][year] || 0
                }));
                return { comarca, values };
            });
        }

        // Dimensions
        const margin = { top: 20, right: 30, bottom: 30, left: 60 };
        const width = container.node().clientWidth - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Neteja
        container.html('');

        // SVG
        const svg = container
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Escales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(years))
            .range([0, width]);

        const yMax = d3.max(chartData, d => d3.max(d.values, v => v.population));
        const yScale = d3.scaleLinear()
            .domain([0, yMax])
            .range([height, 0]);

        const colors = d3.scaleOrdinal(d3.schemeCategory10);

        // Generador de línies
        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.population));

        // Eix X
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
            .append('text')
            .attr('x', width / 2)
            .attr('y', 30)
            .attr('fill', '#333')
            .attr('text-anchor', 'middle')
            .text('Any');

        // Eix Y
        svg.append('g')
            .call(d3.axisLeft(yScale).tickFormat(d => formatNumber(d)))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -45)
            .attr('fill', '#333')
            .attr('text-anchor', 'middle')
            .text('Població');

        // Línies
        chartData.forEach((d, i) => {
            svg.append('path')
                .datum(d.values)
                .attr('fill', 'none')
                .attr('stroke', colors(i))
                .attr('stroke-width', 2)
                .attr('d', line);
        });

        // Llegenda a sota de l'eix X, alineada verticalment
        const legend = svg.selectAll('.legend')
            .data(chartData)
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', (d, i) => `translate(0, ${height + 50 + i * 20})`);

        legend.append('rect')
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', (d, i) => colors(i));

        legend.append('text')
            .attr('x', 15)
            .attr('y', 8)
            .attr('font-size', '12px')
            .text(d => d.comarca);
    }

    // Inicialitzar amb "Totes"
    const firstProvincia = 'Totes';
    provinciaSelect.property('value', firstProvincia);
    updateComarques(firstProvincia);

    // Event listener per al canvi de província
    provinciaSelect.on('change', function () {
        const provincia = d3.select(this).property('value');
        updateComarques(provincia);
        render();
    });

    // Renderització inicial
    render();
}

