describe('SG Agenda Admin - Login', () => {
  it('deve abrir a página inicial do sistema', () => {
    cy.visit('/');

    cy.title().should('match', /SG Agenda|Painel/i);
  });

  it('deve mostrar erro ao tentar login inválido', () => {
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