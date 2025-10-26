// ===== Roxinho Shop - E-COMMERCE DE ELETRÔNICOS =====
// Desenvolvido por Gabriel (gabwvr)
// Este arquivo contém funções para gerenciar [FUNCIONALIDADE]
// Comentários didáticos para facilitar o entendimento


// Classe para manuseio do formulário de cadastro
class FormularioCadastro {
    constructor() {
        this.formulario = document.getElementById('formularioCadastro');
        this.entradaNome = document.getElementById('nome');
        this.entradaSobrenome = document.getElementById('sobrenome');
        this.entradaEmail = document.getElementById('email');
        this.entradaSenha = document.getElementById('senha');
        this.entradaConfirmarSenha = document.getElementById('confirmarSenha');
        this.botaoCadastro = document.getElementById('botaoCadastro');
        this.indicadorContainer = document.getElementById('indicador-senha-container');
        this.progressoSenha = document.getElementById('progresso-senha');
        this.nivelSenha = document.getElementById('nivel-senha');
        this.pontuacaoSenha = document.getElementById('pontuacao-senha');
        this.avisoSenhaCurta = document.getElementById('aviso-senha-curta');
        
        this.inicializar();
    }

    inicializar() {
        this.formulario.addEventListener('submit', this.lidarComEnvio.bind(this));
        
        // Validações em tempo real
        this.entradaNome.addEventListener('blur', () => this.validarNome());
        this.entradaNome.addEventListener('input', () => this.limparErro('nome'));
        
        this.entradaSobrenome.addEventListener('blur', () => this.validarSobrenome());
        this.entradaSobrenome.addEventListener('input', () => this.limparErro('sobrenome'));
        
        this.entradaEmail.addEventListener('blur', () => this.validarEmail());
        this.entradaEmail.addEventListener('input', () => this.limparErro('email'));
        
        this.entradaSenha.addEventListener('input', () => {
            this.verificarForcaSenha();
            this.limparErro('senha');

            // ✅ Revalida confirmação em tempo real
            this.validarConfirmacaoSenha();
        });
        
        this.entradaConfirmarSenha.addEventListener('input', () => {
            this.validarConfirmacaoSenha();
        });
    }

    validarNome() {
        const nome = this.entradaNome.value.trim();
        if (!nome) return this.mostrarErro('nome', 'Nome é obrigatório');
        if (nome.length < 2) return this.mostrarErro('nome', 'Nome deve ter pelo menos 2 caracteres');
        if (!/^[a-záàâãéèêíïóôõöúçñ\s]+$/i.test(nome)) return this.mostrarErro('nome', 'Nome deve conter apenas letras');
        this.mostrarSucesso('nome'); return true;
    }

    validarSobrenome() {
        const sobrenome = this.entradaSobrenome.value.trim();
        if (!sobrenome) return this.mostrarErro('sobrenome', 'Sobrenome é obrigatório');
        if (sobrenome.length < 2) return this.mostrarErro('sobrenome', 'Sobrenome deve ter pelo menos 2 caracteres');
        if (!/^[a-záàâãéèêíïóôõöúçñ\s]+$/i.test(sobrenome)) return this.mostrarErro('sobrenome', 'Sobrenome deve conter apenas letras');
        this.mostrarSucesso('sobrenome'); return true;
    }

    validarEmail() {
        const email = this.entradaEmail.value.trim();
        const padraoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return this.mostrarErro('email', 'E-mail é obrigatório');
        if (!padraoEmail.test(email)) return this.mostrarErro('email', 'E-mail inválido');
        this.mostrarSucesso('email'); return true;
    }

    verificarForcaSenha() {
        const senha = this.entradaSenha.value;
        
        if (senha.length === 0) {
            this.indicadorContainer.classList.remove('visivel');
            this.avisoSenhaCurta.classList.remove('visivel');
            return 0;
        }

        if (senha.length < 8) {
            this.indicadorContainer.classList.remove('visivel');
            this.avisoSenhaCurta.classList.add('visivel');
            return 0;
        }

        this.avisoSenhaCurta.classList.remove('visivel');

        let score = 0;
        if (senha.length < 8) score = 10;
        else if (senha.length < 12) score = 20;
        else if (senha.length < 16) score = 40;
        else score = 90;

        if (/[a-z]/.test(senha)) score += 1;
        if (/[A-Z]/.test(senha)) score += 10;
        if (/[0-9]/.test(senha)) score += 10;
        if (/[^A-Za-z0-9]/.test(senha)) score += 10;

        score = Math.min(score, 100);

        let nivel, classe;
        if (score < 40) { nivel = 'Fraca'; classe = 'forca-fraca'; }
        else if (score < 80) { nivel = 'Moderada'; classe = 'forca-moderada'; }
        else { nivel = 'Forte'; classe = 'forca-forte'; }

        this.indicadorContainer.className = 'indicador-senha-container visivel';
        this.indicadorContainer.classList.add(classe);

        this.progressoSenha.style.width = `${Math.min(score, 100)}%`;
        this.nivelSenha.textContent = nivel;

        return score;
    }

    validarSenha() {
        const senha = this.entradaSenha.value;
        if (!senha) return this.mostrarErro('senha', 'Senha é obrigatória');
        if (senha.length < 8) return this.mostrarErro('senha', 'Senha deve ter pelo menos 8 caracteres');
        const forca = this.verificarForcaSenha();
        if (forca < 50) return this.mostrarErro('senha', 'Senha muito fraca - Use uma combinação mais forte');
        this.mostrarSucesso('senha'); return true;
    }

    validarConfirmacaoSenha() {
        const senha = this.entradaSenha.value;
        const confirmarSenha = this.entradaConfirmarSenha.value;

        if (!confirmarSenha) {
            return this.mostrarErro('confirmar-senha', 'Confirmação de senha é obrigatória');
        }
        if (senha !== confirmarSenha) {
            return this.mostrarErro('confirmar-senha', 'As senhas não coincidem');
        }

        this.mostrarSucesso('confirmar-senha');
        return true;
    }

    mostrarErro(campo, mensagem) {
        const entrada = document.getElementById(campo === 'confirmar-senha' ? 'confirmarSenha' : campo);
        const divErro = document.getElementById(`erro-${campo}`);

        entrada.classList.remove('valido');
        entrada.classList.add('invalido');

        divErro.textContent = mensagem;
        divErro.classList.remove('apenas-leitura-tela');
        divErro.classList.add('mensagem-erro', 'visivel');
        return false;
    }

    mostrarSucesso(campo) {
        const entrada = document.getElementById(campo === 'confirmar-senha' ? 'confirmarSenha' : campo);
        const divErro = document.getElementById(`erro-${campo}`);

        entrada.classList.remove('invalido');
        entrada.classList.add('valido');

        divErro.textContent = '';
        divErro.className = 'apenas-leitura-tela';
    }

    limparErro(campo) {
        const entrada = document.getElementById(campo === 'confirmar-senha' ? 'confirmarSenha' : campo);
        const divErro = document.getElementById(`erro-${campo}`);

        entrada.classList.remove('invalido', 'valido');
        divErro.textContent = '';
        divErro.className = 'apenas-leitura-tela';
    }

    definirCarregamento(carregando) {
        if (carregando) {
            this.botaoCadastro.classList.add('carregando');
            this.botaoCadastro.disabled = true;
            this.botaoCadastro.querySelector('span').style.opacity = '0';
        } else {
            this.botaoCadastro.classList.remove('carregando');
            this.botaoCadastro.disabled = false;
            this.botaoCadastro.querySelector('span').style.opacity = '1';
        }
    }

    async lidarComEnvio(evento) {
        evento.preventDefault();

        const nomeValido = this.validarNome();
        const sobrenomeValido = this.validarSobrenome();
        const emailValido = this.validarEmail();
        const senhaValida = this.validarSenha();
        const confirmacaoValida = this.validarConfirmacaoSenha();

        if (!nomeValido || !sobrenomeValido || !emailValido || !senhaValida || !confirmacaoValida) {
            return;
        }

        this.definirCarregamento(true);

        try {
            // Simular criação da conta
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Salvar dados do usuário para verificação
            const dadosUsuario = {
                nome: this.entradaNome.value.trim(),
                sobrenome: this.entradaSobrenome.value.trim(),
                email: this.entradaEmail.value.trim(),
                senha: this.entradaSenha.value,
                dataCadastro: new Date().toISOString()
            };
            
            // Salvar email para a página de verificação
            localStorage.setItem('emailCadastro', dadosUsuario.email);
            localStorage.setItem('dadosCadastro', JSON.stringify(dadosUsuario));
            
            // Mostrar mensagem de sucesso
            this.mostrarNotificacao('Conta criada com sucesso! Verifique seu e-mail.', 'sucesso');
            
            // Redirecionar para página de verificação
            setTimeout(() => {
                window.location.href = `verificacao.html?email=${encodeURIComponent(dadosUsuario.email)}`;
            }, 1500);
            
        } catch (erro) {
            console.error('Erro no cadastro:', erro);
            this.mostrarNotificacao('Erro ao criar conta. Tente novamente.', 'erro');
        } finally {
            this.definirCarregamento(false);
        }
    }

    mostrarNotificacao(mensagem, tipo = 'info') {
        // Remover notificação anterior
        const notificacaoAnterior = document.querySelector('.notificacao-sistema');
        if (notificacaoAnterior) {
            notificacaoAnterior.remove();
        }

        const notificacao = document.createElement('div');
        notificacao.className = `notificacao-sistema notificacao-${tipo}`;
        notificacao.textContent = mensagem;

        notificacao.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        switch (tipo) {
            case 'sucesso':
                notificacao.style.backgroundColor = '#10b981';
                break;
            case 'erro':
                notificacao.style.backgroundColor = '#ef4444';
                break;
            default:
                notificacao.style.backgroundColor = '#7c3aed';
        }

        document.body.appendChild(notificacao);

        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notificacao.parentNode) {
                        notificacao.remove();
                    }
                }, 300);
            }
        }, 4000);
    }
}

// Inicializar quando o DOM for carregado
document.addEventListener('DOMContentLoaded', () => {
    new FormularioCadastro();

    const entradas = document.querySelectorAll('.entrada-formulario');
    entradas.forEach(entrada => {
        entrada.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
        });
        entrada.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });
    });
});