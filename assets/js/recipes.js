const BASE_IMAGE_PATH = '/assets/images/';
const API_BASE_URL = '/api/receitas'; 

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchInput');
  const button = document.getElementById('searchButton');
  const container = document.getElementById('lista-receitas');
  let receitas = [];

  fetch(API_BASE_URL)
    .then(res => {
      if (!res.ok) throw new Error('Erro ao carregar receitas');
      return res.json();
    })
    .then(data => {
      receitas = data;
      render(receitas);
    })
    .catch(err => {
      console.error('Erro:', err);
      showAlert('Erro ao carregar receitas. Tente recarregar a página.');
    });

  input.addEventListener('input', () => {
    const termo = input.value.trim().toLowerCase();
    const filtradas = receitas.filter(receita =>
      receita.titulo.toLowerCase().includes(termo)
    );
    render(filtradas);
  });

  function render(lista) {
    container.innerHTML = '';
    if (lista.length === 0) {
      container.innerHTML = '<p class="no-results">Ops! Parece que ainda não temos essa receita :(</p>';
      return;
    }

    lista.forEach(receita => {
      const card = document.createElement('div');
      card.className = 'recipe-card';
      card.innerHTML = `
        <h3>${receita.titulo}</h3>
        <img src="${BASE_IMAGE_PATH}${receita.imagem}" alt="${receita.titulo}" loading="lazy">
        <p>${receita.card_descricao}</p>
        <button class="recipe-button" data-id="${receita.id}">Ver Receita</button>
      `;
      container.appendChild(card);
    });

    document.querySelectorAll('.recipe-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const receitaId = e.target.getAttribute('data-id');
        window.location.href = `/receita.html?id=${receitaId}`;
      });
    });
  }

  const openReceitaBtn = document.getElementById('openReceitaBtn');
  const closeReceitaBtn = document.getElementById('closeReceitaModal');
  const modalReceita = document.getElementById('modal-receita');

  if (openReceitaBtn) {
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
    });
  }

  if (closeReceitaBtn) {
    closeReceitaBtn.addEventListener('click', () => {
      modalReceita.style.display = 'none';
    });
  }


  fetch('/api/categorias')
    .then(res => res.json())
    .then(categorias => {
      const select = document.getElementById('categoria');
      categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.nome;
        select.appendChild(option);
      });
    });

 
  const form = document.querySelector('#modal-receita form');
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!user) {
      showAlert("Sessão expirada. Faça login novamente.", () => {
        window.location.href = "/login.html";
      });
      return;
    }

    const fileInput = document.getElementById('imagem');
    if (!fileInput.files[0]) {
      showAlert("Selecione uma imagem para a receita!");
      return;
    }

    try {
      
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      formData.append('upload_preset', 'saladdays');

      const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/dp3ypabuy/image/upload', {
        method: 'POST',
        body: formData
      });
      
      const imageData = await uploadResponse.json();
      const imageUrl = imageData.secure_url;

      const novaReceita = {
        titulo: document.getElementById('titulo').value.trim(),
        categoria_id: [Number(document.getElementById('categoria').value)],
        card_descricao: document.getElementById('descricao').value.trim(),
        ingredientes_base: document.getElementById('ingredientes-base').value
          .split('\n').filter(i => i.trim()),
        ingredientes_molho: document.getElementById('ingredientes-molho').value
          .split('\n').filter(i => i.trim()),
        instrucoes: document.getElementById('modo-preparo').value
          .split('\n').filter(i => i.trim()),
        imagem: imageUrl.split('/').pop(), 
        autorId: user.id
      };

      
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(novaReceita)
      });

      if (response.ok) {
        showAlert("Receita enviada com sucesso!");
        form.reset();
        modalReceita.style.display = 'none';
       
        const updatedData = await fetch(API_BASE_URL).then(res => res.json());
        receitas = updatedData;
        render(receitas);
      } else {
        throw new Error('Erro ao salvar receita');
      }
    } catch (error) {
      console.error('Erro:', error);
      showAlert("Erro ao enviar receita. Tente novamente.");
    }
  });
});


function showAlert(msg, callback = null, okText = "OK") {
  const alertBox = document.createElement('div');
  alertBox.className = 'custom-alert';
  alertBox.innerHTML = `
    <div class="alert-content">
      <p>${msg}</p>
      <button class="alert-button">${okText}</button>
    </div>
  `;
  
  document.body.appendChild(alertBox);
  alertBox.querySelector('button').addEventListener('click', () => {
    alertBox.remove();
    if (callback) callback();
  });
}