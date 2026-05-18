describe('Smoke Test - SG Agenda', () => {
  it('Deve carregar o sistema de homologação.', () => {
    cy.visit('/');
    cy.title().should('match', /SG Agenda|Painel/i);
  });
  it('Finalizado', () => {
    cy.log('Teste Finalizado');
  });   
});