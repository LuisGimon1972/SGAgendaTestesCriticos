describe('SG Agenda Admin - Login', () => {
  it('Deve abrir a página inicial do sistema.', () => {
    cy.visit('/');

    cy.title().should('match', /SG Agenda|Painel/i);
  });

  it('Deve mostrar erro ao tentar login inválido.', () => {
    cy.visit('/');

    cy.get('input[type="text"], input[type="email"]')
      .first()
      .type('teste@exemplo.com');

    cy.get('input[type="password"]')
      .first()
      .type('senha_errada');

    cy.contains('button', /entrar|login|acessar/i)
      .click();

    cy.contains(/inválido|incorreto|credenciais|senha|erro/i)
      .should('be.visible');
  });
});