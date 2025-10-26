// ===== Roxinho Shop - E-COMMERCE DE ELETRÔNICOS =====
// Desenvolvido por Gabriel (gabwvr)
// Este arquivo contém funções para gerenciar [FUNCIONALIDADE]
// Comentários didáticos para facilitar o entendimento


        document.addEventListener('DOMContentLoaded', function() {
            const formulario = document.getElementById('formularioEsqueceuSenha');
            const emailInput = document.getElementById('email');
            const botaoEnviar = document.getElementById('botaoEnviar');
            const mensagemSucesso = document.getElementById('mensagem-sucesso');

            // Função para validar e-mail
            function validarEmail(email) {
                const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return regex.test(email);
            }

            // Função para mostrar erro
            function mostrarErro(elemento, mensagem) {
                const grupoFormulario = elemento.closest('.form-group');
                const elementoErro = grupoFormulario.querySelector('.error-message');
                
                elemento.classList.add('error');
                elementoErro.textContent = mensagem;
                elementoErro.style.display = 'flex';
            }

            // Função para limpar erro
            function limparErro(elemento) {
                const grupoFormulario = elemento.closest('.form-group');
                const elementoErro = grupoFormulario.querySelector('.error-message');
                
                elemento.classList.remove('error');
                elementoErro.textContent = '';
                elementoErro.style.display = 'none';
            }

            // Função para enviar e-mail de recuperação (simulação)
            async function enviarEmailRecuperacao(email) {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        // Simula envio do e-mail
                        if (Math.random() > 0.1) { // 90% de sucesso
                            resolve({
                                success: true,
                                message: 'E-mail enviado com sucesso!'
                            });
                        } else {
                            reject({
                                success: false,
                                message: 'Erro interno do servidor. Tente novamente.'
                            });
                        }
                    }, 2000);
                });
            }

            // Event listener para limpar erro ao digitar
            emailInput.addEventListener('input', function() {
                if (this.classList.contains('error')) {
                    limparErro(this);
                }
                
                // Validação visual do e-mail
                const emailValido = validarEmail(this.value);
                let corBorda = '#e5e7eb';
                
                if (this.value.length > 0) {
                    corBorda = emailValido ? '#10b981' : '#ef4444';
                }
                
                this.style.borderColor = corBorda;
            });

            // Event listener para o formulário
            formulario.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = emailInput.value.trim();
                let formularioValido = true;

                // Limpar estados anteriores
                limparErro(emailInput);
                mensagemSucesso.style.display = 'none';

                // Validação do e-mail
                if (!email) {
                    mostrarErro(emailInput, 'Este campo é obrigatório');
                    formularioValido = false;
                
                } else if (!validarEmail(email)) {
                    mostrarErro(emailInput, 'E-mail inválido');
                    formularioValido = false;
                }

                if (!formularioValido) {
                    return;
                }

                // Desabilitar botão durante o envio
                const textoOriginal = botaoEnviar.innerHTML;
                botaoEnviar.disabled = true;
                botaoEnviar.innerHTML = '<span>Enviando...</span>';
                botaoEnviar.style.opacity = '0.7';

                try {
                    const resultado = await enviarEmailRecuperacao(email);
                    
                    if (resultado.success) {
                        // Mostrar mensagem de sucesso
                        mensagemSucesso.style.display = 'block';
                        formulario.reset();
                        emailInput.style.borderColor = '#e5e7eb';
                        
                        // Opcional: redirecionar para login após alguns segundos
                        setTimeout(() => {
                            // window.location.href = './login.html';
                        }, 5000);
                    }
                } catch (error) {
                    mostrarErro(emailInput, error.message || 'Erro ao enviar e-mail. Tente novamente.');
                } finally {
                    // Reabilitar botão
                    botaoEnviar.disabled = false;
                    botaoEnviar.innerHTML = textoOriginal;
                    botaoEnviar.style.opacity = '1';
                }
            });

            // Efeito de foco nos inputs
            emailInput.addEventListener('focus', function() {
                this.parentElement.style.transform = 'translateY(-2px)';
            });
            
            emailInput.addEventListener('blur', function() {
                this.parentElement.style.transform = 'translateY(0)';
            });
        });

        // Função para ser usada em um ambiente real
        function enviarEmailRecuperacaoReal(email) {
            return fetch('/api/esqueceu-senha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: email
                })
            })
            .then(response => response.json())
            .catch(error => {
                console.error('Erro:', error);
                throw new Error('Erro de conexão. Verifique sua internet.');
            });
        }
        
