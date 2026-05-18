describe('Clientes - Contratar plano', () => {
  function fecharCookiesSeAparecer() {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
      }
    });
  }

  function abrirClientes() {
    cy.contains(/Clientes/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Listagem de clientes/i, { timeout: 30000 })
      .should('be.visible');
  }

  function abrirClienteAleatorioParaEdicao() {
    cy.get('tbody tr:visible', { timeout: 30000 })
      .should('have.length.greaterThan', 0)
      .then(($linhas) => {
        const linhasValidas = [...$linhas].filter((linha) => {
          const $linha = Cypress.$(linha);
          const texto = $linha.text().replace(/\s+/g, ' ').trim();

          const temColunas = $linha.find('td').length > 0;
          const temAcaoEditar =
            $linha
              .find('td')
              .last()
              .find('i, button, svg, [role="button"], .q-icon')
              .length > 0;

          return temColunas && temAcaoEditar && texto.length > 0;
        });

        expect(
          linhasValidas.length,
          'clientes válidos encontrados'
        ).to.be.greaterThan(0);

        const indiceAleatorio = Cypress._.random(0, linhasValidas.length - 1);
        const linhaSelecionada = Cypress.$(linhasValidas[indiceAleatorio]);

        const nomeCliente = linhaSelecionada
          .find('td')
          .eq(0)
          .text()
          .replace(/\s+/g, ' ')
          .trim();

        Cypress.log({
          name: 'Cliente selecionado',
          message: nomeCliente,
        });

        cy.wrap(linhaSelecionada).within(() => {
          const seletorAcoes = 'i, button, svg, [role="button"], .q-icon';

          cy.get('td')
            .last()
            .find(seletorAcoes)
            .then(($acoes) => {
              const acaoEditar = [...$acoes].find((acao) => {
                const texto = Cypress.$(acao).text().trim();

                return /edit|edit_square/i.test(texto);
              });

              if (acaoEditar) {
                cy.wrap(acaoEditar).click({ force: true });
                return;
              }

              // Na grade de clientes normalmente:
              // 0 = WhatsApp, 1 = Editar, 2 = Excluir
              cy.wrap($acoes.eq(1)).click({ force: true });
            });
        });
      });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Editar cliente|Dados do cliente|Assinatura|Gravar/i);
  }

  function abrirAbaAssinatura() {
    cy.contains(/^Assinatura$/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Assinatura|Contratar plano|Planos contratados/i);
  }

  function clicarContratarPlano() {
    cy.contains(/Contratar plano/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('.q-dialog:visible, [role="dialog"]:visible', {
      timeout: 30000,
    }).should('exist');

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Contratar plano|Plano|Confirmar/i);
  }

  function selecionarPlanoAleatorioNoCombo() {
  cy.get('.q-dialog:visible, [role="dialog"]:visible')
    .last()
    .within(() => {
      cy.get('.q-field:visible, input:visible')
        .first()
        .click({ force: true });
    });

  cy.wait(1000);

  cy.get('body').then(($body) => {
    const opcoesPlano = $body
      .find(
        '.q-menu:visible .q-item, .q-virtual-scroll__content .q-item, [role="option"]:visible, [class*="q-item"]:visible'
      )
      .toArray()
      .filter((opcao) => {
        const texto = Cypress.$(opcao)
          .text()
          .replace(/\s+/g, ' ')
          .trim();

        const ehOpcaoValida =
          texto.length > 0 &&
          !/Contratar plano|Confirmar|Cancelar|Buscar|Nenhum|Nenhuma/i.test(
            texto
          );

        return ehOpcaoValida;
      }) as HTMLElement[];

    expect(
      opcoesPlano.length,
      'planos disponíveis no combo'
    ).to.be.greaterThan(0);

    const indiceAleatorio = Cypress._.random(0, opcoesPlano.length - 1);
    const planoSelecionado = opcoesPlano[indiceAleatorio];

    const nomePlano = Cypress.$(planoSelecionado)
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    Cypress.log({
      name: 'Plano selecionado',
      message: nomePlano,
    });

    cy.wrap(planoSelecionado)
      .click({ force: true });
  });

  cy.wait(800);
}

  function confirmarPlano() {
    cy.get('.q-dialog:visible, [role="dialog"]:visible')
      .last()
      .within(() => {
        cy.contains(/Confirmar/i, { timeout: 30000 })
          .should('be.visible')
          .click({ force: true });
      });

    cy.wait(1200);

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Planos contratados|Assinatura|Gravar/i);
  }

  function gravarCliente() {
    cy.contains(/Gravar/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /sucesso|salvo|atualizado|Listagem de clientes|Clientes|Assinatura/i
      );
  }

  beforeEach(() => {
    cy.login();
    fecharCookiesSeAparecer();
    abrirClientes();
  });

  it('Deve contratar um plano para um cliente aleatório.', () => {
    abrirClienteAleatorioParaEdicao();

    abrirAbaAssinatura();

    clicarContratarPlano();

    selecionarPlanoAleatorioNoCombo();

    confirmarPlano();

    gravarCliente();
  });
});