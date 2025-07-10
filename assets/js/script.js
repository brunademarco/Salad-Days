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

// 1. Modifique a função switchModal para debug avançado
function switchModal() {
  console.log('--- Executando switchModal ---');
  
  const modal = document.getElementById('modal-favoritos');
  if (!modal) {
    console.error('ERRO: Elemento modal não encontrado');
    return false;
  }
  console.log('Modal encontrado:', modal);

  // Estado atual do modal
  const isShowing = modal.classList.contains('show');
  console.log('Estado inicial:', isShowing ? 'VISÍVEL' : 'OCULTO');

  if (isShowing) {
    console.log('Iniciando fechamento...');
    modal.classList.remove('show');
    
    modal.addEventListener('transitionend', function handler() {
      console.log('Transição completa - ocultando modal');
      modal.style.display = 'none';
      modal.removeEventListener('transitionend', handler);
    });
  } else {
    console.log('Iniciando abertura...');
    modal.style.display = 'block';
    
    // Força recálculo do layout antes da transição
    void modal.offsetWidth;
    
    setTimeout(() => {
      console.log('Adicionando classe show');
      modal.classList.add('show');
    }, 10);
  }
  
  return true;
}

document.getElementById('closeModalButton')?.addEventListener('click', function(event) {

  event.preventDefault();
  event.stopPropagation();
  
  const result = switchModal();
});

function loadFavoritos() {
  fetch('http://localhost:3000/favoritos')
    .then(response => response.json())
    .then(favoritosData => {
      const modalContent = document.querySelector('.column-recipes');
      favoritosData.forEach(favorito => {
        const receitaId = favorito.id_salada;
        
        fetch(`http://localhost:3000/receitas/${receitaId}`)
          .then(response => response.json())
          .then(receita => {
            const item = document.createElement('div');
            item.classList.add('recipe-item');
            item.innerHTML = `
              <img src="images/${receita.imagem}" alt="${receita.titulo}">
              <h3>${receita.titulo}</h3>
            `;
            modalContent.appendChild(item);
          })
          .catch(error => console.error('Erro ao carregar receita favorita:', error));
      });
    })
    .catch(error => console.error('Erro ao carregar favoritos:', error));
}

document.getElementById('botao-favoritos').addEventListener('click', () => {
  loadFavoritos();
});

updateCarousel();
startAutoScroll();
