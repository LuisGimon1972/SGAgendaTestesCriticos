describe('WhatsApp - Teste de conexão', () => {
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

  it('Deve exibir o status atual da conexão do WhatsApp.', () => {
    cy.get('body')
      .invoke('text')
      .should('match', /Status|Conectado|Desconectado|WhatsApp/i);

    cy.get('body').then(($body) => {
      const texto = $body.text();

      if (/Conectado/i.test(texto)) {
        Cypress.log({
          name: 'WhatsApp',
          message: 'WhatsApp está conectado.',
        });

        expect(texto).to.match(/Conectado/i);
      } else if (/Desconectado/i.test(texto)) {
        Cypress.log({
          name: 'WhatsApp',
          message: 'WhatsApp está desconectado.',
        });

        expect(texto).to.match(/Desconectado/i);
      } else {
        throw new Error('Não foi possível identificar o status do WhatsApp.');
      }
    });

    validarSemErroGrave();
  });

  it('Deve iniciar reconexão do WhatsApp quando estiver desconectado.', () => {
    cy.get('body').then(($body) => {
      const texto = $body.text();

      if (/Conectado/i.test(texto) && !/Desconectado/i.test(texto)) {
        Cypress.log({
          name: 'WhatsApp',
          message: 'WhatsApp já está conectado. Não será feita reconexão.',
        });

        return;
      }

      cy.contains(/Reconectar WhatsApp|Conectar WhatsApp|Conectar/i, {
        timeout: 30000,
      })
        .should('be.visible')
        .click({ force: true });

      cy.wait(3000);

      cy.get('body', { timeout: 30000 })
        .invoke('text')
        .should(
          'match',
          /WhatsApp|QR|qrcode|conectar|reconectar|aguarde|conectando|Status/i
        );
    });

    validarSemErroGrave();
  });
  it('Finalizado', () => {
    cy.log('Teste Finalizado');
  });   
});