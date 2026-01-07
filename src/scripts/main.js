// estils principals
import '../styles/main.scss';
// navegació entre diapositives
import { initSlideNavigation } from './slides.js';
// gràfiques
import * as d3 from 'd3';
import { createOverviewPieChart } from './charts/overview-pie.js';

// Prefix base per a desplegament a GitHub Pages
const BASE_URL = window.location.origin.includes('rbuj-uoc.github.io')
    ? 'https://rbuj-uoc.github.io/M2.959-PRACTICA'
    : '';

console.log('Aplicació iniciada');

// Carregar les dades
Promise.all([
    d3.csv(`${BASE_URL}/data/recollida-selectiva-comarques-2006-2021.csv`),
]).then(([csvData, geojson]) => {

    const data = csvData.map(d => ({
        any: +d['Any'],
        comarca: d['Comarca'],
        kg_per_hab_dia: +d['Total kg/hab./dia'],
        provincia: d['Província'],
        tones_recollida_no_selectiva: +d['Recollida no selectiva'],
        tones_recollida_selectiva: +d['Recollida selectiva'],
        tones_recollida_total: +d['Total recollida'],
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
