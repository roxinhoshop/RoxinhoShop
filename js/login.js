// ===== Roxinho Shop - E-COMMERCE DE ELETRÔNICOS =====
// Desenvolvido por Gabriel (gabwvr)
// Este arquivo contém funções para gerenciar [FUNCIONALIDADE]
// Comentários didáticos para facilitar o entendimento


document.addEventListener('DOMContentLoaded', () => {
  // ------------------------
  // 🎨 Partículas animadas
  // ------------------------
  function gerarParticulas() {
    const container = document.createElement("div");
    container.classList.add("particles");
    document.body.appendChild(container);

    for (let i = 0; i < 50; i++) {
      const particle = document.createElement("div");
      particle.classList.add("particle");
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.animationDuration = `${3 + Math.random() * 5}s`;
      particle.style.animationDelay = `${Math.random() * 5}s`;
      container.appendChild(particle);
    }
  }
  gerarParticulas();

  // ------------------------
  // ✅ Validação de login
  // ------------------------
  const formulario = document.getElementById('formularioLogin');
  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');
  const erroEmail = document.getElementById('erro-email');
  const erroSenha = document.getElementById('erro-senha');

  formulario.addEventListener('submit', function (e) {
    e.preventDefault();

    // 🔹 Limpa mensagens e estilos
    erroEmail.textContent = '';
    erroSenha.textContent = '';
    emailInput.classList.remove('error');
    senhaInput.classList.remove('error');

    let temErro = false;

    // 🔹 Validação de e-mail
    if (emailInput.value.trim() === '') {
      erroEmail.textContent = 'Insira seu e-mail.';
      emailInput.classList.add('error');
      temErro = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
      erroEmail.textContent = 'Insira um e-mail válido.';
      emailInput.classList.add('error');
      temErro = true;
    }

    // 🔹 Validação de senha
    if (senhaInput.value.trim() === '') {
      erroSenha.textContent = 'Insira sua senha.';
      senhaInput.classList.add('error');
      temErro = true;
    }

    // 🔹 Se não houver erros → redireciona
    if (!temErro) {
      window.location.href = 'home.html';
    }
  });
});

// ------------------------
// 🔹 Login com Google
// ------------------------
function handleCredentialResponse(response) {
  console.log("Google JWT: ", response.credential);
  // Aqui você pode enviar para o backend ou autenticar
}

   function toggleCheckbox() {
            const checkbox = document.getElementById('remember');
            checkbox.checked = !checkbox.checked;
            
            // Adiciona uma pequena animação de feedback
            const wrapper = document.querySelector('.remember-me');
            wrapper.style.transform = 'scale(0.98)';
            setTimeout(() => {
                wrapper.style.transform = 'scale(1)';
            }, 100);
        }

    window.onload = function () {
    google.accounts.id.initialize({
      client_id: "SUA_CLIENT_ID_AQUI.apps.googleusercontent.com", // troque pelo seu
      callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
      document.getElementById("googleBtn"),
      {
        theme: "outline",   // opções: outline, filled_blue, filled_black
        size: "large",      // opções: small, medium, large
        shape: "pill",      // opções: rect, pill, circle
        logo_alignment: "left"
      }
    );
  }

  