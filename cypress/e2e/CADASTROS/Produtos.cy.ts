describe('Produtos - Cadastro', () => {
  const timestamp = Date.now();
  const nomeProduto = `E2E Produto ${timestamp}`;
  const valor = '2500'; // pode virar 25,00 em campo com máscara
  const quantidade = '10';
  const comissao = '2000';

  beforeEach(() => {
    cy.login();

    cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
      }
    });

    cy.contains(/Produtos/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Listagem de produtos/i, { timeout: 30000 })
      .should('be.visible');
  });

  it('Deve cadastrar um produto E2E com nome aleatório.', () => {
    cy.contains(/Cadastrar produto/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.contains(/Cadastrar produto/i, { timeout: 30000 })
      .should('be.visible');

    cy.url().should('match', /\/products\/(create|cadastro)/);

    cy.get('input:visible')
      .eq(0)
      .should('be.visible')
      .click({ force: true })
      .type(`{selectall}{backspace}${nomeProduto}`, { force: true });


    cy.get('input:visible')
      .eq(1)
      .should('be.visible')
      .click({ force: true })
      .type(`{selectall}{backspace}${valor}`, { force: true });

    cy.get('input:visible')
      .eq(2)
      .should('be.visible')
      .click({ force: true })
      .type(`{selectall}{backspace}${quantidade}`, { force: true });

    cy.get('input:visible')
      .eq(3)
      .should('be.visible')
      .click({ force: true })
      .type(`{selectall}{backspace}${comissao}`, { force: true });

    cy.contains(/Gravar/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /produto|sucesso|salvo|cadastrado|Listagem de produtos/i
      );
  });
});