/**
 * 🎭 TESTES E2E - Interface do Matias
 * 
 * Testes end-to-end para validar toda a experiência do usuário
 * com o assistente virtual Matias
 */

describe('Matias - Interface do Usuário', () => {
  
  beforeEach(() => {
    // Visitar a página principal
    cy.visit('/');
    
    // Fazer login se necessário
    cy.window().then((win) => {
      if (!win.localStorage.getItem('auth_token')) {
        cy.login('user@test.com', 'password123');
      }
    });
  });

  describe('🗨️ Interface de Chat', () => {
    it('deve carregar o widget do Matias corretamente', () => {
      // Verificar se o widget está visível
      cy.get('[data-testid="matias-widget"]').should('be.visible');
      
      // Verificar elementos do chat
      cy.get('[data-testid="matias-avatar"]').should('be.visible');
      cy.get('[data-testid="chat-messages"]').should('be.visible');
      cy.get('[data-testid="message-input"]').should('be.visible');
      cy.get('[data-testid="send-button"]').should('be.visible');
      
      // Verificar mensagem de boas-vindas
      cy.get('[data-testid="chat-messages"]')
        .should('contain', 'Olá! Eu sou o Matias')
        .should('contain', 'Como posso ajudar');
    });

    it('deve enviar e receber mensagens corretamente', () => {
      const testMessage = 'Olá Matias, preciso de ajuda';
      
      // Digitar mensagem
      cy.get('[data-testid="message-input"]')
        .type(testMessage);
      
      // Enviar mensagem
      cy.get('[data-testid="send-button"]').click();
      
      // Verificar mensagem enviada
      cy.get('[data-testid="user-message"]')
        .last()
        .should('contain', testMessage);
      
      // Aguardar resposta do Matias
      cy.get('[data-testid="matias-message"]', { timeout: 10000 })
        .should('be.visible')
        .should('contain', 'Matias');
    });

    it('deve processar consulta técnica sobre freios', () => {
      const technicalQuery = 'Meu carro está fazendo barulho quando freio';
      
      cy.get('[data-testid="message-input"]')
        .type(technicalQuery);
      
      cy.get('[data-testid="send-button"]').click();
      
      // Verificar resposta técnica
      cy.get('[data-testid="matias-message"]', { timeout: 10000 })
        .should('contain.text', /freio|pastilha|diagnóstico/i);
      
      // Verificar se apareceram sugestões de ação
      cy.get('[data-testid="action-suggestions"]')
        .should('be.visible')
        .within(() => {
          cy.get('[data-testid="action-schedule"]').should('be.visible');
          cy.get('[data-testid="action-estimate"]').should('be.visible');
        });
    });

    it('deve permitir agendamento através do chat', () => {
      // Iniciar conversa sobre agendamento
      cy.get('[data-testid="message-input"]')
        .type('Quero agendar uma revisão');
      
      cy.get('[data-testid="send-button"]').click();
      
      // Aguardar resposta e clicar em agendar
      cy.get('[data-testid="action-schedule"]', { timeout: 10000 })
        .click();
      
      // Verificar se modal de agendamento abriu
      cy.get('[data-testid="schedule-modal"]')
        .should('be.visible')
        .within(() => {
          cy.get('[data-testid="date-picker"]').should('be.visible');
          cy.get('[data-testid="time-slots"]').should('be.visible');
          cy.get('[data-testid="service-type"]').should('be.visible');
        });
      
      // Selecionar data e horário
      cy.get('[data-testid="date-picker"]')
        .click()
        .get('.react-datepicker__day--today')
        .next()
        .click();
      
      cy.get('[data-testid="time-slot-9am"]').click();
      
      cy.get('[data-testid="service-type"]')
        .select('Revisão Completa');
      
      // Confirmar agendamento
      cy.get('[data-testid="confirm-schedule"]').click();
      
      // Verificar confirmação
      cy.get('[data-testid="schedule-success"]')
        .should('be.visible')
        .should('contain', 'Agendamento confirmado');
      
      // Verificar mensagem no chat
      cy.get('[data-testid="matias-message"]')
        .last()
        .should('contain', 'agendamento foi confirmado');
    });
  });

  describe('🎤 Interface de Voz', () => {
    it('deve ativar gravação de voz', () => {
      // Clicar no botão de voz
      cy.get('[data-testid="voice-button"]').click();
      
      // Verificar se gravação iniciou
      cy.get('[data-testid="voice-recording"]')
        .should('be.visible')
        .should('have.class', 'recording');
      
      // Verificar indicador visual de gravação
      cy.get('[data-testid="recording-indicator"]')
        .should('be.visible')
        .should('have.class', 'pulse-animation');
      
      // Simular término da gravação
      cy.wait(2000);
      cy.get('[data-testid="voice-button"]').click();
      
      // Verificar processamento
      cy.get('[data-testid="voice-processing"]')
        .should('be.visible')
        .should('contain', 'Processando áudio');
    });

    it('deve converter voz em texto corretamente', () => {
      // Mock do áudio (em teste real usaria arquivo de áudio)
      cy.window().then((win) => {
        win.mockAudioTranscription = 'problema no freio do carro';
      });
      
      cy.get('[data-testid="voice-button"]').click();
      cy.wait(2000);
      cy.get('[data-testid="voice-button"]').click();
      
      // Verificar transcrição
      cy.get('[data-testid="transcription-result"]', { timeout: 10000 })
        .should('be.visible')
        .should('contain', 'problema no freio do carro');
      
      // Verificar resposta do Matias
      cy.get('[data-testid="matias-message"]')
        .should('contain.text', /freio|problema/i);
    });

    it('deve reproduzir resposta em áudio', () => {
      // Enviar mensagem
      cy.get('[data-testid="message-input"]')
        .type('Como trocar o óleo?');
      
      cy.get('[data-testid="send-button"]').click();
      
      // Aguardar resposta
      cy.get('[data-testid="matias-message"]', { timeout: 10000 })
        .should('be.visible');
      
      // Clicar no botão de áudio da resposta
      cy.get('[data-testid="play-audio-response"]')
        .last()
        .click();
      
      // Verificar se áudio está sendo reproduzido
      cy.get('[data-testid="audio-player"]')
        .should('be.visible')
        .should('have.attr', 'data-playing', 'true');
    });
  });

  describe('📱 Responsividade', () => {
    it('deve adaptar interface para mobile', () => {
      // Simular tela de mobile
      cy.viewport(375, 667);
      
      // Verificar se widget se adapta
      cy.get('[data-testid="matias-widget"]')
        .should('have.class', 'mobile-layout');
      
      // Verificar chat em tela cheia no mobile
      cy.get('[data-testid="chat-messages"]')
        .should('have.css', 'height')
        .and('match', /400px|50vh/);
      
      // Verificar botões otimizados para touch
      cy.get('[data-testid="send-button"]')
        .should('have.css', 'min-height', '44px');
      
      cy.get('[data-testid="voice-button"]')
        .should('have.css', 'min-height', '44px');
    });

    it('deve funcionar em tablet', () => {
      cy.viewport(768, 1024);
      
      cy.get('[data-testid="matias-widget"]')
        .should('have.class', 'tablet-layout');
      
      // Chat deve ocupar área lateral
      cy.get('[data-testid="chat-container"]')
        .should('have.css', 'position', 'fixed')
        .should('have.css', 'right', '0px');
    });

    it('deve funcionar em desktop', () => {
      cy.viewport(1920, 1080);
      
      cy.get('[data-testid="matias-widget"]')
        .should('have.class', 'desktop-layout');
      
      // Widget deve ser um modal/sidebar
      cy.get('[data-testid="chat-container"]')
        .should('have.css', 'width', '400px');
    });
  });

  describe('♿ Acessibilidade', () => {
    it('deve ser navegável por teclado', () => {
      // Tab para o input
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'message-input');
      
      // Digitar e enviar com Enter
      cy.focused().type('teste de teclado{enter}');
      
      // Verificar mensagem enviada
      cy.get('[data-testid="user-message"]')
        .last()
        .should('contain', 'teste de teclado');
      
      // Tab para botão de voz
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'voice-button');
      
      // Ativar com Space
      cy.focused().type(' ');
      cy.get('[data-testid="voice-recording"]')
        .should('be.visible');
    });

    it('deve ter textos alternativos adequados', () => {
      // Verificar alt text do avatar
      cy.get('[data-testid="matias-avatar"] img')
        .should('have.attr', 'alt', 'Matias - Assistente Virtual Mecânico');
      
      // Verificar aria-labels
      cy.get('[data-testid="voice-button"]')
        .should('have.attr', 'aria-label', 'Gravar mensagem de voz');
      
      cy.get('[data-testid="send-button"]')
        .should('have.attr', 'aria-label', 'Enviar mensagem');
    });

    it('deve ter contraste adequado', () => {
      // Verificar cores do chat
      cy.get('[data-testid="matias-message"]')
        .should('have.css', 'background-color')
        .and('match', /#f3f4f6|#e5e7eb/);
      
      cy.get('[data-testid="user-message"]')
        .should('have.css', 'background-color')
        .and('match', /#2563eb|#1d4ed8/);
    });

    it('deve suportar leitores de tela', () => {
      // Verificar roles ARIA
      cy.get('[data-testid="chat-messages"]')
        .should('have.attr', 'role', 'log')
        .should('have.attr', 'aria-live', 'polite');
      
      // Verificar landmarks
      cy.get('[data-testid="matias-widget"]')
        .should('have.attr', 'role', 'region')
        .should('have.attr', 'aria-label', 'Chat com Matias');
    });
  });

  describe('🌐 Multilíngue', () => {
    it('deve alternar idioma da interface', () => {
      // Clicar no seletor de idioma
      cy.get('[data-testid="language-selector"]').click();
      
      // Selecionar inglês
      cy.get('[data-testid="lang-en"]').click();
      
      // Verificar mudança da interface
      cy.get('[data-testid="welcome-message"]')
        .should('contain', 'Hello! I am Matias');
      
      cy.get('[data-testid="message-placeholder"]')
        .should('have.attr', 'placeholder')
        .and('contain', 'Type your message');
      
      // Enviar mensagem em inglês
      cy.get('[data-testid="message-input"]')
        .type('Hello Matias, I need help');
      
      cy.get('[data-testid="send-button"]').click();
      
      // Verificar resposta em inglês
      cy.get('[data-testid="matias-message"]', { timeout: 10000 })
        .should('contain.text', /Hello|Hi|help|assist/i);
    });

    it('deve detectar idioma automaticamente', () => {
      // Enviar mensagem em espanhol
      cy.get('[data-testid="message-input"]')
        .type('Hola Matias, necesito ayuda con mi coche');
      
      cy.get('[data-testid="send-button"]').click();
      
      // Verificar detecção e resposta em espanhol
      cy.get('[data-testid="matias-message"]', { timeout: 10000 })
        .should('contain.text', /Hola|coche|ayuda/i);
      
      // Verificar se interface mudou para espanhol
      cy.get('[data-testid="detected-language"]')
        .should('contain', 'es');
    });
  });

  describe('📊 Analytics e Tracking', () => {
    it('deve rastrear eventos de interação', () => {
      // Enviar mensagem
      cy.get('[data-testid="message-input"]')
        .type('teste analytics');
      
      cy.get('[data-testid="send-button"]').click();
      
      // Verificar se evento foi registrado
      cy.window().then((win) => {
        expect(win.analytics.track).to.have.been.calledWith('matias_message_sent');
      });
      
      // Usar comando de voz
      cy.get('[data-testid="voice-button"]').click();
      
      cy.window().then((win) => {
        expect(win.analytics.track).to.have.been.calledWith('matias_voice_started');
      });
    });

    it('deve medir tempo de resposta', () => {
      const startTime = Date.now();
      
      cy.get('[data-testid="message-input"]')
        .type('pergunta para medir tempo');
      
      cy.get('[data-testid="send-button"]').click();
      
      cy.get('[data-testid="matias-message"]', { timeout: 10000 })
        .should('be.visible')
        .then(() => {
          const responseTime = Date.now() - startTime;
          expect(responseTime).to.be.lessThan(5000);
        });
    });
  });

  describe('💾 Persistência de Dados', () => {
    it('deve salvar histórico de conversas', () => {
      // Enviar algumas mensagens
      const messages = [
        'Primeira mensagem de teste',
        'Segunda mensagem para histórico',
        'Terceira mensagem final'
      ];
      
      messages.forEach((message, index) => {
        cy.get('[data-testid="message-input"]')
          .clear()
          .type(message);
        
        cy.get('[data-testid="send-button"]').click();
        
        // Aguardar resposta antes da próxima mensagem
        if (index < messages.length - 1) {
          cy.get('[data-testid="matias-message"]', { timeout: 10000 })
            .should('be.visible');
        }
      });
      
      // Recarregar página
      cy.reload();
      
      // Verificar se histórico foi mantido
      messages.forEach(message => {
        cy.get('[data-testid="chat-messages"]')
          .should('contain', message);
      });
    });

    it('deve manter preferências do usuário', () => {
      // Definir preferências
      cy.get('[data-testid="settings-button"]').click();
      
      cy.get('[data-testid="enable-sound"]')
        .check();
      
      cy.get('[data-testid="enable-notifications"]')
        .check();
      
      cy.get('[data-testid="save-settings"]').click();
      
      // Recarregar página
      cy.reload();
      
      // Verificar se preferências foram mantidas
      cy.get('[data-testid="settings-button"]').click();
      
      cy.get('[data-testid="enable-sound"]')
        .should('be.checked');
      
      cy.get('[data-testid="enable-notifications"]')
        .should('be.checked');
    });
  });

  describe('🚨 Cenários de Erro', () => {
    it('deve lidar com perda de conexão', () => {
      // Simular perda de conexão
      cy.window().then((win) => {
        win.navigator.onLine = false;
      });
      
      // Tentar enviar mensagem
      cy.get('[data-testid="message-input"]')
        .type('mensagem offline');
      
      cy.get('[data-testid="send-button"]').click();
      
      // Verificar mensagem de erro
      cy.get('[data-testid="offline-message"]')
        .should('be.visible')
        .should('contain', 'Sem conexão');
      
      // Verificar que mensagem fica pendente
      cy.get('[data-testid="pending-message"]')
        .should('be.visible')
        .should('contain', 'mensagem offline');
    });

    it('deve tratar erro do servidor', () => {
      // Interceptar e falhar requisição
      cy.intercept('POST', '/api/matias/chat', {
        statusCode: 500,
        body: { error: 'Erro interno do servidor' }
      });
      
      cy.get('[data-testid="message-input"]')
        .type('mensagem que vai falhar');
      
      cy.get('[data-testid="send-button"]').click();
      
      // Verificar mensagem de erro
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .should('contain', 'Erro ao processar mensagem');
      
      // Verificar botão de retry
      cy.get('[data-testid="retry-button"]')
        .should('be.visible')
        .click();
    });

    it('deve lidar com timeout de resposta', () => {
      // Interceptar com delay longo
      cy.intercept('POST', '/api/matias/chat', (req) => {
        req.reply((res) => {
          res.delay(15000); // 15 segundos
          res.send({ success: true, response: 'Resposta demorada' });
        });
      });
      
      cy.get('[data-testid="message-input"]')
        .type('mensagem que vai demorar');
      
      cy.get('[data-testid="send-button"]').click();
      
      // Verificar loading
      cy.get('[data-testid="typing-indicator"]')
        .should('be.visible');
      
      // Aguardar timeout
      cy.get('[data-testid="timeout-message"]', { timeout: 12000 })
        .should('be.visible')
        .should('contain', 'Resposta demorou mais que o esperado');
    });
  });
});

// Comandos customizados do Cypress
Cypress.Commands.add('login', (email, password) => {
  cy.window().then((win) => {
    win.localStorage.setItem('auth_token', 'mock_token_123');
    win.localStorage.setItem('user', JSON.stringify({
      id: 'user123',
      email: email,
      name: 'Usuário Teste'
    }));
  });
});

Cypress.Commands.add('tab', { prevSubject: 'element' }, (subject) => {
  return cy.wrap(subject).trigger('keydown', { key: 'Tab' });
});
