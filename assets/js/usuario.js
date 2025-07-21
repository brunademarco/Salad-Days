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
      </div>
    `;
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
        function renderReceitas() {

        }
      }
      else if (view === "favoritos") {
        content.innerHTML = "<p>Suas receitas favoritas aparecerão aqui.</p>";
      }
    });
  });
});


content.addEventListener('click', (e) => {
  if (e.target.classList.contains('perfil-editar')) {
    const campo = e.target.getAttribute('data-campo');
    abrirModalEdicao(campo);
  }
});