const getRootPrefix = () =>
  window.location.pathname.includes('/pages/') ? '../../' : './';

(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches ||
      matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cursor = document.createElement('img');
  cursor.className = 'custom-cursor'; cursor.src = `${getRootPrefix()}assets/images/alface.png`;
  cursor.alt = ''; cursor.setAttribute('aria-hidden', 'true'); document.body.appendChild(cursor);
  document.body.classList.add('custom-cursor-active');
  let tx = -100, ty = -100, x = tx, y = ty, tr = 0, r = 0, ts = 1, s = 1, px = tx, py = ty, frame;
  const lerp = (a, b, n) => a + (b - a) * n;
  const animate = () => {
    x = lerp(x, tx, .16); y = lerp(y, ty, .16); r = lerp(r, tr, .12); s = lerp(s, ts, .14);
    cursor.style.transform = `translate3d(${x + 7}px, ${y + 7}px, 0) rotate(${r}deg) scale(${s})`;
    tr = lerp(tr, 0, .08); frame = requestAnimationFrame(animate);
  };
  const move = (event) => {
    tx = event.clientX; ty = event.clientY;
    const dx = tx - px, dy = ty - py, speed = Math.min(Math.hypot(dx, dy), 28);
    tr = Math.max(-14, Math.min(14, dx * .45 + dy * .12 + speed * .15)); px = tx; py = ty;
    ts = event.target.closest('a, button, [role="button"], label') ? 1.13 : 1;
    cursor.classList.add('is-visible');
  };
  const leave = () => { cursor.classList.remove('is-visible'); ts = 1; };
  document.addEventListener('mousemove', move, { passive: true });
  document.documentElement.addEventListener('mouseleave', leave);
  frame = requestAnimationFrame(animate);
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); cursor.remove();
    document.body.classList.remove('custom-cursor-active'); }, { once: true });
})();

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

const renderFavoritesPreview = (container, recipes) => {
  container.innerHTML = '';
  recipes.forEach((recipe) => {
    const card = document.createElement('article');
    card.className = 'favorite-preview-card';

    const title = document.createElement('h3');
    title.textContent = recipe.titulo || 'Receita';

    const description = document.createElement('p');
    description.textContent = recipe.card_descricao || 'Descrição não informada.';

    const link = document.createElement('a');
    link.className = 'favorite-preview-link';
    link.href = `${getRootPrefix()}pages/detalhesreceita/receita.html?id=${encodeURIComponent(recipe.id)}`;
    link.setAttribute('aria-label', `Ver receita ${recipe.titulo || ''}`.trim());
    const arrow = document.createElement('img');
    arrow.src = `${getRootPrefix()}assets/images/Arrow right.png`;
    arrow.alt = '';
    link.appendChild(arrow);

    card.append(title, description, link);
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', (event) => {
      if (!event.target.closest('a')) window.location.href = link.href;
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        window.location.href = link.href;
      }
    });
    container.appendChild(card);
  });
};

const loadFavoritesPreview = async () => {
  const modal = document.getElementById('modal-favoritos');
  if (!modal) return;
  const column = modal.querySelector('.column-recipes');
  if (!column) return;

  try {
    const response = await fetch('/api/usuarios/favoritos', {
      credentials: 'include'
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
    const receitas = await Promise.all(favoritos.map(async (id) => {
      const recipeResponse = await fetch(`/api/receitas/${encodeURIComponent(id)}`);
      return recipeResponse.ok ? recipeResponse.json() : null;
    }));
    const receitasValidas = receitas.filter(Boolean);
    if (receitasValidas.length === 0) {
      renderFavoritesEmptyState(column, () => navigateTo('pages/receitas/receitas.html'));
      return;
    }
    renderFavoritesPreview(column, receitasValidas);
  } catch (error) {
    renderFavoritesEmptyState(column, () => navigateTo('pages/receitas/receitas.html'));
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const loginRedirectBtn = document.getElementById('login-redirect');
  if (loginRedirectBtn) {
    loginRedirectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      fetch('/api/usuarios/perfil', { credentials: 'include' })
        .then(response => navigateTo(response.ok ? 'pages/usuario/usuario.html' : 'login.html'))
        .catch(() => navigateTo('login.html'));
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('usuarioLogado'));
  if (user) return;

  fetch('/api/usuarios/perfil', {
    credentials: 'include'
  })
    .then(res => {
      if (!res.ok) throw new Error('Sessão inválida');
      return res.json();
    })
    .then(profile => {
      localStorage.setItem('usuarioLogado', JSON.stringify(profile));
    })
    .catch(() => {
      localStorage.removeItem('usuarioLogado');
    });
});
