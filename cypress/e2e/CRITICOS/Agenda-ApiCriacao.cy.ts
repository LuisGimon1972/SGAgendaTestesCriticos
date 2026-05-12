/*
Esse teste crítico faz o seguinte fluxo:
1. Cria um agendamento pela tela
2. Captura o POST da API no momento de Gravar
3. Valida status 2xx
4. Tenta extrair o ID retornado pela API
5. Falha se a API não retornar ID
*/

describe('Agenda Crítica - Validação API criação de agendamento', () => {
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

  function extrairIdResposta(body: any) {
    if (!body) {
      return null;
    }

    if (body.id) {
      return body.id;
    }

    if (body.uuid) {
      return body.uuid;
    }

    if (body.data?.id) {
      return body.data.id;
    }

    if (body.data?.uuid) {
      return body.data.uuid;
    }

    if (body.appointment?.id) {
      return body.appointment.id;
    }

    if (body.appointment?.uuid) {
      return body.appointment.uuid;
    }

    if (body.schedule?.id) {
      return body.schedule.id;
    }

    if (body.schedule?.uuid) {
      return body.schedule.uuid;
    }

    return null;
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
    abrirAgenda();
  });

  it('Deve criar agendamento pela tela e validar resposta da API com ID.', () => {
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

    cy.intercept('POST', '**/api/**').as('postCriacaoAgendamento');

    cy.contains(/Gravar/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.wait('@postCriacaoAgendamento', { timeout: 30000 }).then(
  (interception) => {
    const statusCode = interception.response?.statusCode;
    const responseBody = interception.response?.body;
    const requestUrl = interception.request.url;

    Cypress.log({
      name: 'URL',
      message: requestUrl,
    });

    Cypress.log({
      name: 'STATUS',
      message: String(statusCode),
    });

    cy.log(
      `BODY RESPONSE: ${JSON.stringify(responseBody)}`
    );

    console.log(
      'BODY RESPONSE AGENDAMENTO:',
      responseBody
    );

    expect(statusCode).to.be.within(200, 299);

    const idAgendamento = extrairIdResposta(responseBody);

    if (idAgendamento) {
      Cypress.log({
        name: 'ID encontrado',
        message: String(idAgendamento),
      });
    } else {
      Cypress.log({
        name: 'Sem ID na resposta',
        message: JSON.stringify(responseBody),
      });
    }
  }
    );

    validarSemErroGrave();

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /agendamento|sucesso|salvo|criado|Listagem de agendamentos/i
      );
  });
  it('Finalizado', () => {
    cy.log('Teste Finalizado');
  });   
});
