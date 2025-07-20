const BASE_IMAGE_PATH = '/assets/images/'; 

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchInput');
  const button = document.getElementById('searchButton');
  const container = document.getElementById('lista-receitas');
  let receitas = [];

  fetch('../../../db/receitas.json')
    .then(res => res.json())
    .then(data => {
      receitas = data.receitas; 
      render(receitas);
    })
    .catch(err => console.error('Erro ao carregar JSON:', err));


  input.addEventListener('input', () => {
    const termo = input.value.trim().toLowerCase();
    const filtradas = receitas.filter(receita =>
      receita.titulo.toLowerCase().includes(termo)
    );
    render(filtradas);
  });

  function render(lista) {
    container.innerHTML = ''; 
    lista.forEach(receita => {
      const card = document.createElement('div');
      card.className = 'recipe-card';
      card.innerHTML = `
        <h3>${receita.titulo}</h3>
        <img src="${BASE_IMAGE_PATH}${receita.imagem}" alt="${receita.titulo}">
        <p>${receita.card_descricao}</p>
        <button class="recipe-button">Ver Receita</button>
      `;
      container.appendChild(card);
    });

    if (lista.length === 0) {
      container.innerHTML = '<p>Ops! Parece que ainda não temos essa receita :(</p>';
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const openReceitaBtn = document.getElementById('openReceitaBtn');
  const closeReceitaBtn = document.getElementById('closeReceitaModal');
  const modalReceita = document.getElementById('modal-receita');

  if (openReceitaBtn && modalReceita) {
    openReceitaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const user = JSON.parse(localStorage.getItem('usuarioLogado'));

      if (!user) {
        showAlert("Você precisa estar logado para enviar uma receita!", () => {
         window.location.href = "/login.html";
        }, "Fazer login");

        return;
      }

      modalReceita.style.display = 'block';
      void modalReceita.offsetWidth; 
      setTimeout(() => modalReceita.classList.add('show'), 10);
    });
  }

  if (closeReceitaBtn && modalReceita) {
    closeReceitaBtn.addEventListener('click', () => {
      modalReceita.classList.remove('show');
      setTimeout(() => {
        modalReceita.style.display = 'none';
      }, 800);
    });
  }
});

function showAlert(msg, callback = null, okText = "OK") {
  const alertContainer = document.getElementById('custom-alert');
  const alertOkButton = document.getElementById('alert-ok');
  const alertMessage = document.getElementById('alert-message');

  if (!alertContainer || !alertMessage || !alertOkButton) {
    console.error('Elementos do alerta não encontrados no DOM.');
    return;
  }

  alertMessage.textContent = msg;
  alertOkButton.textContent = okText;

  alertContainer.classList.remove('alert-hidden');
  alertContainer.classList.add('alert-show');

  const newOkButton = alertOkButton.cloneNode(true);
  alertOkButton.parentNode.replaceChild(newOkButton, alertOkButton);

  newOkButton.addEventListener('click', () => {
    alertContainer.classList.remove('alert-show');
    alertContainer.classList.add('alert-hidden');
    if (callback) callback();
  });
}

document.getElementById('closeAlert')?.addEventListener('click', () => {
  const alertContainer = document.getElementById('custom-alert');
  alertContainer.classList.remove('alert-show');
  alertContainer.classList.add('alert-hidden');
});