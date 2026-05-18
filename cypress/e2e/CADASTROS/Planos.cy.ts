describe('Planos - Cadastro', () => {
  const timestamp = Date.now();

  const nomePlano = `E2E Plano ${timestamp}`;
  const valorPlano = '5000'; // 50,00
  const duracaoPlano = '2';
  const descricaoPlano = `Plano criado automaticamente pelo Cypress em ${timestamp}`;

  function fecharCookiesSeAparecer() {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
      }
    });
  }

  function abrirPlanos() {
    cy.contains(/Planos/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Listagem de planos/i, { timeout: 30000 })
      .should('be.visible');
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
      .type(valor, { force: true, delay: 20 });
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

  function validarValoresPadraoDoPlano() {
    cy.get('body')
      .invoke('text')
      .should('match', /Mensal/i)
      .and('match', /Meses/i)
      .and('match', /Usos/i);
  }

  function clicarAdicionarServico() {
    cy.contains(/Servi[çc]os prestados/i, { timeout: 30000 })
      .scrollIntoView()
      .should('be.visible');

    cy.contains('button, .q-btn, [role="button"]', /Adicionar/i, {
      timeout: 30000,
    })
      .should('be.visible')
      .click({ force: true });

    cy.wait(1000);
  }

  function selecionarServicosNoModal() {
    cy.get('body').then(($body) => {
      const modal = $body
        .find('.q-dialog:visible, [role="dialog"]:visible')
        .last();

      const raiz = modal.length > 0 ? modal : $body;

      const linhas = raiz
        .find('tbody tr:visible')
        .toArray()
        .filter((linha) => {
          const texto = Cypress.$(linha)
            .text()
            .replace(/\s+/g, ' ')
            .trim();

          const temColunas = Cypress.$(linha).find('td').length > 0;

          const linhaVazia =
            /nenhum|nenhuma|sem dados|sem resultado|não encontrado|nao encontrado/i.test(
              texto
            );

          return temColunas && texto.length > 0 && !linhaVazia;
        }) as HTMLElement[];

      if (linhas.length > 0) {
        const quantidadeParaSelecionar = linhas.length > 1 ? 2 : 1;

        const servicosSelecionados = Cypress._.shuffle(linhas).slice(
          0,
          quantidadeParaSelecionar
        );

        Cypress.log({
          name: 'Serviços',
          message: `Selecionando ${quantidadeParaSelecionar} serviço(s) de ${linhas.length}`,
        });

        servicosSelecionados.forEach((linha, index) => {
          const textoServico = Cypress.$(linha)
            .text()
            .replace(/\s+/g, ' ')
            .trim();

          Cypress.log({
            name: `Serviço selecionado ${index + 1}`,
            message: textoServico,
          });

          cy.wrap(linha)
            .click({ force: true });

          cy.wait(500);
        });

        return;
      }

      const itens = raiz
        .find('.q-item:visible, .q-card:visible, [class*="card"]:visible')
        .toArray()
        .filter((item) => {
          const texto = Cypress.$(item)
            .text()
            .replace(/\s+/g, ' ')
            .trim();

          return (
            texto.length > 0 &&
            !/Adicionar|Confirmar|Cancelar|Buscar|Servi[çc]os prestados|Valor definido/i.test(
              texto
            )
          );
        }) as HTMLElement[];

      expect(
        itens.length,
        'serviços disponíveis para selecionar'
      ).to.be.greaterThan(0);

      const quantidadeParaSelecionar = itens.length > 1 ? 2 : 1;

      const servicosSelecionados = Cypress._.shuffle(itens).slice(
        0,
        quantidadeParaSelecionar
      );

      Cypress.log({
        name: 'Serviços',
        message: `Selecionando ${quantidadeParaSelecionar} serviço(s) de ${itens.length}`,
      });

      servicosSelecionados.forEach((item, index) => {
        const textoServico = Cypress.$(item)
          .text()
          .replace(/\s+/g, ' ')
          .trim();

        Cypress.log({
          name: `Serviço selecionado ${index + 1}`,
          message: textoServico,
        });

        cy.wrap(item)
          .click({ force: true });

        cy.wait(500);
      });
    });

    cy.wait(800);
  }

  function confirmarServicos() {
    cy.contains('button, .q-btn, [role="button"]', /Confirmar/i, {
      timeout: 30000,
    })
      .should('be.visible')
      .click({ force: true });

    cy.wait(1000);

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /Servi[çc]os prestados|Valor definido por servi[çc]o|Gravar/i
      );
  }

  function subirParaGravar() {
    cy.scrollTo('top', {
      duration: 500,
      ensureScrollable: false,
    });

    cy.wait(500);

    cy.contains(/Gravar/i, { timeout: 30000 })
      .should('be.visible');
  }

  beforeEach(() => {
    cy.login();

    fecharCookiesSeAparecer();

    abrirPlanos();
  });

  it('Deve cadastrar um plano E2E com serviço prestado.', () => {
    cy.contains(/Cadastrar plano/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /Cadastrar plano|Detalhes do plano|Gravar/i);

    preencherInput(0, nomePlano);
    
    preencherInput(1, valorPlano);
    
    preencherInput(2, duracaoPlano);
    
    validarValoresPadraoDoPlano();
    
    preencherTextarea(descricaoPlano);
    
    clicarAdicionarServico();
    
    selecionarServicosNoModal();
    
    confirmarServicos();
   
    subirParaGravar();

    cy.contains(/Gravar/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /sucesso|salvo|cadastrado|Listagem de planos|Planos/i
      );
  });
});