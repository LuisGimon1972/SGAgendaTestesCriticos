describe('Serviços - Cadastro', () => {
  const timestamp = Date.now();

  const nomeServico = `E2E Serviço_Corte ${timestamp}`;
  const duracao = '30';
  const descricao = `Serviço criado automaticamente pelo Cypress em ${timestamp}`;

  function fecharCookiesSeAparecer() {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
      }
    });
  }

  function preencherInput(index: number, valor: string) {
    cy.get('input:visible')
      .eq(index)
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    cy.get('input:visible')
      .eq(index)
      .type('{selectall}{backspace}', { force: true });

    cy.wait(200);

    cy.get('input:visible')
      .eq(index)
      .type(valor, { force: true, delay: 50 });
  }

  function preencherTextarea(valor: string) {
    cy.get('textarea:visible')
      .first()
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    cy.get('textarea:visible')
      .first()
      .type('{selectall}{backspace}', { force: true });

    cy.wait(200);

    cy.get('textarea:visible')
      .first()
      .type(valor, { force: true, delay: 20 });
  }

  function selecionarAtendentesAleatorios() {
  cy.contains(/Sele[çc][aã]o de Atendentes/i, { timeout: 30000 })
    .should('exist');

  cy.get('body').then(($body) => {
    const tituloAtendentes = $body
      .find('*')
      .filter((_, el) => {
        const texto = Cypress.$(el).text().replace(/\s+/g, ' ').trim();

        return /Sele[çc][aã]o de Atendentes/i.test(texto);
      })
      .first();

    const topoSecao =
      tituloAtendentes.length > 0
        ? tituloAtendentes[0].getBoundingClientRect().top
        : 0;

    const cardsAtendentes = $body
      .find('div')
      .toArray()
      .filter((el) => {
        const $el = Cypress.$(el);
        const texto = $el.text().replace(/\s+/g, ' ').trim();
        const rect = el.getBoundingClientRect();

        const temTamanhoDeCard =
          rect.width >= 150 &&
          rect.width <= 400 &&
          rect.height >= 100 &&
          rect.height <= 260;

        const estaNaSecaoDeAtendentes = rect.top >= topoSecao - 20;

        const temImagemOuInput =
          $el.find('img').length > 0 ||
          $el.find('input').length > 0;

        const naoEhFormulario =
          !/Nome do servi[çc]o|Dura[çc][aã]o|Valor|Comiss[aã]o|Categoria|Descri[çc][aã]o|Gravar|Cadastrar servi[çc]o|Conferir disponibilidade|Servi[çc]o a domic[ií]lio/i.test(
            texto
          );

        return (
          temTamanhoDeCard &&
          estaNaSecaoDeAtendentes &&
          temImagemOuInput &&
          texto.length > 0 &&
          naoEhFormulario
        );
      }) as HTMLElement[];

    expect(
      cardsAtendentes.length,
      'cards de atendentes encontrados'
    ).to.be.greaterThan(0);
    
    const primeirosSeisAtendentes = cardsAtendentes.slice(0, 6);

    const quantidadeParaSelecionar =
      primeirosSeisAtendentes.length > 1 ? 2 : 1;

    const cardsSelecionados = Cypress._.shuffle(primeirosSeisAtendentes).slice(
      0,
      quantidadeParaSelecionar
    );

    Cypress.log({
      name: 'Atendentes',
      message: `Selecionando ${quantidadeParaSelecionar} atendente(s) aleatório(s) entre os primeiros ${primeirosSeisAtendentes.length}`,
    });

    cardsSelecionados.forEach((card, index) => {
      const textoCard = Cypress.$(card)
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      Cypress.log({
        name: `Atendente selecionado ${index + 1}`,
        message: textoCard,
      });

      const rect = card.getBoundingClientRect();

      const clientX = rect.right - 20;
      const clientY = rect.top + 20;

      const windowRef = card.ownerDocument.defaultView;

      const eventos = ['pointerdown', 'mousedown', 'mouseup', 'click'];

      eventos.forEach((evento) => {
        card.dispatchEvent(
          new MouseEvent(evento, {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
            view: windowRef,
          })
        );
      });
    });
  });

  cy.wait(800);
}

  function subirParaBotaoGravar() {
  cy.scrollTo('top', {
    duration: 500,
    ensureScrollable: false,
  });

  cy.wait(2500);

  cy.contains(/Gravar/i, { timeout: 50000 })
    .scrollIntoView()
    .should('be.visible');
}

  beforeEach(() => {
    cy.login();

    fecharCookiesSeAparecer();

    cy.contains(/Servi[çc]os/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Listagem de servi[çc]os|Servi[çc]os/i);
  });

  it('Deve cadastrar um serviço E2E com atendentes aleatórios.', () => {
  cy.contains(/Cadastrar servi[çc]o/i, { timeout: 30000 })
    .should('be.visible')
    .click({ force: true });

  cy.get('body', { timeout: 30000 })
    .invoke('text')
    .should('match', /Cadastrar servi[çc]o|Nome do servi[çc]o|Gravar/i);

  preencherInput(0, nomeServico);

  preencherInput(1, duracao);

  preencherInput(2, '4000');

  preencherInput(3, '3000');

  preencherTextarea(descricao);
  
  selecionarAtendentesAleatorios();

  subirParaBotaoGravar();

  cy.contains(/Gravar/i, { timeout: 30000 })
    .should('be.visible')
    .click({ force: true });

  cy.get('body', { timeout: 30000 })
    .invoke('text')
    .should(
      'match',
      /sucesso|salvo|cadastrado|Listagem de servi[çc]os|Servi[çc]os/i
    );
});
});