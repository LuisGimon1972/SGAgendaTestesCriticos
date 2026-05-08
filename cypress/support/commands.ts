type LoginViewport = string | { width: number; height: number };

Cypress.Commands.add('login', (viewport?: LoginViewport) => {
  const email = Cypress.env('TEST_USER_EMAIL');
  const password = Cypress.env('TEST_USER_PASSWORD');

  if (!email || !password) {
    throw new Error('Configure TEST_USER_EMAIL e TEST_USER_PASSWORD no cypress.env.json');
  }

  if (viewport) {
    if (typeof viewport === 'string') {
      cy.viewport(viewport as any);
    } else {
      cy.viewport(viewport.width, viewport.height);
    }
  }

  cy.visit('/');

  cy.get('input')
    .first()
    .should('be.visible')
    .clear()
    .type(email);

  cy.get('input[type="password"]')
    .first()
    .should('be.visible')
    .clear()
    .type(password);

  cy.contains(/entrar|login|acessar|sign in/i)
    .should('be.visible')
    .click();

  cy.wait(5000);

  cy.get('body').then(($body) => {
    const texto = $body.text();

    if (texto.match(/entrar|login|senha|password/i)) {
      throw new Error('Login não parece ter sido concluído. Ainda há textos de login na tela.');
    }
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(viewport?: LoginViewport): Chainable<void>;
    }
  }
}

export {};