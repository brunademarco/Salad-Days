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

document.addEventListener('DOMContentLoaded', () => {
  const loginRedirectBtn = document.getElementById('login-redirect');
  const user = JSON.parse(localStorage.getItem('usuarioLogado'));

  if (loginRedirectBtn) {
    loginRedirectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(user ? 'pages/usuario/usuario.html' : 'login.html');
    });
  }
});
