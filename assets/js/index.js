//carrosel
const items = document.querySelectorAll('.carousel-item');
let currentIndex = 2; // índice do item central

function updateCarousel() {
    items.forEach((item, i) => {
      item.classList.remove('active');
      item.style.transform = 'scale(0.8)';
      item.style.opacity = '0.5';
      const caption = item.querySelector('.caption');
      if (caption) caption.style.display = 'none';
    });
  
    // Aplica destaque ao item central
    const activeItem = items[currentIndex];
    if (activeItem) {
      activeItem.classList.add('active');
      activeItem.style.transform = 'scale(1.2)';
      activeItem.style.opacity = '1';
      const caption = activeItem.querySelector('.caption');
      if (caption) caption.style.display = 'block';
    }
  }
  

document.getElementById('prevBtn').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    updateCarousel();
  }
});

document.getElementById('nextBtn').addEventListener('click', () => {
  if (currentIndex < items.length - 1) {
    currentIndex++;
    updateCarousel();
  }
});

updateCarousel(); // inicialização
