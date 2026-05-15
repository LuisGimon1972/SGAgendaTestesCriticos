/*
Esse teste crítico verifica três cenários possíveis:
1. O horário some após o primeiro agendamento: correto.
2. O horário aparece, mas não deixa avançar: correto.
3. O horário aparece, deixa avançar, mas bloqueia ao gravar: correto.
*/

describe('Agenda Crítica - Conflito de horário', () => {
  let dataSelecionadaTexto = '';
  let horarioSelecionadoTexto = '';
  let dataSelecionadaEhHoje = false;

  const telefone = gerarTelefoneAleatorio();

  function gerarTelefoneAleatorio() {
    const ddd = '49';
    const primeiroDigito = '9';
    const numero = Math.floor(10000000 + Math.random() * 90000000);

    return `${ddd}${primeiroDigito}${numero}`;
  }

  function fecharCookiesSeAparecer() {
    cy.get('body').then(($body) => {
      const texto = $body.text();

      if (/Entendi|Aceitar|Aceito|OK|Concordo/i.test(texto)) {
        cy.contains(/Entendi|Aceitar|Aceito|OK|Concordo/i)
          .click({ force: true });
      }
    });
  }

  function abrirAgenda() {
    cy.contains(/Agenda/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.wait(1000);

    cy.get('body').then(($body) => {
      const texto = $body.text();

      if (/Detalhes do agendamento|Detalhes/i.test(texto)) {
        cy.contains(/Listagem de agendamentos/i, { timeout: 30000 })
          .click({ force: true });

        cy.wait(1000);
      }
    });

    cy.contains(/Listagem de agendamentos/i, { timeout: 30000 })
      .should('exist');
  }

  function abrirCadastroAgendamento() {
    cy.contains(/Agenda/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.wait(1500);

    cy.get('body').then(($body) => {
      const texto = $body.text();

      if (/Detalhes do agendamento|Detalhes/i.test(texto)) {
        const breadcrumb = $body
          .find('*')
          .filter((_, el) => {
            const t = Cypress.$(el).text().trim();

            return /Listagem de agendamentos/i.test(t);
          })
          .first();

        if (breadcrumb.length > 0) {
          cy.wrap(breadcrumb).click({ force: true });
          cy.wait(1500);
        }
      }
    });

    cy.contains(/Listagem de agendamentos/i, { timeout: 30000 })
      .should('exist');

    cy.wait(1000);

    cy.get('body').then(($body) => {
      const botaoCadastrar = $body
        .find('button:visible, .q-btn:visible, [role="button"]:visible')
        .filter((_, el) => {
          const texto = Cypress.$(el).text().replace(/\s+/g, ' ').trim();

          return /Cadastrar agendamento/i.test(texto);
        })
        .first();

      expect(
        botaoCadastrar.length,
        'botão cadastrar agendamento'
      ).to.be.greaterThan(0);

      cy.wrap(botaoCadastrar)
        .scrollIntoView()
        .click({ force: true });
    });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Escolha o servi[çc]o/i);
  }

  function parseDataDiaMes(texto: string) {
    const match = texto.match(/(\d{2})\/(\d{2})/);

    if (!match) {
      return null;
    }

    const dia = Number(match[1]);
    const mes = Number(match[2]) - 1;
    const anoAtual = new Date().getFullYear();

    return new Date(anoAtual, mes, dia);
  }

  function parseHorario(texto: string) {
    const match = texto.match(/(\d{1,2}):(\d{2})h/i);

    if (!match) {
      return null;
    }

    const hora = Number(match[1]);
    const minuto = Number(match[2]);

    return hora * 60 + minuto;
  }

  function obterCardsServico($body: JQuery<HTMLElement>) {
  return $body
    .find('div:visible, button:visible, [role="button"]:visible')
    .toArray()
    .filter((el) => {
      const texto = Cypress.$(el)
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      const rect = el.getBoundingClientRect();

      const temTamanhoDeCard =
        rect.width >= 80 &&
        rect.width <= 460 &&
        rect.height >= 35 &&
        rect.height <= 320;

      const contemPalavraServico =
        /Corte|Servi|Servi[çc]o|Servicio/i.test(texto);

      const contemValorServico =
        /R\$\s*[\d.,]+|\$\s*[\d.,]+|₲\s*[\d.,]+|G\s*[\d.,]+/i.test(
          texto
        );

      const naoEhTituloOuBusca =
        !/Escolha o servi[çc]o|Buscar servi[çc]o|Buscar servicio|Exibir mais|Mostrar mais/i.test(
          texto
        );

      return (
        temTamanhoDeCard &&
        naoEhTituloOuBusca &&
        (contemPalavraServico || contemValorServico)
      );
    }) as HTMLElement[];
}

  function selecionarServico() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Escolha o servi[çc]o/i);

    cy.wait(1000);

    cy.get('body').then(($body) => {
      const cardsServico = obterCardsServico($body);

      if (cardsServico.length === 0) {
        cy.screenshot('servico-nao-encontrado');

        throw new Error(
          'Nenhum card de serviço encontrado. Cadastre um serviço ou verifique se há serviços disponíveis no agendamento.'
        );
      }

      const cardServico = cardsServico[0];

      if (!cardServico) {
        throw new Error('Card de serviço inválido.');
      }

      const textoServico = Cypress.$(cardServico)
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      cy.log(`Serviço escolhido: ${textoServico}`);

      cy.wrap(cardServico)
        .scrollIntoView()
        .click('center', { force: true });
    });

    cy.wait(1200);
  }

  function obterCardsProfissional($body: JQuery<HTMLElement>) {
  const tituloProfissional = $body
    .find('*:visible')
    .toArray()
    .find((el) => {
      const texto = Cypress.$(el)
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      return /^Escolha o profissional$/i.test(texto);
    });

  const topTitulo = tituloProfissional
    ? tituloProfissional.getBoundingClientRect().top
    : 0;

  return $body
    .find(
      '.q-card:visible, .q-item:visible, div:visible, button:visible, [role="button"]:visible'
    )
    .toArray()
    .filter((el) => {
      const texto = Cypress.$(el)
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      const rect = el.getBoundingClientRect();

      const depoisDoTitulo = rect.top >= topTitulo - 5;

      const temTamanhoPossivel =
        rect.width >= 40 &&
        rect.width <= 800 &&
        rect.height >= 20 &&
        rect.height <= 400;

      const pareceProfissional =
        /Usuario Paraguai/i.test(texto) ||
        /E2E\s+Atendente/i.test(texto) ||
        /Atendente/i.test(texto) ||
        /Barbeiro/i.test(texto) ||
        /Peluquero/i.test(texto) ||
        /person/i.test(texto);

      const naoEhMenuOuTitulo =
        !/Escolha o profissional|Escolha o servi[çc]o|Corte|Barba|Cejas|Servi[çc]o|Servicio|R\$|₲|\$|Dashboard|Agenda|Clientes|Atendentes|Produtos|Configura[çc][õo]es|Termos de uso|Política de privacidade|cookies|Entendi/i.test(
          texto
        );

      return (
        depoisDoTitulo &&
        temTamanhoPossivel &&
        pareceProfissional &&
        naoEhMenuOuTitulo
      );
    }) as HTMLElement[];
}

function selecionarProfissional() {
  cy.get('body', { timeout: 30000 })
    .invoke('text')
    .should('match', /Escolha o profissional/i);

  fecharCookiesSeAparecer();

  cy.wait(1000);

  cy.get('body').then(($body) => {
    const cardsProfissional = obterCardsProfissional($body);

    if (cardsProfissional.length === 0) {
      cy.screenshot('profissional-nao-encontrado');

      throw new Error(
        'Nenhum card de profissional foi encontrado após selecionar o serviço.'
      );
    }

    const profissionalPreferido = cardsProfissional.find((card) => {
      const texto = Cypress.$(card)
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      return /Usuario Paraguai|E2E\s+Atendente|Atendente|Barbeiro|Peluquero/i.test(
        texto
      );
    });

    const cardProfissional = profissionalPreferido || cardsProfissional[0];

    if (!cardProfissional) {
      throw new Error('Card de profissional inválido.');
    }

    const textoProfissional = Cypress.$(cardProfissional)
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    cy.log(`Profissional escolhido: ${textoProfissional}`);

    const clicavel =
      Cypress.$(cardProfissional)
        .closest('.q-card, .q-item, button, [role="button"]')
        .get(0) || cardProfissional;

    cy.wrap(clicavel)
      .scrollIntoView()
      .click('center', { force: true });
  });

  cy.wait(1500);

  cy.get('body').then(($body) => {
    const texto = $body.text();

    if (/Escolha o profissional/i.test(texto) && !/\d{2}\/\d{2}/.test(texto)) {
      cy.log('Ainda está na etapa profissional. Tentando clicar diretamente no nome.');

      const profissionalPorTexto = $body
        .find('*:visible')
        .toArray()
        .find((el) => {
          const textoElemento = Cypress.$(el)
            .text()
            .replace(/\s+/g, ' ')
            .trim();

          return /Usuario Paraguai|E2E\s+Atendente|Atendente|Barbeiro|Peluquero/i.test(
            textoElemento
          );
        });

      if (!profissionalPorTexto) {
        cy.screenshot('profissional-segunda-tentativa-nao-encontrado');

        throw new Error(
          'Profissional apareceu na tela, mas não foi possível localizar elemento clicável.'
        );
      }

      const clicavel =
        Cypress.$(profissionalPorTexto)
          .closest('.q-card, .q-item, button, [role="button"], div')
          .get(0) || profissionalPorTexto;

      cy.wrap(clicavel)
        .scrollIntoView()
        .click('center', { force: true });

      cy.wait(1500);
    }
  });

  cy.get('body', { timeout: 30000 })
    .invoke('text')
    .should(
      'match',
      /Selecione o dia da semana|Selecione o dia|Escolha o dia|\d{2}\/\d{2}/i
    );
}

  function aguardarDatasAparecerem() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Selecione o dia da semana|\d{2}\/\d{2}/i);
  }

  function selecionarDataFuturaOuHoje() {
    cy.get('body').then(($body) => {
      const agora = new Date();
      const hoje = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
      );

      const elementosData = $body
        .find('*:visible')
        .toArray()
        .filter((el) => {
          const texto = Cypress.$(el).text().trim();

          return /^\d{2}\/\d{2}$/.test(texto);
        });

      const datas = elementosData
        .map((el) => {
          const texto = Cypress.$(el).text().trim();
          const data = parseDataDiaMes(texto);

          return {
            el,
            texto,
            data,
          };
        })
        .filter((item) => item.data !== null) as Array<{
        el: Element;
        texto: string;
        data: Date;
      }>;

      expect(datas.length, 'datas disponíveis').to.be.greaterThan(0);

      const datasFuturas = datas.filter((item) => item.data > hoje);
      const datasHoje = datas.filter(
        (item) => item.data.getTime() === hoje.getTime()
      );

      const dataEscolhida = datasFuturas[0] || datasHoje[0] || datas[0];

      if (!dataEscolhida) {
        throw new Error('Nenhuma data disponível para selecionar.');
      }

      dataSelecionadaTexto = dataEscolhida.texto;
      dataSelecionadaEhHoje =
        dataEscolhida.data.getTime() === hoje.getTime();

      cy.log(`Data escolhida: ${dataSelecionadaTexto}`);
      cy.log(`Data escolhida é hoje? ${dataSelecionadaEhHoje}`);

      cy.wrap(dataEscolhida.el)
        .scrollIntoView()
        .should('be.visible')
        .click({ force: true });
    });
  }

  function selecionarHorarioFuturo() {
    cy.get('body').then(($body) => {
      const agora = new Date();
      const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

      const elementosHorario = $body
        .find('*:visible')
        .toArray()
        .filter((el) => {
          const texto = Cypress.$(el).text().trim();

          return /^\d{1,2}:\d{2}h$/i.test(texto);
        });

      const horarios = elementosHorario
        .map((el) => {
          const texto = Cypress.$(el).text().trim();
          const minutos = parseHorario(texto);

          return {
            el,
            texto,
            minutos,
          };
        })
        .filter((item) => item.minutos !== null) as Array<{
        el: Element;
        texto: string;
        minutos: number;
      }>;

      expect(horarios.length, 'horários disponíveis').to.be.greaterThan(0);

      const horariosValidos = dataSelecionadaEhHoje
        ? horarios.filter((item) => item.minutos > minutosAgora)
        : horarios;

      expect(
        horariosValidos.length,
        'horários futuros disponíveis'
      ).to.be.greaterThan(0);

      const horarioEscolhido = horariosValidos[0];

      if (!horarioEscolhido) {
        throw new Error('Nenhum horário válido disponível.');
      }

      horarioSelecionadoTexto = horarioEscolhido.texto;

      cy.log(`Horário escolhido: ${horarioSelecionadoTexto}`);

      cy.wrap(horarioEscolhido.el)
        .scrollIntoView()
        .should('be.visible')
        .click({ force: true });
    });
  }

  function selecionarCliente() {
    cy.contains(/Nome do cliente/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible');

    cy.get('input:visible')
      .eq(1)
      .should('be.visible')
      .click({ force: true })
      .type('{selectall}{backspace}CLIENTE', { force: true });

    cy.wait(1000);

    cy.get(
      '.q-menu:visible .q-item, .q-virtual-scroll__content .q-item, [role="option"]',
      { timeout: 10000 }
    )
      .filter(':visible')
      .first()
      .click({ force: true });

    cy.wait(500);

    return cy.get('input:visible')
      .eq(0)
      .then(($inputTelefone) => {
        const valorAtual = String($inputTelefone.val() || '').trim();

        if (!valorAtual) {
          cy.wrap($inputTelefone)
            .click({ force: true })
            .type(`{selectall}{backspace}${telefone}`, { force: true });
        }
      });
  }

  function gravarAgendamento() {
    cy.contains(/Gravar|Salvar|Guardar/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /agendamento|sucesso|salvo|criado|Listagem de agendamentos/i
      );
  }

  function criarPrimeiroAgendamento() {
    abrirCadastroAgendamento();

    selecionarServico();

    selecionarProfissional();

    aguardarDatasAparecerem();

    selecionarDataFuturaOuHoje();

    cy.wait(2000);

    cy.contains(/Hor[aá]rios dispon[ií]veis/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible');

    selecionarHorarioFuturo();

    cy.wait(1000);

    selecionarCliente();

    gravarAgendamento();
  }

  function tentarSelecionarMesmaData() {
    return cy.get('body').then(($body) => {
      const datas = $body
        .find('*:visible')
        .toArray()
        .filter((el) => {
          const texto = Cypress.$(el).text().trim();

          return texto === dataSelecionadaTexto;
        }) as HTMLElement[];

      if (datas.length === 0) {
        cy.log(
          `A data ${dataSelecionadaTexto} não apareceu novamente. Sistema bloqueou a data.`
        );

        return cy.wrap(false);
      }

      cy.wrap(datas[0])
        .scrollIntoView()
        .click({ force: true });

      return cy.wrap(true);
    });
  }

  function tentarCriarSegundoMesmoHorario() {
    return cy.get('body').then(($body) => {
      const horarios = $body
        .find('*:visible')
        .toArray()
        .filter((el) => {
          const texto = Cypress.$(el).text().trim();

          return texto === horarioSelecionadoTexto;
        }) as HTMLElement[];

      if (horarios.length === 0) {
        cy.log(
          `O horário ${horarioSelecionadoTexto} não apareceu novamente. Sistema bloqueou o horário.`
        );

        return cy.wrap(false);
      }

      cy.wrap(horarios[0])
        .scrollIntoView()
        .click({ force: true });

      cy.wait(1000);

      return cy.get('body').then(($bodyDepoisHorario) => {
        const texto = $bodyDepoisHorario.text();

        if (!/Nome do cliente/i.test(texto)) {
          cy.log(
            'Sistema não avançou para o formulário final. Horário provavelmente bloqueado.'
          );

          return cy.wrap(false);
        }

        selecionarCliente();

        cy.contains(/Gravar|Salvar|Guardar/i, { timeout: 30000 })
          .scrollIntoView()
          .should('be.visible')
          .click({ force: true });

        cy.get('body', { timeout: 30000 })
          .invoke('text')
          .should(
            'match',
            /conflito|indispon[ií]vel|ocupado|j[aá] existe|hor[aá]rio|não dispon[ií]vel|nao disponivel|erro/i
          );

        return cy.wrap(true);
      });
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
    cy.login();

    fecharCookiesSeAparecer();

    abrirAgenda();
  });

  it('Não deve permitir dois agendamentos no mesmo horário para o mesmo atendente', () => {
    criarPrimeiroAgendamento();

    abrirAgenda();

    abrirCadastroAgendamento();

    selecionarServico();

    selecionarProfissional();

    aguardarDatasAparecerem();

    tentarSelecionarMesmaData().then((dataDisponivel) => {
      if (!dataDisponivel) {
        validarSemErroGrave();

        return;
      }

      cy.wait(1500);

      tentarCriarSegundoMesmoHorario().then(() => {
        validarSemErroGrave();
      });
    });
  });
});