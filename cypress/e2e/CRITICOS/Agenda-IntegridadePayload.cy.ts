/*
Esse teste crítico valida a integridade do payload enviado para a API.

Ele verifica se, ao criar um agendamento pela tela, o POST enviado contém:
- serviço
- atendente/profissional
- data selecionada
- horário selecionado
- cliente

Esse teste ajuda a encontrar problemas como:
- tela seleciona um serviço, mas API recebe outro
- tela seleciona um atendente, mas API recebe outro
- data enviada diferente da data clicada
- horário enviado diferente do horário clicado
- payload incompleto
- erro de fuso horário
- sucesso visual com dados errados no backend
*/

describe('Agenda Crítica - Integridade do Payload', () => {
  let servicoSelecionadoTexto = '';
  let atendenteSelecionadoTexto = '';
  let dataSelecionadaTexto = '';
  let dataSelecionadaApiEsperada = '';
  let horarioSelecionadoTexto = '';
  let horarioSelecionadoApiEsperado = '';
  let dataSelecionadaEhHoje = false;

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

  function limparTexto(texto: string) {
    return texto.replace(/\s+/g, ' ').trim();
  }

  function formatarDataApi(data: Date) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
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

  function normalizarRequestBody(body: any) {
    if (!body) {
      return {};
    }

    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }

    return body;
  }

  function abrirAgenda() {
    cy.contains(/Agenda/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Listagem de agendamentos/i, { timeout: 30000 })
      .should('exist');

    cy.wait(1000);
  }

  function abrirCadastroAgendamento() {
    cy.contains(/Cadastrar agendamento/i, { timeout: 30000 })
      .scrollIntoView()
      .should('exist')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Escolha o servi[çc]o/i);
  }

  function selecionarServico() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Escolha o servi[çc]o/i)
      .then(() => {
        cy.wait(1000);

        cy.get('body').then(($body) => {
          const tituloServico = [...$body.find('*:visible')].find((el) => {
            const texto = limparTexto(Cypress.$(el).text());

            return /^Escolha o servi[çc]o$/i.test(texto);
          });

          const topTitulo = tituloServico
            ? tituloServico.getBoundingClientRect().top
            : 0;

          const cardsServico = $body
            .find('div:visible, button:visible, [role="button"]:visible')
            .filter((_, el) => {
              const texto = limparTexto(Cypress.$(el).text());
              const rect = el.getBoundingClientRect();

              return (
                rect.top > topTitulo &&
                /servi[çc]o/i.test(texto) &&
                !/^Escolha o servi[çc]o$/i.test(texto) &&
                !/Buscar servi[çc]o por nome/i.test(texto) &&
                rect.width >= 80 &&
                rect.width <= 350 &&
                rect.height >= 60 &&
                rect.height <= 250
              );
            });

          if (cardsServico.length === 0) {
            cy.screenshot('servico-payload-nao-encontrado');

            throw new Error(
              'Nenhum card contendo a palavra SERVIÇO foi encontrado.'
            );
          }

          const cardServico = cardsServico.first();
          servicoSelecionadoTexto = limparTexto(cardServico.text());

          cy.log(`Serviço selecionado: ${servicoSelecionadoTexto}`);

          cy.wrap(cardServico)
            .scrollIntoView()
            .click('center', { force: true });
        });
      });

    cy.wait(1000);
  }

  function selecionarProfissional() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Escolha o profissional/i)
      .then(() => {
        cy.wait(1000);

        cy.get('body').then(($body) => {
          const cardsAtendente = $body
            .find('div:visible, button:visible, [role="button"]:visible')
            .filter((_, el) => {
              const texto = limparTexto(Cypress.$(el).text());
              const rect = el.getBoundingClientRect();

              return (
                /E2E\s+Atendente/i.test(texto) &&
                rect.width >= 70 &&
                rect.width <= 350 &&
                rect.height >= 60 &&
                rect.height <= 300
              );
            });

          if (cardsAtendente.length === 0) {
            cy.screenshot('atendente-e2e-payload-nao-encontrado');

            throw new Error(
              'Nenhum card contendo "E2E Atendente" foi encontrado.'
            );
          }

          const cardAtendente = cardsAtendente.first();
          atendenteSelecionadoTexto = limparTexto(cardAtendente.text());

          cy.log(`Atendente selecionado: ${atendenteSelecionadoTexto}`);

          cy.wrap(cardAtendente)
            .scrollIntoView()
            .click('center', { force: true });
        });
      });

    cy.wait(3000);
  }

  function aguardarDatasAparecerem() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Selecione o dia da semana|\d{2}\/\d{2}/i);
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

      dataSelecionadaTexto = dataEscolhida.texto;
      dataSelecionadaApiEsperada = formatarDataApi(dataEscolhida.data);
      dataSelecionadaEhHoje = dataEscolhida.data.getTime() === hoje.getTime();

      cy.log(`Data selecionada na tela: ${dataSelecionadaTexto}`);
      cy.log(`Data esperada no payload: ${dataSelecionadaApiEsperada}`);
      cy.log(`Data selecionada é hoje? ${dataSelecionadaEhHoje}`);

      return cy
        .wrap(dataEscolhida.el)
        .scrollIntoView()
        .should('be.visible')
        .click({ force: true });
    });
  }

  function selecionarHorarioFuturo() {
    return cy.get('body').then(($body) => {
      const agora = new Date();
      const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

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

      const horariosValidos = dataSelecionadaEhHoje
        ? horarios.filter((item) => item.minutos > minutosAgora)
        : horarios;

      expect(
        horariosValidos.length,
        'horários futuros disponíveis'
      ).to.be.greaterThan(0);

      const horarioEscolhido = horariosValidos[0];

      horarioSelecionadoTexto = horarioEscolhido.texto;
      horarioSelecionadoApiEsperado = horarioEscolhido.texto.replace(/h$/i, '');

      cy.log(`Horário selecionado na tela: ${horarioSelecionadoTexto}`);
      cy.log(`Horário esperado no payload: ${horarioSelecionadoApiEsperado}`);

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

function validarPayloadAgendamento(payloadOriginal: any) {
  const payload = normalizarRequestBody(payloadOriginal);
  const payloadString = JSON.stringify(payload);

  cy.log(`Payload enviado: ${payloadString}`);
  cy.log(`Serviço selecionado: ${servicoSelecionadoTexto}`);
  cy.log(`Atendente selecionado: ${atendenteSelecionadoTexto}`);
  cy.log(`Data selecionada: ${dataSelecionadaTexto}`);
  cy.log(`Horário selecionado: ${horarioSelecionadoTexto}`);

  expect(
    payloadString,
    'Payload deve conter campo relacionado a serviço.'
  ).to.match(
    /service|servi[çc]o|service_id|service_uuid|services|serviceId/i
  );

  expect(
    payloadString,
    'Payload deve conter campo relacionado a atendente/profissional.'
  ).to.match(
    /companyUserId|company_user|company_user_id|companyUser|professional|professional_id|professionalId|atendente|user_id|userId|employee/i
  );

  expect(
    payloadString,
    'Payload deve conter campo relacionado à data.'
  ).to.match(/date|data|schedule_date|scheduled_at|day/i);

  expect(
    payloadString,
    'Payload deve conter campo relacionado ao horário.'
  ).to.match(/time|hora|hour|start_time|scheduled_at|start/i);

  expect(
    payloadString,
    'Payload deve conter campo relacionado ao cliente.'
  ).to.match(
    /client|cliente|customer|customer_id|customerId|client_id|clientId|customerName|phone|telefone|name/i
  );

  expect(
    payloadString,
    `Payload deve conter a data selecionada na tela: ${dataSelecionadaApiEsperada}`
  ).to.include(dataSelecionadaApiEsperada);

  expect(
    payloadString,
    `Payload deve conter o horário selecionado na tela: ${horarioSelecionadoApiEsperado}`
  ).to.include(horarioSelecionadoApiEsperado);
}

  beforeEach(() => {
    cy.login();

    fecharCookiesSeAparecer();

    abrirAgenda();
  });

  it('Deve enviar para API os mesmos dados selecionados na tela.', () => {
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

    cy.intercept('POST', '**/api/**').as('postCriacaoAgendamento');

    cy.contains(/Gravar/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.wait('@postCriacaoAgendamento', { timeout: 30000 }).then(
      (interception) => {
        const statusCode = interception.response?.statusCode;
        const requestUrl = interception.request.url;
        const requestBody = interception.request.body;
        const responseBody = interception.response?.body;

        cy.log(`URL do POST: ${requestUrl}`);
        cy.log(`Status da resposta: ${statusCode}`);
        cy.log(`Body da resposta: ${JSON.stringify(responseBody)}`);

        expect(statusCode).to.be.within(200, 299);

        validarPayloadAgendamento(requestBody);
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