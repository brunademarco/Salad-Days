// carrossel
const items = document.querySelectorAll('.carousel-item');
let currentIndex = 2; // índice inicial do item central
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
  currentIndex = (currentIndex + 1) % items.length; // volta pro primeiro ao chegar no fim
  updateCarousel();
}

function prevItem() {
  currentIndex = (currentIndex - 1 + items.length) % items.length; // vai pro último se estiver no primeiro
  updateCarousel();
}

// eventos dos botões
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

updateCarousel();
startAutoScroll();

const switchModal = () => {
  const modal = document.getElementById('modal-favoritos');
  
  if (modal.classList.contains('show')) {
    
    modal.addEventListener('transitionend', () => {
      modal.classList.remove('show');  
      modal.style.display = 'none';  
    }, { once: true });
  } else {
    modal.style.display = 'block';  
    
    setTimeout(() => {
      modal.classList.add('show');  
    }, 10);
  }
};

const modalButton = document.getElementById('botao-favoritos');
if (modalButton) {
  modalButton.addEventListener('click', (event) => {
    event.stopPropagation();  
    switchModal();  
  });
}

const closeButton = document.querySelector('.close-button');
if (closeButton) {
  closeButton.addEventListener('click', (event) => {
    event.stopPropagation(); 
    switchModal(); 
  });
}

document.addEventListener('click', (event) => {
  const modal = document.getElementById('modal-favoritos');
  const content = modal.querySelector('.modal-content');

  if (!modal.classList.contains('show')) return;

  if (content.contains(event.target) || event.target.closest('.heart-svg') || event.target.closest('#botao-favoritos')) {
    return;
  }

  switchModal();
});
