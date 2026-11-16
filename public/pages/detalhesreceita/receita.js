const DETAIL_API_URL = '/api/receitas';
const DETAIL_IMAGE_PATH = '../../assets/images/';

const resolveDetailImage = (image) => {
  if (!image) return `${DETAIL_IMAGE_PATH}cardClassica.jpg`;
  return String(image).startsWith('http') ? image : `${DETAIL_IMAGE_PATH}${image}`;
};

const text = (value, fallback = 'Não informado') => String(value ?? '').trim() || fallback;

const updateFavoriteButton = (button, isFavorite) => {
  button.setAttribute('aria-pressed', String(isFavorite));
  button.setAttribute('aria-label', isFavorite ? 'Remover receita dos favoritos' : 'Favoritar receita');
  button.querySelector('.favorite-icon').textContent = '♡';
};

const loadFavoriteState = async (recipeId, button) => {
  try {
    const response = await fetch('/api/usuarios/favoritos', { credentials: 'include' });
    if (!response.ok) return;
    const favorites = await response.json();
    updateFavoriteButton(button, Array.isArray(favorites) && favorites.map(Number).includes(Number(recipeId)));
  } catch (error) {
    console.warn('Não foi possível carregar o estado do favorito.', error);
  }
};

const toggleFavorite = async (recipeId, button) => {
  const wasFavorite = button.getAttribute('aria-pressed') === 'true';
  button.disabled = true;
  try {
    const response = await fetch('/api/usuarios/favoritos', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receitaId: Number(recipeId) })
    });
    if (response.status === 401) {
      window.location.href = '../../login.html';
      return;
    }
    if (!response.ok) throw new Error('Não foi possível atualizar o favorito');
    updateFavoriteButton(button, !wasFavorite);
  } catch (error) {
    console.error(error);
  } finally {
    button.disabled = false;
  }
};

const createMetric = (label, value) => {
  const item = document.createElement('div');
  item.className = 'metric';
  item.innerHTML = `<span class="metric-label"></span><span class="metric-value"></span>`;
  item.querySelector('.metric-label').textContent = label;
  item.querySelector('.metric-value').textContent = value;
  return item;
};

const createChecklist = (items, heading) => {
  const wrapper = document.createElement('div');
  if (heading) {
    const subheading = document.createElement('h3');
    subheading.textContent = heading;
    wrapper.appendChild(subheading);
  }
  const list = document.createElement('ul');
  list.className = 'checklist';
  items.forEach((item, index) => {
    const li = document.createElement('li');
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `detail-check-${heading || 'step'}-${index}`;
    const span = document.createElement('span');
    span.textContent = item;
    label.htmlFor = checkbox.id;
    label.append(checkbox, span);
    li.appendChild(label);
    list.appendChild(li);
  });
  wrapper.appendChild(list);
  return wrapper;
};

const renderRecipe = (recipe) => {
  const root = document.getElementById('recipe-detail');
  root.innerHTML = '';
  const base = Array.isArray(recipe.ingredientes_base) ? recipe.ingredientes_base : [];
  const sauce = Array.isArray(recipe.ingredientes_molho) ? recipe.ingredientes_molho : [];
  const steps = Array.isArray(recipe.instrucoes) ? recipe.instrucoes : [];

  const hero = document.createElement('section');
  hero.className = 'hero-card';
  hero.innerHTML = `
    <button class="favorite-toggle" type="button" aria-label="Favoritar receita" aria-pressed="false"><span class="favorite-icon" aria-hidden="true">♡</span></button>
    <div class="hero-info">
      <h1></h1><p class="hero-description"></p><div class="hero-metrics"></div>
    </div>
    <div class="hero-image"><img alt=""></div>`;
  hero.querySelector('h1').textContent = text(recipe.titulo, 'Receita');
  hero.querySelector('.hero-description').textContent = text(recipe.card_descricao, 'Descrição não informada.');
  const metrics = hero.querySelector('.hero-metrics');
  metrics.append(
    createMetric('TEMPO', recipe.tempo_preparo_min ? `${recipe.tempo_preparo_min} MIN` : '—'),
    createMetric('PORÇÕES', text(recipe.numero_porcoes, '—')),
    createMetric('NÍVEL', '—'), createMetric('AVALIAÇÕES', '—')
  );
  const image = hero.querySelector('img');
  image.src = resolveDetailImage(recipe.imagem); image.alt = text(recipe.titulo, 'Imagem da receita');
  const favorite = hero.querySelector('.favorite-toggle');
  favorite.addEventListener('click', () => toggleFavorite(recipe.id, favorite));
  loadFavoriteState(recipe.id, favorite);

  const columns = document.createElement('section');
  columns.className = 'recipe-columns';
  const ingredients = document.createElement('div'); ingredients.className = 'recipe-panel';
  ingredients.innerHTML = '<h2>INGREDIENTES</h2>';
  if (base.length) ingredients.appendChild(createChecklist(base, 'Base'));
  if (sauce.length) ingredients.appendChild(createChecklist(sauce, 'Molho'));
  if (!base.length && !sauce.length) ingredients.appendChild(createChecklist(['Não informado'], ''));
  const preparation = document.createElement('div'); preparation.className = 'recipe-panel';
  preparation.innerHTML = '<h2>MODO DE PREPARO</h2>';
  preparation.appendChild(createChecklist(steps.length ? steps : ['Não informado'], ''));
  columns.append(ingredients, preparation);

  const info = document.createElement('section'); info.className = 'info-grid';
  info.innerHTML = `<div class="info-card"><h3>INFORMAÇÃO NUTRICIONAL</h3><div class="info-body"><p>Não informado</p></div></div><div class="info-card"><h3>BENEFÍCIOS</h3><div class="info-body"><p>Não informado</p></div></div>`;
  root.append(hero, columns, info);
};

document.addEventListener('DOMContentLoaded', async () => {
  const id = new URLSearchParams(window.location.search).get('id');
  const status = document.querySelector('.detail-status');
  if (!id) { status.textContent = 'Receita não encontrada.'; return; }
  try {
    const response = await fetch(`${DETAIL_API_URL}/${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error('Receita não encontrada');
    renderRecipe(await response.json());
  } catch (error) {
    console.error(error);
    status.textContent = 'Não foi possível carregar esta receita.';
  }
});
