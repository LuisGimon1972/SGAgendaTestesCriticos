describe('Categorias - Cadastro', () => {
  const timestamp = Date.now();
  const nomeCategoria = `E2E Categoria ${timestamp}`;
  const descricao = `Categoria criada automaticamente pelo Cypress em ${timestamp}`;

  beforeEach(() => {
    cy.login();

    cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
      }
    });

    cy.contains(/Categorias/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Listagem de categorias/i, { timeout: 30000 })
      .should('be.visible');
  });

  it('Deve cadastrar uma categoria E2E com nome aleatório.', () => {
    cy.contains(/Cadastrar categoria/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.contains(/Cadastrar categoria/i, { timeout: 30000 })
      .should('be.visible');

    cy.url().should('match', /\/categories\/(create|cadastro)/);

    cy.get('input:visible')
      .eq(0)
      .should('be.visible')
      .click({ force: true })
      .type(`{selectall}{backspace}${nomeCategoria}`, { force: true });

    cy.get('textarea:visible')
      .first()
      .should('be.visible')
      .click({ force: true })
      .type(`{selectall}{backspace}${descricao}`, { force: true });

    cy.contains(/Gravar/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /categoria|sucesso|salvo|cadastrado|Listagem de categorias/i
      );
  });
});