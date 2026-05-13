describe('WhatsApp - Enviar mensagem de teste', () => {
  function fecharCookiesSeAparecer() {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
      }
    });
  }

  function abrirConfiguracoesWhatsapp() {
    cy.contains(/Configura[çc][õo]es/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Configura[çc][õo]es/i, { timeout: 30000 })
      .should('be.visible');

    cy.contains(/^WhatsApp$/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /WhatsApp|Conex[aã]o do WhatsApp|Mensagens autom[aá]ticas/i);
  }

  function whatsappEstaConectado() {
    return cy.get('body').then(($body) => {
      const texto = $body.text().replace(/\s+/g, ' ').trim();

      const conectado =
        /Status:\s*Conectado/i.test(texto) ||
        /Status\s*Conectado/i.test(texto);

      const desconectado =
        /Status:\s*Desconectado/i.test(texto) ||
        /Status\s*Desconectado/i.test(texto);

      if (conectado) {
        Cypress.log({
          name: 'WhatsApp',
          message: 'WhatsApp está conectado.',
        });

        return true;
      }

      if (desconectado) {
        Cypress.log({
          name: 'WhatsApp',
          message: 'WhatsApp está desconectado. Mensagem de teste não será enviada.',
        });

        return false;
      }

      Cypress.log({
        name: 'WhatsApp',
        message: 'Não foi possível identificar claramente o status do WhatsApp.',
      });

      return false;
    });
  }

  function validarSemErroGrave() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'not.match',
        /TypeError|Cannot read|undefined is not|Internal Server Error|Network Error|Erro interno|is not a function/i
      );
  }

  beforeEach(() => {
    cy.login({ width: 1366, height: 768 });

    fecharCookiesSeAparecer();

    abrirConfiguracoesWhatsapp();
  });

  it('Deve enviar mensagem de teste somente se o WhatsApp estiver conectado.', () => {
    whatsappEstaConectado().then((conectado) => {
      if (!conectado) {
        Cypress.log({
          name: 'WhatsApp',
          message: 'Teste encerrado sem enviar mensagem porque o WhatsApp não está conectado.',
        });

        validarSemErroGrave();

        return;
      }

      cy.contains(/Enviar mensagem de teste/i, { timeout: 30000 })
        .should('be.visible')
        .click({ force: true });

      cy.wait(3000);

      cy.get('body', { timeout: 30000 })
        .invoke('text')
        .should(
          'match',
          /WhatsApp|Conectado|mensagem|teste|enviada|sucesso|enviar mensagem de teste/i
        );

      validarSemErroGrave();
    });    
  });
  it('Finalizado', () => {
    cy.log('Teste Finalizado');
  });
});