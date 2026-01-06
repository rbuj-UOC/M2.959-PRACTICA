import '../styles/main.scss';
import { initSlideNavigation } from './slides.js';

console.log('Aplicació iniciada');

// promesa un cop el DOM està carregat
document.addEventListener('DOMContentLoaded', () => {
    // Inicialitzar navegació
    initSlideNavigation();
    console.log('DOM completament carregat i analitzat');
});

