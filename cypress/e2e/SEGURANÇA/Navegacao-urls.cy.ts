describe('Navegação e URLs', () => {
  beforeEach(() => {
    cy.login();

    cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
      }
    });
  });

  const telas = [
    {
      nome: 'Dashboard',
      menu: /Dashboard/i,
      textoEsperado: /Dashboard/i,
    },
    {
      nome: 'Agenda',
      menu: /Agenda/i,
      textoEsperado: /Agenda/i,
    },
    {
      nome: 'Clientes',
      menu: /Clientes/i,
      textoEsperado: /Clientes/i,
    },
    {
      nome: 'Atendentes',
      menu: /Atendentes/i,
      textoEsperado: /Atendentes/i,
    },
    {
      nome: 'Serviços',
      menu: /Servi[çc]os/i,
      textoEsperado: /Servi[çc]os/i,
    },
    {
      nome: 'Produtos',
      menu: /Produtos/i,
      textoEsperado: /Produtos/i,
    },
    {
      nome: 'Categorias',
      menu: /Categorias/i,
      textoEsperado: /Categorias/i,
    },
    {
      nome: 'Comissões',
      menu: /Comiss(ões|oes)/i,
      textoEsperado: /Comiss(ões|oes)/i,
    },
    {
      nome: 'Planos',
      menu: /Planos/i,
      textoEsperado: /Planos/i,
    },
    {
      nome: 'Configurações',
      menu: /Configura(ções|coes)/i,
      textoEsperado: /Configura(ções|coes)/i,
    },
  ];

  telas.forEach((tela) => {
    it(`Deve navegar para ${tela.nome}.`, () => {
      cy.contains(tela.menu, { timeout: 30000 })
        .scrollIntoView()
        .should('exist')
        .click({ force: true });

      cy.get('body')
        .invoke('text')
        .should('match', tela.textoEsperado);

      cy.url().should('include', 'admin-hom.sgagenda.com');
    });
  });
  it('Finalizado', () => {
    cy.log('Teste Finalizado');
  });   
});