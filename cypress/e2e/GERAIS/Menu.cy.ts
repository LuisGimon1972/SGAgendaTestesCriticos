describe('Menu lateral', () => {
  beforeEach(() => {
    cy.login();    
  });

  it('deve exibir os menus principais', () => {
    const menus = [
      /Dashboard/i,
      /Agenda/i,
      /Clientes/i,
      /Atendentes/i,
      /Servi[çc]os/i,
      /Produtos/i,
      /Categorias/i,
      /Comiss(ões|oes)/i,
      /Planos/i,
      /Configura(ções|coes)/i,
    ];

    menus.forEach((menu) => {
      cy.contains(menu, { timeout: 30000 })
        .scrollIntoView()
        .should('exist');
    });
  });
});