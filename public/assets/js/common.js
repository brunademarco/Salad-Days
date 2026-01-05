const getRootPrefix = () =>
  window.location.pathname.includes('/pages/') ? '../../' : './';

const navigateTo = (relativePath) => {
  window.location.href = `${getRootPrefix()}${relativePath}`;
};

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
  const modalFavoritos = document.getElementById('modal-favoritos');
  const modalFavoritosContent = modalFavoritos?.querySelector('.modal-content');
  if (openFavoritosBtn) {
    openFavoritosBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('modal-favoritos');
      loadFavoritesPreview();
    });
  }

  if (modalFavoritos && modalFavoritosContent) {
    document.addEventListener('click', (e) => {
      const isOpen = modalFavoritos.classList.contains('show');
      if (!isOpen) return;
      if (modalFavoritosContent.contains(e.target)) return;
      if (openFavoritosBtn && openFavoritosBtn.contains(e.target)) return;
      closeModal('modal-favoritos');
    });
  }

  const closeFavoritosBtn = document.getElementById('closeFavoritosModal');
  if (closeFavoritosBtn) {
    closeFavoritosBtn.addEventListener('click', () => {
      closeModal('modal-favoritos');
    });
  }
});

const renderFavoritesEmptyState = (container, onExplore) => {
  if (!container) return;
  container.innerHTML = `
    <div class="favorites-empty">
      <p class="favorites-empty-title">Vazio</p>
      <button class="favorites-empty-btn" type="button">
        Explorar Receitas <span class="favorites-empty-arrow">→</span>
      </button>
    </div>
  `;
  const btn = container.querySelector('.favorites-empty-btn');
  if (btn) btn.addEventListener('click', onExplore);
};

const loadFavoritesPreview = async () => {
  const modal = document.getElementById('modal-favoritos');
  if (!modal) return;
  const column = modal.querySelector('.column-recipes');
  if (!column) return;

  const token = localStorage.getItem('token');
  if (!token) {
    renderFavoritesEmptyState(column, () => navigateTo('pages/receitas/receitas.html'));
    return;
  }

  try {
    const response = await fetch('/api/usuarios/favoritos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      renderFavoritesEmptyState(column, () => navigateTo('pages/receitas/receitas.html'));
      return;
    }
    const favoritos = await response.json();
    if (!Array.isArray(favoritos) || favoritos.length === 0) {
      renderFavoritesEmptyState(column, () => navigateTo('pages/receitas/receitas.html'));
      return;
    }
    column.innerHTML = '';
  } catch (error) {
    renderFavoritesEmptyState(column, () => navigateTo('pages/receitas/receitas.html'));
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const loginRedirectBtn = document.getElementById('login-redirect');
  const token = localStorage.getItem('token');

  if (loginRedirectBtn) {
    loginRedirectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(token ? 'pages/usuario/usuario.html' : 'login.html');
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('usuarioLogado'));
  if (!token || user) return;

  fetch('/api/usuarios/perfil', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => {
      if (!res.ok) throw new Error('Sessão inválida');
      return res.json();
    })
    .then(profile => {
      localStorage.setItem('usuarioLogado', JSON.stringify(profile));
    })
    .catch(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('usuarioLogado');
    });
});
