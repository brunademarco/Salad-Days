const BASE_API_URL = '/api/usuarios';
const RECEITAS_API_URL = '/api/receitas';
const ROOT_PREFIX = window.location.pathname.includes('/pages/') ? '../../' : './';
const STATIC_IMAGE_PATH = `${ROOT_PREFIX}assets/images/`;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'\"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));
let usuarioAtual = null;

const resolveImage = (imagem) => {
  if (!imagem) return `${STATIC_IMAGE_PATH}cardClassica.jpg`;
  return imagem.startsWith('http') ? imagem : `${STATIC_IMAGE_PATH}${imagem}`;
};

const goToLogin = () => {
  window.location.href = `${ROOT_PREFIX}login.html`;
};

const goToHome = () => {
  window.location.href = `${ROOT_PREFIX}index.html`;
};

document.addEventListener("DOMContentLoaded", async () => {
  const content = document.getElementById("perfil-content");
  const botoes = document.querySelectorAll(".sidebar-button");
  
  const token = null;

  try {
    
    const usuario = await fetchUserProfile(token);
    if (!usuario) return;
    usuarioAtual = usuario;

    renderPerfil(usuario);
    setupEventListeners(usuario, token);

    botoes.forEach(btn => {
      btn.addEventListener("click", () => {
        botoes.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const view = btn.getAttribute("data-view");
        if (view === "perfil") renderPerfil(usuario);
        else if (view === "receitas") renderUserRecipes(usuario.id, token);
        else if (view === "favoritos") renderFavorites(usuario.id, token);
      });
    });

    renderPerfil(usuario);

  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
    content.innerHTML = `<p class="error-message">Erro ao carregar perfil. Tente recarregar a página.</p>`;
  }
});

async function fetchUserProfile(token) {
  const response = await fetch(`${BASE_API_URL}/perfil`, {
    credentials: 'include'
  });

  if (!response.ok) {
    if (response.status === 401) {
      goToLogin();
    }
    throw new Error('Erro ao carregar perfil');
  }

  return await response.json();
}

function renderPerfil(usuario) {
  const content = document.getElementById("perfil-content");
  content.innerHTML = `
    <div class="perfil-header"><h2>Perfil</h2></div>
    <div class="card-perfil">
      <p><strong>Nome:</strong></p>
      <div class="perfil-info">
        <p class="perfil-dado">${escapeHtml(usuario.nome)}</p>
        <button class="perfil-editar" data-campo="nome">
          <img src="${STATIC_IMAGE_PATH}editar.svg" alt="Editar Nome">
        </button>
      </div>
      <p><strong>Email:</strong></p>
      <div class="perfil-info">
        <p class="perfil-dado">${escapeHtml(usuario.email)}</p>
        <button class="perfil-editar" data-campo="email">
          <img src="${STATIC_IMAGE_PATH}editar.svg" alt="Editar Email">
        </button>
      </div>
      <p><strong>Login:</strong></p>
      <div class="perfil-info">
        <p class="perfil-dado">${escapeHtml(usuario.login)}</p>
        <button class="perfil-editar" data-campo="login">
          <img src="${STATIC_IMAGE_PATH}editar.svg" alt="Editar Login">
        </button>
      </div>
      <p><strong>Senha:</strong></p>
      <div class="perfil-info">
        <p class="perfil-dado">${"•".repeat(8)}</p>
        <button class="perfil-editar" data-campo="senha">
          <img src="${STATIC_IMAGE_PATH}editar.svg" alt="Editar Senha">
        </button>
      </div>
      <div class="button-space">
        <button class="perfil-sair">
          <img src="${STATIC_IMAGE_PATH}Sair.svg" alt="Sair do perfil">
        </button>
        <button class="perfil-excluir">
          <img src="${STATIC_IMAGE_PATH}trash.svg" alt="Excluir conta">
        </button>
      </div>
    </div>
  `;
}

async function renderUserRecipes(userId, token) {
  const content = document.getElementById("perfil-content");
  content.innerHTML = '';

  try {
    const response = await fetch(`${RECEITAS_API_URL}?autorId=${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Erro ao carregar receitas');
    
    const receitas = await response.json();
    
    if (receitas.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <p>Você ainda não enviou nenhuma receita.</p>
          <button type="button" class="btn-primary btn-nova-receita">Criar primeira receita</button>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="perfil-header">
        <h2>Receitas enviadas:</h2>
      </div>
      <div class="card-lista-receitas"></div>
    `;

    const lista = content.querySelector('.card-lista-receitas');
    receitas.forEach(receita => {
      lista.appendChild(createRecipeCard(receita));
    });

  } catch (error) {
    console.error("Erro:", error);
    content.innerHTML = `
      <div class="error-state">
        <p>Erro ao carregar receitas.</p>
        <button class="btn-retry">Tentar novamente</button>
      </div>
    `;
    content.querySelector('.btn-retry').addEventListener('click', () => renderUserRecipes(userId, token));
  }
}

function createRecipeCard(receita) {
  const card = document.createElement('div');
  card.className = 'recipe-card';
  const recipeUrl = `${ROOT_PREFIX}pages/detalhesreceita/receita.html?id=${encodeURIComponent(receita.id)}`;
  card.setAttribute('role', 'link');
  card.setAttribute('tabindex', '0');
  card.addEventListener('click', (event) => {
    if (!event.target.closest('.recipe-actions')) window.location.href = recipeUrl;
  });
  card.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('button')) {
      event.preventDefault();
      window.location.href = recipeUrl;
    }
  });
  card.innerHTML = `
    <h3>${escapeHtml(receita.titulo)}</h3>
    <img src="${escapeHtml(resolveImage(receita.imagem))}" alt="${escapeHtml(receita.titulo)}" loading="lazy">
    <p class="recipe-description">${escapeHtml(receita.card_descricao)}</p>
    <div class="recipe-metrics">
      <div><strong>TEMPO</strong><span>${escapeHtml(receita.tempo_preparo_min || '—')} ${receita.tempo_preparo_min ? 'Min' : ''}</span></div>
      <div><strong>PORÇÕES</strong><span>${escapeHtml(receita.numero_porcoes || '—')}</span></div>
      <div><strong>NÍVEL</strong><span>—</span></div>
      <div><strong>AVALIAÇÕES</strong><span>—</span></div>
    </div>
    <div class="recipe-actions">
      <button class="recipe-button" data-id="${receita.id}" type="button">VER RECEITA</button>
      <button class="btn-edit" data-id="${receita.id}">
        <img src="${STATIC_IMAGE_PATH}editar.svg" alt="Editar">
      </button>
      <button class="btn-delete" data-id="${receita.id}">
        <img src="${STATIC_IMAGE_PATH}trash.svg" alt="Excluir">
      </button>
    </div>
  `;
  return card;
}

async function renderFavorites(userId, token) {
  const content = document.getElementById("perfil-content");
  content.innerHTML = '';

  try {
    const response = await fetch(`${BASE_API_URL}/favoritos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Erro ao carregar favoritos');
    
    const favoritos = await response.json();
    
    if (favoritos.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <p>Você ainda não tem receitas favoritas.</p>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="perfil-header">
        <h2>Receitas Favoritas</h2>
      </div>
      <div class="favorites-grid"></div>
    `;

    const grid = content.querySelector('.favorites-grid');

    for (const receitaId of favoritos) {
      const receita = await fetchRecipeDetails(receitaId, token);
      if (receita) {
        grid.appendChild(createFavoriteCard(receita));
      }
    }

  } catch (error) {
    console.error("Erro:", error);
    content.innerHTML = `
      <div class="error-state">
        <p>Erro ao carregar favoritos.</p>
        <button class="btn-retry">Tentar novamente</button>
      </div>
    `;
    content.querySelector('.btn-retry').addEventListener('click', () => renderFavorites(userId, token));
  }
}

async function fetchRecipeDetails(receitaId, token) {
  try {
    const response = await fetch(`${RECEITAS_API_URL}/${receitaId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error(`Erro ao carregar receita ${receitaId}:`, error);
    return null;
  }
}

function createFavoriteCard(receita) {
  const card = document.createElement('div');
  card.className = 'favorite-card';
  card.innerHTML = `
    <img src="${escapeHtml(resolveImage(receita.imagem))}" alt="${escapeHtml(receita.titulo)}">
    <h4>${escapeHtml(receita.titulo)}</h4>
    <p class="favorite-description">${escapeHtml(receita.card_descricao || 'Descrição não informada.')}</p>
    <button class="btn-remove-favorite" data-id="${receita.id}">
      <img src="${STATIC_IMAGE_PATH}heart-light.svg" alt="Remover dos favoritos">
    </button>
  `;
  return card;
}

function setupEventListeners(usuario, token) {

  document.addEventListener('click', (e) => {
    const editRecipeBtn = e.target.closest('.btn-edit');
    if (editRecipeBtn) {
      openRecipeEditModal(editRecipeBtn.getAttribute('data-id'));
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.perfil-sair')) {
      showConfirm("Deseja sair da sua conta?", () => {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
          .finally(() => {
            localStorage.removeItem('usuarioLogado');
            goToHome();
          });
      });
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.perfil-excluir')) {
      showConfirm("Tem certeza que deseja excluir sua conta permanentemente?", async () => {
        try {
          const response = await fetch(`${BASE_API_URL}/${usuario.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            goToHome();
          } else {
            throw new Error('Falha ao excluir conta');
          }
        } catch (error) {
          console.error("Erro ao excluir conta:", error);
          showAlert("Erro ao excluir conta. Tente novamente.");
        }
      }, "Excluir");
    }
  });

  document.addEventListener('click', (e) => {
    const recipeBtn = e.target.closest('.recipe-button');
    if (recipeBtn) {
      window.location.href = `${ROOT_PREFIX}pages/detalhesreceita/receita.html?id=${recipeBtn.dataset.id}`;
      return;
    }
    const editBtn = e.target.closest('.perfil-editar');
    if (editBtn) {
      const campo = editBtn.getAttribute('data-campo');
      openEditModal(campo, usuario, token);
    }
  });

  document.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      const receitaId = deleteBtn.getAttribute('data-id');
      handleDeleteRecipe(receitaId, token);
    }
  });

  document.addEventListener('click', (e) => {
    const favBtn = e.target.closest('.btn-remove-favorite');
    if (favBtn) {
      const receitaId = favBtn.getAttribute('data-id');
      handleRemoveFavorite(receitaId, token);
    }
  });
}

async function openRecipeEditModal(receitaId) {
  const modal = document.getElementById('modal-edicao-receita');
  const form = document.getElementById('form-edicao-receita');
  if (!modal || !form) return;

  try {
    const response = await fetch(`${RECEITAS_API_URL}/${receitaId}`, { credentials: 'include' });
    if (!response.ok) throw new Error('Não foi possível carregar a receita');
    const receita = await response.json();
    form.titulo.value = receita.titulo || '';
    form.descricao.value = receita.card_descricao || '';
    form.tempo_preparo_min.value = receita.tempo_preparo_min || '';
    form.numero_porcoes.value = receita.numero_porcoes || '';
    form.imagem.value = receita.imagem || '';
    form.categoria_id.value = Array.isArray(receita.categoria_id) ? receita.categoria_id.join(',') : '';
    form.ingredientes_base.value = (receita.ingredientes_base || []).join('\n');
    form.ingredientes_molho.value = (receita.ingredientes_molho || []).join('\n');
    form.instrucoes.value = (receita.instrucoes || []).join('\n');
    modal.classList.remove('oculto');
    form.dataset.receitaId = receitaId;
  } catch (error) {
    showAlert(error.message);
  }
}

document.getElementById('cancelar-edicao-receita')?.addEventListener('click', () => {
  document.getElementById('modal-edicao-receita')?.classList.add('oculto');
});

document.getElementById('form-edicao-receita')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const linhas = (name) => form[name].value.split('\n').map(item => item.trim()).filter(Boolean);
  const categorias = form.categoria_id.value.split(',').map(Number).filter(Number.isInteger);
  const payload = {
    titulo: form.titulo.value.trim(),
    descricao: form.descricao.value.trim(),
    tempo_preparo_min: Number(form.tempo_preparo_min.value),
    numero_porcoes: Number(form.numero_porcoes.value),
    imagem: form.imagem.value.trim(),
    categoria_id: categorias,
    ingredientes_base: linhas('ingredientes_base'),
    ingredientes_molho: linhas('ingredientes_molho'),
    instrucoes: linhas('instrucoes')
  };
  try {
    const response = await fetch(`${RECEITAS_API_URL}/${form.dataset.receitaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Falha ao salvar receita');
    form.closest('.modal-edicao').classList.add('oculto');
    showAlert('Receita atualizada com sucesso!');
    if (usuarioAtual) renderUserRecipes(usuarioAtual.id, null);
  } catch (error) {
    showAlert(error.message);
  }
});

document.addEventListener('click', (event) => {
  if (event.target.closest('.btn-nova-receita')) {
    document.getElementById('modal-nova-receita')?.classList.remove('oculto');
  }
  if (event.target.closest('#cancelar-nova-receita')) {
    document.getElementById('modal-nova-receita')?.classList.add('oculto');
  }
});

fetch('/api/categorias')
  .then(response => response.ok ? response.json() : [])
  .then(categorias => {
    const select = document.getElementById('categoria-nova-receita');
    if (!select) return;
    categorias.forEach(categoria => {
      const option = document.createElement('option');
      option.value = categoria.id;
      option.textContent = categoria.nome;
      select.appendChild(option);
    });
  });

document.getElementById('adicionar-categoria-nova')?.addEventListener('click', () => {
  const select = document.getElementById('categoria-nova-receita');
  const container = document.getElementById('categorias-nova-selecionadas');
  const option = select?.options[select.selectedIndex];
  if (!option?.value || container.querySelector(`[data-id="${option.value}"]`)) return;
  const chip = document.createElement('span');
  chip.className = 'categoria-chip';
  chip.dataset.id = option.value;
  chip.textContent = option.textContent;
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.textContent = '×';
  remove.addEventListener('click', () => chip.remove());
  chip.appendChild(remove);
  container.appendChild(chip);
  select.value = '';
});

document.getElementById('form-nova-receita')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const file = form.imagem.files[0];
  const categorias = Array.from(document.querySelectorAll('#categorias-nova-selecionadas .categoria-chip'))
    .map(chip => Number(chip.dataset.id)).filter(Number.isInteger);
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    return showAlert('Selecione uma imagem JPG, PNG ou WebP de até 5 MB.');
  }
  if (!categorias.length) return showAlert('Informe ao menos uma categoria.');
  try {
    const upload = new FormData();
    upload.append('file', file);
    upload.append('upload_preset', 'saladdays');
    const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/dp3ypabuy/image/upload', { method: 'POST', body: upload });
    const image = await uploadResponse.json();
    if (!uploadResponse.ok || !image.secure_url) throw new Error('Falha no upload da imagem');
    const response = await fetch(RECEITAS_API_URL, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: form.titulo.value.trim(), descricao: form.descricao.value.trim(),
        tempo_preparo_min: Number(form.tempo.value), numero_porcoes: Number(form.porcoes.value),
        categorias, imagem: image.secure_url,
        ingredientesBaseTexto: form.base.value, ingredientesMolhoTexto: form.molho.value,
        modoPreparoTexto: form.preparo.value
      })
    });
    if (!response.ok) throw new Error((await response.json()).erro || 'Falha ao criar receita');
    form.reset();
    document.getElementById('categorias-nova-selecionadas').innerHTML = '';
    document.getElementById('modal-nova-receita').classList.add('oculto');
    showAlert('Receita criada com sucesso!');
    if (usuarioAtual) renderUserRecipes(usuarioAtual.id, null);
  } catch (error) { showAlert(error.message); }
});

async function handleDeleteRecipe(receitaId, token) {
  showConfirm("Tem certeza que deseja excluir esta receita?", async () => {
    try {
      const response = await fetch(`${RECEITAS_API_URL}/${receitaId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      
      if (response.ok) {
        showAlert("Receita excluída com sucesso!");
       
        if (usuarioAtual) renderUserRecipes(usuarioAtual.id, token);
      } else {
        throw new Error('Falha ao excluir receita');
      }
    } catch (error) {
      console.error("Erro ao excluir receita:", error);
      showAlert("Erro ao excluir receita. Tente novamente.");
    }
  }, "Excluir");
}

async function handleRemoveFavorite(receitaId, token) {
  try {
    const response = await fetch(`${BASE_API_URL}/favoritos`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ receitaId })
    });
    
    if (response.ok) {
      showAlert("Receita removida dos favoritos!");
      
      renderFavorites(usuario.id, token);
    } else {
      throw new Error('Falha ao remover favorito');
    }
  } catch (error) {
    console.error("Erro ao remover favorito:", error);
    showAlert("Erro ao remover receita dos favoritos. Tente novamente.");
  }
}

function openEditModal(campo, usuario, token) {
  const modal = document.getElementById("modal-edicao");
  const titulo = modal.querySelector("#modal-titulo");
  const inputUnico = modal.querySelector("#modal-input");
  const grupoUnico = modal.querySelector("#grupo-input-unico");
  const grupoSenha = modal.querySelector("#grupo-input-senha");
  const salvarBtn = modal.querySelector("#salvar-edicao");
  const cancelarBtn = modal.querySelector("#cancelar-edicao");

  titulo.textContent = `Editar ${campo.charAt(0).toUpperCase() + campo.slice(1)}`;
  
  if (campo === "senha") {
    grupoUnico.classList.add("oculto");
    grupoSenha.classList.remove("oculto");
    modal.querySelector("#senha-atual").value = "";
    modal.querySelector("#nova-senha").value = "";
    modal.querySelector("#confirmar-senha").value = "";
  } else {
    grupoUnico.classList.remove("oculto");
    grupoSenha.classList.add("oculto");
    inputUnico.value = usuario[campo];
  }

  modal.classList.remove("oculto");

  salvarBtn.onclick = async () => {
    try {
      let updateData = {};
      
      if (campo === "senha") {
        const senhaAtual = modal.querySelector("#senha-atual").value.trim();
        const novaSenha = modal.querySelector("#nova-senha").value.trim();
        const confirmarSenha = modal.querySelector("#confirmar-senha").value.trim();

        if (!senhaAtual || !novaSenha) {
          return showAlert("Preencha a senha atual e a nova senha.");
        }

        if (novaSenha !== confirmarSenha) {
          return showAlert("As senhas não coincidem!");
        }

        updateData = { senha: novaSenha, senhaAtual };
      } else {
        const novoValor = inputUnico.value.trim();
        if (!novoValor) return showAlert("O campo não pode estar vazio!");
        updateData = { [campo]: novoValor };
      }

      const response = await fetch(`${BASE_API_URL}/${usuario.id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        showAlert("Alterações salvas com sucesso!");
        modal.classList.add("oculto");
        
        const updatedUser = await fetchUserProfile(token);
        Object.assign(usuario, updatedUser);
        renderPerfil(updatedUser);
      } else {
        const data = await response.json().catch(() => ({}));
        const msg = data.error || 'Falha ao atualizar perfil';
        throw new Error(msg);
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      showAlert(error.message || "Erro ao salvar alterações. Tente novamente.");
    }
  };

  if (cancelarBtn) {
    cancelarBtn.onclick = () => {
      modal.classList.add("oculto");
    };
  }
}

function showAlert(message, callback) {
  let alertRoot = document.getElementById('custom-alert');
  if (!alertRoot) {
    alertRoot = document.createElement('div');
    alertRoot.id = 'custom-alert';
    alertRoot.className = 'alert-hidden';
    alertRoot.innerHTML = `
      <div class="alert-box">
        <button class="close-button" id="closeAlert">
          <img src="${STATIC_IMAGE_PATH}close2.svg" alt="Fechar alerta">
        </button>
        <div class="alert-message">
          <p id="alert-message">Mensagem</p>
          <button class="aceppt-button" id="alert-ok">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(alertRoot);
  }

  const msg = alertRoot.querySelector('#alert-message');
  const closeBtn = alertRoot.querySelector('#closeAlert');
  const okBtn = alertRoot.querySelector('#alert-ok');

  if (msg) msg.textContent = message;
  alertRoot.classList.remove('alert-hidden');
  alertRoot.classList.add('alert-show');

  const hide = () => {
    alertRoot.classList.remove('alert-show');
    alertRoot.classList.add('alert-hidden');
    if (callback) callback();
  };

  if (closeBtn) closeBtn.addEventListener('click', hide, { once: true });
  if (okBtn) okBtn.addEventListener('click', hide, { once: true });
}

function showConfirm(message, onConfirm, confirmText = "Confirmar") {
  const modal = document.getElementById('confirm-modal');
  const msg = document.getElementById('confirm-message');
  const btnNo = document.getElementById('confirm-no');
  const btnYes = document.getElementById('confirm-yes');

  if (!modal || !msg || !btnNo || !btnYes) {
    if (window.confirm(message)) onConfirm();
    return;
  }

  msg.textContent = message;
  btnYes.textContent = confirmText;
  modal.classList.remove('confirm-hidden');

  const closeModal = () => {
    modal.classList.add('confirm-hidden');
  };

  btnNo.addEventListener('click', closeModal, { once: true });
  btnYes.addEventListener('click', () => {
    closeModal();
    onConfirm();
  }, { once: true });
}
