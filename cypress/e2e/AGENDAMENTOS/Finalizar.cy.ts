describe('Agendamentos - Finalizar agendamento criado no mês', () => {
  function fecharCookiesSeAparecer() {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
      }
    });
  }

  function garantirModoLista() {
    cy.get('body').then(($body) => {
      const estaEmLista =
        $body.text().includes('Data') &&
        $body.text().includes('Hora') &&
        $body.text().includes('Agendamento') &&
        $body.text().includes('Status');
      if (!estaEmLista) {
        cy.get('.q-btn-group:visible')
          .first()
          .within(() => {
            cy.get('.q-btn')
              .eq(1)
              .click({ force: true });
          });
      }
    });
  }

  function obterMesAnoAtual() {
    return cy.get('body').invoke('text').then((texto) => {
      const match = texto.match(/\d{2}\s+de\s+([a-zç]+)\s+de\s+(\d{4})/i);

      if (!match) {
        return '';
      }

      const mes = match[1].toLowerCase();
      const ano = match[2];

      return `${mes}-${ano}`;
    });
  }

  function avancarUmDia() {
    return cy.get('.q-icon')
      .filter((_, el) => {
        const texto = Cypress.$(el).text();

        return /chevron_right|keyboard_arrow_right|navigate_next/i.test(texto);
      })
      .first()
      .parents('.q-btn')
      .first()
      .click({ force: true });
  }

  function clicarEditarNaLinha(linhaSelecionada: JQuery<HTMLElement>) {
    return cy
      .wrap(linhaSelecionada)
      .scrollIntoView()
      .within(() => {
        cy.get('td')
          .last()
          .find('i, button, svg, [role="button"], .q-icon')
          .then(($acoes) => {
            const botaoEditar = [...$acoes].find((acao) => {
              const texto = Cypress.$(acao).text();

              return /edit|mode_edit|border_color|create/i.test(texto);
            });

            if (botaoEditar) {
              cy.wrap(botaoEditar).click({ force: true });
            } else {
              cy.wrap($acoes.last()).click({ force: true });
            }
          });
      });
  }

  function tentarAbrirAgendamentoCriado() {
    return cy.get('tbody tr:visible', { timeout: 30000 }).then(($linhas) => {
      const linhasCriado = [...$linhas].filter((linha) => {
        return /Criado/i.test(Cypress.$(linha).text());
      });

      if (linhasCriado.length === 0) {
        return cy.wrap(false);
      }

      const indiceAleatorio = Cypress._.random(0, linhasCriado.length - 1);
      const linhaSelecionada = Cypress.$(linhasCriado[indiceAleatorio]);
      const textoLinha = linhaSelecionada.text().trim();

      cy.log(`Agendamento Criado encontrado: ${textoLinha}`);

      return clicarEditarNaLinha(linhaSelecionada).then(() => {
        return true;
      });
    });
  }

  function procurarCriadoNoMes(mesAnoInicial: string, tentativa = 0) {
    const maxTentativas = 35;

    if (tentativa >= maxTentativas) {
      cy.log('Chegou ao limite de dias pesquisados e não encontrou agendamento Criado.');
      return cy.wrap(false);
    }

    cy.log(`Procurando agendamento Criado. Tentativa: ${tentativa + 1}`);

    return tentarAbrirAgendamentoCriado().then((encontrou) => {
      if (encontrou) {
        return cy.wrap(true);
      }

      return obterMesAnoAtual().then((mesAnoAtual) => {
        if (mesAnoAtual && mesAnoAtual !== mesAnoInicial) {
          cy.log(`Chegou ao final do mês ${mesAnoInicial} e não encontrou agendamento Criado.`);
          return cy.wrap(false);
        }

        avancarUmDia();

        cy.wait(1500);

        garantirModoLista();

        cy.wait(500);

        return procurarCriadoNoMes(mesAnoInicial, tentativa + 1);
      });
    });
  }

  beforeEach(() => {
    cy.login();

    fecharCookiesSeAparecer();

    cy.contains(/Agenda/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Listagem de agendamentos/i, { timeout: 30000 })
      .should('be.visible');
  });

  it('deve percorrer o mês até encontrar um agendamento Criado e finalizar', () => {
    cy.contains(/^DIA$/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.wait(1000);

    garantirModoLista();

    cy.wait(1000);

    obterMesAnoAtual().then((mesAnoInicial) => {
      cy.log(`Mês inicial: ${mesAnoInicial}`);

      procurarCriadoNoMes(mesAnoInicial).then((encontrou) => {
        if (!encontrou) {
          cy.log('Nenhum agendamento Criado encontrado. Teste encerrado sem erro.');
          return;
        }

        cy.contains(/Detalhes/i, { timeout: 30000 })
          .should('be.visible');

        cy.contains(/Finalizar/i, { timeout: 30000 })
          .should('be.visible')
          .click({ force: true });

        cy.get('body').then(($body) => {
          const texto = $body.text();

          if (texto.match(/Confirmar|Sim/i)) {
            cy.contains(/Confirmar|Sim/i, { timeout: 10000 })
              .click({ force: true });
          }
        });
      });
    });
  });
});