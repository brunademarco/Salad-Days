const BASE_IMAGE_PATH = '/assets/images/'; 

document.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:3000/receitas')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro HTTP! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(receitas => {  
      const container = document.getElementById('lista-receitas');
      
      if (!Array.isArray(receitas)) {
        throw new Error('Dados recebidos não são um array');
      }

      receitas.forEach(receita => {
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
    })
    .catch(error => console.error('Erro ao carregar receitas:', error));
});

