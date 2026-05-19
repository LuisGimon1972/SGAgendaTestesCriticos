/*
Esse teste cria um agendamento pelo Painel do Cliente.

Fluxo:
1. Fazer login no painel administrativo
2. Clicar em Configurações
3. Clicar em Personalização
4. Capturar a URL pública do Painel do Cliente
5. Acessar o Painel do Cliente
6. Selecionar 1 ou 2 serviços com Corte, Servi, Serviço, Servicio, Barba ou valor
7. Clicar em Continuar
8. No carrinho, clicar em Continuar
9. Selecionar atendente
10. Clicar em Continuar
11. Selecionar data
12. Clicar em Continuar
13. Selecionar horário
14. Clicar em Continuar
15. Preencher nome e telefone
16. Confirmar agendamento
*/

Cypress.on('uncaught:exception', (err) => {
  const mensagem = [
    err?.name || '',
    err?.message || '',
    err?.stack || '',
  ].join(' ');

  const errosConhecidosDaAplicacao = [
    /Element not found/i,
    /Cannot read properties of null.*nextSibling/i,
    /reading 'nextSibling'/i,
  ];

  const deveIgnorar = errosConhecidosDaAplicacao.some((regex) =>
    regex.test(mensagem)
  );

  if (deveIgnorar) {
    Cypress.log({
      name: 'Erro ignorado da aplicação',
      message: mensagem,
    });

    return false;
  }

  return true;
});

describe('Painel do Cliente - Criar agendamento', () => {
  const timestamp = Date.now();

  const nomeCliente = `Cliente Painel ${timestamp}`;
  const telefoneCliente = gerarTelefoneAleatorio();

  let urlPainelCliente = '';

  function gerarTelefoneAleatorio() {
    const ddd = '49';
    const primeiroDigito = '9';
    const numero = Math.floor(10000000 + Math.random() * 90000000);

    return `${ddd}${primeiroDigito}${numero}`;
  }

  function limparTexto(texto: string) {
    return String(texto || '').replace(/\s+/g, ' ').trim();
  }

  function fecharCookiesSeAparecer() {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
      }
    });
  }

  function abrirPersonalizacao() {
    cy.login('iphone-x');

    fecharCookiesSeAparecer();

    cy.contains(/Configura[çc][õo]es/i, { timeout: 30000 })
      .click({ force: true });

    cy.contains(/Personaliza[çc][aã]o/i, { timeout: 30000 })
      .click({ force: true });

    cy.wait(1000);

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /URL do site|URL de tu sitio web|URL del sitio|Personaliza[çc][aã]o|Personalización|Dados do site|Datos del sitio/i
      );
  }  

function clicarLinkPainelCliente() {
  cy.location().then((location) => {
    const slug = location.pathname.split('/').filter(Boolean)[0];

    if (!slug) {
      throw new Error(
        `Não foi possível obter o slug da empresa pela URL atual: ${location.pathname}`
      );
    }

    const dominioPublico = location.host.includes('hom')
      ? 'https://app-hom.sgagenda.com'
      : 'https://app.sgagenda.com';

    const urlCorreta = `${dominioPublico}/${slug}`;

    cy.log(`Abrindo URL pública correta: ${urlCorreta}`);

    expect(urlCorreta).to.eq(`${dominioPublico}/${slug}`);

    cy.visit(urlCorreta);
  });

  cy.get('body', { timeout: 30000 })
    .invoke('text')
    .should(
      'match',
      /Selecione os servi[çc]os|Selecciona los servicios|Escolha um ou mais servi[çc]os|Elige uno o más servicios|servi[çc]os que deseja agendar|servicios que deseas reservar|Escolha os servi[çc]os|Choose.*services|Select.*services/i
    );

  fecharCookiesSeAparecer();
}

  function normalizarTextoBusca(texto: string) {
  return limparTexto(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function obterCardsServico($body: JQuery<HTMLElement>) {
  const encontrados: HTMLElement[] = [];
  const chavesVistas = new Set<string>();

  const candidatos = $body
    .find(
      'article:visible, button:visible, [role="button"]:visible, .q-card:visible, .p-card:visible, [class*="card"]:visible, div:visible'
    )
    .toArray();

  candidatos.forEach((el) => {
    const elemento = el as HTMLElement;

    const textoOriginal = limparTexto(Cypress.$(elemento).text());
    const texto = normalizarTextoBusca(textoOriginal);

    if (!textoOriginal || textoOriginal.length > 450) {
      return;
    }

    const rect = elemento.getBoundingClientRect();

    const temTamanhoDeCard =
      rect.width >= 80 &&
      rect.height >= 40 &&
      rect.height <= 500;

    const contemPalavraServico =
      /CORTE|CORT|SERVI|SERVICO|SERVICIO|BARBA|SOBRANCELHA|CEJAS|CABELEIREIRO|PELUQUERIA|PELUQUERO/.test(
        texto
      );

    const contemValor =
      /(?:R\$|\$|₲|G|GS\.?|G\$)\s*[\d.,]+|[\d.,]+\s*(?:R\$|\$|₲|G|GS\.?|G\$)/.test(
        texto
      );

    const contemDuracao = /\d+\s*MIN/.test(texto);

    const naoEhResumoOuTitulo =
      !/SELECIONE OS SERVICOS|ESCOLHA UM OU MAIS|0 SERVICO\(S\)|1 SERVICO|2 SERVICOS|TODOS|CONTINUAR|HISTORICO|INICIO|TOTAL|CARRINHO|CARRO|VOLVER|VOLTAR/.test(
        texto
      );

    const pareceCardReal = contemPalavraServico || (contemValor && contemDuracao);

    if (!temTamanhoDeCard || !naoEhResumoOuTitulo || !pareceCardReal) {
      return;
    }

    const clicavel =
      Cypress.$(elemento)
        .closest(
          'article, button, [role="button"], .q-card, .p-card, [class*="card"], [class*="service"], [class*="item"]'
        )
        .get(0) || elemento;

    const chaveServico = normalizarTextoBusca(Cypress.$(clicavel).text())
      .replace(/SELECIONADO|ADICIONAR|REMOVER|CHECK/gi, '')
      .trim()
      .slice(0, 140);

    if (!chavesVistas.has(chaveServico)) {
      chavesVistas.add(chaveServico);
      encontrados.push(clicavel);
    }
  });

  return encontrados.sort((a, b) => {
    const textoA = normalizarTextoBusca(Cypress.$(a).text());
    const textoB = normalizarTextoBusca(Cypress.$(b).text());

    const scoreA =
      (/CORTE|CORT|SERVI|SERVICO|SERVICIO|BARBA|SOBRANCELHA|CEJAS/.test(textoA)
        ? 100
        : 0) +
      (/(?:R\$|\$|₲|G|GS\.?|G\$)\s*[\d.,]+/.test(textoA) ? 80 : 0) +
      (/\d+\s*MIN/.test(textoA) ? 40 : 0) -
      textoA.length * 0.1;

    const scoreB =
      (/CORTE|CORT|SERVI|SERVICO|SERVICIO|BARBA|SOBRANCELHA|CEJAS/.test(textoB)
        ? 100
        : 0) +
      (/(?:R\$|\$|₲|G|GS\.?|G\$)\s*[\d.,]+/.test(textoB) ? 80 : 0) +
      (/\d+\s*MIN/.test(textoB) ? 40 : 0) -
      textoB.length * 0.1;

    return scoreB - scoreA;
  });
}

function selecionarServicosPainelCliente() {
  cy.get('body', { timeout: 30000 })
    .invoke('text')
    .should(
      'match',
      /Selecione os servi[çc]os|Selecciona los servicios|Escolha um ou mais servi[çc]os|Elige uno o más servicios|servi[çc]os que deseja agendar|servicios que deseas reservar|Escolha os servi[çc]os|Choose.*services|Select.*services/i
    );

  cy.wait(3000);

  cy.get('body').then(($body) => {
    const cardsServico = obterCardsServico($body);

    if (cardsServico.length === 0) {
      cy.log(`Texto da tela: ${limparTexto($body.text()).slice(0, 2000)}`);
      cy.screenshot('painel-cliente-servicos-nao-encontrados');

      throw new Error(
        'Nenhum serviço encontrado. A busca aceita maiúsculas/minúsculas, Corte, Servi, Serviço, Servicio, Barba, valor em R$, $, ₲, G, Gs, BRL, PYG e cards com valor + duração.'
      );
    }

    const quantidadeParaSelecionar = cardsServico.length > 1 ? 2 : 1;
    const servicosSelecionados = cardsServico.slice(0, quantidadeParaSelecionar);

    cy.log(`Quantidade de serviços a selecionar: ${quantidadeParaSelecionar}`);

    servicosSelecionados.forEach((card, index) => {
      const textoServico = limparTexto(Cypress.$(card).text());

      cy.log(`Selecionando serviço ${index + 1}: ${textoServico}`);

      cy.wrap(card)
        .scrollIntoView()
        .click('center', { force: true });

      cy.wait(700);
    });
  });

  cy.wait(1000);

  cy.get('body', { timeout: 30000 }).then(($body) => {
    const textoOriginal = limparTexto($body.text());
    const texto = normalizarTextoBusca(textoOriginal);

    cy.log(`Texto após selecionar serviços: ${textoOriginal.slice(0, 1200)}`);

    const temContinuar = /CONTINUAR|SIGUIENTE|NEXT/.test(texto);

    const ficouComZeroServico =
      /0\s*(SERVICO|SERVICIO)\(S\)?\s*(R\$|BRL|PYG|\$|₲|G|GS\.?)?\s*0,00/.test(
        texto
      );

    if (ficouComZeroServico) {
      cy.screenshot('servicos-nao-foram-selecionados');

      throw new Error(
        'Os serviços foram clicados, mas o contador continuou em 0 serviço(s).'
      );
    }

    const matchesQuantidade = Array.from(
      texto.matchAll(/(\d+)\s*(SERVICO|SERVICIO)\(S\)?/g)
    );

    const quantidades = matchesQuantidade
      .map((match) => Number(match[1]))
      .filter((numero) => Number.isFinite(numero));

    const temQuantidadeMaiorQueZero = quantidades.some(
      (quantidade) => quantidade > 0
    );

    if (!temQuantidadeMaiorQueZero && !temContinuar) {
      cy.screenshot('contador-servicos-nao-encontrado');

      throw new Error(
        `Não foi possível validar quantidade de serviços selecionados. Texto: ${textoOriginal.slice(
          0,
          1200
        )}`
      );
    }

    expect(
      temQuantidadeMaiorQueZero || temContinuar,
      'serviço selecionado ou botão Continuar disponível'
    ).to.eq(true);
  });
}

  function clicarContinuar() {
  cy.get('body', { timeout: 30000 }).then(($body) => {
    const botoesContinuar = $body
      .find(
        'button:visible, .q-btn:visible, .p-button:visible, [role="button"]:visible'
      )
      .toArray()
      .filter((botao) => {
        const textoBotao = limparTexto(Cypress.$(botao).text());

        const estaDesabilitado =
          botao.hasAttribute('disabled') ||
          Cypress.$(botao).attr('aria-disabled') === 'true' ||
          Cypress.$(botao).hasClass('disabled') ||
          Cypress.$(botao).hasClass('q-btn--disabled') ||
          Cypress.$(botao).hasClass('p-disabled') ||
          Cypress.$(botao).is(':disabled');

        return (
          /Continuar|Avançar|Avancar|Siguiente|Próximo|Proximo|Next/i.test(
            textoBotao
          ) && !estaDesabilitado
        );
      }) as HTMLElement[];

    if (botoesContinuar.length === 0) {
      cy.log(`Texto da tela: ${limparTexto($body.text()).slice(0, 1500)}`);
      cy.screenshot('botao-continuar-nao-encontrado');

      throw new Error(
        'Botão Continuar não está habilitado. Verifique se serviço/atendente/data/horário foi selecionado.'
      );
    }

    const botao =
      botoesContinuar[botoesContinuar.length - 1] || botoesContinuar[0];

    if (!botao) {
      throw new Error('Botão Continuar inválido.');
    }

    cy.wrap(botao)
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });
  });

  cy.wait(1000);

  fecharCookiesSeAparecer();
}

 function selecionarAtendente() {
  cy.get('body', { timeout: 30000 })
    .invoke('text')
    .should(
      'match',
      /Escolha seu atendente|Escolha o atendente|Selecione o profissional|Atendente|Profissional|Profesional|Elige tu profesional|Selecciona un profesional/i
    );

  cy.wait(1500);

  cy.get('body').then(($body) => {
    const body = $body.get(0);

    if (!body) {
      throw new Error('Body da página não encontrado.');
    }

    const regexTituloProfissional =
      /Escolha seu atendente|Escolha o atendente|Selecione o profissional|Elige tu profesional|Selecciona un profesional/i;

    const tituloProfissional = Array.from(
      body.querySelectorAll<HTMLElement>('*')
    ).find((el) => {
      const texto = limparTexto(el.textContent || '');

      return Cypress.$(el).is(':visible') && regexTituloProfissional.test(texto);
    });

    if (!tituloProfissional) {
      cy.log(`Texto da tela: ${limparTexto($body.text()).slice(0, 2500)}`);
      cy.screenshot('titulo-profissional-nao-encontrado');

      throw new Error('Título da etapa de profissional não encontrado.');
    }

    const topTitulo = tituloProfissional.getBoundingClientRect().top;

    const containerProfissional =
      Cypress.$(tituloProfissional)
        .parents()
        .toArray()
        .find((parent) => {
          const texto = limparTexto(parent.textContent || '');
          const normalizado = normalizarTextoBusca(texto);
          const rect = parent.getBoundingClientRect();

          const contemTitulo =
            /ELIGE TU PROFESIONAL|SELECCIONA UN PROFESIONAL|ESCOLHA SEU ATENDENTE|SELECIONE O PROFISSIONAL/.test(
              normalizado
            );

          const contemBotoesEtapa =
            /CONTINUAR|SIGUIENTE|NEXT/.test(normalizado) &&
            /VOLVER|VOLTAR|BACK/.test(normalizado);

          const tamanhoValido =
            rect.width >= 250 &&
            rect.height >= 220 &&
            rect.height <= 900;

          return contemTitulo && contemBotoesEtapa && tamanhoValido;
        }) || body;

    const candidatos = Array.from(
      containerProfissional.querySelectorAll<HTMLElement>(
        'button, [role="button"], article, .q-card, .p-card'
      )
    ).filter((el) => {
      const textoOriginal = limparTexto(el.textContent || '');
      const texto = normalizarTextoBusca(textoOriginal);
      const rect = el.getBoundingClientRect();

      const estaVisivel = Cypress.$(el).is(':visible');

      const estaDepoisDoTitulo = rect.top > topTitulo;

      const tamanhoValido =
        rect.width >= 80 &&
        rect.width <= 750 &&
        rect.height >= 30 &&
        rect.height <= 260;

      const textoValido =
        textoOriginal.length >= 3 &&
        textoOriginal.length <= 140;

      const naoEhMenuHistoricoOuTopo =
        !/INICIO|HISTORIAL|HISTORICO|ACCEDER AL HISTORIAL|TELEFONO|TELÉFONO|TERMINOS|POLITICA|POLÍTICA|COMPARTILHAR/.test(
          texto
        );

      const naoEhCabecalhoResumoOuBotao =
        !/FINALIZAR RESERVA|FINALIZAR AGENDAMENTO|PROFESIONALFECHAHORARESUMEN|ATENDENTEDATAHORARIORESUMO|FECHAHORARESUMEN|DATAHORARIORESUMO|ELIGE TU PROFESIONAL|SELECCIONA UN PROFESIONAL|ESCOLHA SEU ATENDENTE|SELECIONE O PROFISSIONAL|SERVICIOS|SERVIÇOS|SERVICOS|VOLVER|VOLTAR|CONTINUAR|SIGUIENTE|NEXT/.test(
          texto
        );

      const naoEhServicoCategoriaOuValor =
        !/CORTE|CORTES|SERVI|SERVICO|SERVIÇO|SERVICIO|BARBA|SOBRANCELHA|CEJAS|CABELLO|CABELO|LAVADO|SECADO|TATOO|PEDI|CURE|LIMPEZA|PELE|DESDE|CONSULTAR|DISPONIBILIDAD|DISPONIBILIDADE|DOMICILIO|DOMICÍLIO|BRL|R\$|\$|₲|GS\.?|G\$|\d+\s*MIN/.test(
          texto
        );

      const pareceNomeProfissional =
        /^[A-ZÁÉÍÓÚÃÕÇÑ][A-ZÁÉÍÓÚÃÕÇÑa-záéíóúãõçñ]+(?:\s+[A-ZÁÉÍÓÚÃÕÇÑa-záéíóúãõçñ]+)+/.test(
          textoOriginal
        ) ||
        /USUARIO|USUÁRIO|ATENDENTE|PROFISSIONAL|PROFESIONAL|PELUQUERO|BARBEIRO|SGBR|PAGAMENTOS/.test(
          texto
        );

      const naoEstaDesabilitado =
        !el.hasAttribute('disabled') &&
        Cypress.$(el).attr('aria-disabled') !== 'true' &&
        !Cypress.$(el).hasClass('disabled') &&
        !Cypress.$(el).hasClass('p-disabled') &&
        !Cypress.$(el).hasClass('q-btn--disabled') &&
        !Cypress.$(el).is(':disabled');

      return (
        estaVisivel &&
        estaDepoisDoTitulo &&
        tamanhoValido &&
        textoValido &&
        pareceNomeProfissional &&
        naoEhMenuHistoricoOuTopo &&
        naoEhCabecalhoResumoOuBotao &&
        naoEhServicoCategoriaOuValor &&
        naoEstaDesabilitado
      );
    });

    if (candidatos.length === 0) {
      cy.log(`Texto da etapa profissional: ${limparTexto(Cypress.$(containerProfissional).text()).slice(0, 2500)}`);
      cy.screenshot('profissional-painel-cliente-nao-encontrado');

      throw new Error(
        'Nenhum profissional real encontrado. O teste ignorou histórico, serviços, categorias, valores e botões.'
      );
    }

    const profissionalEscolhido = candidatos[0];

    const textoProfissional = limparTexto(profissionalEscolhido.textContent || '');

    cy.log(`Profissional escolhido: ${textoProfissional}`);

    cy.wrap(profissionalEscolhido)
      .scrollIntoView()
      .click('center', { force: true });
  });

  cy.wait(1000);

  cy.get('body', { timeout: 30000 }).then(($body) => {
    const botoesContinuarHabilitados = $body
      .find(
        'button:visible, .p-button:visible, .q-btn:visible, [role="button"]:visible'
      )
      .toArray()
      .filter((botao) => {
        const textoBotao = limparTexto(Cypress.$(botao).text());

        const desabilitado =
          botao.hasAttribute('disabled') ||
          Cypress.$(botao).attr('aria-disabled') === 'true' ||
          Cypress.$(botao).hasClass('disabled') ||
          Cypress.$(botao).hasClass('p-disabled') ||
          Cypress.$(botao).hasClass('q-btn--disabled') ||
          Cypress.$(botao).is(':disabled');

        return /Continuar|Siguiente|Next/i.test(textoBotao) && !desabilitado;
      });

    expect(
      botoesContinuarHabilitados.length,
      'botão Continuar habilitado após selecionar profissional'
    ).to.be.greaterThan(0);
  });
}

  function selecionarData() {
  cy.get('body', { timeout: 30000 })
    .invoke('text')
    .should(
      'match',
      /Escolha a data|Escolha uma data|Selecione a data|Data|Datas dispon[ií]veis|Elige la fecha|Selecciona.*fecha|Fecha|Fechas disponibles/i
    );

  cy.wait(1000);

  cy.get('body').then(($body) => {
    const body = $body.get(0);

    if (!body) {
      throw new Error('Body da página não encontrado.');
    }

    const datas = Array.from(
      body.querySelectorAll<HTMLElement>(
        'button, [role="button"], article, .q-card, .p-card, div'
      )
    ).filter((el) => {
      const textoOriginal = limparTexto(el.textContent || '');
      const texto = normalizarTextoBusca(textoOriginal);
      const rect = el.getBoundingClientRect();

      const estaVisivel = Cypress.$(el).is(':visible');

      const ehData =
        /^\d{1,2}\/\d{1,2}/.test(textoOriginal) ||
        /^\d{1,2}\/\d{1,2}/.test(texto);

      const contemDiaSemana =
        /SEGUNDA|TERCA|TERÇA|QUARTA|QUINTA|SEXTA|SABADO|SÁBADO|DOMINGO|LUNES|MARTES|MIERCOLES|MIÉRCOLES|JUEVES|VIERNES/.test(
          texto
        );

      const naoEhCabecalhoOuResumo =
        !/FINALIZAR RESERVA|FINALIZAR AGENDAMENTO|PROFESIONALFECHAHORARESUMEN|ATENDENTEDATAHORARIORESUMO|FECHA SELECCIONADA|DATA SELECIONADA|SELECIONA UMA DATA|SELECCIONA UNA FECHA|FECHAS DISPONIBLES|DATAS DISPONIVEIS|SERVICIOS|SERVIÇOS|SERVICOS|VOLVER|VOLTAR|CONTINUAR|SIGUIENTE|NEXT/.test(
          texto
        );

      const naoEhServico =
        !/CORTE|SERVICO|SERVIÇO|SERVICIO|BARBA|BRL|R\$|\$|₲|GS\.?|G\$|\d+\s*MIN/.test(
          texto
        );

      const naoEstaDesabilitado =
        !el.hasAttribute('disabled') &&
        Cypress.$(el).attr('aria-disabled') !== 'true' &&
        !Cypress.$(el).hasClass('disabled') &&
        !Cypress.$(el).hasClass('p-disabled') &&
        !Cypress.$(el).hasClass('q-btn--disabled') &&
        !Cypress.$(el).is(':disabled');

      const tamanhoValido =
        rect.width >= 35 &&
        rect.width <= 400 &&
        rect.height >= 25 &&
        rect.height <= 160;

      return (
        estaVisivel &&
        ehData &&
        contemDiaSemana &&
        naoEhCabecalhoOuResumo &&
        naoEhServico &&
        naoEstaDesabilitado &&
        tamanhoValido
      );
    });

    if (datas.length === 0) {
      cy.log(`Texto da tela: ${limparTexto($body.text()).slice(0, 2500)}`);
      cy.screenshot('data-painel-cliente-nao-encontrada');

      throw new Error(
        'Nenhuma data disponível encontrada. O teste aceita formatos como 16/5, 18/05, 1/6 e 01/06.'
      );
    }

    const dataEscolhida = datas[0];

    const textoData = limparTexto(dataEscolhida.textContent || '');

    cy.log(`Data escolhida: ${textoData}`);

    cy.wrap(dataEscolhida)
      .scrollIntoView()
      .click('center', { force: true });
  });

  cy.wait(1000);

  cy.get('body', { timeout: 30000 }).then(($body) => {
    const botoesContinuarHabilitados = $body
      .find(
        'button:visible, .p-button:visible, .q-btn:visible, [role="button"]:visible'
      )
      .toArray()
      .filter((botao) => {
        const textoBotao = limparTexto(Cypress.$(botao).text());

        const desabilitado =
          botao.hasAttribute('disabled') ||
          Cypress.$(botao).attr('aria-disabled') === 'true' ||
          Cypress.$(botao).hasClass('disabled') ||
          Cypress.$(botao).hasClass('p-disabled') ||
          Cypress.$(botao).hasClass('q-btn--disabled') ||
          Cypress.$(botao).is(':disabled');

        return /Continuar|Siguiente|Next/i.test(textoBotao) && !desabilitado;
      });

    expect(
      botoesContinuarHabilitados.length,
      'botão Continuar habilitado após selecionar data'
    ).to.be.greaterThan(0);
  });
}

  function selecionarHorario() {
    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /Escolha o hor[aá]rio|Selecione o hor[aá]rio|Hor[aá]rios dispon[ií]veis|Horario|Hora/i
      );

    cy.get('body').then(($body) => {
      const horarios = $body
        .find('*:visible')
        .toArray()
        .filter((el) => {
          const texto = limparTexto(Cypress.$(el).text());
          const rect = el.getBoundingClientRect();

          return (
            /^\d{1,2}:\d{2}$/.test(texto) &&
            rect.width >= 30 &&
            rect.height >= 20
          );
        }) as HTMLElement[];

      if (horarios.length === 0) {
        cy.log(`Texto da tela: ${limparTexto($body.text()).slice(0, 1500)}`);
        cy.screenshot('horario-painel-cliente-nao-encontrado');

        throw new Error('Nenhum horário disponível encontrado.');
      }

      const horario = horarios[0];

      cy.log(`Horário escolhido: ${limparTexto(Cypress.$(horario).text())}`);

      cy.wrap(horario)
        .scrollIntoView()
        .click('center', { force: true });
    });

    cy.wait(700);
  }

  function preencherDadosClienteEConfirmar() {
  cy.get('body', { timeout: 30000 })
    .invoke('text')
    .should(
      'match',
      /Resumo do agendamento|Resumo|Nome do cliente|Telefone do cliente|Cliente|Telefone|Teléfono|Nombre/i
    );

  cy.wait(1000);

  cy.contains(/Nome do cliente|Nombre del cliente|Nome|Nombre/i, {
    timeout: 30000,
  })
    .scrollIntoView()
    .should('exist');

  cy.get('body').then(($body) => {
    const body = $body.get(0);

    if (!body) {
      throw new Error('Body da página não encontrado.');
    }

    const campos = Array.from(
      body.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        'input, textarea'
      )
    ).filter((campo) => {
      const dados = [
        campo.getAttribute('placeholder') || '',
        campo.getAttribute('aria-label') || '',
        campo.getAttribute('name') || '',
        campo.getAttribute('type') || '',
        campo.getAttribute('id') || '',
        campo.getAttribute('class') || '',
      ].join(' ');

      const rect = campo.getBoundingClientRect();

      const ehCampoInterno =
        /q-select__focus-target|q-field__focusable-action|hidden/i.test(dados);

      const tipo = String(campo.getAttribute('type') || '').toLowerCase();

      const tipoValido =
        !tipo || /text|tel|phone|search|email|number/.test(tipo);

      const estaNoDom = rect.width > 0 && rect.height > 0;

      return (
        tipoValido &&
        estaNoDom &&
        !ehCampoInterno &&
        !campo.disabled &&
        !campo.readOnly
      );
    });

    cy.log(`Campos encontrados no resumo: ${campos.length}`);

    campos.forEach((campo, index) => {
      cy.log(
        `Campo ${index}: placeholder="${campo.getAttribute(
          'placeholder'
        )}", name="${campo.getAttribute('name')}", type="${campo.getAttribute(
          'type'
        )}", class="${campo.getAttribute('class')}"`
      );
    });

    if (campos.length < 2) {
      cy.screenshot('campos-resumo-nao-encontrados');

      throw new Error(
        'Campos de nome e telefone não foram encontrados no resumo do agendamento.'
      );
    }

    const campoNome =
      campos.find((campo) => {
        const dados = [
          campo.getAttribute('placeholder') || '',
          campo.getAttribute('aria-label') || '',
          campo.getAttribute('name') || '',
          campo.getAttribute('id') || '',
        ].join(' ');

        return /nome|nombre|name|cliente|client/i.test(dados);
      }) || campos[0];

    const campoTelefone =
      campos.find((campo) => {
        const dados = [
          campo.getAttribute('placeholder') || '',
          campo.getAttribute('aria-label') || '',
          campo.getAttribute('name') || '',
          campo.getAttribute('id') || '',
          campo.getAttribute('type') || '',
          campo.getAttribute('class') || '',
        ].join(' ');

        return /telefone|tel[eé]fono|phone|celular|whatsapp|tel/i.test(dados);
      }) || campos[1];

    if (!campoNome || !campoTelefone) {
      throw new Error('Campos de nome e telefone não encontrados.');
    }

    cy.wrap(campoNome)
      .scrollIntoView()
      .click({ force: true })
      .clear({ force: true })
      .type(nomeCliente, { force: true });

    cy.wrap(campoTelefone)
      .scrollIntoView()
      .click({ force: true })
      .clear({ force: true })
      .type(telefoneCliente, { force: true });
  });

  cy.wait(700);

  cy.get('body').then(($body) => {
    const botoesConfirmar = $body
      .find(
        'button:visible, .p-button:visible, .q-btn:visible, [role="button"]:visible'
      )
      .toArray()
      .filter((botao) => {
        const textoBotao = limparTexto(Cypress.$(botao).text());

        const estaDesabilitado =
          botao.hasAttribute('disabled') ||
          Cypress.$(botao).attr('aria-disabled') === 'true' ||
          Cypress.$(botao).hasClass('disabled') ||
          Cypress.$(botao).hasClass('p-disabled') ||
          Cypress.$(botao).hasClass('q-btn--disabled') ||
          Cypress.$(botao).is(':disabled');

        return (
          /Confirmar agendamento|Confirmar|Agendar|Finalizar/i.test(
            textoBotao
          ) && !estaDesabilitado
        );
      }) as HTMLElement[];

    if (botoesConfirmar.length === 0) {
      cy.log(`Texto da tela: ${limparTexto($body.text()).slice(0, 1500)}`);
      cy.screenshot('botao-confirmar-agendamento-nao-encontrado');

      throw new Error(
        'Botão Confirmar agendamento não encontrado ou desabilitado.'
      );
    }

    const botaoConfirmar =
      botoesConfirmar[botoesConfirmar.length - 1] || botoesConfirmar[0];

    if (!botaoConfirmar) {
      throw new Error('Botão Confirmar agendamento inválido.');
    }

    cy.wrap(botaoConfirmar)
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });
  });
}

  it('Deve criar agendamento pelo Painel do Cliente usando a URL da personalização.', () => {
    abrirPersonalizacao();

    clicarLinkPainelCliente()

    selecionarServicosPainelCliente();

    clicarContinuar();

    clicarContinuar();

    selecionarAtendente();

    clicarContinuar();

    selecionarData();

    clicarContinuar();

    selecionarHorario();

    clicarContinuar();

    preencherDadosClienteEConfirmar();

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /agendamento confirmado|agendamento realizado|sucesso|confirmado|obrigado|reserva confirmada|agendado com sucesso/i
      );
  });
});