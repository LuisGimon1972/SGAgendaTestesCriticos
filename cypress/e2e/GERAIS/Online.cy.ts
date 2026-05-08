describe('Smoke Test - SG Agenda', () => {
  it('deve carregar o sistema de homologação', () => {
    cy.visit('/');
    cy.title().should('match', /SG Agenda|Painel/i);
  });
});