// Variáveis de controle do carrossel
const items = document.querySelectorAll('.carousel-item');
let currentIndex = 2; // índice inicial do item central
let autoScrollInterval;

// Função para atualizar o carrossel
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

// Função para mudar para o próximo item do carrossel
function nextItem() {
  currentIndex = (currentIndex + 1) % items.length; // volta pro primeiro ao chegar no fim
  updateCarousel();
}

// Função para voltar para o item anterior do carrossel
function prevItem() {
  currentIndex = (currentIndex - 1 + items.length) % items.length; // vai pro último se estiver no primeiro
  updateCarousel();
}

// Eventos dos botões
document.getElementById('prevBtn').addEventListener('click', () => {
  prevItem();
  resetAutoScroll();
});

document.getElementById('nextBtn').addEventListener('click', () => {
  nextItem();
  resetAutoScroll();
});

// Função para iniciar o auto-scroll do carrossel
function startAutoScroll() {
  autoScrollInterval = setInterval(nextItem, 2000);
}

// Função para resetar o auto-scroll do carrossel
function resetAutoScroll() {
  clearInterval(autoScrollInterval);
  startAutoScroll(); 
}

// Função para exibir ou esconder o modal de favoritos
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

// Eventos de clique para abrir e fechar o modal
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

// Fechar o modal ao clicar fora dele
document.addEventListener('click', (event) => {
  const modal = document.getElementById('modal-favoritos');
  const content = modal.querySelector('.modal-content');

  if (!modal.classList.contains('show')) return;

  if (content.contains(event.target) || event.target.closest('.heart-svg') || event.target.closest('#botao-favoritos')) {
    return;
  }

  switchModal();
});

function loadFavoritos() {
  fetch('http://localhost:3000/favoritos')
    .then(response => response.json())
    .then(favoritosData => {
      const modalContent = document.querySelector('.column-recipes');
      favoritosData.forEach(favorito => {
        const receitaId = favorito.id_salada;
        
        // Fetch da receita correspondente ao favorito
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

// Carregar os favoritos quando o modal for aberto
document.getElementById('botao-favoritos').addEventListener('click', () => {
  loadFavoritos();
});

updateCarousel();
startAutoScroll();
