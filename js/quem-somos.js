// ===== Roxinho Shop - E-COMMERCE DE ELETRÔNICOS =====
// Desenvolvido por Gabriel (gabwvr)
// Este arquivo contém funções para gerenciar [FUNCIONALIDADE]
// Comentários didáticos para facilitar o entendimento


// ================== ANIMAÇÃO AO ROLAR ==================
const caixas = document.querySelectorAll(".caixa-destaque");

function revelarCaixas() {
  caixas.forEach(caixa => {
    const topo = caixa.getBoundingClientRect().top;
    const alturaJanela = window.innerHeight;

    if (topo < alturaJanela - 100) {
      caixa.classList.add("visivel");
    }
  });
}

window.addEventListener("scroll", revelarCaixas);
window.addEventListener("load", revelarCaixas);

// ================== VALIDAÇÃO DE FORMULÁRIO (Contato) ==================
const form = document.querySelector("form");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = form.querySelector("#nome");
    const email = form.querySelector("#email");
    const msg = form.querySelector("#mensagem");

    if (!nome.value.trim() || !email.value.trim() || !msg.value.trim()) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      alert("Digite um e-mail válido.");
      return;
    }

    alert("Mensagem enviada com sucesso!");
    form.reset();
  });
}

// ================== DESTAQUE NO MENU DA PÁGINA ATUAL ==================
const linksMenu = document.querySelectorAll("nav a");
const caminho = window.location.pathname.split("/").pop();

linksMenu.forEach(link => {
  if (link.getAttribute("href") === caminho) {
    link.style.color = "#7c3aed";
    link.style.fontWeight = "bold";
  }
});
