const BASE_IMAGE_PATH = '/assets/images/'; 

document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("perfil-content");
  const botoes = document.querySelectorAll(".sidebar-button");

  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuarioLogado) {
    content.innerHTML = "<p>Você precisa estar logado para ver seu perfil.</p>";
    return;
  }

  function renderPerfil() {
    content.innerHTML = `
      <div class="perfil-header"><h2>Perfil</h2></div>
      <div class="card-perfil">
        <p><strong>Nome:</strong></p>
        <div class="perfil-info">
          <p class="perfil-dado">${usuarioLogado.nome}</p>
          <button class="perfil-editar" data-campo="nome">
            <img src="/assets/images/editar.svg" alt="Editar Nome">
          </button>
        </div>
        <p><strong>Email:</strong></p>
        <div class="perfil-info">
          <p class="perfil-dado">${usuarioLogado.email}</p>
          <button class="perfil-editar" data-campo="email">
            <img src="/assets/images/editar.svg" alt="Editar Email">
          </button>
        </div>
        <p><strong>Login:</strong></p>
        <div class="perfil-info">
          <p class="perfil-dado">${usuarioLogado.login}</p>
          <button class="perfil-editar" data-campo="login">
            <img src="/assets/images/editar.svg" alt="Editar Login">
          </button>
        </div>
        <p><strong>Senha:</strong></p>
        <div class="perfil-info">
          <p class="perfil-dado">${"•".repeat(usuarioLogado.senha.length)}</p>
          <button class="perfil-editar" data-campo="senha">
            <img src="/assets/images/editar.svg" alt="Editar Senha">
          </button>
        </div>
        <button class="perfil-sair" data-campo="sair">
            <img src="/assets/images/Sair.svg" alt="Sair do perfil">
          </button>
      </div>
    `;

    document.addEventListener("click", (e) => {
        if (e.target.closest(".perfil-sair")) {
        showConfirm("Tem certeza que deseja sair?", () => {
            localStorage.removeItem("usuarioLogado");
            window.location.href = "../../index.html";
        }, "Sair");
    }
});

  }

  renderPerfil();

  botoes.forEach((btn) => {
    btn.addEventListener("click", () => {

      botoes.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const view = btn.getAttribute("data-view");
      if (view === "perfil") renderPerfil();
      else if (view === "receitas") {
        content.innerHTML = "<p>Suas receitas aparecerão aqui.</p>";
        
         renderReceitas(); 

    function renderReceitas() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (!usuarioLogado) {
      content.innerHTML = "<p>Você precisa estar logado para ver suas receitas.</p>";
      return;
    }

    fetch(`http://localhost:3000/receitas?autorId=${usuarioLogado.id}`)
      .then(res => res.json())
      .then(receitas => {
        if (receitas.length === 0) {
          content.innerHTML = "<p>Você ainda não enviou nenhuma receita.</p>";
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
          const card = document.createElement('div');
          card.classList.add('recipe-card');

          card.innerHTML = `
            <h3>${receita.titulo}</h3>
            <p><strong>Categoria:</strong> ${receita.categoria}</p>
            <p><strong>Descrição:</strong> ${receita.descrição}</p>
            <div class="editar-e-sair"> 
                <button class="editar-receita" data-campo="receita">
                    <img src="/assets/images/editar.svg" alt="Editar receita">
                </button>
                <button class="excluir-receita" data-campo="receita">
                    <img src="/assets/images/trash(1).svg" alt="Excluir receita">
                </button>
            </div>
          `;

          lista.appendChild(card);
        });
      })
      .catch(err => {
        console.error('Erro ao buscar receitas:', err);
        content.innerHTML = "<p>Erro ao carregar suas receitas.</p>";
      });
    }
      }
      else if (view === "favoritos") {
        content.innerHTML = "<p>Suas receitas favoritas aparecerão aqui.</p>";
      }
    });
  });

  content.addEventListener('click', (e) => {
  const excluirBtn = e.target.closest('.excluir-receita');
  if (excluirBtn) {
    const card = excluirBtn.closest('.recipe-card');
    const titulo = card.querySelector('h3').textContent;

    showConfirm(`Tem certeza que deseja excluir a receita "${titulo}"?`, () => {
     
      const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
      
      fetch(`http://localhost:3000/receitas?autorId=${usuarioLogado.id}`)
        .then(res => res.json())
        .then(receitas => {
          const receitaAlvo = receitas.find(r => r.titulo === titulo && r.autorId === usuarioLogado.id);
          if (!receitaAlvo) {
            alert('Receita não encontrada.');
            return;
          }

          fetch(`http://localhost:3000/receitas/${receitaAlvo.id}`, {
            method: 'DELETE'
          })
          .then(() => {
            alert('Receita excluída com sucesso!');
            card.remove(); 
          })
          .catch(err => {
            console.error('Erro ao excluir receita:', err);
            alert('Erro ao excluir receita.');
          });
        });
    });
  }
});

});


content.addEventListener('click', (e) => {
  if (e.target.classList.contains('perfil-editar')) {
    const campo = e.target.getAttribute('data-campo');
    abrirModalEdicao(campo);
  }
});

function showConfirm(msg, onConfirm) {
  const modal = document.getElementById('confirm-modal');
  const message = document.getElementById('confirm-message');
  const yesBtn = document.getElementById('confirm-yes');
  const noBtn = document.getElementById('confirm-no');

  message.textContent = msg;
  modal.classList.remove('confirm-hidden');

  const cleanup = () => {
    modal.classList.add('confirm-hidden');
    yesBtn.replaceWith(yesBtn.cloneNode(true));
    noBtn.replaceWith(noBtn.cloneNode(true));
  };

  yesBtn.addEventListener('click', () => {
    cleanup();
    onConfirm();
  });

  noBtn.addEventListener('click', () => {
    cleanup();
  });
}