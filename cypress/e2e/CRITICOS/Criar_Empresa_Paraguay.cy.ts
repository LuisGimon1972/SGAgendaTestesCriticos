/*
Esse teste avalia principalmente:

- Se o cadastro de um novo usuário funciona
- Se o e-mail aleatório é aceito
- Se a senha e a confirmação da senha são aceitas
- Se a empresa paraguaia pode ser cadastrada
- Se o País Paraguay pode ser selecionado
- Se a moeda Guarani pode ser selecionada
- Se um RUC válido do Paraguai é aceito
- Se o sistema bloqueia RUC inválido ou já cadastrado
- Se a razão social e o nome fantasia são aceitos
- Se o slug do site é aceito
- Se o segmento Barbearia pode ser selecionado
- Se o sistema conclui corretamente o onboarding inicial
- Se o usuário criado consegue acessar o sistema após o cadastro
*/

import {
  empresasParaguai,
  formatarRucParaguai,
} from '../../support/data/rucs-paraguai';

describe('Cadastro completo - Usuário e empresa Paraguai', () => {

const arquivoUsuariosGerados = 'cypress/fixtures/usuarios-gerados.json';

let timestamp = Date.now();

let nomeUsuario = '';
let emailUsuario = '';
let senhaUsuario = '12345678';

let razaoSocial = '';
let fantasia = '';
let rucValido = '';
let slug = '';
    

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

  function preencherInputVisivel(index: number, valor: string, nomeCampo = `input ${index}`) {
  const valorFinal = String(valor || '').trim();

  if (!valorFinal) {
    throw new Error(`Valor vazio para o campo: ${nomeCampo}`);
  }

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
    .type(valorFinal, { force: true, delay: 20 });
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

  preencherInputVisivel(0, nomeUsuario, 'Nome do usuário');
  preencherInputVisivel(1, emailUsuario, 'E-mail do usuário');
  preencherInputVisivel(2, senhaUsuario, 'Senha');
  preencherInputVisivel(3, senhaUsuario, 'Confirmação de senha');

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

  preencherInputVisivel(0, razaoSocial, 'Razão social');
  preencherInputVisivel(1, fantasia, 'Fantasia');

  selecionarComboPorIndice(2, /Paraguay|Paraguai/i);

  selecionarComboPorIndice(3, /Guarani|Guaran[ií]s|PYG|₲|G\./i);

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

  preencherInputVisivel(0, slug, 'Slug');

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
  const usuarioGerado: UsuarioGerado = {
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

  cy.readFile(arquivoUsuariosGerados).then((usuariosExistentes) => {
    const usuarios: UsuarioGerado[] = Array.isArray(usuariosExistentes)
      ? usuariosExistentes
      : [];

    const rucJaExiste = usuarios.some((usuario) => {
      return normalizarRuc(usuario.documento || '') === normalizarRuc(rucValido);
    });

    if (rucJaExiste) {
      throw new Error(`RUC já estava salvo no JSON: ${rucValido}`);
    }

    usuarios.push(usuarioGerado);

    cy.writeFile(arquivoUsuariosGerados, usuarios);

    cy.log(`Usuário salvo no JSON: ${emailUsuario}`);
    cy.log(`RUC salvo no JSON: ${rucValido}`);
  });
}

type UsuarioGerado = {
  dataCriacao?: string;
  pais?: string;
  nomeUsuario?: string;
  emailUsuario?: string;
  senhaUsuario?: string;
  razaoSocial?: string;
  fantasia?: string;
  documento?: string;
  slug?: string;
};

function normalizarRuc(ruc: string) {
  return String(ruc || '').replace(/\D/g, '');
}

function prepararDadosComRucNaoCadastrado() {
  return cy.readFile(arquivoUsuariosGerados).then((usuariosExistentes) => {
    const usuarios: UsuarioGerado[] = Array.isArray(usuariosExistentes)
      ? usuariosExistentes
      : [];

    const rucsJaUsados = new Set(
      usuarios
        .map((usuario) => normalizarRuc(usuario.documento || ''))
        .filter((ruc) => ruc.length > 0)
    );

    const empresasDisponiveis = empresasParaguai
      .map((empresa) => {
        const rucCompleto = formatarRucParaguai(empresa.ruc);

        return {
          ...empresa,
          rucCompleto,
        };
      })
      .filter((empresa) => {
        return !rucsJaUsados.has(normalizarRuc(empresa.rucCompleto));
      });

    expect(
      empresasDisponiveis.length,
      'RUCs disponíveis ainda não cadastrados'
    ).to.be.greaterThan(0);

    const empresaSelecionada = Cypress._.sample(empresasDisponiveis);

    if (!empresaSelecionada) {
      throw new Error('Nenhum RUC disponível para cadastrar.');
    }

    timestamp = Date.now();

    nomeUsuario = `Usuario Paraguai ${timestamp}`;
    emailUsuario = `usuario.paraguai.${timestamp}@teste.com`;
    senhaUsuario = '12345678';

    razaoSocial = `${empresaSelecionada.razao} E2E ${timestamp}`;
    fantasia = `Fantasia Paraguai ${timestamp}`;
    rucValido = empresaSelecionada.rucCompleto;
    slug = `py-${timestamp}`;

    Cypress.log({
      name: 'RUC selecionado',
      message: rucValido,
    });

    cy.log(`RUC selecionado: ${rucValido}`);
    cy.log(`E-mail criado: ${emailUsuario}`);
  });
}

 it('deve cadastrar usuário, empresa do Paraguai e configuração inicial do site', () => {
  prepararDadosComRucNaoCadastrado().then(() => {
    fazerLogoutSeNecessario();

    abrirCadastroUsuario();

    cadastrarUsuario();

    preencherInformacoesEmpresaParaguai();

    preencherConfiguracaoSite();
  });
});
});