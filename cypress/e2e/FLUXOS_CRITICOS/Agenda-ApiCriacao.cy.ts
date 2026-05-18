/*
Esse teste crítico faz o seguinte fluxo:
1. Cria um agendamento pela tela
2. Captura o POST da API no momento de Gravar
3. Valida status 2xx
4. Tenta extrair o ID retornado pela API
5. Se a API não retornar ID, valida code 201 ou mensagem de registro criado
*/

describe('Agenda Crítica - Validação API criação de agendamento', () => {
  const telefone = gerarTelefoneAleatorio();

  let agendamentoDataEhHoje = false;

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
      const texto = Cypress.$(el)
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      const rect = el.getBoundingClientRect();

      const temTamanhoDeCard =
        rect.width >= 80 &&
        rect.width <= 420 &&
        rect.height >= 50 &&
        rect.height <= 300;

      const contemPalavraServico =
        /Corte|Servi|Servi[çc]o|Servicio/i.test(texto);

      const contemValorServico =
        /R\$\s*[\d.,]+|₲\s*[\d.,]+|\$\s*[\d.,]+/i.test(texto);

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
    .find('div:visible, button:visible, [role="button"]:visible')
    .toArray()
    .filter((el) => {
      const texto = Cypress.$(el)
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      const rect = el.getBoundingClientRect();

      const depoisDoTitulo = rect.top >= topTitulo;

      const temTamanhoDeCard =
        rect.width >= 80 &&
        rect.width <= 600 &&
        rect.height >= 30 &&
        rect.height <= 350;

      const pareceProfissional =
        /person/i.test(texto) ||
        /Usuario Paraguai/i.test(texto) ||
        /E2E\s+Atendente/i.test(texto) ||
        /Atendente/i.test(texto) ||
        /Barbeiro/i.test(texto) ||
        /Peluquero/i.test(texto) ||
        texto.length >= 5;

      const naoEhTituloOuMenu =
        !/Escolha o profissional|Escolha o servi[çc]o|Dashboard|Agenda|Clientes|Atendentes|Servi[çc]os|Produtos|Configura[çc][õo]es|Termos de uso|Política de privacidade|cookies|Entendi/i.test(
          texto
        );

      return (
        depoisDoTitulo &&
        temTamanhoDeCard &&
        pareceProfissional &&
        naoEhTituloOuMenu
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

    cy.wrap(cardProfissional)
      .scrollIntoView()
      .click('center', { force: true });
  });

  cy.wait(2000);

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
    .should(
      'match',
      /Selecione o dia da semana|Selecione o dia|Escolha o dia|\d{2}\/\d{2}/i
    );
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

  function validarRespostaCriacaoSemId(responseBody: any) {
    const textoResposta = JSON.stringify(responseBody || {});

    const code = responseBody?.code;
    const message = String(responseBody?.message || '');

    const respostaCriada =
      code === 201 ||
      /Registro criado|criado|created|success|sucesso/i.test(message) ||
      /Registro criado|criado|created|success|sucesso/i.test(textoResposta);

    expect(
      respostaCriada,
      `API criou agendamento sem retornar ID. Body: ${textoResposta}`
    ).to.eq(true);
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

  it('Deve criar agendamento pela tela e validar resposta da API', () => {
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

    cy.intercept('POST', '**/api/**').as('postCriacaoAgendamento');

    cy.contains(/Gravar|Salvar|Guardar/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.wait('@postCriacaoAgendamento', { timeout: 30000 }).then(
      (interception) => {
        const statusCode = interception.response?.statusCode;
        const responseBody = interception.response?.body;
        const requestUrl = interception.request.url;

        cy.log(`URL: ${requestUrl}`);
        cy.log(`STATUS: ${statusCode}`);
        cy.log(`BODY RESPONSE: ${JSON.stringify(responseBody)}`);

        console.log('BODY RESPONSE AGENDAMENTO:', responseBody);

        expect(statusCode, 'status da API').to.be.within(200, 299);

        const idAgendamento = extrairIdResposta(responseBody);

        if (idAgendamento) {
          cy.log(`ID encontrado: ${idAgendamento}`);
        } else {
          cy.log('API criou o agendamento, mas não retornou ID.');
          validarRespostaCriacaoSemId(responseBody);
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
});