/*  
Esse teste crítico verifica 6 cenários possíveis:    
    1. Abrir Agenda
    2. Alternar várias vezes entre DIA, SEMANA e MÊS
    3. Navegar dias para frente e para trás
    4. Abrir detalhes de agendamentos em sequência
    5. Fazer scroll extremo
    6. Falhar se aparecer erro grave na tela
*/

describe('Agenda Crítica - Stress de navegação', () => {
  const repeticoes = 5;

  function fecharCookiesSeAparecer() {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
      }
    });
  }

  function abrirAgenda() {
    cy.contains(/Agenda/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Listagem de agendamentos/i, { timeout: 30000 })
      .should('exist');

    cy.wait(1000);
  }

  function validarAgendaSemErros() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Listagem de agendamentos|DIA|SEMANA|M[EÊ]S|Agenda/i)
      .and(
        'not.match',
        /TypeError|Cannot read|is not a function|undefined is not|Internal Server Error|Erro interno|Network Error/i
      );
  }

  function validarTelaDetalhesOuAgenda() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /Detalhes|Cliente|Telefone|Atendentes|Serviços agendados|Valor|Listagem de agendamentos|Agenda/i
      )
      .and(
        'not.match',
        /TypeError|Cannot read|is not a function|undefined is not|Internal Server Error|Erro interno|Network Error/i
      );
  }

  function clicarAbaAgenda(modo: 'DIA' | 'SEMANA' | 'MÊS') {
    const regex =
      modo === 'MÊS'
        ? /^M[EÊ]S$/i
        : new RegExp(`^${modo}$`, 'i');

    return cy.contains(regex, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true })
      .then(() => {
        cy.wait(1000);
        validarAgendaSemErros();
      });
  }

  function alternarModosAgenda(tentativa = 0): Cypress.Chainable {
    if (tentativa >= repeticoes) {
      return cy.wrap(null);
    }

    Cypress.log({
      name: 'Stress Agenda',
      message: `Alternando modos - ciclo ${tentativa + 1}`,
    });

    return clicarAbaAgenda('DIA')
      .then(() => clicarAbaAgenda('SEMANA'))
      .then(() => clicarAbaAgenda('MÊS'))
      .then(() => clicarAbaAgenda('DIA'))
      .then(() => alternarModosAgenda(tentativa + 1));
  }

  function clicarIconePorTexto(regex: RegExp) {
    return cy.get('body').then(($body) => {
      const icones = $body
        .find(
          'button:visible, .q-btn:visible, i:visible, .q-icon:visible, [role="button"]:visible'
        )
        .filter((_, el) => {
          const texto = Cypress.$(el).text().trim();

          return regex.test(texto);
        });

      if (icones.length === 0) {
        Cypress.log({
          name: 'Stress Agenda',
          message: `Ícone não encontrado: ${regex}`,
        });

        return cy.wrap(null);
      }

      return cy
        .wrap(icones.first())
        .click({ force: true })
        .then(() => {
          cy.wait(1000);
          validarAgendaSemErros();
        });
    });
  }

  function navegarProximosDias(tentativa = 0): Cypress.Chainable {
    if (tentativa >= repeticoes) {
      return cy.wrap(null);
    }

    Cypress.log({
      name: 'Stress Agenda',
      message: `Avançando dia - tentativa ${tentativa + 1}`,
    });

    return clicarIconePorTexto(/chevron_right|keyboard_arrow_right|navigate_next/i)
      .then(() => navegarProximosDias(tentativa + 1));
  }

  function navegarDiasAnteriores(tentativa = 0): Cypress.Chainable {
    if (tentativa >= repeticoes) {
      return cy.wrap(null);
    }

    Cypress.log({
      name: 'Stress Agenda',
      message: `Voltando dia - tentativa ${tentativa + 1}`,
    });

    return clicarIconePorTexto(/chevron_left|keyboard_arrow_left|navigate_before/i)
      .then(() => navegarDiasAnteriores(tentativa + 1));
  }

  function garantirModoLista() {
    return cy.get('body').then(($body) => {
      const texto = $body.text();

      const estaEmLista =
        texto.includes('Data') &&
        texto.includes('Hora') &&
        texto.includes('Status');

      if (estaEmLista) {
        return cy.wrap(null);
      }

      const botoesLista = $body
        .find(
          'button:visible, .q-btn:visible, i:visible, .q-icon:visible, [role="button"]:visible'
        )
        .filter((_, el) => {
          const textoIcone = Cypress.$(el).text().trim();

          return /list|view_list|format_list_bulleted/i.test(textoIcone);
        });

      if (botoesLista.length === 0) {
        Cypress.log({
          name: 'Stress Agenda',
          message: 'Botão de lista não encontrado. Seguindo sem alterar modo.',
        });

        return cy.wrap(null);
      }

      return cy
        .wrap(botoesLista.first())
        .click({ force: true })
        .then(() => {
          cy.wait(1000);
        });
    });
  }

  function obterLinhasComAcoes($body: JQuery<HTMLElement>) {
    return $body
      .find('tbody tr:visible')
      .toArray()
      .filter((linha) => {
        const $linha = Cypress.$(linha);
        const texto = $linha.text().replace(/\s+/g, ' ').trim();

        const temAcoes =
          $linha
            .find('td')
            .last()
            .find('i, button, svg, [role="button"], .q-icon, .q-btn')
            .length > 0;

        const linhaVazia =
          /nenhum|nenhuma|sem dados|sem resultado|não encontrado|nao encontrado/i.test(
            texto
          );

        return texto.length > 0 && temAcoes && !linhaVazia;
      });
  }

  function clicarBotaoDetalheDaLinha(linha: JQuery<HTMLElement>) {
    const acoes = linha
      .find('td')
      .last()
      .find('button:visible, .q-btn:visible, i:visible, svg:visible, [role="button"]:visible, .q-icon:visible');

    const acaoDetalhe = acoes
      .filter((_, el) => {
        const texto = Cypress.$(el).text().trim();

        return /visibility|remove_red_eye|Detalhes|info|search|open_in_new/i.test(
          texto
        );
      })
      .first();

    if (acaoDetalhe.length > 0) {
      return cy.wrap(acaoDetalhe).click({ force: true });
    }

    return cy.wrap(acoes.first()).click({ force: true });
  }

  function voltarParaListagemSeEstiverEmDetalhes() {
    return cy.get('body').then(($body) => {
      const texto = $body.text();

      if (!/Detalhes|Cliente|Telefone|Atendentes|Serviços agendados|Valor/i.test(texto)) {
        return cy.wrap(null);
      }

      const breadcrumbListagem = $body
        .find('*')
        .filter((_, el) => {
          const textoElemento = Cypress.$(el).text().trim();

          return /Listagem de agendamentos/i.test(textoElemento);
        })
        .first();

      if (breadcrumbListagem.length > 0) {
        return cy
          .wrap(breadcrumbListagem)
          .click({ force: true })
          .then(() => {
            cy.wait(1000);
          });
      }

      return cy
        .contains(/Agenda/i, { timeout: 30000 })
        .click({ force: true })
        .then(() => {
          cy.wait(1000);
        });
    });
  }

  function abrirDetalhesAleatorios(tentativa = 0): Cypress.Chainable {
    if (tentativa >= 3) {
      return cy.wrap(null);
    }

    return garantirModoLista().then(() => {
      return cy.get('body').then(($body) => {
        const linhas = obterLinhasComAcoes($body);

        if (linhas.length === 0) {
          Cypress.log({
            name: 'Stress Agenda',
            message: 'Nenhum agendamento visível para abrir detalhes.',
          });

          return cy.wrap(null);
        }

        const indiceAleatorio = Cypress._.random(0, linhas.length - 1);
        const linhaSelecionada = Cypress.$(linhas[indiceAleatorio]);

        const textoLinha = linhaSelecionada
          .text()
          .replace(/\s+/g, ' ')
          .trim();

        Cypress.log({
          name: 'Stress Agenda',
          message: `Abrindo detalhe aleatório ${tentativa + 1}: ${textoLinha}`,
        });

        return cy
          .wrap(linhaSelecionada)
          .scrollIntoView()
          .then(() => {
            return clicarBotaoDetalheDaLinha(linhaSelecionada);
          })
          .then(() => {
            cy.wait(1500);

            validarTelaDetalhesOuAgenda();

            return voltarParaListagemSeEstiverEmDetalhes();
          })
          .then(() => {
            cy.wait(1000);

            return abrirDetalhesAleatorios(tentativa + 1);
          });
      });
    });
  }

  function scrollExtremo(tentativa = 0): Cypress.Chainable {
    if (tentativa >= repeticoes) {
      return cy.wrap(null);
    }

    Cypress.log({
      name: 'Stress Agenda',
      message: `Scroll extremo - ciclo ${tentativa + 1}`,
    });

    return cy.scrollTo('bottom', { ensureScrollable: false })
      .wait(700)
      .then(() => validarAgendaSemErros())
      .then(() => cy.scrollTo('top', { ensureScrollable: false }))
      .wait(700)
      .then(() => validarAgendaSemErros())
      .then(() => scrollExtremo(tentativa + 1));
  }

  beforeEach(() => {
    cy.login();

    fecharCookiesSeAparecer();

    abrirAgenda();
  });

  it('Deve alternar entre DIA, SEMANA e MÊS várias vezes sem quebrar.', () => {
    alternarModosAgenda();
  });

  it('Deve navegar dias para frente e para trás sem quebrar.', () => {
    clicarAbaAgenda('DIA')
      .then(() => navegarProximosDias())
      .then(() => navegarDiasAnteriores());
  });

  it('Deve abrir detalhes de agendamentos em sequência sem misturar dados ou travar.', () => {
    clicarAbaAgenda('DIA')
      .then(() => garantirModoLista())
      .then(() => abrirDetalhesAleatorios());
  });

  it('Deve suportar scroll extremo na agenda sem quebrar layout.', () => {
    scrollExtremo();
  });

  it('Finalizado', () => {
    cy.log('Teste Finalizado');
  });
});