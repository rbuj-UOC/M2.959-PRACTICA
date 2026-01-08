// estils principals
import '../styles/main.scss';
// navegació entre diapositives
import { initSlideNavigation } from './slides.js';
// gràfiques
import * as d3 from 'd3';
import { createOverviewPieChart } from './charts/overview-pie.js';
import { createDemographicChart } from './charts/demographic-chart.js';
import { createMapGeo } from './charts/map-chart.js';

// Prefix base per a desplegament a GitHub Pages
const BASE_URL = window.location.origin.includes('rbuj-uoc.github.io')
    ? 'https://rbuj-uoc.github.io/M2.959-PRACTICA'
    : '';

console.log('Aplicació iniciada');

// Carregar les dades
Promise.all([
    d3.csv(`${BASE_URL}/data/recollida-selectiva-comarques-2006-2021.csv`),
    d3.json(`${BASE_URL}/data/divisions-administratives-v2r1-catalunya-1000000-20250730.json`),
]).then(([csvData, geojson]) => {

    const data = csvData.map(d => ({
        any: +d['Any'],
        comarca: d['Comarca'],
        // kg_per_hab_dia: +d['Total kg/hab./dia'],
        lat: +d['Latitud'],
        lon: +d['Longitud'],
        poblacio_masculina_0_15: +d['Població.y 0-15'],
        poblacio_masculina_16_24: +d['Població.y 16-24'],
        poblacio_masculina_25_44: +d['Població.y 25-44'],
        poblacio_masculina_45_64: +d['Població.y 45-64'],
        poblacio_masculina_64_120: +d['Població.y 64+'],
        poblacio_femenina_0_15: +d['Població.x 0-15'],
        poblacio_femenina_16_24: +d['Població.x 16-24'],
        poblacio_femenina_25_44: +d['Població.x 25-44'],
        poblacio_femenina_45_64: +d['Població.x 45-64'],
        poblacio_femenina_64_120: +d['Població.x 64+'],
        provincia: d['Província'],
        superficie_km2: +d['Superfície km2'],
        tones_recollida_no_selectiva: +d['Recollida no selectiva'],
        tones_recollida_selectiva: +d['Recollida selectiva'],
    }))
        .map(d => ({
            ...d,
            // calcula les tones totals de recollida
            tones_recollida_total: d.tones_recollida_selectiva + d.tones_recollida_no_selectiva,
            // calcula la població total
            poblacio_masculina: d.poblacio_masculina_0_15 + d.poblacio_masculina_16_24 + d.poblacio_masculina_25_44 + d.poblacio_masculina_45_64 + d.poblacio_masculina_64_120,
            poblacio_femenina: d.poblacio_femenina_0_15 + d.poblacio_femenina_16_24 + d.poblacio_femenina_25_44 + d.poblacio_femenina_45_64 + d.poblacio_femenina_64_120,
            poblacio: d.poblacio_masculina_0_15 + d.poblacio_masculina_16_24 + d.poblacio_masculina_25_44 + d.poblacio_masculina_45_64 + d.poblacio_masculina_64_120 + d.poblacio_femenina_0_15 + d.poblacio_femenina_16_24 + d.poblacio_femenina_25_44 + d.poblacio_femenina_45_64 + d.poblacio_femenina_64_120,
            // càlcul kg_per_hab_dia
            kg_per_hab_dia: (d.tones_recollida_selectiva + d.tones_recollida_no_selectiva) * 1000 / ((d.poblacio_masculina_0_15 + d.poblacio_masculina_16_24 + d.poblacio_masculina_25_44 + d.poblacio_masculina_45_64 + d.poblacio_masculina_64_120 + d.poblacio_femenina_0_15 + d.poblacio_femenina_16_24 + d.poblacio_femenina_25_44 + d.poblacio_femenina_45_64 + d.poblacio_femenina_64_120) * (Number.isFinite(d.any) && d.any % 4 === 0 ? 366 : 365)),
            kg_selectiva_per_hab_dia: d.tones_recollida_selectiva * 1000 / ((d.poblacio_masculina_0_15 + d.poblacio_masculina_16_24 + d.poblacio_masculina_25_44 + d.poblacio_masculina_45_64 + d.poblacio_masculina_64_120 + d.poblacio_femenina_0_15 + d.poblacio_femenina_16_24 + d.poblacio_femenina_25_44 + d.poblacio_femenina_45_64 + d.poblacio_femenina_64_120) * (Number.isFinite(d.any) && d.any % 4 === 0 ? 366 : 365)),
            kg_no_selectiva_per_hab_dia: d.tones_recollida_no_selectiva * 1000 / ((d.poblacio_masculina_0_15 + d.poblacio_masculina_16_24 + d.poblacio_masculina_25_44 + d.poblacio_masculina_45_64 + d.poblacio_masculina_64_120 + d.poblacio_femenina_0_15 + d.poblacio_femenina_16_24 + d.poblacio_femenina_25_44 + d.poblacio_femenina_45_64 + d.poblacio_femenina_64_120) * (Number.isFinite(d.any) && d.any % 4 === 0 ? 366 : 365)),
        }));

    // Descartar valors no disponibles en càlculs específics
    const safe = (arr, accessor) => arr.filter(d => Number.isFinite(accessor(d)));

    // Inicialitzar navegació
    initSlideNavigation();

    // Crear gràfica de presentació
    createOverviewPieChart(data);

    // Crear gràfica de demografia
    createDemographicChart(data);

    // Crear mapa
    createMapGeo(data, geojson);

    console.log('Dades carregades i gràfiques inicialitzades');

}).catch(error => {
    console.error('Error carregant les dades:', error);
});
