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

  function gerarTelefoneAleatorio() {
    const ddd = '49';
    const primeiroDigito = '9';
    const numero = Math.floor(10000000 + Math.random() * 90000000);

    return `${ddd}${primeiroDigito}${numero}`;
  }

  const telefone = gerarTelefoneAleatorio();

  function fecharCookiesSeAparecer() {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
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

    cy.contains(/Listagem de agendamentos/i, { timeout: 30000 })
      .should('be.visible');
  }

  function abrirCadastroAgendamento() {
    cy.contains(/Cadastrar agendamento/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.contains(/Escolha o servi[çc]o/i, { timeout: 30000 })
      .should('be.visible');
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

  function selecionarServico() {
    cy.contains(/CORTE DE BARBA GROSSA/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.wait(1000);
  }

  function selecionarProfissional() {
    cy.contains(/Escolha o profissional/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible');

    cy.contains(/MARCOS\s+OLIVEIRA/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.wait(3000);
  }

  function selecionarDataFuturaOuHoje() {
    return cy.get('body').then(($body) => {
      const agora = new Date();
      const hoje = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
      );

      const elementosData = [...$body.find('*:visible')].filter((el) => {
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

      const ehHoje = dataEscolhida.data.getTime() === hoje.getTime();

      Cypress.env('AGENDAMENTO_DATA_EH_HOJE', ehHoje);

      Cypress.log({
        name: 'Data escolhida',
        message: `${dataEscolhida.texto} | Hoje: ${ehHoje}`,
      });

      return cy
        .wrap(dataEscolhida.el)
        .scrollIntoView()
        .should('be.visible')
        .click({ force: true });
    });
  }

  function selecionarHorarioMaiorQueAgora() {
    return cy.get('body').then(($body) => {
      const agora = new Date();
      const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
      const dataEhHoje = Cypress.env('AGENDAMENTO_DATA_EH_HOJE') === true;

      const elementosHorario = [...$body.find('*:visible')].filter((el) => {
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

      const horariosValidos = dataEhHoje
        ? horarios.filter((item) => item.minutos > minutosAgora)
        : horarios;

      expect(
        horariosValidos.length,
        'horários futuros disponíveis'
      ).to.be.greaterThan(0);

      const horarioEscolhido = horariosValidos[0];

      Cypress.log({
        name: 'Horário escolhido',
        message: horarioEscolhido.texto,
      });

      return cy
        .wrap(horarioEscolhido.el)
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
      .type('CLIENTE', { force: true });

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
    cy.login({ width: 1366, height: 768 });

    fecharCookiesSeAparecer();

    monitorarPostsAgendamento();

    abrirAgenda();
  });

  it('Não deve criar agendamento duplicado ao clicar duas vezes em Gravar.', () => {
    abrirCadastroAgendamento();

    selecionarServico();

    selecionarProfissional();

    selecionarDataFuturaOuHoje();

    cy.wait(2000);

    cy.contains(/Hor[aá]rios dispon[ií]veis/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible');

    selecionarHorarioMaiorQueAgora();

    cy.wait(1000);

    selecionarCliente();

    cy.contains(/Gravar/i, { timeout: 30000 })
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
        return post.statusCode && post.statusCode >= 200 && post.statusCode < 300;
      });

      Cypress.log({
        name: 'POSTs de agendamento',
        message: JSON.stringify(postsAgendamento),
      });

      expect(
        postsComSucesso.length,
        'Não deve haver mais de um POST de agendamento com sucesso.'
      ).to.be.lessThan(2);
    });
  });
  it('Finalizado', () => {
    cy.log('Teste Finalizado');
  });   
});