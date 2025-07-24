const BASE_IMAGE_PATH = '/assets/images/'; 
const API_URL = 'http://localhost:3000';

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
          <p class="perfil-dado">${"•".repeat(8)}</p>
          <button class="perfil-editar" data-campo="senha">
            <img src="/assets/images/editar.svg" alt="Editar Senha">
          </button>
        </div>
        <div class="button-space">
          <button class="perfil-sair" data-campo="sair">
            <img src="/assets/images/Sair.svg" alt="Sair do perfil">
          </button>
          <button class="perfil-excluir" data-campo="excluir">
            <img src="/assets/images/trash-light.svg" alt="Excluir conta">
          </button>
        </div>
      </div>
    `;
  }

  renderPerfil();

  document.addEventListener('click', (e) => {
    const sairBtn = e.target.closest('.perfil-sair');
    const editarBtn = e.target.closest('.perfil-editar');
    const excluirBtn = e.target.closest('.perfil-excluir');
    const excluirReceitaBtn = e.target.closest('.excluir-receita');

    if (sairBtn) {
      showConfirm("Tem certeza que deseja sair?", () => {
        localStorage.removeItem("usuarioLogado");
        window.location.href = "../../index.html";
      }, "Sair");
    }

    if (editarBtn) {
      const campo = editarBtn.getAttribute('data-campo');
      abrirModalEdicao(campo);
    }

    if (excluirBtn) {
      showConfirm("Tem certeza que deseja excluir sua conta?", () => {
        const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (!usuario) return;

        fetch(`${API_URL}/usuarios/${usuario.id}`, {
          method: 'DELETE'
        })
        .then(() => {
          localStorage.removeItem('usuarioLogado');
          alert("Conta excluída com sucesso!");
          window.location.href = "../../index.html";
        })
        .catch(err => {
          console.error("Erro ao excluir conta:", err);
          alert("Erro ao excluir conta.");
        });
      }, "Excluir");
    }

    if (excluirReceitaBtn) {
      const card = excluirReceitaBtn.closest('.recipe-card');
      const titulo = card.querySelector('h3').textContent;

      showConfirm(`Tem certeza que deseja excluir a receita "${titulo}"?`, () => {
        const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
        fetch(`${API_URL}/receitas?autorId=${usuario.id}`)
          .then(res => res.json())
          .then(receitas => {
            const receitaAlvo = receitas.find(r => r.titulo === titulo && r.autorId === usuario.id);
            if (!receitaAlvo) {
              alert('Receita não encontrada.');
              return;
            }

            fetch(`${API_URL}/receitas/${receitaAlvo.id}`, {
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

  botoes.forEach((btn) => {
    btn.addEventListener("click", () => {
      botoes.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const view = btn.getAttribute("data-view");
      if (view === "perfil") renderPerfil();
      else if (view === "receitas") renderReceitas();
      else if (view === "favoritos") {
        content.innerHTML = "<p>Suas receitas favoritas aparecerão aqui.</p>";
      }
    });
  });

  function renderReceitas() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    if (!usuarioLogado) {
      content.innerHTML = "<p>Você precisa estar logado para ver suas receitas.</p>";
      return;
    }

    fetch(`${API_URL}/receitas?autorId=${usuarioLogado.id}`)
      .then(res => res.json())
      .then(receitas => {
        if (receitas.length === 0) {
          content.innerHTML = `
            <div style="
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100%;
              width: 100%;
            ">
              <p style="text-align: center; font-size: 1.2rem;">Você ainda não enviou nenhuma receita.</p>
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
});

function abrirModalEdicao(campo) {
  const modal = document.getElementById("modal-edicao");
  const titulo = document.getElementById("modal-titulo");
  const inputUnico = document.getElementById("modal-input");
  const grupoUnico = document.getElementById("grupo-input-unico");
  const grupoSenha = document.getElementById("grupo-input-senha");
  const senhaAtualInput = document.getElementById("senha-atual");
  const novaSenhaInput = document.getElementById("nova-senha");
  const salvarBtn = document.getElementById("salvar-edicao");

  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  titulo.textContent = `Editar ${campo.charAt(0).toUpperCase() + campo.slice(1)}`;
  modal.classList.remove("oculto");

  if (campo === "senha") {
    grupoUnico.classList.add("oculto");
    grupoSenha.classList.remove("oculto");
    senhaAtualInput.value = "";
    novaSenhaInput.value = "";
  } else {
    grupoUnico.classList.remove("oculto");
    grupoSenha.classList.add("oculto");
    inputUnico.type = "text";
    inputUnico.value = usuario[campo];
  }

  salvarBtn.onclick = () => {
    if (campo === "senha") {
      const senhaAtual = senhaAtualInput.value.trim();
      const novaSenha = novaSenhaInput.value.trim();

      if (!senhaAtual || !novaSenha) {
        return alert("Preencha os dois campos de senha.");
      }

      const senhaHash = CryptoJS.SHA256(senhaAtual).toString(CryptoJS.enc.Base64);
      if (senhaHash !== usuario.senha) {
        return alert("Senha atual incorreta.");
      }

      const novaSenhaHash = CryptoJS.SHA256(novaSenha).toString(CryptoJS.enc.Base64);
      usuario.senha = novaSenhaHash;
    } else {
      const novoValor = inputUnico.value.trim();
      if (!novoValor) return alert("O campo não pode estar vazio.");
      usuario[campo] = novoValor;
    }

    localStorage.setItem("usuarioLogado", JSON.stringify(usuario));

    fetch(`${API_URL}/usuarios/${usuario.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [campo]: usuario[campo] })
    })
    .then(res => {
      if (!res.ok) {
        return res.text().then(texto => {
          throw new Error(`Erro ${res.status}: ${texto}`);
        });
      }
      return res.json();
    })
    .then(() => {
    modal.classList.add("oculto");

    try {
      alert("Dados alterados com sucesso!");
    } catch (e) {
      console.error("Erro ao exibir alerta personalizado:", e);
    }

  document.dispatchEvent(new Event("DOMContentLoaded"));
})

    .catch(err => {
      console.error("Erro detalhado:", err);
      alert("Erro ao atualizar o perfil.");
    });
  };
}

document.getElementById("cancelar-edicao").addEventListener("click", () => {
  document.getElementById("modal-edicao").classList.add("oculto");
});

function showConfirm(msg, onConfirm, acao = "Confirmar") {
  const modal = document.getElementById('confirm-modal');
  const message = document.getElementById('confirm-message');
  const yesBtn = document.getElementById('confirm-yes');
  const noBtn = document.getElementById('confirm-no');

  message.textContent = msg;
  yesBtn.textContent = acao;
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
