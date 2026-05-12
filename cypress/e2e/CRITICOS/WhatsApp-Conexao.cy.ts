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
      .should('exist');

    cy.contains(/^WhatsApp$/i, { timeout: 30000 })
      .should('exist')
      .click({ force: true });

    cy.contains(/WhatsApp|Mensagens autom[aá]ticas|Conectar WhatsApp/i, {
      timeout: 30000,
    }).should('exist');
  }

  function validarSemErroGrave() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'not.match',
        /TypeError|Cannot read|undefined is not|Internal Server Error|Network Error|Erro interno|is not a function/i
      );
  }

  function obterStatusWhatsapp(texto: string) {
    const estaConectado =
      /Conectado/i.test(texto) &&
      !/Desconectado/i.test(texto) &&
      !/Conectar WhatsApp/i.test(texto);

    const estaDesconectado =
      /Desconectado/i.test(texto) ||
      /Conectar WhatsApp/i.test(texto) ||
      /Reconectar WhatsApp/i.test(texto) ||
      /QR|qrcode/i.test(texto);

    if (estaConectado) {
      return 'conectado';
    }

    if (estaDesconectado) {
      return 'desconectado';
    }

    return 'indefinido';
  }

  beforeEach(() => {
    cy.login();

    fecharCookiesSeAparecer();

    abrirConfiguracoesWhatsapp();
  });

  it('Deve exibir o status atual da conexão do WhatsApp.', () => {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /WhatsApp|Conectar WhatsApp|Mensagens autom[aá]ticas/i);

    cy.get('body').then(($body) => {
      const texto = $body.text();
      const status = obterStatusWhatsapp(texto);

      if (status === 'conectado') {
        cy.log('WhatsApp está conectado.');

        expect(texto).to.match(/Conectado/i);
        return;
      }

      if (status === 'desconectado') {
        cy.log('WhatsApp está desconectado ou disponível para conectar.');

        expect(texto).to.match(/Conectar WhatsApp|Desconectado|Reconectar WhatsApp|QR|qrcode/i);
        return;
      }

      throw new Error(
        `Não foi possível identificar o status do WhatsApp. Texto encontrado: ${texto}`
      );
    });

    validarSemErroGrave();
  });

  it('Deve iniciar reconexão do WhatsApp quando estiver desconectado.', () => {
    cy.get('body').then(($body) => {
      const texto = $body.text();
      const status = obterStatusWhatsapp(texto);

      if (status === 'conectado') {
        cy.log('WhatsApp já está conectado. Não será feita reconexão.');
        return;
      }

      cy.contains(/Reconectar WhatsApp|Conectar WhatsApp|Conectar/i, {
        timeout: 30000,
      })
        .should('exist')
        .scrollIntoView()
        .click({ force: true });

      cy.wait(3000);

      cy.get('body', { timeout: 30000 })
        .invoke('text')
        .should(
          'match',
          /WhatsApp|QR|qrcode|conectar|reconectar|aguarde|conectando|Status|Mensagens autom[aá]ticas/i
        );
    });

    validarSemErroGrave();
  });

  it('Finalizado', () => {
    cy.log('Teste Finalizado');
  });
});