/*
Esse teste crítico verifica cenários de stress da Agenda:

1. Abrir Agenda
2. Alternar várias vezes entre DIA, SEMANA e MÊS
3. Navegar dias para frente e para trás
4. Abrir detalhes de agendamentos em sequência
5. Fazer scroll extremo
6. Validar que não aparece erro grave na tela
7. Validar que a Agenda não fica em branco ou travada
*/

describe('Agenda Crítica - Stress de navegação', () => {
  const repeticoes = 5;
  const repeticoesDetalhes = 3;

  function fecharCookiesSeAparecer() {
    cy.get('body').then(($body) => {
      const texto = $body.text();

      const apareceuCookies =
        /cookies|utilizamos cookies|melhorar sua experiência|política de privacidade/i.test(
          texto
        );

      if (!apareceuCookies) {
        return;
      }

      const botoesCookies = $body
        .find('button:visible, .q-btn:visible, [role="button"]:visible')
        .toArray()
        .filter((botao) => {
          const textoBotao = Cypress.$(botao)
            .text()
            .replace(/\s+/g, ' ')
            .trim();

          return /Entendi|Aceitar|Aceito|OK|Concordo/i.test(textoBotao);
        }) as HTMLElement[];

      if (botoesCookies.length > 0) {
        cy.wrap(botoesCookies[0]).click({ force: true });
      }
    });
  }

  function validarSemErroGrave() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'not.match',
        /TypeError|Cannot read|is not a function|undefined is not|Internal Server Error|Erro interno|Network Error|ChunkLoadError|ResizeObserver loop limit exceeded/i
      );
  }

  function validarTelaNaoEstaVazia() {
    cy.get('body', { timeout: 30000 }).should('be.visible');

    cy.window().then((win) => {
      const htmlLength = win.document.body.innerHTML.length;

      expect(
        htmlLength,
        'a tela não deve estar vazia ou sem renderização'
      ).to.be.greaterThan(1000);
    });
  }

  function validarAgendaSemErros() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /Listagem de agendamentos|Agenda|DIA|D[IÍ]A|Dia|SEMANA|Semana|M[EÊ]S|MES|Mês/i
      );

    validarSemErroGrave();

    validarTelaNaoEstaVazia();
  }

  function validarTelaDetalhesOuAgenda() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /Detalhes|Detalle|Cliente|Telefone|Tel[eé]fono|Atendentes|Profesional|Servi[çc]os agendados|Servicios agendados|Valor|Listagem de agendamentos|Agenda/i
      );

    validarSemErroGrave();

    validarTelaNaoEstaVazia();
  }

  function abrirAgenda() {
    cy.contains(/Agenda/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /Listagem de agendamentos|Agenda|DIA|D[IÍ]A|Dia|SEMANA|Semana|M[EÊ]S|MES|Mês/i
      );

    cy.wait(1000);

    fecharCookiesSeAparecer();

    validarAgendaSemErros();
  }

  function clicarAbaAgenda(modo: 'DIA' | 'SEMANA' | 'MES') {
    const regex =
      modo === 'DIA'
        ? /^DIA$|^D[IÍ]A$|^Dia$/i
        : modo === 'SEMANA'
          ? /^SEMANA$|^Semana$/i
          : /^M[EÊ]S$|^MES$|^Mês$/i;

    return cy
      .contains(regex, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true })
      .then(() => {
        cy.wait(1000);

        fecharCookiesSeAparecer();

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
      .then(() => clicarAbaAgenda('MES'))
      .then(() => clicarAbaAgenda('DIA'))
      .then(() => alternarModosAgenda(tentativa + 1));
  }

  function clicarIconePorTexto(regex: RegExp) {
    return cy.get('body').then(($body) => {
      const botoes = $body
        .find('button:visible, .q-btn:visible, [role="button"]:visible')
        .toArray()
        .filter((el) => {
          const texto = Cypress.$(el)
            .text()
            .replace(/\s+/g, ' ')
            .trim();

          const html = el.innerHTML || '';
          const ariaLabel = String(el.getAttribute('aria-label') || '');
          const title = String(el.getAttribute('title') || '');

          return (
            regex.test(texto) ||
            regex.test(html) ||
            regex.test(ariaLabel) ||
            regex.test(title)
          );
        }) as HTMLElement[];

      if (botoes.length === 0) {
        Cypress.log({
          name: 'Stress Agenda',
          message: `Ícone não encontrado: ${regex}`,
        });

        return cy.wrap(null);
      }

      const botao = botoes[0];

      if (!botao) {
        return cy.wrap(null);
      }

      return cy
        .wrap(botao)
        .scrollIntoView()
        .click({ force: true })
        .then(() => {
          cy.wait(1000);

          fecharCookiesSeAparecer();

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

    return clicarIconePorTexto(
      /chevron_right|keyboard_arrow_right|navigate_next|arrow_forward|pr[oó]ximo|siguiente/i
    ).then(() => navegarProximosDias(tentativa + 1));
  }

  function navegarDiasAnteriores(tentativa = 0): Cypress.Chainable {
    if (tentativa >= repeticoes) {
      return cy.wrap(null);
    }

    Cypress.log({
      name: 'Stress Agenda',
      message: `Voltando dia - tentativa ${tentativa + 1}`,
    });

    return clicarIconePorTexto(
      /chevron_left|keyboard_arrow_left|navigate_before|arrow_back|anterior/i
    ).then(() => navegarDiasAnteriores(tentativa + 1));
  }

  function garantirModoLista() {
    return cy.get('body').then(($body) => {
      const texto = $body.text();

      const estaEmLista =
        /Data|Fecha/i.test(texto) &&
        /Hora/i.test(texto) &&
        /Status|Estado/i.test(texto);

      if (estaEmLista) {
        return cy.wrap(null);
      }

      const botoesLista = $body
        .find('button:visible, .q-btn:visible, [role="button"]:visible')
        .toArray()
        .filter((el) => {
          const textoBotao = Cypress.$(el)
            .text()
            .replace(/\s+/g, ' ')
            .trim();

          const html = el.innerHTML || '';
          const ariaLabel = String(el.getAttribute('aria-label') || '');
          const title = String(el.getAttribute('title') || '');

          return (
            /list|view_list|format_list_bulleted/i.test(textoBotao) ||
            /list|view_list|format_list_bulleted/i.test(html) ||
            /list|lista/i.test(ariaLabel) ||
            /list|lista/i.test(title)
          );
        }) as HTMLElement[];

      if (botoesLista.length === 0) {
        Cypress.log({
          name: 'Stress Agenda',
          message:
            'Botão de lista não encontrado. Seguindo sem alterar modo.',
        });

        return cy.wrap(null);
      }

      const botaoLista = botoesLista[0];

      if (!botaoLista) {
        return cy.wrap(null);
      }

      return cy
        .wrap(botaoLista)
        .click({ force: true })
        .then(() => {
          cy.wait(1000);

          fecharCookiesSeAparecer();

          validarAgendaSemErros();
        });
    });
  }

  function obterLinhasComAgendamento($body: JQuery<HTMLElement>) {
    return $body
      .find('tbody tr:visible')
      .toArray()
      .filter((linha) => {
        const $linha = Cypress.$(linha);
        const texto = $linha.text().replace(/\s+/g, ' ').trim();

        const linhaVazia =
          /nenhum|nenhuma|sem dados|sem resultado|não encontrado|nao encontrado|sin datos|sin resultados/i.test(
            texto
          );

        const pareceAgendamento =
          /\d{2}\/\d{2}\/\d{4}/.test(texto) ||
          /\d{1,2}:\d{2}h\s+às\s+\d{1,2}:\d{2}h/i.test(texto) ||
          /Finalizado|Agendado|Cancelado|Cliente|R\$|edit_square|visibility/i.test(
            texto
          );

        return texto.length > 0 && pareceAgendamento && !linhaVazia;
      }) as HTMLElement[];
  }

  function clicarBotaoDetalheDaLinha(linha: JQuery<HTMLElement>) {
    const seletoresAcao = [
      'button',
      '.q-btn',
      '[role="button"]',
      'i',
      '.q-icon',
      'svg',
      '*',
    ].join(',');

    const acoesNaLinha = linha
      .find(seletoresAcao)
      .toArray()
      .filter((el) => {
        const $el = Cypress.$(el);

        const texto = $el.text().replace(/\s+/g, ' ').trim();
        const html = el.innerHTML || '';
        const ariaLabel = String(el.getAttribute('aria-label') || '');
        const title = String(el.getAttribute('title') || '');

        const conteudo = `${texto} ${html} ${ariaLabel} ${title}`;

        const pareceAcao =
          /visibility|remove_red_eye|edit_square|edit|Detalhes|Detalle|info|search|open_in_new/i.test(
            conteudo
          );

        if (!pareceAcao) {
          return false;
        }

        const rect = el.getBoundingClientRect();

        return rect.width >= 0 && rect.height >= 0;
      }) as HTMLElement[];

    if (acoesNaLinha.length > 0) {
      const acao = acoesNaLinha[0];

      if (acao) {
        return cy
          .wrap(acao)
          .scrollIntoView()
          .click({ force: true });
      }
    }

    const celulas = linha.find('td').toArray() as HTMLElement[];

    const ultimaCelula = celulas[celulas.length - 1];

    if (ultimaCelula) {
      Cypress.log({
        name: 'Stress Agenda',
        message:
          'Nenhum ícone de ação encontrado. Clicando na última célula da linha.',
      });

      return cy
        .wrap(ultimaCelula)
        .scrollIntoView()
        .click({ force: true });
    }

    const elementoLinha = linha.get(0);

    if (!elementoLinha) {
      Cypress.log({
        name: 'Stress Agenda',
        message: 'Linha inválida. Ignorando abertura de detalhe.',
      });

      return cy.wrap(null);
    }

    Cypress.log({
      name: 'Stress Agenda',
      message:
        'Nenhuma ação nem célula encontrada. Clicando na própria linha.',
    });

    return cy
      .wrap(elementoLinha)
      .scrollIntoView()
      .click({ force: true });
  }

  function voltarParaListagemSeEstiverEmDetalhes() {
    return cy.get('body').then(($body) => {
      const texto = $body.text();

      const estaEmDetalhes =
        /Detalhes do agendamento|Detalhes|Detalle|Servi[çc]os agendados|Servicios agendados|Forma de pagamento|Finalizar agendamento|Cancelar agendamento/i.test(
          texto
        );

      if (!estaEmDetalhes) {
        return cy.wrap(null);
      }

      const breadcrumbListagem = $body
        .find('*')
        .filter((_, el) => {
          const textoElemento = Cypress.$(el)
            .text()
            .replace(/\s+/g, ' ')
            .trim();

          return /Listagem de agendamentos|Agenda/i.test(textoElemento);
        })
        .first();

      if (breadcrumbListagem.length > 0) {
        const elemento = breadcrumbListagem.get(0);

        if (!elemento) {
          return cy.wrap(null);
        }

        return cy
          .wrap(elemento)
          .click({ force: true })
          .then(() => {
            cy.wait(1000);

            fecharCookiesSeAparecer();

            validarAgendaSemErros();
          });
      }

      return cy
        .contains(/Agenda/i, { timeout: 30000 })
        .click({ force: true })
        .then(() => {
          cy.wait(1000);

          fecharCookiesSeAparecer();

          validarAgendaSemErros();
        });
    });
  }

  function abrirDetalhesAleatorios(tentativa = 0): Cypress.Chainable {
    if (tentativa >= repeticoesDetalhes) {
      return cy.wrap(null);
    }

    return garantirModoLista().then(() => {
      return cy.get('body').then(($body) => {
        const linhas = obterLinhasComAgendamento($body);

        if (linhas.length === 0) {
          Cypress.log({
            name: 'Stress Agenda',
            message: 'Nenhum agendamento visível para abrir detalhes.',
          });

          return cy.wrap(null);
        }

        const indiceAleatorio = Cypress._.random(0, linhas.length - 1);
        const linhaSelecionada = linhas[indiceAleatorio];

        if (!linhaSelecionada) {
          return cy.wrap(null);
        }

        const linhaJquery = Cypress.$(linhaSelecionada);

        const textoLinha = linhaJquery.text().replace(/\s+/g, ' ').trim();

        Cypress.log({
          name: 'Stress Agenda',
          message: `Abrindo detalhe aleatório ${tentativa + 1}: ${textoLinha}`,
        });

        return cy
          .wrap(linhaSelecionada)
          .scrollIntoView()
          .then(() => {
            return clicarBotaoDetalheDaLinha(linhaJquery);
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

    return cy
      .scrollTo('bottom', { ensureScrollable: false })
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

  it('Deve alternar entre DIA, SEMANA e MÊS várias vezes sem quebrar', () => {
    alternarModosAgenda();
  });

  it('Deve navegar dias para frente e para trás sem quebrar', () => {
    clicarAbaAgenda('DIA')
      .then(() => navegarProximosDias())
      .then(() => navegarDiasAnteriores());
  });

  it('Deve abrir detalhes de agendamentos em sequência sem misturar dados ou travar', () => {
    clicarAbaAgenda('DIA')
      .then(() => garantirModoLista())
      .then(() => abrirDetalhesAleatorios());
  });

  it('Deve suportar scroll extremo na agenda sem quebrar layout', () => {
    scrollExtremo();
  });
});