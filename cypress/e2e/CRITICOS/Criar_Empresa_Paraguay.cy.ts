import { obterEmpresaParaguaiAleatoria } from '../../support/data/rucs-paraguai';

describe('Cadastro completo - Usuário e empresa Paraguai', () => {

const timestamp = Date.now();

const empresaSelecionada = obterEmpresaParaguaiAleatoria(timestamp);

const nomeUsuario = `Usuario Paraguai ${timestamp}`;
const emailUsuario = `usuario.paraguai.${timestamp}@teste.com`;
const senhaUsuario = '12345678';

const razaoSocial = `${empresaSelecionada.razao} E2E ${timestamp}`;
const fantasia = `Fantasia Paraguai ${timestamp}`;
const rucValido = empresaSelecionada.rucCompleto;
const slug = `py-${timestamp}`;
    

  function fecharCookiesSeAparecer() {
    cy.get('body', { timeout: 30000 }).then(($body) => {
      const texto = $body.text();

      const apareceuCookies =
        /cookies|utilizamos cookies|melhorar sua experiência|política de privacidade/i.test(
          texto
        );

      if (apareceuCookies) {
        cy.contains(/Entendi|Aceitar|Aceito|OK|Concordo/i, {
          timeout: 10000,
        }).click({ force: true });
      }
    });
  }

  function preencherInputVisivel(index: number, valor: string) {
    cy.get('input:visible', { timeout: 30000 })
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

  function selecionarComboPorIndice(index: number, opcao: RegExp) {
    cy.get('.q-field:visible', { timeout: 30000 })
      .eq(index)
      .should('be.visible')
      .click({ force: true });

    cy.wait(800);

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

    cy.wait(800);
  }

  function clicarBotaoGravarAtual() {
    cy.wait(700);

    cy.get('body', { timeout: 30000 }).then(($body) => {
      const botoes = $body
        .find('button:visible, .q-btn:visible, [role="button"]:visible')
        .toArray()
        .filter((botao) => {
          const texto = Cypress.$(botao)
            .text()
            .replace(/\s+/g, ' ')
            .trim();

          return /Guardar|Gravar|Salvar|Confirmar|Continuar/i.test(texto);
        }) as HTMLElement[];

      expect(
        botoes.length,
        'botão Guardar/Gravar visível encontrado'
      ).to.be.greaterThan(0);

      cy.wrap(botoes[0])
        .scrollIntoView()
        .should('be.visible')
        .click({ force: true });
    });
  }

  function fazerLogoutSeNecessario() {
    cy.visit('/');

    cy.wait(1000);

    fecharCookiesSeAparecer();

    cy.wait(1000);

    cy.get('body').then(($body) => {
      const texto = $body.text();

      const pareceLogado =
        /Dashboard|Agenda|Clientes|Atendentes|Servi[çc]os|Configura[çc][õo]es|Configuraciones/i.test(
          texto
        ) && !/Bem vindo|Bienvenido|Entrar|Ingresar|Cadastre-se/i.test(texto);

      if (!pareceLogado) {
        return;
      }

      const botaoPerfil = $body
        .find('button:visible, .q-btn:visible, [role="button"]:visible')
        .filter((_, el) => {
          const textoBotao = Cypress.$(el)
            .text()
            .replace(/\s+/g, ' ')
            .trim();

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
      const texto = $body.text();

      if (/\bSair\b|\bSalir\b/i.test(texto)) {
        cy.contains(/^Sair$|^Salir$/i).click({ force: true });
      } else {
        cy.clearCookies();
        cy.clearLocalStorage();

        cy.visit('/');

        cy.wait(1000);

        fecharCookiesSeAparecer();
      }
    });

    cy.contains(
      /Entrar|Ingresar|Cadastre-se|Reg[ií]strate|Bem vindo|Bienvenido/i,
      { timeout: 30000 }
    ).should('be.visible');
  }

  function abrirCadastroUsuario() {
    fecharCookiesSeAparecer();

    cy.contains(/Cadastre-se|Reg[ií]strate|Crear cuenta|Crear una cuenta/i, {
      timeout: 40000,
    })
      .should('be.visible')
      .click({ force: true });

    cy.wait(1000);

    fecharCookiesSeAparecer();

    cy.contains(/Cadastre-se|Reg[ií]strate|Crear cuenta|Crear una cuenta/i, {
      timeout: 40000,
    }).should('be.visible');
  }

  function cadastrarUsuario() {
    Cypress.log({
      name: 'E-mail criado',
      message: emailUsuario,
    });

    Cypress.log({
      name: 'RUC válido usado',
      message: rucValido,
    });

    cy.log(`E-mail criado: ${emailUsuario}`);
    cy.log(`RUC usado: ${rucValido}`);

    preencherInputVisivel(0, nomeUsuario);
    preencherInputVisivel(1, emailUsuario);
    preencherInputVisivel(2, senhaUsuario);
    preencherInputVisivel(3, senhaUsuario);

    clicarBotaoGravarAtual();

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /Informa[çc][õo]es da empresa|Información de la empresa|Raz[aãóo]+ social|Razón social|Fantasia|Nombre comercial|Pa[ií]s|Moeda|Moneda/i
      );
  }

  function preencherRucParaguai() {
    cy.get('input:visible', { timeout: 30000 }).then(($inputs) => {
      expect(
        $inputs.length,
        'inputs visíveis após selecionar Paraguai'
      ).to.be.greaterThan(2);

      cy.wrap($inputs.eq(2))
        .should('be.visible')
        .click({ force: true })
        .type('{selectall}{backspace}', { force: true });

      cy.wait(200);

      cy.wrap($inputs.eq(2)).type(rucValido, {
        force: true,
        delay: 20,
      });
    });

    cy.wait(1200);

    cy.get('body')
      .invoke('text')
      .should('not.match', /no v[aá]lido|inv[aá]lido/i);
  }

  function preencherInformacoesEmpresaParaguai() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /Información de la empresa|Informa[çc][õo]es da empresa|Razón social|Raz[aãóo]+ social|Nombre comercial|Fantasia|Pa[ií]s|Moneda|Moeda/i
      );

    // Razón social
    preencherInputVisivel(0, razaoSocial);

    // Nombre comercial / Fantasia
    preencherInputVisivel(1, fantasia);

    // País: Paraguay
    selecionarComboPorIndice(2, /Paraguay|Paraguai/i);

    // Moneda: Guarani
    selecionarComboPorIndice(3, /Guarani|Guaran[ií]s|PYG|₲|G\./i);

    // RUC válido com dígito verificador
    preencherRucParaguai();

    clicarBotaoGravarAtual();

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /Configura[çc][aã]o do site|Configuraci[oó]n del sitio|URL do site|URL del sitio|Segmento|dados iniciais|datos iniciales/i
      );
  }

  function preencherConfiguracaoSite() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /Configura[çc][aã]o do site|Configuraci[oó]n del sitio|URL do site|URL del sitio|Segmento/i
      );

    // Slug / URL do site
    preencherInputVisivel(0, slug);

    // Segmento: Barbearia
    selecionarComboPorIndice(1, /Barbearia|Barber[ií]a/i);

    clicarBotaoGravarAtual();

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /Dashboard|Agenda|Clientes|Configura[çc][õo]es|Configuraciones|Bom dia|Boa tarde|Boa noite|Buenos d[ií]as|Buenas tardes|Buenas noches|sucesso|éxito|exitosamente/i
      );
    salvarUsuarioGeradoNoJson();
  }

  function salvarUsuarioGeradoNoJson() {
  const arquivo = 'cypress/fixtures/usuarios-gerados.json';

  const usuarioGerado = {
    dataCriacao: new Date().toISOString(),
    pais: 'Paraguay',
    nomeUsuario,
    emailUsuario,
    senhaUsuario,
    razaoSocial,
    fantasia,
    documento: rucValido,
    slug,
  };

  cy.readFile(arquivo).then((usuariosExistentes) => {
    const usuarios = Array.isArray(usuariosExistentes)
      ? usuariosExistentes
      : [];

    usuarios.push(usuarioGerado);

    cy.writeFile(arquivo, usuarios);

    cy.log(`Usuário salvo no JSON: ${emailUsuario}`);
  });
}

  it('deve cadastrar usuário, empresa do Paraguai e configuração inicial do site', () => {
    fazerLogoutSeNecessario();

    abrirCadastroUsuario();

    cadastrarUsuario();

    preencherInformacoesEmpresaParaguai();

    preencherConfiguracaoSite();
  });
});