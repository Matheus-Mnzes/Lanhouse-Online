"use strict";

let paginaAtual = 1;
let generoSelecionado = "";
let pesquisaSelecionada = "";
let jogosCatalogo = [];
let temporizadorPesquisa;
let catalogoCarregado = false;

let heroJogos = [];
let heroAtual = 0;
let heroTimer = null;
const HERO_INTERVAL = 6000;

const GENEROS = { "Adventure": "Aventura", "Arcade": "Arcade", "Card & Board Game": "Cartas e tabuleiro", "Fighting": "Luta", "Indie": "Independente", "Music": "Música", "Platform": "Plataforma", "Puzzle": "Quebra-cabeça", "Racing": "Corrida", "Role-playing (RPG)": "RPG", "Shooter": "Tiro", "Simulator": "Simulação", "Sport": "Esporte", "Strategy": "Estratégia", "Tactical": "Tático", "Visual Novel": "Visual novel" };
const USUARIOS_DEMO = [
    { usuario: "joao", senha: "1234", admin: false },
    { usuario: "maria", senha: "senha", admin: false },
    { usuario: "admin", senha: "admin", admin: true }
];
let modoCadastro = false;
let planoPendente = null;

const PLANOS = {
    Essencial: { descricao: "R$ 14,90 por mês · 1 dispositivo · Full HD" },
    Premium: { descricao: "R$ 29,90 por mês · 3 dispositivos · 4K" },
    Ultimate: { descricao: "R$ 49,90 por mês · 6 dispositivos · 8K" }
};

function obterPlanosCustom() {
    try {
        return JSON.parse(localStorage.getItem("ycloudPlanosCustom") || "{}");
    } catch {
        return {};
    }
}

function obterPlanosDisponiveis() {
    return { ...PLANOS, ...obterPlanosCustom() };
}

function obterUsuarioLogado() { return localStorage.getItem("ycloudUsuarioLogado"); }
function obterDadosUsuario(usuario = obterUsuarioLogado()) {
    if (!usuario) return null;
    const usuarios = obterTodosUsuarios();
    return usuarios.find(item => String(item.usuario).toLowerCase() === String(usuario).trim().toLowerCase()) || null;
}
function usuarioEhAdmin(usuario = obterUsuarioLogado()) {
    return Boolean(obterDadosUsuario(usuario)?.admin);
}
function normalizarTexto(valor) {
    return String(valor ?? "").trim();
}
function normalizarJogo(jogo) {
    if (!jogo || typeof jogo !== "object") return null;

    const nome = normalizarTexto(jogo.name ?? jogo.title ?? "");
    if (!nome) return null;

    return {
        ...jogo,
        id: jogo.id ?? jogo.slug ?? `${nome}-${Date.now()}`,
        name: nome,
        cover: jogo.cover && typeof jogo.cover === "object" ? jogo.cover : null,
        genres: Array.isArray(jogo.genres) ? jogo.genres.filter(Boolean) : []
    };
}
function normalizarListaJogos(valor) {
    if (Array.isArray(valor)) return valor.map(normalizarJogo).filter(Boolean);
    if (valor && typeof valor === "object") return [normalizarJogo(valor)].filter(Boolean);
    return [];
}
function formatarDataBrasileira(dataValor) {
    const valor = normalizarTexto(dataValor);
    if (!valor) return "Não informado";
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return valor;
    return new Intl.DateTimeFormat("pt-BR").format(data);
}
function obterUsuariosCadastrados() {
    try {
        const usuarios = JSON.parse(localStorage.getItem("ycloudUsuarios") || "[]");
        return usuarios.map(function(item) {
            if (typeof item === "object" && item) {
                return {
                    usuario: item.usuario,
                    senha: item.senha,
                    admin: Boolean(item.admin),
                    cpf: item.cpf || "",
                    dataNascimento: item.dataNascimento || "",
                    gmail: item.gmail || "",
                    telefone: item.telefone || "",
                    dataCadastro: item.dataCadastro || ""
                };
            }
            return { usuario: String(item), senha: "", admin: false, cpf: "", dataNascimento: "", gmail: "", telefone: "", dataCadastro: "" };
        });
    }
    catch { return []; }
}
function obterTodosUsuarios() {
    const mapa = new Map();

    USUARIOS_DEMO.forEach(function(item) {
        if (!item || !item.usuario) return;
        mapa.set(String(item.usuario).trim().toLowerCase(), {
            usuario: item.usuario,
            senha: item.senha || "",
            admin: Boolean(item.admin),
            cpf: item.cpf || "",
            dataNascimento: item.dataNascimento || "",
            gmail: item.gmail || "",
            telefone: item.telefone || "",
            dataCadastro: item.dataCadastro || ""
        });
    });

    obterUsuariosCadastrados().forEach(function(item) {
        if (!item || !item.usuario) return;
        mapa.set(String(item.usuario).trim().toLowerCase(), {
            usuario: item.usuario,
            senha: item.senha || "",
            admin: Boolean(item.admin),
            cpf: item.cpf || "",
            dataNascimento: item.dataNascimento || "",
            gmail: item.gmail || "",
            telefone: item.telefone || "",
            dataCadastro: item.dataCadastro || ""
        });
    });

    return Array.from(mapa.values());
}
function chaveBibliotecaDoUsuario(usuario = obterUsuarioLogado()) {
    return usuario ? `ycloudBiblioteca_${encodeURIComponent(usuario.toLowerCase())}` : null;
}
function chavePlanoDoUsuario(usuario = obterUsuarioLogado()) {
    return usuario ? `ycloudPlano_${encodeURIComponent(usuario.toLowerCase())}` : null;
}
function chaveFotoDoUsuario(usuario = obterUsuarioLogado()) {
    return usuario ? `ycloudFoto_${encodeURIComponent(usuario.toLowerCase())}` : null;
}
function obterJogosCustom() {
    try {
        return normalizarListaJogos(JSON.parse(localStorage.getItem("ycloudJogosCustom") || "[]"));
    } catch {
        return [];
    }
}

function obterJogosCatalogoComCustom(jogos = []) {
    const custom = obterJogosCustom();
    return [...custom, ...normalizarListaJogos(jogos)];
}

function obterPlanoDoUsuario(usuario = obterUsuarioLogado()) {
    const chave = chavePlanoDoUsuario(usuario);
    const plano = chave ? localStorage.getItem(chave) : null;
    return obterPlanosDisponiveis()[plano] ? plano : null;
}
function atualizarAreaPlano() {
    const plano = obterPlanoDoUsuario();
    const titulo = document.getElementById("contaPlanoTitulo");
    const descricao = document.getElementById("contaPlanoDescricao");
    const botaoCancelar = document.getElementById("cancelarPlanoBotao");
    const planosDisponiveis = obterPlanosDisponiveis();

    if (titulo) titulo.textContent = plano ? `Plano ${plano}` : "Plano não selecionado";
    if (descricao) descricao.textContent = plano ? planosDisponiveis[plano].descricao : "Escolha um plano para sua conta.";
    if (botaoCancelar) botaoCancelar.hidden = !plano;

    document.querySelectorAll(".plano").forEach(function(cartao) {
        const selecionado = cartao.dataset.plano === plano;
        cartao.classList.toggle("plano-selecionado", selecionado);
        const botaoPlano = cartao.querySelector(".plano-btn");
        if (botaoPlano) {
            botaoPlano.textContent = selecionado ? "Plano atual" : "Escolher plano";
            botaoPlano.setAttribute("aria-pressed", String(selecionado));
        }
    });
}
function renderizarPlanos() {
    const containers = document.querySelectorAll("#planosGrid, #contaPlanos");
    if (!containers.length) return;

    const planos = Object.entries(obterPlanosDisponiveis());
    const planoAtual = obterPlanoDoUsuario();

    containers.forEach(function(container) {
        const cards = planos.map(function([nome, info]) {
            const selecionado = nome === planoAtual;
            const destaque = nome === "Premium" ? " plano-destaque" : "";
            const resumo = info.descricao || "Plano disponível";
            const preco = resumo.includes("R$") ? resumo.split(" · ")[0] : "R$ 0,00";
            const precoFormatado = preco.includes("R$") ? preco : `R$ ${Number(info.preco || 0).toFixed(2).replace(".", ",")}`;
            const html = `
                <article class="plano plano-conta${destaque}${selecionado ? " plano-selecionado" : ""}" data-plano="${nome}">
                    <div class="plano-nome">${nome}</div>
                    <div class="plano-preco">${precoFormatado}<small>/mês</small></div>
                    <p class="plano-resumo">${resumo.replace(/^R\$\s*[^\s]+\s*por\s*mês\s*·\s*/i, "").replace(/\s*\·\s*/g, " · ")}</p>
                    <button class="plano-btn${nome === "Premium" ? " plano-btn-destaque" : ""}" type="button" data-plano="${nome}">${selecionado ? "Plano atual" : "Escolher plano"}</button>
                </article>
            `;
            return html;
        }).join("");

        container.innerHTML = cards;
        container.querySelectorAll(".plano-btn").forEach(function(botao) {
            botao.addEventListener("click", function() {
                selecionarPlano(botao.dataset.plano);
            });
        });
    });
}

function atualizarPerfil() {
    const usuario = obterUsuarioLogado();
    const nome = document.getElementById("perfilUsuario");
    const foto = document.getElementById("perfilFoto");
    const iniciais = document.getElementById("perfilIniciais");
    const fotoCabecalho = document.getElementById("headerAvatarFoto");
    const iniciaisCabecalho = document.getElementById("headerAvatarIniciais");
    const imagem = usuario ? localStorage.getItem(chaveFotoDoUsuario(usuario)) : null;

    if (nome) nome.textContent = usuario || "Jogador";
    if (iniciais) iniciais.textContent = usuario ? usuario.slice(0, 2).toUpperCase() : "Y";
    if (foto) {
        foto.hidden = !imagem;
        foto.src = imagem || "";
    }
    if (iniciais) iniciais.hidden = Boolean(imagem);
    if (fotoCabecalho) {
        fotoCabecalho.hidden = !imagem;
        fotoCabecalho.src = imagem || "";
    }
    if (iniciaisCabecalho) {
        iniciaisCabecalho.textContent = usuario ? usuario.slice(0, 2).toUpperCase() : "Y";
        iniciaisCabecalho.hidden = Boolean(imagem);
    }
    atualizarDadosConta();
}

function atualizarDadosConta() {
    const container = document.getElementById("contaDadosGrid");
    if (!container) return;

    const usuario = obterDadosUsuario();
    const dados = usuario || {};
    const itens = [
        ["CPF", dados.cpf || "Não informado"],
        ["Data de nascimento", formatarDataBrasileira(dados.dataNascimento)],
        ["Gmail", dados.gmail || "Não informado"],
        ["Telefone", dados.telefone || "Não informado"],
        ["Data de cadastro", formatarDataBrasileira(dados.dataCadastro)]
    ];

    container.innerHTML = itens.map(function([label, valor]) {
        return `
            <div class="conta-dado-item">
                <span>${label}</span>
                <strong>${valor}</strong>
            </div>
        `;
    }).join("");
}
function abrirContaPeloAvatar() {
    if (obterUsuarioLogado()) mostrarPainel("conta");
    else abrirLogin();
}
function selecionarPlano(plano) {
    const planosDisponiveis = obterPlanosDisponiveis();
    if (!planosDisponiveis[plano]) return;
    if (!obterUsuarioLogado()) {
        planoPendente = plano;
        abrirLogin();
        mostrarToast("Entre ou crie uma conta para escolher um plano.");
        return;
    }
    localStorage.setItem(chavePlanoDoUsuario(), plano);
    planoPendente = null;
    atualizarAreaPlano();
    renderizarPlanos();
    mostrarToast(`Plano ${plano} selecionado para sua conta.`);
}
function adicionarPlanoCustom(evento) {
    evento.preventDefault();
    const nome = document.getElementById("novoPlanoNome")?.value.trim();
    const preco = Number(document.getElementById("novoPlanoPreco")?.value || 0);
    const descricao = document.getElementById("novoPlanoDescricao")?.value.trim();

    if (!nome || !descricao || Number.isNaN(preco) || preco < 0) {
        mostrarToast("Preencha nome, preço e descrição do plano.");
        return;
    }

    const planos = obterPlanosCustom();
    const chave = nome;
    planos[chave] = {
        descricao: `R$ ${preco.toFixed(2).replace(".", ",")} por mês · ${descricao}`,
        preco: preco
    };
    localStorage.setItem("ycloudPlanosCustom", JSON.stringify(planos));
    document.getElementById("formNovoPlano")?.reset();
    renderizarPlanos();
    atualizarAreaPlano();
    mostrarToast(`Plano "${chave}" cadastrado.`);
}

function adicionarJogoCustom(evento) {
    evento.preventDefault();
    const nome = document.getElementById("novoJogoNome")?.value.trim();
    const genero = document.getElementById("novoJogoGenero")?.value.trim() || "Indie";
    const imagem = document.getElementById("novoJogoImagem")?.value.trim();

    if (!nome) {
        mostrarToast("Informe o nome do jogo.");
        return;
    }

    const jogos = obterJogosCustom();
    jogos.push({
        id: `custom-${Date.now()}`,
        name: nome,
        genres: [{ name: genero }],
        cover: imagem ? { url: imagem } : null
    });
    localStorage.setItem("ycloudJogosCustom", JSON.stringify(jogos));
    document.getElementById("formNovoJogo")?.reset();
    carregarCatalogo(1);
    renderizarBiblioteca();
    mostrarToast(`Jogo "${nome}" adicionado ao catálogo.`);
}

function cancelarPlano() {
    const plano = obterPlanoDoUsuario();
    if (!plano) return;
    if (!window.confirm(`Cancelar o plano ${plano}? Você perderá os benefícios ao fim do período atual.`)) return;
    localStorage.removeItem(chavePlanoDoUsuario());
    atualizarAreaPlano();
    renderizarPlanos();
    mostrarToast("Seu plano foi cancelado.");
}
function salvarFotoPerfil(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    if (!obterUsuarioLogado()) return;
    if (arquivo.size > 2 * 1024 * 1024) {
        mostrarToast("Escolha uma imagem de até 2 MB.");
        evento.target.value = "";
        return;
    }
    const leitor = new FileReader();
    leitor.onload = function() {
        try {
            localStorage.setItem(chaveFotoDoUsuario(), leitor.result);
            atualizarPerfil();
            mostrarToast("Foto de perfil atualizada.");
        } catch {
            mostrarToast("Não foi possível salvar essa imagem. Tente uma menor.");
        }
    };
    leitor.readAsDataURL(arquivo);
    evento.target.value = "";
}
function aplicarPlanoPendente() {
    if (!planoPendente) {
        atualizarAreaPlano();
        return;
    }
    const plano = planoPendente;
    planoPendente = null;
    selecionarPlano(plano);
}
function migrarBibliotecaLegada() {
    const chave = chaveBibliotecaDoUsuario();
    const bibliotecaAntiga = localStorage.getItem("biblioteca") || localStorage.getItem("favoritos");
    if (!chave || !bibliotecaAntiga || localStorage.getItem(chave)) return;

    try {
        const biblioteca = normalizarListaJogos(JSON.parse(bibliotecaAntiga));
        if (!biblioteca.length) return;
        localStorage.setItem(chave, JSON.stringify(biblioteca));
    } catch {
        return;
    }

    localStorage.removeItem("biblioteca");
    localStorage.removeItem("favoritos");
}
function atualizarBotaoLogin() {
    const botao = document.getElementById("loginBtn");
    if (!botao) return;
    const usuario = obterUsuarioLogado();
    botao.textContent = usuario ? `CONTA (${usuario})` : "ENTRAR";
    botao.onclick = usuario ? function() { mostrarPainel("conta"); } : abrirLogin;
    atualizarMenuAdmin();
}

function atualizarMenuAdmin() {
    const link = document.getElementById("menuAdmin");
    if (!link) return;
    link.hidden = !usuarioEhAdmin();
}
function abrirLogin() {
    const modal = document.getElementById("loginModal");
    if (!modal) return;
    modal.classList.add("aberto");
    modal.setAttribute("aria-hidden", "false");
    configurarModoLogin(false);
    document.getElementById("loginUsuario")?.focus();
}
function configurarModoLogin(cadastro) {
    modoCadastro = cadastro;
    const titulo = document.getElementById("loginTitulo");
    const ajuda = document.getElementById("loginAjuda");
    const enviar = document.querySelector(".login-enviar");
    const alternar = document.getElementById("loginAlternar");
    const tipoContaWrap = document.getElementById("tipoContaWrap");
    const dadosCadastroWrap = document.getElementById("dadosCadastroWrap");
    const camposCadastro = [
        document.getElementById("cadastroCpf"),
        document.getElementById("cadastroNascimento"),
        document.getElementById("cadastroGmail"),
        document.getElementById("cadastroTelefone")
    ];

    if (titulo) titulo.textContent = cadastro ? "Crie sua conta" : "Entre na sua conta";
    if (ajuda) ajuda.innerHTML = cadastro ? "Escolha um usuário, uma senha, o tipo de conta e os dados pessoais." : "Para testar: <strong>joao / 1234</strong>, <strong>maria / senha</strong> ou <strong>admin / admin</strong>.";
    if (enviar) enviar.textContent = cadastro ? "Criar conta" : "Entrar";
    if (alternar) alternar.textContent = cadastro ? "Já tenho uma conta" : "Criar uma conta nova";
    if (tipoContaWrap) {
        tipoContaWrap.hidden = !cadastro;
        tipoContaWrap.style.display = cadastro ? "" : "none";
    }
    if (dadosCadastroWrap) {
        dadosCadastroWrap.hidden = !cadastro;
        dadosCadastroWrap.style.display = cadastro ? "" : "none";
    }

    camposCadastro.forEach(function(campo) {
        if (!campo) return;
        campo.disabled = !cadastro;
        campo.required = cadastro;
        campo.setAttribute("aria-hidden", cadastro ? "false" : "true");
    });

    document.getElementById("loginForm")?.reset();
    document.getElementById("loginErro").textContent = "";
}
function alternarModoLogin() { configurarModoLogin(!modoCadastro); }
function fecharLogin() {
    const modal = document.getElementById("loginModal");
    if (!modal) return;
    modal.classList.remove("aberto");
    modal.setAttribute("aria-hidden", "true");
    document.getElementById("loginErro").textContent = "";
}
function limparMascara(valor, tipo) {
    if (!valor) return "";
    const texto = String(valor).replace(/\D/g, "");
    if (tipo === "cpf") return texto.slice(0, 11);
    if (tipo === "telefone") return texto.slice(0, 11);
    return texto;
}

function formatarMascara(valor, tipo) {
    const texto = limparMascara(valor, tipo);
    if (tipo === "cpf") {
        if (texto.length <= 3) return texto;
        if (texto.length <= 6) return `${texto.slice(0, 3)}.${texto.slice(3)}`;
        if (texto.length <= 9) return `${texto.slice(0, 3)}.${texto.slice(3, 6)}.${texto.slice(6)}`;
        return `${texto.slice(0, 3)}.${texto.slice(3, 6)}.${texto.slice(6, 9)}-${texto.slice(9, 11)}`;
    }
    if (tipo === "telefone") {
        if (texto.length <= 2) return texto;
        if (texto.length <= 7) return `(${texto.slice(0, 2)}) ${texto.slice(2)}`;
        return `(${texto.slice(0, 2)}) ${texto.slice(2, 7)}-${texto.slice(7, 11)}`;
    }
    return texto;
}

function aplicarMascaraCampo(campoId, tipo) {
    const campo = document.getElementById(campoId);
    if (!campo) return;

    campo.addEventListener("input", function() {
        campo.value = formatarMascara(campo.value, tipo);
    });
}

function obterDadosCadastroFormulario() {
    return {
        cpf: limparMascara(document.getElementById("cadastroCpf")?.value, "cpf"),
        dataNascimento: normalizarTexto(document.getElementById("cadastroNascimento")?.value),
        gmail: normalizarTexto(document.getElementById("cadastroGmail")?.value),
        telefone: limparMascara(document.getElementById("cadastroTelefone")?.value, "telefone")
    };
}

function validarDadosCadastro(dados) {
    if (!dados.cpf || dados.cpf.length !== 11) {
        return "Informe um CPF válido com 11 dígitos.";
    }
    if (!dados.dataNascimento) {
        return "Informe a data de nascimento.";
    }
    if (!dados.gmail || !/^[^\s@]+@gmail\.com$/i.test(dados.gmail)) {
        return "Informe um Gmail válido no formato nome@gmail.com.";
    }
    if (!dados.telefone || dados.telefone.length !== 11) {
        return "Informe um telefone válido com 11 dígitos.";
    }
    return "";
}

function fazerLogin(evento) {
    evento.preventDefault();
    const usuario = document.getElementById("loginUsuario").value.trim();
    const senha = document.getElementById("loginSenha").value;
    const tipoConta = document.querySelector('input[name="tipoConta"]:checked')?.value || "usuario";
    const usuarios = obterTodosUsuarios();
    const valido = usuarios.some(item => item.usuario === usuario && item.senha === senha);
    const erro = document.getElementById("loginErro");
    if (modoCadastro) {
        if (usuario.length < 3) { erro.textContent = "O usuário deve ter ao menos 3 caracteres."; return; }
        if (senha.length < 3) { erro.textContent = "A senha deve ter ao menos 3 caracteres."; return; }
        if (usuarios.some(item => item.usuario.toLowerCase() === usuario.toLowerCase())) {
            erro.textContent = "Este nome de usuário já existe.";
            return;
        }

        const dadosCadastro = obterDadosCadastroFormulario();
        const erroCadastro = validarDadosCadastro(dadosCadastro);
        if (erroCadastro) {
            erro.textContent = erroCadastro;
            return;
        }

        const cadastrados = obterUsuariosCadastrados();
        cadastrados.push({
            usuario,
            senha,
            admin: tipoConta === "admin",
            cpf: dadosCadastro.cpf,
            dataNascimento: dadosCadastro.dataNascimento,
            gmail: dadosCadastro.gmail,
            telefone: dadosCadastro.telefone,
            dataCadastro: new Date().toISOString()
        });
        localStorage.setItem("ycloudUsuarios", JSON.stringify(cadastrados));
        localStorage.setItem("ycloudUsuarioLogado", usuario);
        migrarBibliotecaLegada();
        fecharLogin();
        atualizarBotaoLogin();
        atualizarPerfil();
        aplicarPlanoPendente();
        mostrarToast(`Conta criada. Bem-vindo, ${usuario}!`);
        return;
    }
    if (!valido) {
        erro.textContent = "Usuário ou senha inválidos.";
        return;
    }
    const dadosUsuario = obterDadosUsuario(usuario);
    if (!dadosUsuario) {
        erro.textContent = "Usuário não encontrado.";
        return;
    }
    localStorage.setItem("ycloudUsuarioLogado", usuario);
    migrarBibliotecaLegada();
    fecharLogin();
    atualizarBotaoLogin();
    atualizarPerfil();
    aplicarPlanoPendente();
    mostrarToast(`Bem-vindo, ${usuario}!`);
}
function sair() {
    localStorage.removeItem("ycloudUsuarioLogado");
    atualizarBotaoLogin();
    atualizarAreaPlano();
    atualizarPerfil();
    mostrarPainel("inicio");
    mostrarToast("Você saiu da conta.");
}

function mostrarPainel(id) {
    if ((id === "biblioteca" || id === "conta" || id === "admin") && !obterUsuarioLogado()) {
        fecharMenu();
        abrirLogin();
        mostrarToast(id === "admin" ? "Entre com uma conta de administrador." : "Entre para acessar sua biblioteca.");
        return;
    }
    if (id === "admin" && !usuarioEhAdmin()) {
        fecharMenu();
        mostrarToast("Acesso restrito a administradores.");
        return;
    }
    const alvo = id === "planos" ? "inicio" : id;
    document.querySelectorAll(".painel").forEach(function(painel) {
        const ativo = painel.id === `painel-${alvo}`;
        painel.classList.toggle("painel-oculto", !ativo);
        painel.classList.toggle("ativo", ativo);
    });

    const header = document.getElementById("header");
    if (header && alvo !== "inicio") {
        header.classList.remove("on-hero");
    }

    if (alvo === "jogos" && !catalogoCarregado) {
        carregarCatalogo(1);
    }

    if (alvo === "biblioteca") {
        renderizarBiblioteca();
    }
    if (alvo === "conta") {
        atualizarAreaPlano();
        atualizarPerfil();
    }

    if (id === "planos") {
        document.getElementById("painel-planos")?.scrollIntoView({ behavior: "smooth" });
    } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

function toggleMenu() { document.body.classList.contains("menu-aberto") ? fecharMenu() : abrirMenu(); }
function abrirMenu() { document.body.classList.add("menu-aberto"); document.getElementById("menuOverlay")?.setAttribute("aria-hidden", "false"); }
function fecharMenu() { document.body.classList.remove("menu-aberto"); document.getElementById("menuOverlay")?.setAttribute("aria-hidden", "true"); }
function fecharMenuE(id) { fecharMenu(); mostrarPainel(id); }


function mostrarToast(texto) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    clearTimeout(toast._timer);
    toast.textContent = texto;
    toast.classList.add("visivel");
    toast._timer = setTimeout(function() { toast.classList.remove("visivel"); }, 2800);
}

function obterBiblioteca() {
    const chave = chaveBibliotecaDoUsuario();
    if (!chave) return [];
    try {
        const dados = JSON.parse(localStorage.getItem(chave) || "[]");
        return normalizarListaJogos(dados);
    } catch {
        return [];
    }
}
function jogoEstaNaBiblioteca(id) {
    return obterBiblioteca().some(function(jogo) { return String(jogo.id) === String(id); });
}
function alternarBiblioteca(jogo, botao) {
    if (!obterUsuarioLogado()) {
        abrirLogin();
        mostrarToast("Entre para salvar jogos na biblioteca.");
        return;
    }

    const jogoNormalizado = normalizarJogo(jogo) || { id: `jogo-${Date.now()}`, name: "Jogo", genres: [], cover: null };
    const biblioteca = obterBiblioteca();
    const indice = biblioteca.findIndex(function(item) { return String(item.id) === String(jogoNormalizado.id); });
    const adicionou = indice < 0;

    if (indice >= 0) {
        biblioteca.splice(indice, 1);
        mostrarToast(`${jogoNormalizado.name} removido da biblioteca`);
    } else {
        biblioteca.push(jogoNormalizado);
        mostrarToast(`"${jogoNormalizado.name}" adicionado a biblioteca`);
    }

    localStorage.setItem(chaveBibliotecaDoUsuario(), JSON.stringify(biblioteca));

    // Atualiza todos os botões que representam este jogo na página
    try {
        const selector = `.btn-bib[data-jogo-id="${String(jogoNormalizado.id)}"]`;
        document.querySelectorAll(selector).forEach(function(b) {
            b.classList.toggle('salvo', adicionou);
            b.textContent = adicionou ? 'Salvo' : 'Biblioteca';
        });
    } catch (e) { /* não crítico */ }

    // Atualiza a visualização da biblioteca
    renderizarBiblioteca();
}


// ── Carregar e renderizar catálogo ──────────────────────────────
async function carregarCatalogo(pagina) {
    const botaoAnterior = document.getElementById("paginaAnterior");
    const botaoProxima = document.getElementById("paginaProxima");
    const indicador = document.getElementById("paginaIndicador");
    const catalogo  = document.getElementById("catalogo");

    if (botaoAnterior) botaoAnterior.disabled = true;
    if (botaoProxima) botaoProxima.disabled = true;
    if (indicador) indicador.textContent = "Carregando...";

    if (catalogo) {
        catalogo.replaceChildren(...Array.from({ length: 6 }, () => {
            const sk = document.createElement("div");
            sk.className = "skel";
            return sk;
        }));
    }

    try {
        const dados = await buscarJogos(pagina, generoSelecionado, pesquisaSelecionada);
        if (!dados) return;

        const jogos = dados.jogos || [];
        const jogosComCustom = obterJogosCatalogoComCustom(jogos);
        jogosCatalogo   = jogosComCustom;
        paginaAtual     = pagina;
        catalogoCarregado = true;
        renderizarCatalogo();
        iniciarAnimacoesScroll();

        if (pagina === 1 && !generoSelecionado && !pesquisaSelecionada) {
            preencherCatalogo(
                document.getElementById("jogos-populares"),
                jogosComCustom.slice(0, 4)
            );
            montarHero(jogosComCustom);
            iniciarAnimacoesScroll();
        }

        if (botaoAnterior) botaoAnterior.disabled = pagina === 1;
        if (botaoProxima) botaoProxima.disabled = jogos.length < (dados.limite ?? 15);
        if (indicador) indicador.textContent = `Página ${pagina}`;

    } catch (erro) {
        mostrarErro(catalogo, erro.message || "Não foi possível carregar os jogos.");
        if (botaoAnterior) botaoAnterior.disabled = pagina === 1;
        if (botaoProxima) botaoProxima.disabled = false;
        if (indicador) indicador.textContent = `Página ${pagina}`;
    }
}

function renderizarCatalogo() { preencherCatalogo(document.getElementById("catalogo"), jogosCatalogo, "Nenhum jogo encontrado."); }
function preencherCatalogo(container, jogos, mensagem = "", naBiblioteca = false) {
    if (!container) return;
    container.replaceChildren();
    if (!jogos.length) { if (mensagem) mostrarErro(container, mensagem); return; }
    jogos.forEach(function(jogo) { container.appendChild(criarCardJogo(jogo, naBiblioteca)); });
}
function criarCardJogo(jogo, naBiblioteca) {
    const jogoNormalizado = normalizarJogo(jogo) || {
        id: `fallback-${Date.now()}`,
        name: "Jogo indisponível",
        cover: null,
        genres: []
    };

    const card = document.createElement("article"); card.className = "jogo-card scroll-card";
    const capa = document.createElement("div"); capa.className = "jogo-capa";
    const temCapa = Boolean(jogoNormalizado.cover?.image_id || jogoNormalizado.cover?.url);
    if (temCapa) {
        const imagem = document.createElement("img");
        imagem.src = urlCapaJogo(jogoNormalizado);
        imagem.alt = `Capa de ${jogoNormalizado.name}`;
        imagem.loading = "lazy";
        capa.appendChild(imagem);
    } else {
        capa.textContent = "Y";
    }
    const info = document.createElement("div"); info.className = "jogo-info";
    const titulo = document.createElement("h3"); titulo.className = "jogo-titulo"; titulo.textContent = jogoNormalizado.name;
    const genero = document.createElement("p"); genero.className = "jogo-genero"; genero.textContent = textoGeneros(jogoNormalizado);
    const acoes = document.createElement("div"); acoes.className = "jogo-acoes";
    if (naBiblioteca) { const jogar = document.createElement("button"); jogar.className = "btn-jogar"; jogar.textContent = "Jogar"; jogar.addEventListener("click", function() { mostrarToast(`Abrindo ${jogoNormalizado.name}...`); }); acoes.appendChild(jogar); }
    const biblioteca = document.createElement("button");
    biblioteca.className = "btn-bib" + (jogoEstaNaBiblioteca(jogoNormalizado.id) ? " salvo" : "");
    biblioteca.textContent = jogoEstaNaBiblioteca(jogoNormalizado.id) ? "Salvo" : "Biblioteca";
    biblioteca.dataset.jogoId = String(jogoNormalizado.id);
    biblioteca.addEventListener("click", function(evt) {
        alternarBiblioteca(jogoNormalizado, evt.currentTarget);
    });
    acoes.appendChild(biblioteca);
    info.append(titulo, genero, acoes);
    card.dataset.jogoId = String(jogoNormalizado.id);
    card.append(capa, info); return card;
}
function mostrarErro(container, texto) { if (!container) return; const estado = document.createElement("p"); estado.className = "estado-texto"; estado.textContent = texto; container.replaceChildren(estado); }

function renderizarBiblioteca() {
    const pesquisa = document.getElementById("pesquisaBiblioteca")?.value.trim().toLowerCase() || "";
    const todos = obterBiblioteca();

    const jogos = todos.filter(function(jogo) {
        return normalizarTexto(jogo.name ?? "").toLowerCase().includes(pesquisa);
    });

    preencherCatalogo(
        document.getElementById("catalogoBiblioteca"),
        jogos,
        "",
        true
    );

    const vazio = document.getElementById("bibVazio");

    if (vazio) {
        vazio.hidden = todos.length > 0;
        vazio.style.display = todos.length > 0 ? "none" : "";
    }
}

// ── Filtro de gêneros ─────────────────────────────────────────────
async function carregarFiltroGeneros() {
    const filtro = document.getElementById("filtroGenero");
    if (!filtro) return;

    try {
        const generos = await buscarGeneros();
        filtro.replaceChildren(new Option("Todos os gêneros", ""));
        generos.forEach(g => filtro.add(new Option(GENEROS[g.name] || g.name, g.id)));
        filtro.disabled = false;
    } catch {
        filtro.replaceChildren(new Option("Erro ao carregar gêneros", ""));
    }
}


// ── Jogar ──────────────────────────────────────────────────────────
function jogar(nomeJogo) {
    mostrarToast(`Abrindo ${nomeJogo}…`);
}

function urlCapaJogo(jogo, tamanho = "t_cover_big") {
    if (jogo.cover?.url) return jogo.cover.url;
    if (!jogo.cover?.image_id) return null;
    return `https://images.igdb.com/igdb/image/upload/${tamanho}/${jogo.cover.image_id}.jpg`;
}

function textoGeneros(jogo) {
    if (!jogo.genres?.length) return "Gênero não informado";
    return jogo.genres
        .slice(0, 2)
        .map(function(item) { return GENEROS[item.name] || item.name; })
        .join(" · ");
}

function montarHero(jogos) {
    const slidesWrap = document.getElementById("slides");
    const progressWrap = document.getElementById("progress");
    if (!slidesWrap || !progressWrap) return;

    heroJogos = jogos.filter(function(j) { return j.cover?.image_id; }).slice(0, 4);
    if (!heroJogos.length) {
        document.getElementById("gameTitle").textContent = "Catálogo indisponível";
        document.getElementById("gameGenre").textContent = "Verifique a API";
        return;
    }

    slidesWrap.replaceChildren();
    progressWrap.replaceChildren();

    heroJogos.forEach(function(jogo, indice) {
        const slide = document.createElement("div");
        slide.className = "slide" + (indice === 0 ? " active" : "");
        const img = document.createElement("img");
        img.src = urlCapaJogo(jogo, "t_1080p");
        img.alt = jogo.name;
        slide.appendChild(img);
        slidesWrap.appendChild(slide);

        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("aria-label", `Slide ${indice + 1}`);
        if (indice === 0) btn.classList.add("active");
        btn.addEventListener("click", function() {
            irParaHero(indice);
            reiniciarTimerHero();
        });
        progressWrap.appendChild(btn);
    });

    heroAtual = 0;
    atualizarInfoHero();
    reiniciarTimerHero();
}

function atualizarInfoHero() {
    const jogo = heroJogos[heroAtual];
    const titleEl = document.getElementById("gameTitle");
    const genreEl = document.getElementById("gameGenre");
    const countEl = document.getElementById("slideCount");
    if (!jogo || !titleEl || !genreEl || !countEl) return;

    titleEl.textContent = jogo.name;
    genreEl.textContent = textoGeneros(jogo);
    countEl.textContent =
        String(heroAtual + 1).padStart(2, "0") + " / " + String(heroJogos.length).padStart(2, "0");
}

function irParaHero(indice) {
    const slides = [...document.querySelectorAll("#slides .slide")];
    const buttons = [...document.querySelectorAll("#progress button")];
    const gameBox = document.getElementById("heroGame");
    if (!slides.length || indice === heroAtual) return;

    slides[heroAtual].classList.remove("active");
    buttons[heroAtual]?.classList.remove("active");
    heroAtual = (indice + slides.length) % slides.length;
    slides[heroAtual].classList.add("active");

    if (buttons[heroAtual]) {
        void buttons[heroAtual].offsetWidth;
        buttons[heroAtual].classList.add("active");
    }

    if (gameBox) {
        gameBox.classList.add("fading");
        setTimeout(function() {
            atualizarInfoHero();
            gameBox.classList.remove("fading");
        }, 350);
    }
}

function proximoHero() {
    irParaHero(heroAtual + 1);
}

function reiniciarTimerHero() {
    clearInterval(heroTimer);
    if (heroJogos.length > 1) {
        heroTimer = setInterval(proximoHero, HERO_INTERVAL);
    }
}

function iniciarParallaxHero() {
    const slidesWrap = document.getElementById("slides");
    const heroContent = document.getElementById("heroContent");
    const hero = document.getElementById("hero");
    const header = document.getElementById("header");
    const painelInicio = document.getElementById("painel-inicio");
    if (!slidesWrap || !hero || !header) return;

    let mx = 0, my = 0, tx = 0, ty = 0;

    window.addEventListener("mousemove", function(e) {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function animate() {
        tx += (mx - tx) * 0.05;
        ty += (my - ty) * 0.05;
        slidesWrap.style.transform = `translate3d(${tx * -22}px, ${ty * -14}px, 0) scale(1.06)`;

        const sc = window.scrollY;
        const inicioVisivel = painelInicio && !painelInicio.classList.contains("painel-oculto");

        if (inicioVisivel && sc < hero.offsetHeight) {
            slidesWrap.style.top = sc * 0.35 + "px";
            if (heroContent) {
                heroContent.style.transform = `translateY(${sc * 0.18}px)`;
                heroContent.style.opacity = String(Math.max(0, 1 - sc / (hero.offsetHeight * 0.65)));
            }
            header.classList.add("on-hero");
        } else if (inicioVisivel) {
            header.classList.remove("on-hero");
        }

        requestAnimationFrame(animate);
    }

    animate();
}

function iniciarAnimacoesScroll() {
    const cards = document.querySelectorAll(".featured .jogo-card, .featured .game-card, .jogo-card.scroll-card");
    if (!cards.length) return;

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry, i) {
            if (entry.isIntersecting) {
                setTimeout(function() {
                    entry.target.classList.add("visible");
                }, i * 90);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    cards.forEach(function(card) {
        if (!card.classList.contains("visible")) {
            observer.observe(card);
        }
    });
}

// ── Modo Escuro ──────────────────────────────────────────────────────────

function atualizarBotaoTema() {
    const botao = document.getElementById("btnTema");
    if (!botao) return;

    const modoEscuro = document.body.classList.contains("dark-mode");

    botao.textContent = modoEscuro ? "☀" : "☾";
    botao.setAttribute(
        "aria-label",
        modoEscuro ? "Ativar modo claro" : "Ativar modo escuro"
    );
}

function alternarTema() {
    const modoEscuro = document.body.classList.toggle("dark-mode");
    document.documentElement.style.colorScheme = modoEscuro ? "dark" : "light";

    localStorage.setItem(
        "ycloudTema",
        modoEscuro ? "escuro" : "claro"
    );

    atualizarBotaoTema();
}

// ── Init ───────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const temaSalvo = localStorage.getItem("ycloudTema");
    const temaDoSistema = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (temaSalvo === "escuro" || (!temaSalvo && temaDoSistema)) {
        document.body.classList.add("dark-mode");
    }

    document.documentElement.style.colorScheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
    atualizarBotaoTema();

    document.getElementById("btnTema")?.addEventListener("click", alternarTema);

    atualizarBotaoLogin();
    atualizarAreaPlano();
    renderizarPlanos();
    atualizarPerfil();

    carregarCatalogo(1);
    carregarFiltroGeneros();
    renderizarBiblioteca();

    document.getElementById("paginaAnterior")?.addEventListener("click", () => carregarCatalogo(paginaAtual - 1));
    document.getElementById("paginaProxima")?.addEventListener("click", () => carregarCatalogo(paginaAtual + 1));

    document.getElementById("filtroGenero")?.addEventListener("change", e => {
        generoSelecionado = e.target.value;
        carregarCatalogo(1);
    });

    document.getElementById("pesquisaJogos")?.addEventListener("input", e => {
        clearTimeout(temporizadorPesquisa);
        temporizadorPesquisa = setTimeout(() => {
            pesquisaSelecionada = e.target.value.trim();
            carregarCatalogo(1);
        }, 350);
    });

    document.getElementById("pesquisaBiblioteca")?.addEventListener("input", renderizarBiblioteca);
    aplicarMascaraCampo("cadastroCpf", "cpf");
    aplicarMascaraCampo("cadastroTelefone", "telefone");

    document.getElementById("loginForm")?.addEventListener("submit", fazerLogin);
    document.getElementById("inputFotoPerfil")?.addEventListener("change", salvarFotoPerfil);
    document.getElementById("formNovoJogo")?.addEventListener("submit", adicionarJogoCustom);
    document.getElementById("formNovoPlano")?.addEventListener("submit", adicionarPlanoCustom);
    document.querySelectorAll(".plano-btn").forEach(function(botao) {
        botao.addEventListener("click", function() { selecionarPlano(botao.dataset.plano); });
    });

    // Fecha o menu com a tecla Esc
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") { fecharMenu(); fecharLogin(); }
    });

    iniciarParallaxHero();
    iniciarAnimacoesScroll();
});
