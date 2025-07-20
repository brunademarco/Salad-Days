const items = document.querySelectorAll('.carousel-item');
let currentIndex = 2; 
let autoScrollInterval;

function updateCarousel() {
  items.forEach((item) => {
    item.classList.remove('active');
    item.style.transform = 'scale(0.8)';
    item.style.opacity = '0.5';
    const caption = item.querySelector('.caption');
    if (caption) caption.style.display = 'none';
  });

  const activeItem = items[currentIndex];
  if (activeItem) {
    activeItem.classList.add('active');
    activeItem.style.transform = 'scale(1.2)';
    activeItem.style.opacity = '1';
    const caption = activeItem.querySelector('.caption');
    if (caption) caption.style.display = 'block';
  }
}

function nextItem() {
  currentIndex = (currentIndex + 1) % items.length; 
  updateCarousel();
}

function prevItem() {
  currentIndex = (currentIndex - 1 + items.length) % items.length; 
  updateCarousel();
}

document.getElementById('prevBtn').addEventListener('click', () => {
  prevItem();
  resetAutoScroll();
});

document.getElementById('nextBtn').addEventListener('click', () => {
  nextItem();
  resetAutoScroll();
});

function startAutoScroll() {
  autoScrollInterval = setInterval(nextItem, 2000);
}

function resetAutoScroll() {
  clearInterval(autoScrollInterval);
  startAutoScroll(); 
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal || modal.classList.contains('show')) return;

  modal.style.display = 'block';
  void modal.offsetWidth; 
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal || !modal.classList.contains('show')) return;

  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 800); 
}

document.addEventListener('DOMContentLoaded', () => {
  const openFavoritosBtn = document.getElementById('openFavoritosBtn');
  if (openFavoritosBtn) {
    openFavoritosBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('modal-favoritos');
    });
  }

  const closeFavoritosBtn = document.getElementById('closeFavoritosModal');
  if (closeFavoritosBtn) {
    closeFavoritosBtn.addEventListener('click', () => {
      closeModal('modal-favoritos');
    });
  }

});
