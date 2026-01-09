// Gestió de la navegació entre diapositives

export function initSlideNavigation() {
    const slides = document.querySelectorAll('.slide');
    const navButtons = document.querySelectorAll('.nav-btn');

    function activateSlide(slideNumber, buttonToActivate) {
        // Amagar totes les diapositives
        slides.forEach(slide => slide.classList.remove('active'));

        // Mostrar la diapositiva seleccionada
        const targetSlide = document.querySelector(`.slide[data-slide="${slideNumber}"]`);
        if (targetSlide) {
            targetSlide.classList.add('active');
            // Moure el cursor a l'inici de la diapositiva
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Actualitzar botons actius
        navButtons.forEach(btn => btn.classList.remove('active'));
        if (buttonToActivate) {
            buttonToActivate.classList.add('active');
        }

        // Avisar als gràfics que la diapositiva ha canviat
        const slideNumInt = Number(slideNumber);
        window.dispatchEvent(new CustomEvent('slideChanged', { detail: { slide: slideNumInt } }));
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const slideNumber = button.getAttribute('data-slide');
            activateSlide(slideNumber, button);
        });
    });

    // Activar el primer botó per defecte i notificar el canvi
    if (navButtons.length > 0) {
        const initialSlide = navButtons[0].getAttribute('data-slide');
        activateSlide(initialSlide, navButtons[0]);
    }
}
