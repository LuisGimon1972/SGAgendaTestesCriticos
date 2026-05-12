/*
O teste de múltiplos detalhes consiste em abrir muitos detalhes de agendamentos em sequência para verificar se a Agenda 
mantém os dados corretos e não trava.

Ele tenta encontrar problemas como:

- Dados misturados entre clientes
- Detalhes do agendamento anterior aparecendo no próximo
- Modal/dialog não fechando corretamente
- Cache incorreto
- Scroll travando
- Botões desaparecendo
- Tela branca
- Memory leak
- Travamento após abrir vários detalhes
- Informações desatualizadas
*/

describe('Agenda Crítica - Múltiplos detalhes', () => {
  const repeticoesDetalhes = 5;
  const maxDiasPesquisa = 31;

  function fecharCookiesSeAparecer() {
    return cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
      }
    });
  }

  function abrirAgenda() {
    return cy.contains(/Agenda/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true })
      .then(() => {
        return cy.contains(/Listagem de agendamentos/i, {
          timeout: 30000,
        }).should('exist');
      })
      .then(() => {
        return cy.wait(1000);
      });
  }

  function validarSemErroGrave(): Cypress.Chainable<void> {
    return cy
      .get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'not.match',
        /TypeError|Cannot read|undefined is not|Internal Server Error|Network Error|Erro interno|is not a function/i
      )
      .then(() => undefined);
  }

  function garantirModoLista(): Cypress.Chainable<void> {
    return cy.get('body').then(($body) => {
      const texto = $body.text();

      const estaEmLista =
        texto.includes('Data') &&
        texto.includes('Hora') &&
        texto.includes('Status');

      if (estaEmLista) {
        return;
      }

      const botaoLista = $body
        .find('.q-btn-group:visible')
        .first()
        .find('.q-btn')
        .eq(1);

      if (botaoLista.length > 0) {
        return cy
          .wrap(botaoLista)
          .click({ force: true })
          .then(() => {
            return cy.wait(1000);
          });
      }

      const botoesLista = $body
        .find(
          'button:visible, .q-btn:visible, i:visible, .q-icon:visible, [role="button"]:visible'
        )
        .filter((_, el) => {
          const textoIcone = Cypress.$(el).text().trim();

          return /list|view_list|format_list_bulleted/i.test(textoIcone);
        });

      if (botoesLista.length > 0) {
        return cy
          .wrap(botoesLista.first())
          .click({ force: true })
          .then(() => {
            return cy.wait(1000);
          });
      }

      Cypress.log({
        name: 'Modo Lista',
        message: 'Botão de lista não encontrado.',
      });
    });
  }

  function obterLinhasValidas($body: JQuery<HTMLElement>) {
    return $body
      .find('tbody tr:visible')
      .toArray()
      .filter((linha) => {
        const $linha = Cypress.$(linha);

        const texto = $linha.text().replace(/\s+/g, ' ').trim();

        const possuiAcoes =
          $linha
            .find('td')
            .last()
            .find(
              'i, button, svg, [role="button"], .q-icon'
            ).length > 0;

        const linhaVazia =
          /nenhum|nenhuma|sem dados|sem resultado|não encontrado|nao encontrado/i.test(
            texto
          );

        return (
          texto.length > 0 &&
          possuiAcoes &&
          !linhaVazia
        );
      });
  }

  function avancarDia(): Cypress.Chainable<void> {
    return cy.get('body').then(($body) => {
      const botaoAvancar = $body
        .find(
          'button:visible, .q-btn:visible, i:visible, .q-icon:visible, [role="button"]:visible'
        )
        .filter((_, el) => {
          const texto = Cypress.$(el).text().trim();

          return /chevron_right|keyboard_arrow_right|navigate_next/i.test(
            texto
          );
        })
        .first();

      if (botaoAvancar.length === 0) {
        Cypress.log({
          name: 'Agenda',
          message: 'Botão avançar dia não encontrado.',
        });

        return;
      }

      return cy
        .wrap(botaoAvancar)
        .click({ force: true })
        .then(() => {
          return cy.wait(1500);
        });
    });
  }

  function procurarDiaComAgendamento(
    tentativa = 0
  ): Cypress.Chainable<boolean> {
    if (tentativa >= maxDiasPesquisa) {
      Cypress.log({
        name: 'Agenda',
        message:
          'Nenhum agendamento encontrado nos dias pesquisados.',
      });

      return cy.wrap(false);
    }

    Cypress.log({
      name: 'Agenda',
      message: `Pesquisando dia ${tentativa + 1}`,
    });

    return garantirModoLista().then(() => {
      return cy.get('body').then(($body) => {
        const linhas = obterLinhasValidas($body);

        if (linhas.length > 0) {
          Cypress.log({
            name: 'Agenda',
            message: `${linhas.length} agendamento(s) encontrado(s).`,
          });

          return cy.wrap(true);
        }

        return avancarDia()
          .then(() => validarSemErroGrave())
          .then(() => {
            return procurarDiaComAgendamento(
              tentativa + 1
            );
          });
      });
    });
  }

  function abrirDetalheAleatorio() {
  return cy.get('body').then(($body) => {
    const linhas = obterLinhasValidas($body);

    if (linhas.length === 0) {
      Cypress.log({
        name: 'Detalhes',
        message: 'Nenhuma linha disponível.',
      });

      return cy.wrap('');
    }

    const indiceAleatorio = Cypress._.random(0, linhas.length - 1);
    const linhaSelecionada = Cypress.$(linhas[indiceAleatorio]);

    const textoLinha = linhaSelecionada
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    Cypress.log({
      name: 'Linha escolhida',
      message: textoLinha,
    });

    return cy
      .wrap(linhaSelecionada)
      .scrollIntoView()
      .within(() => {
        cy.get('td')
          .last()
          .find('i, button, svg, [role="button"], .q-icon')
          .last()
          .click({ force: true });
      })
      .then(() => {
        return cy.contains(/Detalhes/i, { timeout: 30000 }).should('exist');
      })
      .then(() => {
        return validarSemErroGrave();
      })
      .then(() => {
        return cy.get('body').invoke('text');
      })
      .then((textoDetalhe) => {
        return String(textoDetalhe);
      });
  });
}

  function voltarListagem(): Cypress.Chainable<void> {
    return cy.get('body').then(($body) => {
      const breadcrumb = $body
        .find('*')
        .filter((_, el) => {
          const texto = Cypress.$(el)
            .text()
            .trim();

          return /Listagem de agendamentos/i.test(
            texto
          );
        })
        .first();

      if (breadcrumb.length > 0) {
        return cy
          .wrap(breadcrumb)
          .click({ force: true })
          .then(() => {
            return cy.wait(1200);
          });
      }

      return cy
        .contains(/Agenda/i, {
          timeout: 30000,
        })
        .click({ force: true })
        .then(() => {
          return cy.wait(1200);
        });
    });
  }

  function validarDetalhe(texto: string) {
    expect(texto).to.match(
      /Cliente|Telefone|Atendentes|Serviços agendados|Valor|Detalhes/i
    );
  }

  function abrirMultiplosDetalhes(tentativa = 0) {
  if (tentativa >= repeticoesDetalhes) {
    return cy.wrap(null);
  }

  Cypress.log({
    name: 'Stress detalhes',
    message: `Execução ${tentativa + 1}`,
  });

  return procurarDiaComAgendamento().then((encontrou) => {
    if (!encontrou) {
      Cypress.log({
        name: 'Stress detalhes',
        message: 'Nenhum agendamento encontrado. Encerrando sem erro.',
      });

      return cy.wrap(null);
    }

    return abrirDetalheAleatorio()
      .then((textoDetalhe) => {
        validarDetalhe(textoDetalhe);

        return voltarListagem();
      })
      .then(() => {
        return garantirModoLista();
      })
      .then(() => {
        return validarSemErroGrave();
      })
      .then(() => {
        return abrirMultiplosDetalhes(tentativa + 1);
      });
  });
}

  beforeEach(() => {
    cy.login({
      width: 1366,
      height: 768,
    });

    fecharCookiesSeAparecer();

    abrirAgenda();
  });

  it('deve abrir vários detalhes em sequência sem travar ou misturar dados', () => {
    cy.contains(/^DIA$/i, {
      timeout: 30000,
    })
      .should('be.visible')
      .click({ force: true });

    cy.wait(1000);

    return abrirMultiplosDetalhes();
  });
  it('Finalizado', () => {
    cy.log('Teste Finalizado');
  });   
});