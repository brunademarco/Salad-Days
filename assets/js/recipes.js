document.addEventListener('DOMContentLoaded', () => {
    fetch('../../db/receitas.json')
      .then(response => response.json())
      .then(data => {
        const container = document.getElementById('lista-receitas');
        data.receitas.forEach(receita => {
          const card = document.createElement('div');
          card.className = 'recipe-card';
          card.innerHTML = `
            <img src="../../assets/images/${receita.imagem}" alt="${receita.titulo}">
            <h3>${receita.titulo}</h3>
            <p>${receita.card_descricao}</p>
            <button class="recipe-button">Ver Receita</button>
          `;
          container.appendChild(card);
        });
      })
      .catch(error => console.error('Erro ao carregar receitas:', error));
  });