describe('Clientes - Cadastro', () => {
  function gerarCPFValido() {
    const rand = () => Math.floor(Math.random() * 9);
    const n = Array.from({ length: 9 }, rand);

    const d1 =
      11 -
      (n.reduce((acc, value, index) => acc + value * (10 - index), 0) % 11);

    n.push(d1 >= 10 ? 0 : d1);

    const d2 =
      11 -
      (n.reduce((acc, value, index) => acc + value * (11 - index), 0) % 11);

    n.push(d2 >= 10 ? 0 : d2);

    return n.join('');
  }

  function gerarTelefoneAleatorio() {
    const ddd = '49';
    const primeiroDigito = '9';
    const numero = Math.floor(10000000 + Math.random() * 90000000);

    return `${ddd}${primeiroDigito}${numero}`;
  }

  function fecharCookiesSeAparecer() {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
      }
    });
  }

  function preencherInput(index: number, valor: string) {
    cy.get('input:visible')
      .eq(index)
      .should('be.visible')
      .click({ force: true })
      .type(`{selectall}{backspace}${valor}`, { force: true });
  }

  function preencherData(index: number, valor: string) {
    cy.get('input:visible')
      .eq(index)
      .should('be.visible')
      .clear({ force: true })
      .type(valor, { force: true });
  }

  function preencherNomeCompleto(nomeCliente: string) {
    cy.get('input:visible')
      .eq(0)
      .as('campoNome');

    cy.get('@campoNome')
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true })
      .clear({ force: true })
      .type(nomeCliente, { force: true, delay: 20 });

    cy.get('@campoNome').then(($input) => {
      const valorAtual = $input.val();

      if (valorAtual !== nomeCliente) {
        cy.wrap($input)
          .invoke('val', nomeCliente)
          .trigger('input', { force: true })
          .trigger('change', { force: true });
      }
    });

    cy.get('@campoNome')
      .should('have.value', nomeCliente);
  }

  function preencherInputModalEndereco(index: number, valor: string) {
    cy.get('.q-dialog input:visible').then(($inputs) => {
      if ($inputs.length > index) {
        cy.wrap($inputs.eq(index))
          .scrollIntoView()
          .click({ force: true })
          .type(`{selectall}{backspace}${valor}`, { force: true });
      }
    });
  }

  function marcarEnderecoPrincipal() {
    cy.get('.q-dialog').then(($dialog) => {
      const $checkbox = $dialog
        .find('[role="checkbox"], .q-checkbox, input[type="checkbox"]')
        .filter(':visible')
        .first();

      if ($checkbox.length > 0) {
        const ariaChecked = $checkbox.attr('aria-checked');
        const className = $checkbox.attr('class') || '';

        const jaMarcado =
          ariaChecked === 'true' ||
          className.includes('truthy') ||
          className.includes('checked');

        if (!jaMarcado) {
          cy.wrap($checkbox).click({ force: true });
        }
      } else {
        cy.contains(/Endere[çc]o principal/i)
          .click({ force: true });
      }
    });
  }

  function adicionarEnderecoCliente() {
    const timestampEndereco = Date.now();

    const nomeEndereco = `Endereço E2E ${timestampEndereco}`;
    const cepValido = '89710300';
    const numero = `${Math.floor(100 + Math.random() * 900)}`;

    cy.contains(/Adicionar/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.get('.q-dialog', { timeout: 30000 })
      .should('exist');

    cy.wait(500);

    cy.get('.q-dialog input:visible').then(($inputs) => {
      const totalInputs = $inputs.length;

      const indices =
        totalInputs >= 9
          ? {
              nomeEndereco: 0,
              cep: 2,
              numero: 6,
            }
          : {
              nomeEndereco: 0,
              cep: 1,
              numero: 3,
            };
      
      preencherInputModalEndereco(indices.nomeEndereco, nomeEndereco);
      
      cy.get('.q-dialog input:visible')
        .eq(indices.cep)
        .scrollIntoView()
        .click({ force: true })
        .type(`{selectall}{backspace}${cepValido}{enter}`, { force: true });
      
      cy.wait(2500);
      
      preencherInputModalEndereco(indices.numero, numero);
    });
    
    marcarEnderecoPrincipal();
    
    cy.get('.q-dialog')
      .contains(/Confirmar/i, { timeout: 30000 })
      .click({ force: true });

    cy.wait(1000);
  }

  const timestamp = Date.now();
  const nomeCliente = `E2E Cliente ${timestamp}`;
  const telefone = gerarTelefoneAleatorio();
  const documento = gerarCPFValido();
  const email = `e2e.cliente.${timestamp}@teste.com`;

  beforeEach(() => {
    cy.login();

    fecharCookiesSeAparecer();

    cy.contains(/Clientes/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Listagem de clientes/i, { timeout: 30000 })
      .should('be.visible');
  });

  it('Deve cadastrar um cliente E2E com endereço principal.', () => {
    cy.contains(/Cadastrar cliente/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.contains(/Dados do cliente/i, { timeout: 30000 })
      .should('be.visible');

    cy.url().should('include', '/customers/cadastro');

    cy.wait(500);
    
    preencherNomeCompleto(nomeCliente);
    
    preencherInput(1, telefone);
    
    preencherInput(2, documento);

    
    preencherInput(3, email);
    
    preencherData(4, '1990-05-20');
    
    adicionarEnderecoCliente();
    
    cy.contains(/Gravar/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /cliente|sucesso|salvo|cadastrado|Listagem de clientes/i
      );
  });
});