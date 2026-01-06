// Gestió de la navegació entre diapositives

export function initSlideNavigation() {
  const slides = document.querySelectorAll('.slide');
  const navButtons = document.querySelectorAll('.nav-btn');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const slideNumber = button.getAttribute('data-slide');
      
      // Amagar totes les diapositives
      slides.forEach(slide => slide.classList.remove('active'));
      
      // Mostrar la diapositiva seleccionada
      const targetSlide = document.querySelector(`.slide[data-slide="${slideNumber}"]`);
      if (targetSlide) {
        targetSlide.classList.add('active');
      }

      // Actualitzar botons actius
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });

  // Activar el primer botó per defecte
  if (navButtons.length > 0) {
    navButtons[0].classList.add('active');
  }
}
