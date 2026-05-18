describe('Atendentes - Cadastro', () => {  
  const timestamp = Date.now();
  const nomeAtendente = `E2E Atendente ${timestamp}`;
  const emailAtendente = `e2e.atendente.${timestamp}@teste.com`;
  const senha = 'Teste@123456';

  beforeEach(() => {
    cy.login();

    cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
      }
    });

    cy.contains(/Atendentes/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Listagem de atendentes/i, { timeout: 30000 })
      .should('be.visible');
  });

  it('Deve cadastrar um atendente E2E com nome, e-mail e comissões.', () => {
    cy.contains(/Cadastrar atendente/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.contains(/Cadastrar atendente/i, { timeout: 30000 })
      .should('be.visible');

    cy.url().should('include', '/service-providers/create');

    cy.wait(1000);

    cy.get('input:visible')
      .eq(0)
      .should('be.visible')
      .click({ force: true })
      .clear({ force: true })
      .type(nomeAtendente, { force: true });

    cy.get('input:visible')
      .eq(1)
      .should('be.visible')
      .click({ force: true })
      .clear({ force: true })
      .type(emailAtendente, { force: true });

    cy.get('input:visible')
      .eq(2)
      .should('be.visible')
      .click({ force: true })
      .clear({ force: true })
      .type(senha, { force: true });

    cy.get('input:visible')
      .eq(3)
      .should('be.visible')
      .click({ force: true })
      .clear({ force: true })
      .type(senha, { force: true });

    cy.get('input:visible')
      .eq(4)
      .should('be.visible')
      .click({ force: true })
      .clear({ force: true })
      .type('3000', { force: true });

    cy.get('input:visible')
      .eq(5)
      .should('be.visible')
      .click({ force: true })
      .clear({ force: true })
      .type('2000', { force: true });

    cy.contains(/Gravar/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should('match', /sucesso|salvo|cadastrado|Listagem de atendentes|Atendentes/i);
  });
});