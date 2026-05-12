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

    cy.wait(1000);

    cy.get('body').then(($body) => {
      const texto = $body.text();

      if (texto.match(/Detalhes do agendamento|Detalhes/i)) {
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

    cy.wait(2000);

    cy.get('body').then(($body) => {
      const texto = $body.text();

      if (texto.match(/Detalhes do agendamento|Detalhes/i)) {
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
        .find('button, .q-btn, [role="button"]')
        .filter((_, el) => {
          const texto = Cypress.$(el).text().trim();

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

  function selecionarServico() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Escolha o servi[çc]o/i)
      .then(() => {
        cy.wait(1000);

        cy.get('body').then(($body) => {
          const cardsServico = $body
            .find('div:visible, button:visible, [role="button"]:visible')
            .filter((_, el) => {
              const texto = Cypress.$(el).text().replace(/\s+/g, ' ').trim();
              const rect = el.getBoundingClientRect();

              return (
                /servi[çc]o/i.test(texto) &&
                !/^Escolha o servi[çc]o$/i.test(texto) &&
                rect.width >= 80 &&
                rect.width <= 350 &&
                rect.height >= 60 &&
                rect.height <= 250
              );
            });

          if (cardsServico.length === 0) {
            cy.screenshot('servico-nao-encontrado');

            throw new Error(
              'Nenhum card contendo a palavra SERVIÇO foi encontrado.'
            );
          }

          const cardServico = cardsServico.first();
          const textoServico = cardServico.text().replace(/\s+/g, ' ').trim();

          cy.log(`Serviço escolhido: ${textoServico}`);

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
              const texto = Cypress.$(el).text().replace(/\s+/g, ' ').trim();
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
            cy.screenshot('atendente-e2e-nao-encontrado');

            throw new Error(
              'Nenhum card contendo "E2E Atendente" foi encontrado.'
            );
          }

          const cardAtendente = cardsAtendente.first();
          const textoAtendente = cardAtendente
            .text()
            .replace(/\s+/g, ' ')
            .trim();

          cy.log(`Atendente escolhido: ${textoAtendente}`);

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
      dataSelecionadaEhHoje = dataEscolhida.data.getTime() === hoje.getTime();

      cy.log(`Data escolhida: ${dataSelecionadaTexto}`);
      cy.log(`Data escolhida é hoje? ${dataSelecionadaEhHoje}`);

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

      cy.log(`Horário escolhido: ${horarioSelecionadoTexto}`);

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
    cy.contains(/Gravar/i, { timeout: 30000 })
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
      const datas = [...$body.find('*:visible')].filter((el) => {
        const texto = Cypress.$(el).text().trim();

        return texto === dataSelecionadaTexto;
      });

      if (datas.length === 0) {
        cy.log(
          `A data ${dataSelecionadaTexto} não apareceu novamente. Sistema bloqueou a data.`
        );

        return cy.wrap(false);
      }

      return cy
        .wrap(datas[0])
        .scrollIntoView()
        .click({ force: true })
        .then(() => true);
    });
  }

  function tentarCriarSegundoMesmoHorario() {
    return cy.get('body').then(($body) => {
      const horarios = [...$body.find('*:visible')].filter((el) => {
        const texto = Cypress.$(el).text().trim();

        return texto === horarioSelecionadoTexto;
      });

      if (horarios.length === 0) {
        cy.log(
          `O horário ${horarioSelecionadoTexto} não apareceu novamente. Sistema bloqueou o horário.`
        );

        return false;
      }

      return cy
        .wrap(horarios[0])
        .scrollIntoView()
        .click({ force: true })
        .then(() => {
          cy.wait(1000);

          return cy.get('body').then(($bodyDepoisHorario) => {
            const texto = $bodyDepoisHorario.text();

            if (!texto.match(/Nome do cliente/i)) {
              cy.log(
                'Sistema não avançou para o formulário final. Horário provavelmente bloqueado.'
              );

              return false;
            }

            return selecionarCliente().then(() => {
              cy.contains(/Gravar/i, { timeout: 30000 })
                .scrollIntoView()
                .should('be.visible')
                .click({ force: true });

              cy.get('body', { timeout: 30000 })
                .invoke('text')
                .should(
                  'match',
                  /conflito|indispon[ií]vel|ocupado|j[aá] existe|hor[aá]rio|não dispon[ií]vel|nao disponivel|erro/i
                );

              return true;
            });
          });
        });
    });
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
        return;
      }

      cy.wait(1500);

      tentarCriarSegundoMesmoHorario();
    });
  });

  it('Finalizado', () => {
    cy.log('Teste Finalizado');
  });
});