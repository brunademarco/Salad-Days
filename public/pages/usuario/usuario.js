const BASE_API_URL = '/api/usuarios';
const RECEITAS_API_URL = '/api/receitas';
const ROOT_PREFIX = window.location.pathname.includes('/pages/') ? '../../' : './';
const STATIC_IMAGE_PATH = `${ROOT_PREFIX}assets/images/`;

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
  
  const token = localStorage.getItem("token");
  if (!token) {
    goToLogin();
    return;
  }

  try {
    
    const usuario = await fetchUserProfile(token);
    if (!usuario) return;

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
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
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
        <p class="perfil-dado">${usuario.nome}</p>
        <button class="perfil-editar" data-campo="nome">
          <img src="${STATIC_IMAGE_PATH}editar.svg" alt="Editar Nome">
        </button>
      </div>
      <p><strong>Email:</strong></p>
      <div class="perfil-info">
        <p class="perfil-dado">${usuario.email}</p>
        <button class="perfil-editar" data-campo="email">
          <img src="${STATIC_IMAGE_PATH}editar.svg" alt="Editar Email">
        </button>
      </div>
      <p><strong>Login:</strong></p>
      <div class="perfil-info">
        <p class="perfil-dado">${usuario.login}</p>
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
          <img src="${STATIC_IMAGE_PATH}trash-light.svg" alt="Excluir conta">
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
          <a href="/nova-receita.html" class="btn-primary">Criar primeira receita</a>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="perfil-header">
        <h2>Suas Receitas</h2>
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
  card.innerHTML = `
    <h3>${receita.titulo}</h3>
    <img src="${resolveImage(receita.imagem)}" alt="${receita.titulo}" loading="lazy">
    <p class="recipe-description">${receita.card_descricao}</p>
    <div class="recipe-actions">
      <button class="btn-edit" data-id="${receita.id}">
        <img src="${STATIC_IMAGE_PATH}editar.svg" alt="Editar">
      </button>
      <button class="btn-delete" data-id="${receita.id}">
        <img src="${STATIC_IMAGE_PATH}trash-light.svg" alt="Excluir">
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
    <img src="${resolveImage(receita.imagem)}" alt="${receita.titulo}">
    <h4>${receita.titulo}</h4>
    <button class="btn-remove-favorite" data-id="${receita.id}">
      <img src="${STATIC_IMAGE_PATH}heart-filled.svg" alt="Remover dos favoritos">
    </button>
  `;
  return card;
}

function setupEventListeners(usuario, token) {

  document.addEventListener('click', (e) => {
    if (e.target.closest('.perfil-sair')) {
      showConfirm("Deseja sair da sua conta?", () => {
        localStorage.removeItem("token");
        goToHome();
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
            localStorage.removeItem("token");
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

async function handleDeleteRecipe(receitaId, token) {
  showConfirm("Tem certeza que deseja excluir esta receita?", async () => {
    try {
      const response = await fetch(`${RECEITAS_API_URL}/${receitaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        showAlert("Receita excluída com sucesso!");
       
        const userId = JSON.parse(atob(token.split('.')[1])).id;
        renderUserRecipes(userId, token);
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
      
      const userId = JSON.parse(atob(token.split('.')[1])).id;
      renderFavorites(userId, token);
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
