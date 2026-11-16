const ROOT_PREFIX = window.location.pathname.includes('/pages/') ? '../../' : './';
const BASE_IMAGE_PATH = `${ROOT_PREFIX}assets/images/`;
const API_BASE_URL = '/api/receitas'; 

const resolveImage = (imagem) => {
  if (!imagem) return `${BASE_IMAGE_PATH}cardClassica.jpg`;
  return String(imagem).startsWith('http') ? imagem : `${BASE_IMAGE_PATH}${imagem}`;
};

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchInput');
  const button = document.getElementById('searchButton');
  const container = document.getElementById('lista-receitas');
  const filterButtons = Array.from(document.querySelectorAll('.filter-pill'));
  let receitas = [];
  let searchTerm = '';
  let activeCategoryId = null;

  fetch(API_BASE_URL)
    .then(res => {
      if (!res.ok) throw new Error('Erro ao carregar receitas');
      return res.json();
    })
    .then(data => {
      receitas = data;
      applyFilters();
    })
    .catch(err => {
      console.error('Erro:', err);
      showAlert('Erro ao carregar receitas. Tente recarregar a página.');
    });

  input.addEventListener('input', () => {
    searchTerm = input.value.trim().toLowerCase();
    applyFilters();
  });

  if (button) {
    button.addEventListener('click', () => {
      searchTerm = input.value.trim().toLowerCase();
      applyFilters();
    });
  }

  function applyFilters() {
    let lista = receitas;
    if (activeCategoryId) {
      lista = lista.filter(receita =>
        Array.isArray(receita.categoria_id) && receita.categoria_id.includes(activeCategoryId)
      );
    }
    if (searchTerm) {
      lista = lista.filter(receita =>
        receita.titulo.toLowerCase().includes(searchTerm)
      );
    }
    render(lista);
  }

  function render(lista) {
    container.innerHTML = '';
    if (lista.length === 0) {
      container.innerHTML = '<p class="no-results">Ops! Parece que ainda não temos essa receita :(</p>';
      return;
    }

    lista.forEach(receita => {
      const card = document.createElement('div');
      card.className = 'recipe-card';
      const title = document.createElement('h3');
      title.textContent = receita.titulo || '';
      const image = document.createElement('img');
      image.src = resolveImage(receita.imagem);
      image.alt = receita.titulo || 'Receita';
      image.loading = 'lazy';
      const description = document.createElement('p');
      description.textContent = receita.card_descricao || '';
      const button = document.createElement('button');
      button.className = 'recipe-button';
      button.dataset.id = String(receita.id);
      button.textContent = 'Ver Receita';
      card.append(title, image, description, button);
      container.appendChild(card);
    });

    document.querySelectorAll('.recipe-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const receitaId = e.target.getAttribute('data-id');
        window.location.href = `${ROOT_PREFIX}pages/detalhesreceita/receita.html?id=${receitaId}`;
      });
    });
  }

  const openReceitaBtn = document.getElementById('openReceitaBtn');
  const closeReceitaBtn = document.getElementById('closeReceitaModal');
  const modalReceita = document.getElementById('modal-receita');

  if (openReceitaBtn) {
    openReceitaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modalReceita.classList.add('show');
    });
  }

  if (closeReceitaBtn) {
    closeReceitaBtn.addEventListener('click', () => {
      modalReceita.classList.remove('show');
    });
  }

  if (new URLSearchParams(window.location.search).get('abrirFormulario') === '1' && modalReceita) {
    modalReceita.classList.add('show');
  }


  fetch('/api/categorias')
    .then(res => res.json())
    .then(categorias => {
      const select = document.getElementById('categoria');
      const categoriaMap = new Map();
      categorias.forEach(cat => {
        categoriaMap.set(normalizeText(cat.nome), cat.id);
      });

      filterButtons.forEach(btn => {
        const key = normalizeText(btn.dataset.category || '');
        const id = categoriaMap.get(key);
        if (id) btn.dataset.categoryId = String(id);
      });

      categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.nome;
        select.appendChild(option);
      });
    });

 
  const form = document.querySelector('#modal-receita form');
  const fileInput = document.getElementById('imagem');
  const nomeArquivo = document.getElementById('nome-arquivo');

  if (fileInput && nomeArquivo) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      nomeArquivo.textContent = file ? file.name : '';
    });
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const selectedFile = fileInput.files[0];
    if (!selectedFile) {
      showAlert("Selecione uma imagem para a receita!");
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type) || selectedFile.size > 5 * 1024 * 1024) {
      showAlert("A imagem deve ser JPG, PNG ou WebP e ter no máximo 5 MB.");
      return;
    }

    const categoriaIds = Array.from(
      document.querySelectorAll('#categoria-selecionadas .categoria-chip')
    )
      .map(chip => Number(chip.dataset.id))
      .filter(id => Number.isInteger(id));

    if (categoriaIds.length === 0) {
      showAlert("Selecione pelo menos uma categoria!");
      return;
    }

    try {
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', 'saladdays');

      const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/dp3ypabuy/image/upload', {
        method: 'POST',
        body: formData
      });
      
      const imageData = await uploadResponse.json();
      const imageUrl = imageData.secure_url;

      const novaReceita = {
        titulo: document.getElementById('titulo').value.trim(),
        descricao: document.getElementById('descricao').value.trim(),
        tempo_preparo_min: Number(document.getElementById('tempo-preparo').value),
        numero_porcoes: Number(document.getElementById('porcoes').value),
        categorias: categoriaIds,
        ingredientesBaseTexto: document.getElementById('ingredientes-base').value,
        ingredientesMolhoTexto: document.getElementById('ingredientes-molho').value,
        modoPreparoTexto: document.getElementById('modo-preparo').value,
        imagem: imageUrl
      };

      
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(novaReceita)
      });

      if (response.ok) {
        showAlert("Receita enviada com sucesso!");
        form.reset();
        clearSelectedCategories();
        modalReceita.classList.remove('show');
       
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

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const categoryName = (btn.dataset.category || '').toLowerCase();
      if (categoryName === 'todas') {
        activeCategoryId = null;
      } else {
        const id = Number(btn.dataset.categoryId);
        activeCategoryId = Number.isInteger(id) ? id : null;
      }
      applyFilters();
    });
  });

  const addCategoriaBtn = document.getElementById('add-categoria');
  const categoriaSelecionadas = document.getElementById('categoria-selecionadas');
  const categoriaSelect = document.getElementById('categoria');

  function addSelectedCategory(id, name) {
    if (!categoriaSelecionadas || !Number.isInteger(id)) return;
    const existing = categoriaSelecionadas.querySelector(`.categoria-chip[data-id="${id}"]`);
    if (existing) return;

    const chip = document.createElement('span');
    chip.className = 'categoria-chip';
    chip.dataset.id = String(id);
    chip.textContent = name;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-categoria';
    removeBtn.setAttribute('aria-label', `Remover ${name}`);
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => chip.remove());

    chip.appendChild(removeBtn);
    categoriaSelecionadas.appendChild(chip);
  }

  function clearSelectedCategories() {
    if (categoriaSelecionadas) categoriaSelecionadas.innerHTML = '';
  }

  if (addCategoriaBtn && categoriaSelect) {
    const updateAddButtonState = () => {
      const option = categoriaSelect.options[categoriaSelect.selectedIndex];
      addCategoriaBtn.disabled = !option || !option.value;
    };

    addCategoriaBtn.addEventListener('click', () => {
      const option = categoriaSelect.options[categoriaSelect.selectedIndex];
      if (!option || !option.value) {
        return;
      }
      const id = Number(option.value);
      const name = option.textContent || '';
      addSelectedCategory(id, name);
      categoriaSelect.value = '';
      updateAddButtonState();
    });

    categoriaSelect.addEventListener('change', updateAddButtonState);
    updateAddButtonState();
  }
});

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}


function showAlert(msg, callback = null, okText = "OK") {
  const alertRoot = document.getElementById('custom-alert');
  if (!alertRoot) {
    alert(msg);
    if (callback) callback();
    return;
  }

  const messageEl = alertRoot.querySelector('#alert-message');
  const okBtn = alertRoot.querySelector('#alert-ok');
  const closeBtn = alertRoot.querySelector('#closeAlert');

  if (messageEl) messageEl.textContent = msg;
  if (okBtn) okBtn.textContent = okText;

  alertRoot.classList.remove('alert-hidden');
  alertRoot.classList.add('alert-show');

  const hide = () => {
    alertRoot.classList.remove('alert-show');
    alertRoot.classList.add('alert-hidden');
  };

  if (okBtn) okBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    hide();
    if (callback) callback();
  }, { once: true });
  if (closeBtn) closeBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    hide();
  }, { once: true });
}
