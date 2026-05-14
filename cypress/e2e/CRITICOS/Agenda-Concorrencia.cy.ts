/*
O teste de concorrência verifica o que acontece quando duas ações tentam usar o mesmo recurso ao mesmo tempo.

Esse teste procura erros como:

- Dois agendamentos no mesmo horário
- Mesmo atendente com agenda duplicada
- Falha de bloqueio no backend
- Race condition
- Botão Gravar permitindo clique duplicado
- API aceitando duplicidade
- Agenda visual mostrando horário livre quando já foi ocupado
*/

describe('Agenda Crítica - Concorrência por duplo clique no Gravar', () => {
  let postsAgendamento: Array<{
    url: string;
    statusCode?: number;
  }> = [];

  let agendamentoDataEhHoje = false;

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
        cy.contains(/Entendi|Aceitar|Aceito|OK|Concordo/i).click({
          force: true,
        });
      }
    });
  }

  function monitorarPostsAgendamento() {
    postsAgendamento = [];

    cy.intercept('POST', '**/api/**', (req) => {
      const url = req.url.toLowerCase();

      const ehAgendamento =
        url.includes('appointment') ||
        url.includes('appointments') ||
        url.includes('schedule') ||
        url.includes('schedules') ||
        url.includes('booking') ||
        url.includes('agenda') ||
        url.includes('agendamento');

      if (ehAgendamento) {
        req.on('response', (res) => {
          postsAgendamento.push({
            url: req.url,
            statusCode: res.statusCode,
          });
        });
      }
    });
  }

  function abrirAgenda() {
    cy.contains(/Agenda/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Listagem de agendamentos/i, { timeout: 30000 }).should(
      'be.visible'
    );
  }

  function abrirCadastroAgendamento() {
    cy.contains(/Cadastrar agendamento/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

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
        const texto = Cypress.$(el).text().replace(/\s+/g, ' ').trim();
        const rect = el.getBoundingClientRect();

        const temTamanhoDeCard =
          rect.width >= 100 &&
          rect.width <= 380 &&
          rect.height >= 60 &&
          rect.height <= 260;

        const pareceServico =
          /R\$\s*\d+/i.test(texto) || /A partir de R\$/i.test(texto);

        const naoEhTituloOuBusca =
          !/Escolha o servi[çc]o|Buscar servi[çc]o|Exibir mais/i.test(texto);

        return temTamanhoDeCard && pareceServico && naoEhTituloOuBusca;
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
    return $body
      .find('div:visible, button:visible, [role="button"]:visible')
      .toArray()
      .filter((el) => {
        const texto = Cypress.$(el).text().replace(/\s+/g, ' ').trim();
        const rect = el.getBoundingClientRect();

        const temTamanhoDeCard =
          rect.width >= 80 &&
          rect.width <= 400 &&
          rect.height >= 60 &&
          rect.height <= 300;

        const naoEhTituloOuBusca =
          !/Escolha o profissional|Escolha o servi[çc]o|Buscar|Exibir mais/i.test(
            texto
          );

        return temTamanhoDeCard && naoEhTituloOuBusca && texto.length >= 3;
      }) as HTMLElement[];
  }

  function selecionarProfissional() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Escolha o profissional/i);

    cy.wait(1000);

    cy.get('body').then(($body) => {
      const cardsProfissional = obterCardsProfissional($body);

      if (cardsProfissional.length === 0) {
        cy.screenshot('profissional-nao-encontrado');

        throw new Error(
          'Nenhum card de profissional foi encontrado após selecionar o serviço.'
        );
      }

      const profissionalE2E = cardsProfissional.find((card) => {
        const texto = Cypress.$(card).text().replace(/\s+/g, ' ').trim();

        return /E2E\s+Atendente/i.test(texto);
      });

      const cardProfissional = profissionalE2E || cardsProfissional[0];

      if (!cardProfissional) {
        throw new Error('Card de profissional inválido.');
      }

      const textoProfissional = Cypress.$(cardProfissional)
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      cy.log(`Profissional escolhido: ${textoProfissional}`);

      cy.wrap(cardProfissional)
        .scrollIntoView()
        .click('center', { force: true });
    });

    cy.wait(2000);
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

      agendamentoDataEhHoje =
        dataEscolhida.data.getTime() === hoje.getTime();

      cy.log(`Data escolhida: ${dataEscolhida.texto}`);
      cy.log(`Data escolhida é hoje? ${agendamentoDataEhHoje}`);

      cy.wrap(dataEscolhida.el)
        .scrollIntoView()
        .should('be.visible')
        .click({ force: true });
    });
  }

  function selecionarHorarioMaiorQueAgora() {
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

      const horariosValidos = agendamentoDataEhHoje
        ? horarios.filter((item) => item.minutos > minutosAgora)
        : horarios;

      expect(
        horariosValidos.length,
        'horários futuros disponíveis'
      ).to.be.greaterThan(0);

      const horarioEscolhido = horariosValidos[0];

      if (!horarioEscolhido) {
        throw new Error('Nenhum horário válido disponível para selecionar.');
      }

      cy.log(`Horário escolhido: ${horarioEscolhido.texto}`);

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

    cy.get('input:visible')
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

    monitorarPostsAgendamento();

    abrirAgenda();
  });

  it('não deve criar agendamento duplicado ao clicar duas vezes em Gravar', () => {
    abrirCadastroAgendamento();

    selecionarServico();

    selecionarProfissional();

    aguardarDatasAparecerem();

    selecionarDataFuturaOuHoje();

    cy.wait(2000);

    cy.contains(/Hor[aá]rios dispon[ií]veis/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible');

    selecionarHorarioMaiorQueAgora();

    cy.wait(1000);

    selecionarCliente();

    cy.contains(/Gravar|Salvar|Guardar/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible')
      .dblclick({ force: true });

    cy.wait(5000);

    validarSemErroGrave();

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /agendamento|sucesso|salvo|criado|Listagem de agendamentos|indispon[ií]vel|j[aá] existe|conflito/i
      );

    cy.then(() => {
      const postsComSucesso = postsAgendamento.filter((post) => {
        return (
          post.statusCode !== undefined &&
          post.statusCode >= 200 &&
          post.statusCode < 300
        );
      });

      Cypress.log({
        name: 'POSTs de agendamento',
        message: JSON.stringify(postsAgendamento),
      });

      cy.log(`POSTs monitorados: ${JSON.stringify(postsAgendamento)}`);
      cy.log(`POSTs com sucesso: ${postsComSucesso.length}`);

      expect(
        postsComSucesso.length,
        'Não deve haver mais de um POST de agendamento com sucesso'
      ).to.be.lessThan(2);
    });
  });
});