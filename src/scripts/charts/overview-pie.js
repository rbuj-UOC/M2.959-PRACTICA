import * as d3 from 'd3';

export function createOverviewPieChart(data) {
    const container = d3.select('#chart-0-overview');
    const yearSlider = d3.select('#overview-year');
    const yearDisplay = d3.select('#overview-year-display');
    const metricSelect = d3.select('#overview-metric');
    const provinciaSelect = d3.select('#overview-provincia');

    // Format numèric amb separador de milers i dos decimals (punt per milers, coma per decimals)
    const formatNumber = (value, decimals = 2) => {
        const fixed = Number(value).toFixed(decimals);
        const [intPart, decPart] = fixed.split('.');
        const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${withThousands},${decPart}`;
    };

    // Inicialitzar el display amb el valor actual
    yearDisplay.text(yearSlider.property('value'));

    function render() {
        const selectedYear = +yearSlider.property('value');
        const metric = metricSelect.property('value');
        const provincia = provinciaSelect.property('value');

        let filtered = data.filter(d => d.any === selectedYear);
        if (provincia !== 'Totes') {
            filtered = filtered.filter(d => d.provincia === provincia);
        }

        if (filtered.length === 0) {
            container.html('<p style="text-align:center;padding:2rem;">No hi ha dades per aquesta selecció.</p>');
            return;
        }

        let pieData = [];
        let title = '';

        // Paleta de colors per comarques
        const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

        if (metric === 'total') {
            pieData = filtered.map((d, i) => ({
                label: d.comarca,
                value: d.total_recollida_t,
                color: colorScale(i)
            })).filter(d => d.value > 0)
                .sort((a, b) => b.value - a.value);
            const totalRecollida = d3.sum(pieData, d => d.value);
            title = `Total residus per comarca: ${formatNumber(totalRecollida)} tones`;
        } else if (metric === 'selectiva') {
            pieData = filtered.map((d, i) => ({
                label: d.comarca,
                value: d.recollida_selectiva_t,
                color: colorScale(i)
            })).filter(d => d.value > 0)
                .sort((a, b) => b.value - a.value);
            const totalSelectiva = d3.sum(pieData, d => d.value);
            title = `Recollida selectiva per comarca: ${formatNumber(totalSelectiva)} tones`;
        } else if (metric === 'no_selectiva') {
            pieData = filtered.map((d, i) => ({
                label: d.comarca,
                value: d.recollida_no_selectiva_t,
                color: colorScale(i)
            })).filter(d => d.value > 0)
                .sort((a, b) => b.value - a.value);
            const totalNoSelectiva = d3.sum(pieData, d => d.value);
            title = `Recollida no selectiva per comarca: ${formatNumber(totalNoSelectiva)} tones`;
        } else if (metric === 'comparativa') {
            const totalSelectiva = d3.sum(filtered, d => d.recollida_selectiva_t);
            const totalNoSelectiva = d3.sum(filtered, d => d.recollida_no_selectiva_t);
            pieData = [
                { label: 'Recollida selectiva', value: totalSelectiva, color: '#73003c' },
                { label: 'Recollida no selectiva', value: totalNoSelectiva, color: '#e98300' }
            ];
            title = 'Comparativa selectiva vs no selectiva';
        }

        const width = 700;
        const height = 550;
        const radius = Math.min(width, height) / 2 - 60;

        container.html('');
        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        const pie = d3.pie().value(d => d.value).sort(null);
        const arc = d3.arc().innerRadius(0).outerRadius(radius);
        const labelArc = d3.arc().innerRadius(radius * 0.65).outerRadius(radius * 0.65);

        const arcs = g.selectAll('arc')
            .data(pie(pieData))
            .join('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('d', arc)
            .attr('fill', d => d.data.color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 3)
            .style('cursor', 'pointer')
            .on('mouseenter', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.8)
                    .attr('transform', 'scale(1.05)');
            })
            .on('mouseleave', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 1)
                    .attr('transform', 'scale(1)');
            })
            .append('title')
            .text(d => {
                const pct = (d.data.value / d3.sum(pieData, p => p.value)) * 100;
                return `${d.data.label}: ${formatNumber(d.data.value)} tones (${formatNumber(pct)}%)`;
            });

        // Etiquetes de percentatge (només per sectors grans)
        if (pieData.length <= 10) {
            arcs.append('text')
                .attr('transform', d => `translate(${labelArc.centroid(d)})`)
                .attr('text-anchor', 'middle')
                .style('font-size', '14px')
                .style('fill', '#fff')
                .style('font-weight', 'bold')
                .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
                .text(d => {
                    const pct = (d.data.value / d3.sum(pieData, p => p.value)) * 100;
                    return pct > 3 ? `${formatNumber(pct)}%` : '';
                });
        }

        // Títol
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .text(title);

        // Subtítol amb info del període
        const numComarques = filtered.length;
        const provinciaText = provincia === 'Totes' ? 'Catalunya' : `Província de ${provincia}`;
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 50)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#666')
            .text(`${provinciaText} - ${numComarques} comarques (${selectedYear})`);

        // Etiquetes externes per les 3 comarques amb més valor (només per mètriques de comarques)
        const labelOuterArc = d3.arc().innerRadius(radius * 1.05).outerRadius(radius * 1.05);
        const topThreeLabels = new Set(pieData.slice(0, 3).map(d => d.label));

        if (metric !== 'comparativa') {
            arcs.filter(d => topThreeLabels.has(d.data.label))
                .append('text')
                .attr('transform', d => `translate(${labelOuterArc.centroid(d)})`)
                .attr('text-anchor', d => labelOuterArc.centroid(d)[0] >= 0 ? 'start' : 'end')
                .attr('dx', d => labelOuterArc.centroid(d)[0] >= 0 ? '8' : '-8')
                .attr('dy', '0.35em')
                .style('font-size', '12px')
                .style('font-weight', '600')
                .style('fill', '#333')
                .text(d => `${d.data.label}: ${formatNumber(d.data.value)} t`);
        }

        // Llegenda només per a la comparativa selectiva/no selectiva
        if (metric === 'comparativa') {
            const maxLegendItems = pieData.length;
            const legendData = pieData.slice(0, maxLegendItems);

            if (legendData.length > 0) {
                const legend = svg.append('g')
                    .attr('transform', `translate(40, ${Math.max(80, height - legendData.length * 22 - 20)})`);

                legendData.forEach((d, i) => {
                    const legendRow = legend.append('g')
                        .attr('transform', `translate(0, ${i * 22})`);

                    legendRow.append('rect')
                        .attr('x', 0)
                        .attr('y', 0)
                        .attr('width', 16)
                        .attr('height', 16)
                        .attr('fill', d.color)
                        .attr('rx', 3);

                    legendRow.append('text')
                        .attr('x', 22)
                        .attr('y', 12)
                        .text(`${d.label}: ${formatNumber(d.value)} t`)
                        .style('font-size', '11px')
                        .style('fill', '#333');
                });

                if (pieData.length > maxLegendItems) {
                    legend.append('text')
                        .attr('x', 22)
                        .attr('y', maxLegendItems * 22 + 12)
                        .text(`... i ${pieData.length - maxLegendItems} més`)
                        .style('font-size', '11px')
                        .style('fill', '#666')
                        .style('font-style', 'italic');
                }
            }
        }
    }

    yearSlider.on('input', function () {
        yearDisplay.text(this.value);
        render();
    });
    metricSelect.on('change', render);
    provinciaSelect.on('change', render);

    render();
}
