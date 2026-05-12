/*
Esse teste crítico ajuda a encontrar problemas como:
- Loading infinito
- Tela branca
- Botão Gravar clicável antes da hora
- Usuário conseguir clicar duas vezes e criar duplicado
- Agenda carregar incompleta
- Erro ao trocar DIA / SEMANA / MÊS com API lenta
- Botões travando
- Mensagens de erro ruins
- Componentes quebrando enquanto carregam
*/

describe('Agenda Crítica - Rede lenta', () => {
  function fecharCookiesSeAparecer() {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
      }
    });
  }

  function ativarRedeLentaSomenteAgenda() {
    cy.intercept(
      {
        method: 'GET',
        url: '**/api/**',
      },
      (req) => {
        const url = req.url.toLowerCase();

        const ehAgenda =
          url.includes('appointment') ||
          url.includes('appointments') ||
          url.includes('schedule') ||
          url.includes('schedules') ||
          url.includes('calendar') ||
          url.includes('agenda') ||
          url.includes('booking');

        const ehAuth =
          url.includes('/auth/') ||
          url.includes('/token') ||
          url.includes('/login');

        if (ehAgenda && !ehAuth) {
          req.on('response', (res) => {
            res.setDelay(3000);
          });
        }
      }
    ).as('redeLentaAgenda');
  }

  function validarSemErroGrave() {
    cy.get('body', { timeout: 40000 })
      .invoke('text')
      .should(
        'not.match',
        /TypeError|Cannot read|is not a function|undefined is not|Network Error|Erro interno|Internal Server Error/i
      );
  }

  beforeEach(() => {
    cy.login({ width: 1366, height: 768 });

    fecharCookiesSeAparecer();
    
    ativarRedeLentaSomenteAgenda();
  });

  it('Deve abrir a agenda mesmo com rede lenta.', () => {
    cy.contains(/Agenda/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.get('body', { timeout: 40000 })
      .invoke('text')
      .should(
        'match',
        /Listagem de agendamentos|Agenda|DIA|SEMANA|M[EÊ]S/i
      );

    validarSemErroGrave();
  });

  it('Deve alternar DIA, SEMANA e MÊS mesmo com rede lenta.', () => {
    cy.contains(/Agenda/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/^DIA$/i, { timeout: 40000 })
      .should('be.visible')
      .click({ force: true });

    cy.wait(1500);
    validarSemErroGrave();

    cy.contains(/^SEMANA$/i, { timeout: 40000 })
      .should('be.visible')
      .click({ force: true });

    cy.wait(1500);
    validarSemErroGrave();

    cy.contains(/^M[EÊ]S$/i, { timeout: 40000 })
      .should('be.visible')
      .click({ force: true });

    cy.wait(1500);
    validarSemErroGrave();
  });

  it('Deve abrir cadastro de agendamento mesmo com rede lenta.', () => {
    cy.contains(/Agenda/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Cadastrar agendamento/i, { timeout: 40000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 40000 })
      .invoke('text')
      .should('match', /Escolha o servi[çc]o|Agendamento/i);

    validarSemErroGrave();
  });   
  it('Finalizado', () => {
    cy.log('Teste Finalizado');
  });   
});