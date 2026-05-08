describe('Debug Login', () => {
  it('deve tentar fazer login e mostrar a tela após o clique', () => {
    cy.login();

    cy.screenshot('tela-depois-do-login');

    cy.get('body').then(($body) => {
      cy.log($body.text());
    });
  });
});