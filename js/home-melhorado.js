// ==================== CARROSSEL MODERNO 2025 ====================
document.addEventListener('DOMContentLoaded', function() {
  
  // ==================== CONFIGURAÇÕES DO CARROSSEL ====================
  const carrossel = {
    slideAtual: 0,
    totalSlides: 3,
    autoPlay: true,
    intervalo: 5000,
    timer: null,
    
    elementos: {
      slidesWrapper: document.getElementById('slidesWrapper'),
      indicadores: document.querySelectorAll('.indicador'),
      btnAnterior: document.getElementById('btnAnterior'),
      btnProximo: document.getElementById('btnProximo'),
      btnPlayPause: document.getElementById('btnPlayPause')
    }
  };
  
  // ==================== FUNÇÕES DO CARROSSEL ====================
  function irParaSlide(indice) {
    carrossel.slideAtual = indice;
    
    if (carrossel.elementos.slidesWrapper) {
      const translateX = -indice * 100;
      carrossel.elementos.slidesWrapper.style.transform = `translateX(${translateX}%)`;
    }
    
    // Atualizar indicadores
    carrossel.elementos.indicadores.forEach((indicador, i) => {
      indicador.classList.toggle('ativo', i === indice);
    });
    
    // Atualizar slides ativos
    const slides = document.querySelectorAll('.slide');
    slides.forEach((slide, i) => {
      slide.classList.toggle('ativo', i === indice);
    });
  }
  
  function proximoSlide() {
    const proximo = (carrossel.slideAtual + 1) % carrossel.totalSlides;
    irParaSlide(proximo);
  }
  
  function slideAnterior() {
    const anterior = carrossel.slideAtual === 0 ? carrossel.totalSlides - 1 : carrossel.slideAtual - 1;
    irParaSlide(anterior);
  }
  
  function iniciarAutoPlay() {
    if (carrossel.autoPlay) {
      carrossel.timer = setInterval(proximoSlide, carrossel.intervalo);
    }
  }
  
  function pararAutoPlay() {
    if (carrossel.timer) {
      clearInterval(carrossel.timer);
      carrossel.timer = null;
    }
  }
  
  function alternarAutoPlay() {
    if (carrossel.autoPlay) {
      pararAutoPlay();
      carrossel.autoPlay = false;
      if (carrossel.elementos.btnPlayPause) {
        carrossel.elementos.btnPlayPause.innerHTML = '<i class="fas fa-play"></i>';
      }
    } else {
      iniciarAutoPlay();
      carrossel.autoPlay = true;
      if (carrossel.elementos.btnPlayPause) {
        carrossel.elementos.btnPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
      }
    }
  }
  
  // ==================== EVENT LISTENERS DO CARROSSEL ====================
  
  // Botões de navegação
  if (carrossel.elementos.btnAnterior) {
    carrossel.elementos.btnAnterior.addEventListener('click', slideAnterior);
  }
  
  if (carrossel.elementos.btnProximo) {
    carrossel.elementos.btnProximo.addEventListener('click', proximoSlide);
  }
  
  // Botão play/pause
  if (carrossel.elementos.btnPlayPause) {
    carrossel.elementos.btnPlayPause.addEventListener('click', alternarAutoPlay);
  }
  
  // Indicadores
  carrossel.elementos.indicadores.forEach((indicador, indice) => {
    indicador.addEventListener('click', () => irParaSlide(indice));
  });
  
  // Navegação por teclado
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') {
      slideAnterior();
    } else if (e.key === 'ArrowRight') {
      proximoSlide();
    } else if (e.key === ' ') {
      e.preventDefault();
      alternarAutoPlay();
    }
  });
  
  // Pausar autoplay ao passar o mouse
  const carrosselContainer = document.querySelector('.carrossel-moderno');
  if (carrosselContainer) {
    carrosselContainer.addEventListener('mouseenter', pararAutoPlay);
    carrosselContainer.addEventListener('mouseleave', () => {
      if (carrossel.autoPlay) {
        iniciarAutoPlay();
      }
    });
  }
  
  // Clique nos slides para navegar
  const slides = document.querySelectorAll('.slide');
  slides.forEach((slide, indice) => {
    slide.addEventListener('click', function() {
      const link = slide.getAttribute('data-link');
      if (link) {
        window.location.href = link;
      }
    });
  });
  
  // ==================== CONTROLES DE VÍDEO ====================
  const video = document.getElementById('videoAnuncio');
  const btnPlayPauseVideo = document.getElementById('btnPlayPauseVideo');
  const btnMute = document.getElementById('btnMute');
  
  if (video && btnPlayPauseVideo) {
    btnPlayPauseVideo.addEventListener('click', function() {
      if (video.paused) {
        video.play();
        btnPlayPauseVideo.innerHTML = '<i class="fas fa-pause"></i>';
      } else {
        video.pause();
        btnPlayPauseVideo.innerHTML = '<i class="fas fa-play"></i>';
      }
    });
  }
  
  if (video && btnMute) {
    btnMute.addEventListener('click', function() {
      if (video.muted) {
        video.muted = false;
        btnMute.innerHTML = '<i class="fas fa-volume-up"></i>';
      } else {
        video.muted = true;
        btnMute.innerHTML = '<i class="fas fa-volume-mute"></i>';
      }
    });
  }
  
  // ==================== ANIMAÇÕES DE ENTRADA ====================
  function animarElementos() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'fadeIn 0.8s ease forwards';
        }
      });
    }, {
      threshold: 0.1
    });
    
    // Observar categorias
    const categorias = document.querySelectorAll('.categoria-card');
    categorias.forEach((categoria, indice) => {
      categoria.style.opacity = '0';
      categoria.style.animationDelay = `${indice * 0.2}s`;
      observer.observe(categoria);
    });
    
    // Observar vídeo
    const videoSection = document.querySelector('.video-anuncio');
    if (videoSection) {
      videoSection.style.opacity = '0';
      observer.observe(videoSection);
    }
  }
  
  // ==================== OTIMIZAÇÕES DE PERFORMANCE ====================
  
  // Lazy loading para imagens
  function implementarLazyLoading() {
    const imagens = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });
    
    imagens.forEach(img => imageObserver.observe(img));
  }
  
  // Preload das próximas imagens do carrossel
  function preloadImagens() {
    const slides = document.querySelectorAll('.slide img');
    slides.forEach(img => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = img.src;
      document.head.appendChild(link);
    });
  }
  
  // ==================== RESPONSIVIDADE AVANÇADA ====================
  function ajustarParaMobile() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Ajustar intervalo do carrossel para mobile
      carrossel.intervalo = 7000;
      
      // Pausar vídeo em mobile para economizar dados
      if (video && !video.paused) {
        video.pause();
      }
    }
  }
  
  // ==================== ANALYTICS E TRACKING ====================
  function trackInteracoes() {
    // Track cliques nos slides
    slides.forEach((slide, indice) => {
      slide.addEventListener('click', () => {
        console.log(`Slide ${indice + 1} clicado`);
        // Aqui você pode integrar com Google Analytics ou outro serviço
      });
    });
    
    // Track tempo de visualização
    let tempoInicio = Date.now();
    window.addEventListener('beforeunload', () => {
      const tempoTotal = Date.now() - tempoInicio;
      console.log(`Tempo na página: ${Math.round(tempoTotal / 1000)}s`);
    });
  }
  
  // ==================== ACESSIBILIDADE ====================
  function melhorarAcessibilidade() {
    // Adicionar ARIA labels
    const controles = document.querySelectorAll('.btn-controle');
    controles.forEach(controle => {
      if (controle.classList.contains('btn-anterior')) {
        controle.setAttribute('aria-label', 'Slide anterior');
      } else if (controle.classList.contains('btn-proximo')) {
        controle.setAttribute('aria-label', 'Próximo slide');
      }
    });
    
    // Adicionar role para indicadores
    carrossel.elementos.indicadores.forEach((indicador, indice) => {
      indicador.setAttribute('role', 'button');
      indicador.setAttribute('aria-label', `Ir para slide ${indice + 1}`);
    });
    
    // Pausar animações se o usuário preferir
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      carrossel.autoPlay = false;
      pararAutoPlay();
    }
  }
  
  // ==================== INICIALIZAÇÃO ====================
  function inicializar() {
    // Iniciar carrossel
    iniciarAutoPlay();
    
    // Configurar animações
    animarElementos();
    
    // Implementar lazy loading
    implementarLazyLoading();
    
    // Preload de imagens
    preloadImagens();
    
    // Ajustes para mobile
    ajustarParaMobile();
    
    // Tracking
    trackInteracoes();
    
    // Acessibilidade
    melhorarAcessibilidade();
    
    console.log('Home melhorada inicializada com sucesso!');
  }
  
  // ==================== EVENT LISTENERS GLOBAIS ====================
  
  // Redimensionamento da janela
  window.addEventListener('resize', ajustarParaMobile);
  
  // Visibilidade da página (pausar quando não visível)
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      pararAutoPlay();
      if (video && !video.paused) {
        video.pause();
      }
    } else if (carrossel.autoPlay) {
      iniciarAutoPlay();
    }
  });
  
  // ==================== INICIALIZAR TUDO ====================
  inicializar();
});

// ==================== FUNÇÕES UTILITÁRIAS GLOBAIS ====================

// Função para criar notificações
window.mostrarNotificacaoHome = function(mensagem, tipo = 'info') {
  const notificacao = document.createElement('div');
  notificacao.className = `notificacao-home notificacao-${tipo}`;
  notificacao.innerHTML = `
    <div class="notificacao-conteudo">
      <i class="fas fa-${tipo === 'sucesso' ? 'check-circle' : 'info-circle'}"></i>
      <span>${mensagem}</span>
    </div>
  `;
  
  document.body.appendChild(notificacao);
  
  // Animar entrada
  setTimeout(() => {
    notificacao.classList.add('mostrar');
  }, 100);
  
  // Remover após 3 segundos
  setTimeout(() => {
    notificacao.classList.remove('mostrar');
    setTimeout(() => {
      if (notificacao.parentElement) {
        notificacao.remove();
      }
    }, 300);
  }, 3000);
};

// Função para scroll suave
window.scrollSuave = function(elemento) {
  if (typeof elemento === 'string') {
    elemento = document.querySelector(elemento);
  }
  
  if (elemento) {
    elemento.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};

// ==================== ESTILOS CSS PARA NOTIFICAÇÕES ====================
const estilosNotificacoes = `
<style>
.notificacao-home {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 1rem 1.5rem;
  z-index: 10000;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  max-width: 300px;
}

.notificacao-home.mostrar {
  transform: translateX(0);
}

.notificacao-conteudo {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.notificacao-sucesso {
  border-left: 4px solid #10b981;
}

.notificacao-info {
  border-left: 4px solid #3b82f6;
}

.notificacao-sucesso i {
  color: #10b981;
}

.notificacao-info i {
  color: #3b82f6;
}
</style>
`;

// Adicionar estilos ao head
document.head.insertAdjacentHTML('beforeend', estilosNotificacoes);

