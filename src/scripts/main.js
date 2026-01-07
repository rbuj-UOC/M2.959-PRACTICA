// estils principals
import '../styles/main.scss';
// navegació entre diapositives
import { initSlideNavigation } from './slides.js';
// gràfiques
import * as d3 from 'd3';
import { createOverviewPieChart } from './charts/overview-pie.js';

console.log('Aplicació iniciada');

// Carregar les dades
Promise.all([
    d3.csv('/data/recollida-selectiva-comarques-2006-2021.csv'),
]).then(([csvData, geojson]) => {

    const data = csvData.map(d => ({
        any: +d['Any'],
        comarca: d['Comarca'],
        provincia: d['Província'],
        kg_per_hab_dia: +d['Total kg/hab./dia'],
        recollida_no_selectiva_t: +d['Recollida no selectiva'],
        recollida_selectiva_t: +d['Recollida selectiva'],
        total_recollida_t: +d['Total recollida'],
    }));

    // Descartar valors no disponibles en càlculs específics
    const safe = (arr, accessor) => arr.filter(d => Number.isFinite(accessor(d)));

    // Inicialitzar navegació
    initSlideNavigation();

    // Crear gràfica de presentació
    createOverviewPieChart(data);

    console.log('Dades carregades i gràfica inicialitzada');

}).catch(error => {
    console.error('Error carregant les dades:', error);
});
