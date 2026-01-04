const loginBox = document.getElementById("login-box");
const registerBox = document.getElementById("register-box");
const showRegisterLink = document.getElementById("show-register");
const showLoginLink = document.getElementById("show-login");
const basePath = window.location.pathname.includes('/pages/') ? '../../' : './';


showRegisterLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginBox.classList.remove("active");
    registerBox.classList.add("active");
});

showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    registerBox.classList.remove("active");
    loginBox.classList.add("active");
});


document.querySelector('#login-box form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const loginInput = document.querySelector('#login-input').value;
    const senhaInput = document.querySelector('#login-box input[type="password"]').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                login: loginInput,
                senha: senhaInput
            })
        });

        const data = await response.json();

        if (response.ok) {
            const usuario = data.usuario || data.user;
            localStorage.setItem('token', data.token);
            if (usuario) {
              localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
            }
            window.location.href = `${basePath}index.html`;
        } else {
            alert(data.error || 'Login falhou!');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao conectar com o servidor');
    }
});

document.querySelector('#register-box form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        nome: document.querySelector('input[name="nome"]').value.trim(),
        login: document.querySelector('input[name="login"]').value.trim(),
        email: document.querySelector('input[name="email"]').value.trim(),
        senha: document.querySelector('#register-box input[name="senha"]').value.trim()
    };

    if (!Object.values(formData).every(Boolean)) {
        alert('Todos os campos são obrigatórios!');
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const modal = document.getElementById('confirmation-modal');
            modal.style.display = 'flex';
            
            setTimeout(() => {
                window.location.href = `${basePath}index.html`;
            }, 3000);
        } else {
            const error = await response.json();
            alert(error.error || 'Erro no registro');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao conectar com o servidor');
    }
});

const inputBoxes = document.querySelectorAll('.input-box input');
inputBoxes.forEach(input => {
    input.addEventListener('focus', () => {
        input.nextElementSibling.classList.add('float');
    });
    input.addEventListener('blur', () => {
        if (input.value.trim() === "") {
            input.nextElementSibling.classList.remove('float');
        }
    });
});

const togglePasswordCheckbox = document.querySelector('#toggle-password');
togglePasswordCheckbox.addEventListener('change', () => {
    const passwordInput = document.querySelector('#senha');
    passwordInput.type = togglePasswordCheckbox.checked ? 'text' : 'password';
});
