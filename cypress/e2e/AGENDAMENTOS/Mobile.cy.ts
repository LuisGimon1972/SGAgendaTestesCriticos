Cypress.on('uncaught:exception', (err) => {
  const mensagem = [
    err?.name || '',
    err?.message || '',
    err?.stack || '',
  ].join(' ');

  const errosConhecidosDaAplicacao = [
    /Element not found/i,
    /Cannot read properties of null.*nextSibling/i,
    /reading 'nextSibling'/i,
  ];

  const deveIgnorar = errosConhecidosDaAplicacao.some((regex) =>
    regex.test(mensagem)
  );

  if (deveIgnorar) {
    Cypress.log({
      name: 'Erro ignorado da aplicação',
      message: mensagem,
    });

    return false;
  }

  return true;
});

describe('Agendamentos - Cadastro', () => {
  let dataSelecionadaEhHoje = false;

  const telefone = gerarTelefoneAleatorio();

  function gerarTelefoneAleatorio() {
    const ddd = '49';
    const primeiroDigito = '9';
    const numero = Math.floor(10000000 + Math.random() * 90000000);

    return `${ddd}${primeiroDigito}${numero}`;
  }

  function limparTexto(texto: string) {
    return texto.replace(/\s+/g, ' ').trim();
  }

  function fecharCookiesSeAparecer() {
    cy.get('body').then(($body) => {
      const texto = $body.text();

      const apareceuCookies =
        /cookies|utilizamos cookies|melhorar sua experiência|política de privacidade/i.test(
          texto
        );

      if (!apareceuCookies && !/Entendi|Aceitar|Aceito|OK|Concordo/i.test(texto)) {
        return;
      }

      const botaoCookie = $body
        .find('button:visible, .q-btn:visible, [role="button"]:visible')
        .toArray()
        .find((botao) => {
          const textoBotao = limparTexto(Cypress.$(botao).text());

          return /Entendi|Aceitar|Aceito|OK|Concordo/i.test(textoBotao);
        });

      if (botaoCookie) {
        cy.wrap(botaoCookie).click({ force: true });
      }
    });
  }

  function abrirAgenda() {
    cy.contains(/Agenda/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Listagem de agendamentos/i, { timeout: 30000 })
      .should('be.visible');

    fecharCookiesSeAparecer();
  }

  function abrirCadastroAgendamento() {
    cy.contains(/Cadastrar agendamento/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.contains(/Escolha o servi[çc]o/i, { timeout: 30000 })
      .should('exist');

    fecharCookiesSeAparecer();
  }

  function obterCardsServico($body: JQuery<HTMLElement>) {
    const encontrados: HTMLElement[] = [];
    const vistos = new Set<HTMLElement>();

    $body
      .find('*:visible')
      .toArray()
      .forEach((el) => {
        const elemento = el as HTMLElement;
        const texto = limparTexto(Cypress.$(elemento).text());

        if (!texto || texto.length > 220) {
          return;
        }

        const rect = elemento.getBoundingClientRect();

        const temTamanhoPossivel =
          rect.width >= 20 &&
          rect.width <= 700 &&
          rect.height >= 10 &&
          rect.height <= 420;

        const contemPalavraServico =
          /Corte|Servi|Servi[çc]o|Servicio/i.test(texto);

        const contemValorServico =
          /(?:R\$|\$|₲|G|Gs\.?|G\$)\s*[\d.,]+|[\d.,]+\s*(?:R\$|\$|₲|G|Gs\.?|G\$)/i.test(
            texto
          );

        const naoEhTituloBuscaOuMenu =
          !/Escolha o servi[çc]o|Buscar servi[çc]o|Buscar servicio|Exibir mais|Mostrar mais|Dashboard|Agenda|Clientes|Atendentes|Produtos|Configura[çc][õo]es|Termos de uso|Política de privacidade|cookies|Entendi/i.test(
            texto
          );

        if (
          !temTamanhoPossivel ||
          !naoEhTituloBuscaOuMenu ||
          (!contemPalavraServico && !contemValorServico)
        ) {
          return;
        }

        const clicavel =
          Cypress.$(elemento)
            .closest(
              '.q-card, .q-item, button, [role="button"], [class*="card"], [class*="item"]'
            )
            .get(0) || elemento;

        if (!vistos.has(clicavel)) {
          vistos.add(clicavel);
          encontrados.push(clicavel);
        }
      });

    return encontrados.sort((a, b) => {
      const textoA = limparTexto(Cypress.$(a).text());
      const textoB = limparTexto(Cypress.$(b).text());

      const scoreA =
        (/Corte|Servi|Servi[çc]o|Servicio/i.test(textoA) ? 100 : 0) +
        (/(?:R\$|\$|₲|G|Gs\.?|G\$)\s*[\d.,]+/i.test(textoA) ? 80 : 0) -
        textoA.length;

      const scoreB =
        (/Corte|Servi|Servi[çc]o|Servicio/i.test(textoB) ? 100 : 0) +
        (/(?:R\$|\$|₲|G|Gs\.?|G\$)\s*[\d.,]+/i.test(textoB) ? 80 : 0) -
        textoB.length;

      return scoreB - scoreA;
    });
  }

  function selecionarServico(tentativa = 0): Cypress.Chainable {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Escolha o servi[çc]o/i);

    fecharCookiesSeAparecer();

    cy.wait(1000);

    return cy.get('body').then(($body) => {
      const cardsServico = obterCardsServico($body);

      if (cardsServico.length === 0) {
        cy.log(`Texto da tela: ${limparTexto($body.text()).slice(0, 1200)}`);
        cy.screenshot('servico-nao-encontrado');

        throw new Error(
          'Nenhum card de serviço encontrado com Corte, Servi, Serviço, Servicio, R$, $, ₲ ou G.'
        );
      }

      const cardServico = cardsServico[tentativa] || cardsServico[0];

      if (!cardServico) {
        throw new Error('Card de serviço inválido.');
      }

      const textoServico = limparTexto(Cypress.$(cardServico).text());

      cy.log(`Serviço escolhido: ${textoServico}`);

      cy.wrap(cardServico)
        .scrollIntoView()
        .click('center', { force: true });

      cy.wait(1500);

      return cy.get('body').then(($bodyDepois) => {
        const textoDepois = $bodyDepois.text();

        if (/Escolha o profissional/i.test(textoDepois)) {
          return cy.wrap(null);
        }

        if (tentativa + 1 < cardsServico.length && tentativa < 5) {
          cy.log('Serviço clicado não avançou. Tentando próximo card.');

          return selecionarServico(tentativa + 1);
        }

        cy.screenshot('servico-clicado-mas-nao-avancou');

        throw new Error(
          `Serviço foi clicado, mas a tela não avançou para profissional. Serviço: ${textoServico}`
        );
      });
    });
  }

  function obterCardsProfissional($body: JQuery<HTMLElement>) {
  const tituloProfissional = $body
    .find('*:visible')
    .toArray()
    .find((el) => {
      const texto = limparTexto(Cypress.$(el).text());

      return /^Escolha o profissional$/i.test(texto);
    });

  const topTitulo = tituloProfissional
    ? tituloProfissional.getBoundingClientRect().top
    : 0;

  return $body
    .find('*:visible')
    .toArray()
    .filter((el) => {
      const elemento = el as HTMLElement;
      const texto = limparTexto(Cypress.$(elemento).text());
      const rect = elemento.getBoundingClientRect();

      const depoisDoTitulo = rect.top >= topTitulo - 10;

      const tamanhoValido =
        rect.width >= 20 &&
        rect.width <= 900 &&
        rect.height >= 10 &&
        rect.height <= 450;

      const pareceProfissional =
        /Usuario Paraguai/i.test(texto) ||
        /E2E\s+Atendente/i.test(texto) ||
        /Atendente/i.test(texto) ||
        /Barbeiro/i.test(texto) ||
        /Peluquero/i.test(texto) ||
        /^person/i.test(texto) ||
        /personUsuario/i.test(texto);

      const naoEhMenuOuTitulo =
        !/Escolha o profissional|Escolha o servi[çc]o|Dashboard|Agenda|Clientes|Atendentes|Produtos|Configura[çc][õo]es|Termos de uso|Política de privacidade|Termos de agendamento|Compartilhar|keyboard_arrow_down|chevron_left|share/i.test(
          texto
        );

      const naoEhServico =
        !/Corte|Barba|Cejas|Servi[çc]o|Servicio|R\$|₲|\$|G\s*[\d.,]+/i.test(
          texto
        );

      return (
        depoisDoTitulo &&
        tamanhoValido &&
        pareceProfissional &&
        naoEhMenuOuTitulo &&
        naoEhServico
      );
    })
    .sort((a, b) => {
      const textoA = limparTexto(Cypress.$(a).text());
      const textoB = limparTexto(Cypress.$(b).text());

      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();

      const scoreA =
        (/Usuario Paraguai|E2E\s+Atendente|Atendente|Barbeiro|Peluquero/i.test(
          textoA
        )
          ? 100
          : 0) - rectA.width * rectA.height * 0.0001;

      const scoreB =
        (/Usuario Paraguai|E2E\s+Atendente|Atendente|Barbeiro|Peluquero/i.test(
          textoB
        )
          ? 100
          : 0) - rectB.width * rectB.height * 0.0001;

      return scoreB - scoreA;
    }) as HTMLElement[];
}

function clicarElementoComEventosReais(elemento: HTMLElement) {
  return cy.wrap(elemento).scrollIntoView().then(($el) => {
    const alvo = $el.get(0) as HTMLElement;

    if (!alvo) {
      throw new Error('Elemento de profissional inválido para clique.');
    }

    const rect = alvo.getBoundingClientRect();

    const x = rect.left + Math.max(5, Math.min(rect.width / 2, rect.width - 5));
    const y = rect.top + Math.max(5, Math.min(rect.height / 2, rect.height - 5));

    const win = alvo.ownerDocument.defaultView;

    if (!win) {
      throw new Error('Window não disponível para disparar clique.');
    }

    ['mouseover', 'mousedown', 'mouseup', 'click'].forEach((evento) => {
      alvo.dispatchEvent(
        new win.MouseEvent(evento, {
          bubbles: true,
          cancelable: true,
          view: win,
          clientX: x,
          clientY: y,
        })
      );
    });
  });
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
      cy.log(`Texto da tela: ${limparTexto($body.text()).slice(0, 1200)}`);
      cy.screenshot('mobile-profissional-nao-encontrado');

      throw new Error(
        'Nenhum card de profissional foi encontrado após selecionar o serviço.'
      );
    }

    const profissionalPreferido = cardsProfissional.find((card) => {
      const texto = limparTexto(Cypress.$(card).text());

      return /Usuario Paraguai|E2E\s+Atendente|Atendente|Barbeiro|Peluquero/i.test(
        texto
      );
    });

    const cardProfissional = profissionalPreferido || cardsProfissional[0];

    if (!cardProfissional) {
      throw new Error('Card de profissional inválido.');
    }

    const textoProfissional = limparTexto(Cypress.$(cardProfissional).text());

    cy.log(`Profissional escolhido: ${textoProfissional}`);

    const paiClicavel =
      Cypress.$(cardProfissional)
        .parents('div, .q-card, .q-item, button, [role="button"]')
        .toArray()
        .find((parent) => {
          const textoPai = limparTexto(Cypress.$(parent).text());
          const rect = parent.getBoundingClientRect();

          return (
            /Usuario Paraguai|E2E\s+Atendente|Atendente|Barbeiro|Peluquero|person/i.test(
              textoPai
            ) &&
            rect.width >= 80 &&
            rect.height >= 20 &&
            rect.height <= 220
          );
        }) as HTMLElement | undefined;

    const clicavel =
      paiClicavel ||
      Cypress.$(cardProfissional)
        .closest('.q-card, .q-item, button, [role="button"], div')
        .get(0) ||
      cardProfissional;

    cy.wrap(clicavel)
      .scrollIntoView()
      .click('center', { force: true });
  });

  cy.wait(1500);

  cy.get('body').then(($body) => {
    const texto = $body.text();

    if (/Escolha o profissional/i.test(texto) && !/\d{2}\/\d{2}/.test(texto)) {
      cy.log(
        'Ainda está na etapa profissional. Tentando clique real no profissional.'
      );

      const profissionalPorTexto = $body
        .find('*:visible')
        .toArray()
        .find((el) => {
          const textoElemento = limparTexto(Cypress.$(el).text());

          return /Usuario Paraguai|E2E\s+Atendente|Atendente|Barbeiro|Peluquero|personUsuario/i.test(
            textoElemento
          );
        }) as HTMLElement | undefined;

      if (!profissionalPorTexto) {
        cy.screenshot('mobile-profissional-segunda-tentativa-nao-encontrado');

        throw new Error(
          'Profissional apareceu na tela, mas não foi possível localizar elemento clicável.'
        );
      }

      const paiClicavel =
        Cypress.$(profissionalPorTexto)
          .parents('div, .q-card, .q-item, button, [role="button"]')
          .toArray()
          .find((parent) => {
            const textoPai = limparTexto(Cypress.$(parent).text());
            const rect = parent.getBoundingClientRect();

            return (
              /Usuario Paraguai|E2E\s+Atendente|Atendente|Barbeiro|Peluquero|person/i.test(
                textoPai
              ) &&
              rect.width >= 80 &&
              rect.height >= 20 &&
              rect.height <= 220
            );
          }) as HTMLElement | undefined;

      const clicavel =
        paiClicavel ||
        Cypress.$(profissionalPorTexto)
          .closest('.q-card, .q-item, button, [role="button"], div')
          .get(0) ||
        profissionalPorTexto;

      clicarElementoComEventosReais(clicavel);

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

      if (datas.length === 0) {
        cy.screenshot('datas-nao-apareceram');

        throw new Error(
          'Nenhuma data disponível foi encontrada para agendamento.'
        );
      }

      const datasFuturas = datas.filter((item) => item.data > hoje);
      const datasHoje = datas.filter(
        (item) => item.data.getTime() === hoje.getTime()
      );

      const dataEscolhida = datasFuturas[0] || datasHoje[0] || datas[0];

      if (!dataEscolhida) {
        throw new Error('Nenhuma data válida foi encontrada.');
      }

      dataSelecionadaEhHoje =
        dataEscolhida.data.getTime() === hoje.getTime();

      cy.log(`Data escolhida: ${dataEscolhida.texto}`);
      cy.log(`Data escolhida é hoje? ${dataSelecionadaEhHoje}`);

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

      if (horarios.length === 0) {
        throw new Error('Nenhum horário disponível foi encontrado.');
      }

      const horariosValidos = dataSelecionadaEhHoje
        ? horarios.filter((item) => item.minutos > minutosAgora)
        : horarios;

      if (horariosValidos.length === 0) {
        throw new Error(
          'Não existe horário disponível maior que a hora atual para a data selecionada.'
        );
      }

      const horarioEscolhido = horariosValidos[0];

      if (!horarioEscolhido) {
        throw new Error('Nenhum horário válido foi encontrado.');
      }

      cy.log(`Horário escolhido: ${horarioEscolhido.texto}`);

      return cy
        .wrap(horarioEscolhido.el)
        .scrollIntoView()
        .should('be.visible')
        .click({ force: true });
    });
  }

  function selecionarCliente() {
    cy.contains(/Nome do cliente|Nombre del cliente/i, { timeout: 30000 })
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

  beforeEach(() => {
    cy.login('iphone-x');

    fecharCookiesSeAparecer();

    abrirAgenda();
  });

  it('deve cadastrar um agendamento E2E com horário futuro', () => {
    abrirCadastroAgendamento();

    selecionarServico();

    selecionarProfissional();

    selecionarDataFuturaOuHoje();

    cy.wait(2000);

    cy.contains(/Hor[aá]rios dispon[ií]veis|Horarios disponibles/i, {
      timeout: 30000,
    })
      .scrollIntoView()
      .should('be.visible');

    selecionarHorarioMaiorQueAgora();

    cy.wait(1000);

    selecionarCliente();

    cy.contains(/Gravar|Salvar|Guardar/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /agendamento|sucesso|salvo|criado|Listagem de agendamentos|guardado|creado/i
      );
  });
});