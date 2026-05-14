/*
Esse teste avalia principalmente:

- Se o cadastro de usuário novo funciona
- Se o e-mail aleatório é aceito
- Se a senha e confirmação são aceitas
- Se a empresa pode ser cadastrada
- Se País e Moeda podem ser selecionados
- Se o CNPJ válido é aceito
- Se o slug do site é aceito
- Se o segmento pode ser selecionado
- Se o sistema conclui o onboarding inicial
*/

describe('Cadastro completo - Usuário e empresa', () => {
  const timestamp = Date.now();

  const nomeUsuario = `Usuario ${timestamp}`;
  const emailUsuario = `usuario.${timestamp}@teste.com`;
  const senhaUsuario = '12345678';

  const razaoSocial = `Barbearia ${timestamp}`;
  const fantasia = `Fantasia ${timestamp}`;
  const slug = `site-${timestamp}`;

  function gerarCnpjValido() {
    const base = `${Math.floor(10000000 + Math.random() * 90000000)}0001`;

    function calcularDigito(cnpjBase: string) {
      const pesos =
        cnpjBase.length === 12
          ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
          : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

      const soma = cnpjBase
        .split('')
        .reduce((total, numero, index) => {
          return total + Number(numero) * pesos[index];
        }, 0);

      const resto = soma % 11;

      return resto < 2 ? '0' : String(11 - resto);
    }

    const digito1 = calcularDigito(base);
    const digito2 = calcularDigito(base + digito1);

    const cnpj = base + digito1 + digito2;

    return cnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  }

  const cnpjValido = gerarCnpjValido();

  function fecharCookiesSeAparecer() {
  cy.get('body', { timeout: 30000 }).then(($body) => {
    const texto = $body.text();

    const apareceuCookies =
      /cookies|utilizamos cookies|melhorar sua experiência|política de privacidade/i.test(
        texto
      );

    if (!apareceuCookies) {
      return cy.wrap(null);
    }

    return cy
      .contains(/Entendi|Aceitar|Aceito|OK|Concordo/i, { timeout: 10000 })
      .click({ force: true });
  });
}

  function preencherInputVisivel(index: number, valor: string) {
    cy.get('input:visible')
      .eq(index)
      .should('be.visible')
      .click({ force: true });

    cy.get('input:visible')
      .eq(index)
      .type('{selectall}{backspace}', { force: true });

    cy.wait(200);

    cy.get('input:visible')
      .eq(index)
      .type(valor, { force: true, delay: 20 });
  }

  function preencherTextareaVisivel(index: number, valor: string) {
    cy.get('textarea:visible')
      .eq(index)
      .should('be.visible')
      .click({ force: true });

    cy.get('textarea:visible')
      .eq(index)
      .type('{selectall}{backspace}', { force: true });

    cy.wait(200);

    cy.get('textarea:visible')
      .eq(index)
      .type(valor, { force: true, delay: 20 });
  }

function preencherCampoProximoAoLabel(label: RegExp, valor: string) {
  cy.contains(label, { timeout: 30000 })
    .should('exist')
    .then(($label: JQuery<HTMLElement>) => {
      const elementoLabel = $label.get(0);

      if (!elementoLabel) {
        throw new Error(`Label não encontrado: ${label}`);
      }

      const labelRect = elementoLabel.getBoundingClientRect();

      cy.get('input:visible, textarea:visible').then(
        ($campos: JQuery<HTMLElement>) => {
          const camposOrdenados = $campos
            .toArray()
            .filter((campo) => {
              const rect = campo.getBoundingClientRect();

              return rect.top >= labelRect.top - 10;
            })
            .sort((a, b) => {
              const rectA = a.getBoundingClientRect();
              const rectB = b.getBoundingClientRect();

              const distanciaA =
                Math.abs(rectA.top - labelRect.bottom) +
                Math.abs(rectA.left - labelRect.left);

              const distanciaB =
                Math.abs(rectB.top - labelRect.bottom) +
                Math.abs(rectB.left - labelRect.left);

              return distanciaA - distanciaB;
            });

          expect(
            camposOrdenados.length,
            `campo encontrado para label ${label}`
          ).to.be.greaterThan(0);

          const campo = camposOrdenados[0];

          if (!campo) {
            throw new Error(`Campo não encontrado para label: ${label}`);
          }

          cy.wrap(campo)
            .click({ force: true })
            .type('{selectall}{backspace}', { force: true });

          cy.wait(200);

          cy.wrap(campo)
            .type(valor, { force: true, delay: 20 });
        }
      );
    });
}

  function selecionarComboPorLabel(label: RegExp, opcao: RegExp) {
  cy.contains(label, { timeout: 30000 })
    .should('exist')
    .then(($label: JQuery<HTMLElement>) => {
      const elementoLabel = $label.get(0);

      if (!elementoLabel) {
        throw new Error(`Label não encontrado: ${label}`);
      }

      const labelRect = elementoLabel.getBoundingClientRect();

      cy.get('.q-field:visible, [role="combobox"]:visible').then(
        ($campos: JQuery<HTMLElement>) => {
          const camposOrdenados = $campos
            .toArray()
            .filter((campo) => {
              const rect = campo.getBoundingClientRect();

              return rect.top >= labelRect.top - 10;
            })
            .sort((a, b) => {
              const rectA = a.getBoundingClientRect();
              const rectB = b.getBoundingClientRect();

              const distanciaA =
                Math.abs(rectA.top - labelRect.bottom) +
                Math.abs(rectA.left - labelRect.left);

              const distanciaB =
                Math.abs(rectB.top - labelRect.bottom) +
                Math.abs(rectB.left - labelRect.left);

              return distanciaA - distanciaB;
            });

          expect(
            camposOrdenados.length,
            `combo encontrado para label ${label}`
          ).to.be.greaterThan(0);

          const combo = camposOrdenados[0];

          if (!combo) {
            throw new Error(`Combo não encontrado para label: ${label}`);
          }

          cy.wrap(combo).click({ force: true });
        }
      );
    });

  cy.wait(700);

  cy.get('body').then(($body) => {
    const opcoes = $body
      .find(
        '.q-menu:visible .q-item, .q-virtual-scroll__content .q-item, [role="option"]:visible'
      )
      .toArray()
      .filter((item) => {
        const texto = Cypress.$(item)
          .text()
          .replace(/\s+/g, ' ')
          .trim();

        return opcao.test(texto);
      }) as HTMLElement[];

    expect(
      opcoes.length,
      `opção encontrada no combo: ${opcao}`
    ).to.be.greaterThan(0);

    const opcaoSelecionada = opcoes[0];

    if (!opcaoSelecionada) {
      throw new Error(`Opção não encontrada no combo: ${opcao}`);
    }

    cy.wrap(opcaoSelecionada).click({ force: true });
  });

  cy.wait(700);
}

  function fazerLogoutSeNecessario() {
  cy.visit('/');

  cy.wait(1000);

  fecharCookiesSeAparecer();

  cy.wait(1000);

  cy.get('body').then(($body) => {
    const texto = $body.text();

    const pareceLogado =
      /Dashboard|Agenda|Clientes|Atendentes|Servi[çc]os|Configura[çc][õo]es/i.test(
        texto
      ) && !/Bem vindo|Entrar|Cadastre-se/i.test(texto);

    if (!pareceLogado) {
      return;
    }

    const botaoPerfil = $body
      .find('button:visible, .q-btn:visible, [role="button"]:visible')
      .filter((_, el) => {
        const textoBotao = Cypress.$(el).text().replace(/\s+/g, ' ').trim();

        return /keyboard_arrow_down|expand_more|Luis|automatizado|@/i.test(
          textoBotao
        );
      })
      .last();

    if (botaoPerfil.length > 0) {
      cy.wrap(botaoPerfil).click({ force: true });
    }
  });

  cy.wait(700);

  cy.get('body').then(($body) => {
    if ($body.text().match(/\bSair\b/i)) {
      cy.contains(/^Sair$/i).click({ force: true });
    } else {
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.visit('/');

      cy.wait(1000);

      fecharCookiesSeAparecer();
    }
  });

  cy.contains(/Entrar|Cadastre-se|Bem vindo/i, { timeout: 30000 })
    .should('be.visible');
}

  function abrirCadastroUsuario() {
    cy.contains(/Cadastre-se/i, { timeout: 40000 })
      .should('be.visible')
      .click({ force: true });

    cy.contains(/Cadastre-se/i, { timeout: 40000 })
      .should('be.visible');
  }

  function cadastrarUsuario() {
    Cypress.log({
      name: 'E-mail criado para cadastro',
      message: emailUsuario,
    });

    cy.log(`E-mail criado: ${emailUsuario}`);

    preencherInputVisivel(0, nomeUsuario);
    preencherInputVisivel(1, emailUsuario);
    preencherInputVisivel(2, senhaUsuario);
    preencherInputVisivel(3, senhaUsuario);

    cy.contains(/Gravar/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /Informa[çc][õo]es da empresa|Raz[aã]o social|Fantasia|Pa[ií]s|Moeda/i
      );
  }

  function preencherInformacoesEmpresa() {
    preencherCampoProximoAoLabel(/Raz[aã]o social/i, razaoSocial);

    preencherCampoProximoAoLabel(/Fantasia/i, fantasia);

    selecionarComboPorLabel(/Pa[ií]s/i, /Brasil/i);

    selecionarComboPorLabel(/Moeda/i, /Real|R\$\s*-?\s*Real|Brasileiro/i);

    cy.get('body').then(($body) => {
      if (/CNPJ/i.test($body.text())) {
        preencherCampoProximoAoLabel(/CNPJ/i, cnpjValido);
      } else {
        Cypress.log({
          name: 'CNPJ',
          message:
            'Campo CNPJ não apareceu nesta etapa. Seguindo para gravar empresa.',
        });
      }
    });

    cy.contains(/Gravar/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /Configura[çc][aã]o do site|URL do site|Segmento|dados iniciais/i
      );
  }

  function preencherConfiguracaoSite() {
    preencherCampoProximoAoLabel(/URL do site|slug/i, slug);

    selecionarComboPorLabel(/Segmento/i, /Barbearia/i);

    cy.contains(/Gravar/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /Dashboard|Agenda|Clientes|Configura[çc][õo]es|Bom dia|Boa tarde|Boa noite|sucesso/i
      );
  }

  it('Deve cadastrar usuário, empresa e configuração inicial do site.', () => {
    fazerLogoutSeNecessario();

    abrirCadastroUsuario();

    cadastrarUsuario();

    preencherInformacoesEmpresa();

    preencherConfiguracaoSite();
  });
});