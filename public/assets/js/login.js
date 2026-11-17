const loginBox = document.getElementById("login-box");
const registerBox = document.getElementById("register-box");
const forgotPasswordBox = document.getElementById('forgot-password-box');
const resetPasswordBox = document.getElementById('reset-password-box');
const showRegisterLink = document.getElementById("show-register");
const showLoginLink = document.getElementById("show-login");
const forgotPasswordLink = document.getElementById('forgot-password-link');
const backToLoginLink = document.getElementById('back-to-login');
const resetBackToLoginLink = document.getElementById('reset-back-to-login');
const basePath = window.location.pathname.includes('/pages/') ? '../../' : './';
const loginFeedbackDialog = document.getElementById('login-feedback-dialog');
const loginFeedbackTitle = document.getElementById('login-feedback-title');
const loginFeedbackMessage = document.getElementById('login-feedback-message');
const closeLoginFeedback = document.getElementById('close-login-feedback');
const confirmLoginFeedback = document.getElementById('confirm-login-feedback');

const showLoginMessage = (message, title = 'Não foi possível continuar') => {
    loginFeedbackTitle.textContent = title;
    loginFeedbackMessage.textContent = message;
    if (!loginFeedbackDialog.open) loginFeedbackDialog.showModal();
    confirmLoginFeedback.focus();
};

const activateLoginView = (activeView) => {
    [loginBox, registerBox, forgotPasswordBox, resetPasswordBox].forEach((view) => {
        view.classList.toggle('active', view === activeView);
    });
};

closeLoginFeedback.addEventListener('click', () => loginFeedbackDialog.close());
confirmLoginFeedback.addEventListener('click', () => loginFeedbackDialog.close());
loginFeedbackDialog.addEventListener('click', (event) => {
    if (event.target === loginFeedbackDialog) loginFeedbackDialog.close();
});

const resetHashParams = new URLSearchParams(window.location.hash.slice(1));
let passwordResetToken = resetHashParams.get('redefinir-senha');
if (passwordResetToken) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    activateLoginView(resetPasswordBox);
} else if (new URLSearchParams(window.location.search).get('cadastro') === '1') {
    activateLoginView(registerBox);
}


showRegisterLink.addEventListener("click", (e) => {
    e.preventDefault();
    activateLoginView(registerBox);
});

showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    activateLoginView(loginBox);
});

forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    activateLoginView(forgotPasswordBox);
});

backToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    activateLoginView(loginBox);
});

resetBackToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    passwordResetToken = null;
    activateLoginView(loginBox);
});


document.querySelector('#login-box form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const loginInput = document.querySelector('#login-input').value.trim();
    const senhaInput = document.querySelector('#login-box input[type="password"]').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                login: loginInput,
                senha: senhaInput
            })
        });

        const data = await response.json();

        if (response.ok) {
            const usuario = data.usuario || data.user;
            if (usuario) {
              localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
            }
            window.location.href = `${basePath}index.html`;
        } else {
            showLoginMessage(data.error || 'Login falhou.', 'Não foi possível entrar');
        }
    } catch (error) {
        console.error('Erro:', error);
        showLoginMessage('Erro ao conectar com o servidor.', 'Não foi possível entrar');
    }
});

document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('recovery-email');
    const email = emailInput.value.trim();
    if (!emailInput.validity.valid || !email) {
        showLoginMessage('Informe um e-mail válido para continuar.', 'Confira o e-mail');
        emailInput.focus();
        return;
    }

    const submitButton = e.currentTarget.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
        const response = await fetch('/api/auth/password-reset/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Não foi possível solicitar a redefinição.');
        showLoginMessage(data.message, 'Confira seu e-mail');
    } catch (error) {
        showLoginMessage(error.message || 'Erro ao conectar com o servidor.', 'Não foi possível enviar o link');
    } finally {
        submitButton.disabled = false;
    }
});

document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const passwordInput = document.getElementById('new-password');
    const confirmationInput = document.getElementById('confirm-new-password');
    const senha = passwordInput.value;
    if (!passwordResetToken) {
        showLoginMessage('Solicite um novo link para redefinir sua senha.', 'Link inválido ou expirado');
        return;
    }
    if (senha.length < 8) {
        showLoginMessage('A nova senha deve ter pelo menos 8 caracteres.', 'Confira a nova senha');
        passwordInput.focus();
        return;
    }
    if (senha !== confirmationInput.value) {
        showLoginMessage('As senhas não coincidem. Confira os campos e tente novamente.', 'Confira as senhas');
        confirmationInput.focus();
        return;
    }

    const submitButton = e.currentTarget.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
        const response = await fetch('/api/auth/password-reset/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: passwordResetToken, senha })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Não foi possível redefinir a senha.');
        passwordResetToken = null;
        e.currentTarget.reset();
        activateLoginView(loginBox);
        showLoginMessage(data.message, 'Senha atualizada');
    } catch (error) {
        showLoginMessage(error.message || 'Erro ao conectar com o servidor.', 'Não foi possível redefinir a senha');
    } finally {
        submitButton.disabled = false;
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
        showLoginMessage('Todos os campos são obrigatórios.', 'Confira os campos');
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const data = await response.json();
            if (!data.token) {
                throw new Error('Resposta de cadastro sem token');
            }

            if (data.usuario) {
                localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
            }

            const modal = document.getElementById('confirmation-modal');
            modal.style.display = 'flex';
            
            setTimeout(() => {
                window.location.href = `${basePath}index.html`;
            }, 3000);
        } else {
            const error = await response.json();
            showLoginMessage(error.error || 'Erro no cadastro.', 'Não foi possível criar a conta');
        }
    } catch (error) {
        console.error('Erro:', error);
        showLoginMessage('Erro ao conectar com o servidor.', 'Não foi possível criar a conta');
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
