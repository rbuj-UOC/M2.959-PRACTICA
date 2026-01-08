// estils principals
import '../styles/main.scss';
// navegació entre diapositives
import { initSlideNavigation } from './slides.js';
// gràfiques
import * as d3 from 'd3';
import { createSlide1PieChart } from './charts/slide1-pie-chart.js';
import { createSlide1DemographicChart } from './charts/slide1-demographic-chart.js';
import { createSlide1MapGeo } from './charts/slide1-map-chart.js';
import { createSlide2SelectivaLine } from './charts/slide2-selectiva-line.js';
import { createSlide2RebuigLine } from './charts/slide2-rebuig-line.js';
import { createSlide2PercentSelectivaLine } from './charts/slide2-percent-selectiva-line.js';
import { createSlide3 } from './charts/slide3.js';
import { createSlide4DensitatVsTotal } from './charts/slide4-densitat-vs-total.js';
import { createSlide4TopRebuig } from './charts/slide4-top-rebuig.js';
import { createSlide4TopSelectiva } from './charts/slide4-top-selectiva.js';
import { createSlide5ProvinciesBars } from './charts/slide5-provincies-bars.js';
import { createSlide5ProvinciesViolin } from './charts/slide5-provincies-violin.js';

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
            // càlcul percentatge selectiva
            percentatge_selectiva: (d.tones_recollida_selectiva + d.tones_recollida_no_selectiva) > 0 ? (d.tones_recollida_selectiva / (d.tones_recollida_selectiva + d.tones_recollida_no_selectiva)) * 100 : 0,
        }));

    // Descartar valors no disponibles en càlculs específics
    const safe = (arr, accessor) => arr.filter(d => Number.isFinite(accessor(d)));

    // Inicialitzar navegació
    initSlideNavigation();

    // Diapositiva 1: Visió general
    createSlide1PieChart(data);
    createSlide1DemographicChart(data);
    createSlide1MapGeo(data, geojson);

    // Diapositiva 2: Millores sostingudes
    createSlide2SelectivaLine(data);
    createSlide2RebuigLine(data);
    createSlide2PercentSelectivaLine(data);

    // Diapositiva 3: Patrons demogràfics
    createSlide3(data);

    // Diapositiva 4: Pressió territorial
    createSlide4DensitatVsTotal(data);
    createSlide4TopRebuig(data);
    createSlide4TopSelectiva(data);

    // Diapositiva 5: Comparatives territorials
    createSlide5ProvinciesBars(data);
    createSlide5ProvinciesViolin(data);

    console.log('Dades carregades i gràfiques inicialitzades');

}).catch(error => {
    console.error('Error carregant les dades:', error);
});
