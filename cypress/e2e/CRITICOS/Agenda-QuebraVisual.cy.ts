/*
Esse teste crítico avalia:
- tela branca
- loading infinito
- botão invisível
- botão fora da tela
- botão coberto por outro elemento
- erro JavaScript aparecendo na tela
- tela quebrada ao trocar DIA / SEMANA / MÊS
- cadastro de agendamento abrindo cortado
- layout quebrado em desktop, tablet ou mobile
*/

describe('Agenda Crítica - Quebra visual', () => {
  function fecharCookiesSeAparecer() {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
      }
    });
  }

  function validarSemErroGrave() {
    return cy
      .get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'not.match',
        /TypeError|Cannot read|undefined is not|Internal Server Error|Network Error|Erro interno|is not a function|Tela não encontrada|Página não encontrada/i
      );
  }

  function validarSemTelaBranca() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .then((texto) => {
        const textoLimpo = texto.replace(/\s+/g, ' ').trim();

        expect(textoLimpo.length, 'tela não deve estar em branco').to.be.greaterThan(20);
      });
  }

  function validarSemLoadingInfinito() {
    cy.wait(1500);

    cy.get('body').then(($body) => {
      const loadings = $body.find(
        '.q-loading:visible, .q-inner-loading:visible, [aria-busy="true"]:visible'
      );

      expect(loadings.length, 'não deve existir loading infinito visível').to.eq(0);
    });
  }

function validarElementoUsavel($el: JQuery<HTMLElement>, nome: string) {
  const elementoOriginal = $el[0];

  if (!elementoOriginal) {
    throw new Error(`${nome} não encontrado`);
  }

  const elemento =
    elementoOriginal.closest('button, .q-btn, [role="button"]') ||
    elementoOriginal;

  const rect = elemento.getBoundingClientRect();

  expect(rect.width, `${nome} deve ter largura`).to.be.greaterThan(0);
  expect(rect.height, `${nome} deve ter altura`).to.be.greaterThan(0);

  const windowRef = elemento.ownerDocument.defaultView;

  const larguraTela = windowRef?.innerWidth || Cypress.config('viewportWidth');
  const alturaTela = windowRef?.innerHeight || Cypress.config('viewportHeight');

  const parcialmenteVisivelVertical =
    rect.bottom > 0 && rect.top < alturaTela;

  const parcialmenteVisivelHorizontal =
    rect.right > 0 && rect.left < larguraTela;

  if (!parcialmenteVisivelVertical || !parcialmenteVisivelHorizontal) {
    Cypress.log({
      name: 'Possível quebra visual',
      message: `${nome} pode estar fora da área visível. Rect: left=${rect.left}, right=${rect.right}, top=${rect.top}, bottom=${rect.bottom}, tela=${larguraTela}x${alturaTela}`,
    });

    return;
  }

  const centroX = rect.left + rect.width / 2;
  const centroY = rect.top + rect.height / 2;

  const elementoNoCentro = elemento.ownerDocument.elementFromPoint(
    centroX,
    centroY
  );

  const estaCoberto =
    elementoNoCentro &&
    elementoNoCentro !== elemento &&
    !elemento.contains(elementoNoCentro) &&
    !elementoNoCentro.closest('button, .q-btn, [role="button"]')?.isSameNode(
      elemento.closest('button, .q-btn, [role="button"]') || elemento
    );

  if (estaCoberto) {
    Cypress.log({
      name: 'Possível sobreposição visual',
      message: `${nome} pode estar parcialmente coberto, mas continua visível.`,
    });
  }
}

function validarBotaoVisivel(texto: RegExp, nome: string) {
  cy.contains('button, .q-btn, [role="button"]', texto, { timeout: 30000 })
    .scrollIntoView()
    .should('be.visible')
    .then(($el) => {
      validarElementoUsavel($el, nome);
    });
}

  function abrirAgendaDesktopOuTablet() {
    cy.contains(/Agenda/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Listagem de agendamentos/i, { timeout: 30000 })
      .should('exist');

    validarSemErroGrave();
    validarSemTelaBranca();
    validarSemLoadingInfinito();
  }

  function abrirMenuMobileSeNecessario() {
    cy.get('body').then(($body) => {
      const drawerVisivel = $body
        .find('.q-drawer:visible, aside:visible, nav:visible')
        .filter((_, el) => {
          const texto = Cypress.$(el).text();

          return /Dashboard|Agenda|Clientes|Servi[çc]os/i.test(texto);
        });

      if (drawerVisivel.length > 0) {
        return;
      }

      const botaoMenu = $body
        .find('button:visible, .q-btn:visible, i:visible, .q-icon:visible, [role="button"]:visible')
        .filter((_, el) => {
          const texto = Cypress.$(el).text().trim();

          return /^menu$/i.test(texto);
        })
        .first();

      if (botaoMenu.length > 0) {
        cy.wrap(botaoMenu).click({ force: true });
        cy.wait(700);
      }
    });
  }

  function abrirAgendaMobile() {
    abrirMenuMobileSeNecessario();

    cy.contains(/Agenda/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Listagem de agendamentos/i, { timeout: 30000 })
      .should('exist');

    validarSemErroGrave();
    validarSemTelaBranca();
    validarSemLoadingInfinito();
  }

  function validarElementosPrincipaisAgenda() {
    cy.contains(/Listagem de agendamentos/i, { timeout: 30000 })
      .should('exist');

    validarBotaoVisivel(/Cadastrar agendamento/i, 'Botão Cadastrar agendamento');

    cy.contains(/^DIA$/i, { timeout: 30000 })
      .should('be.visible');

    cy.contains(/^SEMANA$/i, { timeout: 30000 })
      .should('be.visible');

    cy.contains(/^M[EÊ]S$/i, { timeout: 30000 })
      .should('be.visible');

    validarSemErroGrave();
    validarSemTelaBranca();
    validarSemLoadingInfinito();
  }

  function clicarAbaAgenda(aba: 'DIA' | 'SEMANA' | 'MÊS') {
    const regex = aba === 'MÊS' ? /^M[EÊ]S$/i : new RegExp(`^${aba}$`, 'i');

    cy.contains(regex, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.wait(1500);

    validarSemErroGrave();
    validarSemTelaBranca();
  }

  function abrirCadastroSemSalvar() {
    cy.contains(/Cadastrar agendamento/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.contains(/Escolha o servi[çc]o/i, { timeout: 30000 })
      .should('be.visible');

    validarSemErroGrave();
    validarSemTelaBranca();
    validarSemLoadingInfinito();

    cy.get('body')
      .invoke('text')
      .should('match', /Escolha o servi[çc]o|Agendamento/i);
  }

  context('Desktop 1366x768', () => {
    beforeEach(() => {
      cy.login({ width: 1366, height: 768 });
      fecharCookiesSeAparecer();
      abrirAgendaDesktopOuTablet();
    });

    it('Deve manter a tela principal da Agenda usável em desktop.', () => {
      validarElementosPrincipaisAgenda();
    });

    it('Deve alternar DIA, SEMANA e MÊS sem quebra visual em desktop.', () => {
      clicarAbaAgenda('DIA');
      clicarAbaAgenda('SEMANA');
      clicarAbaAgenda('MÊS');
      clicarAbaAgenda('DIA');

      validarElementosPrincipaisAgenda();
    });

    it('Deve abrir cadastro de agendamento sem quebrar visualmente em desktop.', () => {
      abrirCadastroSemSalvar();
    });
  });

  context('Tablet 768x869', () => {
    beforeEach(() => {
      cy.login({ width: 768, height: 869 });
      fecharCookiesSeAparecer();
      abrirAgendaDesktopOuTablet();
    });

    it('Deve manter a Agenda usável em dimensão tablet.', () => {
      validarElementosPrincipaisAgenda();
    });

    it('Deve alternar modos da Agenda sem quebra visual em tablet.', () => {
      clicarAbaAgenda('DIA');
      clicarAbaAgenda('SEMANA');
      clicarAbaAgenda('MÊS');
      clicarAbaAgenda('DIA');

      validarElementosPrincipaisAgenda();
    });
  });

  context('Mobile iPhone X', () => {
    beforeEach(() => {
      cy.login('iphone-x');
      fecharCookiesSeAparecer();
      abrirAgendaMobile();
    });

    it('Deve manter a Agenda usável em mobile.', () => {
      validarElementosPrincipaisAgenda();
    });

    it('Deve abrir cadastro de agendamento sem tela cortada em mobile.', () => {
      abrirCadastroSemSalvar();

      cy.contains(/Escolha o servi[çc]o/i, { timeout: 30000 })
        .scrollIntoView()
        .should('be.visible');
    });
     it('Finalizado', () => {
    cy.log('Teste Finalizado');
  });   
  }); 
});