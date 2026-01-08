import * as d3 from 'd3';

// Format de nombres
const formatNumber = (num, decimals = 2) => {
    if (!Number.isFinite(num)) return 'N/D';
    return num.toLocaleString('ca-ES', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

const metricOptions = {
    recollida_selectiva_t: {
        label: 'Reciclatge kg/hab',
        accessor: d => d.kg_selectiva_per_hab_dia,
        format: v => Number.isFinite(v) ? `${formatNumber(v, 2)} kg` : 'N/D'
    },
    recollida_no_selectiva_t: {
        label: 'Rebuig kg/hab',
        accessor: d => d.kg_no_selectiva_per_hab_dia,
        format: v => Number.isFinite(v) ? `${formatNumber(v, 2)} kg` : 'N/D'
    },
    kg_per_hab_dia: {
        label: 'Total kg/hab./dia',
        accessor: d => d.kg_per_hab_dia,
        format: v => Number.isFinite(v) ? `${formatNumber(v, 2)} kg` : 'N/D'
    },
    percentatge_selectiva: {
        label: 'Percentatge recollida selectiva',
        accessor: d => {
            const total = (d.tones_recollida_selectiva || 0) + (d.tones_recollida_no_selectiva || 0);
            return total > 0 ? (d.tones_recollida_selectiva / total) * 100 : 0;
        },
        format: v => Number.isFinite(v) ? `${formatNumber(v, 1)} %` : 'N/D'
    }
};

export function createSlide1MapGeo(csvData, geojson) {
    const container = d3.select('#chart-2-overview');
    if (container.empty()) return;

    const yearRadios = d3.selectAll('input[name="map-geo-year"]');
    const yearDisplay = d3.select('#map-geo-year-display');
    const metricSelect = d3.select('#map-geo-metric-select');
    const provSelect = d3.select('#map-geo-provincia-select');

    // Obtenir els anys disponibles
    const years = Array.from(new Set(csvData.map(d => d.any))).sort();
    const firstYear = years[0];
    const lastYear = years[years.length - 1];

    // Inicialitzar l'any a mostrar
    yearDisplay.text(firstYear);

    const enrichedData = csvData.map(d => ({
        ...d,
        _provNorm: d.provincia ? d.provincia.toLowerCase() : ''
    }));

    const bbox = container.node().getBoundingClientRect();
    const width = bbox.width || 900;
    const height = 710;

    const svg = container.append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g');
    const mapLayer = g.append('g');
    const bubbleLayer = g.append('g');
    const labelLayer = g.append('g');

    // Configurar la projecció per encabir Catalunya
    const initialCenter = [1.7, 41.8];
    const initialScale = 10000;
    const projection = d3.geoMercator()
        .center(initialCenter)
        .scale(initialScale)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath(projection);

    // Comportament del zoom
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);

    // Desar la transformació inicial per al botó de restablir
    const initialTransform = d3.zoomIdentity;

    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    // Dibuixar el mapa de Catalunya
    mapLayer.selectAll('path')
        .data(geojson.features)
        .join('path')
        .attr('d', path)
        .attr('class', 'comarca')
        .attr('fill', 'transparent')
        .attr('stroke', '#73000a')
        .attr('stroke-width', 0.3);

    const formatPopulation = (num) => {
        if (!Number.isFinite(num)) return 'N/D';
        return num.toLocaleString('ca-ES');
    };

    const update = () => {
        const yearSelection = d3.select('input[name="map-geo-year"]:checked').node()?.value || 'first';
        const selectedYear = yearSelection === 'first' ? firstYear : lastYear;
        const metricKey = metricSelect.node()?.value || 'percentatge_selectiva';
        const provinceFilter = (provSelect.node()?.value || 'totes').toLowerCase();
        const metric = metricOptions[metricKey];

        const filtered = enrichedData.filter(d =>
            d.any === selectedYear &&
            (provinceFilter === 'totes' || d._provNorm === provinceFilter)
        );

        const metricValues = filtered.map(metric.accessor).filter(Number.isFinite);
        const popValues = filtered.map(d => d.poblacio || 0).filter(v => v > 0);

        const colorDomain = d3.extent(popValues);
        const colorScale = d3.scaleSequential(d3.interpolateOrRd)
            .domain(colorDomain[0] === undefined ? [0, 1] : [colorDomain[0], colorDomain[1] || colorDomain[0] + 1]);

        const sizeDomain = d3.extent(metricValues);
        const sizeScale = d3.scaleSqrt()
            .domain(sizeDomain[0] === undefined ? [0, 1] : [sizeDomain[0], sizeDomain[1] || sizeDomain[0] + 1])
            .range([4, 26]);

        const bubbles = bubbleLayer.selectAll('circle')
            .data(filtered, d => d.comarca);

        bubbles.exit()
            .transition()
            .duration(250)
            .attr('r', 0)
            .remove();

        const bubblesEnter = bubbles.enter()
            .append('circle')
            .attr('class', 'bubble')
            .attr('cx', d => {
                const coords = projection([d.lon, d.lat]);
                return coords ? coords[0] : 0;
            })
            .attr('cy', d => {
                const coords = projection([d.lon, d.lat]);
                return coords ? coords[1] : 0;
            })
            .attr('r', 0)
            .attr('fill', d => colorScale(d.poblacio || 0))
            .attr('fill-opacity', 0.85)
            .on('mousemove', (event, d) => {
                const metricKey = metricSelect.node()?.value || 'recollida_selectiva_t';
                const currentMetric = metricOptions[metricKey];
                tooltip
                    .style('opacity', 1)
                    .style('left', `${event.pageX + 12}px`)
                    .style('top', `${event.pageY - 12}px`)
                    .html(`
            <div class="tooltip-title">${d.comarca}</div>
            <div class="tooltip-content">
              <div><strong>Província:</strong> ${d.provincia}</div>
              <div><strong>${currentMetric.label}:</strong> ${currentMetric.format(currentMetric.accessor(d))}</div>
              <div><strong>Població:</strong> ${formatPopulation(d.poblacio)}</div>
              <div><strong>Any:</strong> ${d.any}</div>
            </div>
          `);
            })
            .on('mouseleave', () => {
                tooltip.style('opacity', 0);
            });

        bubblesEnter.transition()
            .duration(500)
            .attr('r', d => sizeScale(metric.accessor(d)));

        bubbles.transition()
            .duration(500)
            .attr('cx', d => {
                const coords = projection([d.lon, d.lat]);
                return coords ? coords[0] : 0;
            })
            .attr('cy', d => {
                const coords = projection([d.lon, d.lat]);
                return coords ? coords[1] : 0;
            })
            .attr('r', d => sizeScale(metric.accessor(d)))
            .attr('fill', d => colorScale(d.poblacio || 0))
            .attr('fill-opacity', 0.85);

        // Identificar la bombolla més gran
        const top3 = filtered
            .map(d => ({
                ...d,
                metricValue: metric.accessor(d)
            }))
            .filter(d => Number.isFinite(d.metricValue))
            .sort((a, b) => b.metricValue - a.metricValue)
            .slice(0, 1);

        // Actualitzar les etiquetes per la bombolla més gran
        const labels = labelLayer.selectAll('g.label')
            .data(top3, d => d.comarca);

        labels.exit().remove();

        const labelsEnter = labels.enter()
            .append('g')
            .attr('class', 'label')
            .attr('pointer-events', 'none');

        labelsEnter.append('text')
            .attr('class', 'label-comarca')
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('font-weight', 'bold')
            .attr('fill', '#73000a')
            .attr('stroke', 'white')
            .attr('stroke-width', 3)
            .attr('paint-order', 'stroke');

        labelsEnter.append('text')
            .attr('class', 'label-value')
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('fill', '#73000a')
            .attr('stroke', 'white')
            .attr('stroke-width', 3)
            .attr('paint-order', 'stroke');

        const allLabels = labelsEnter.merge(labels);

        allLabels.select('.label-comarca')
            .attr('x', d => {
                const coords = projection([d.lon, d.lat]);
                return coords ? coords[0] : 0;
            })
            .attr('y', d => {
                const coords = projection([d.lon, d.lat]);
                return coords ? coords[1] - sizeScale(metric.accessor(d)) - 8 : 0;
            })
            .text(d => d.comarca);

        allLabels.select('.label-value')
            .attr('x', d => {
                const coords = projection([d.lon, d.lat]);
                return coords ? coords[0] : 0;
            })
            .attr('y', d => {
                const coords = projection([d.lon, d.lat]);
                return coords ? coords[1] - sizeScale(metric.accessor(d)) + 4 : 0;
            })
            .text(d => metric.format(metric.accessor(d)));
    };

    update();

    yearRadios.on('change', () => {
        const yearSelection = d3.select('input[name="map-geo-year"]:checked').node()?.value || 'first';
        const selectedYear = yearSelection === 'first' ? firstYear : lastYear;
        yearDisplay.text(selectedYear);
        update();
    });

    metricSelect.on('change', update);
    provSelect.on('change', update);

    // Botons per fer zoom i restablir el mapa
    const zoomInBtn = d3.select('#map-zoom-in');
    const zoomOutBtn = d3.select('#map-zoom-out');
    const resetBtn = d3.select('#map-reset');

    if (!zoomInBtn.empty()) {
        zoomInBtn.on('click', () => {
            svg.transition().duration(300).call(zoom.scaleBy, 1.3);
        });
    }

    if (!zoomOutBtn.empty()) {
        zoomOutBtn.on('click', () => {
            svg.transition().duration(300).call(zoom.scaleBy, 0.77);
        });
    }

    if (!resetBtn.empty()) {
        resetBtn.on('click', () => {
            svg.transition().duration(500).call(
                zoom.transform,
                initialTransform
            );
        });
    }

    window.addEventListener('resize', () => {
        const newBox = container.node().getBoundingClientRect();
        const newWidth = newBox.width || width;
        const newHeight = 850;
        svg.attr('viewBox', `0 0 ${newWidth} ${newHeight}`);

        projection
            .scale(initialScale * newWidth / width)
            .translate([newWidth / 2, newHeight / 2]);

        mapLayer.selectAll('path').attr('d', path);
        update();
    });
}
