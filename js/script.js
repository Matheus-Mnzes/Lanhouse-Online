"use strict";

let paginaAtual = 1;
let generoSelecionado = "";
let pesquisaSelecionada = "";
let jogosCatalogo = [];
let temporizadorPesquisa;
let catalogoCarregado = false;

const GENEROS = { "Adventure": "Aventura", "Arcade": "Arcade", "Card & Board Game": "Cartas e tabuleiro", "Fighting": "Luta", "Indie": "Independente", "Music": "Música", "Platform": "Plataforma", "Puzzle": "Quebra-cabeça", "Racing": "Corrida", "Role-playing (RPG)": "RPG", "Shooter": "Tiro", "Simulator": "Simulação", "Sport": "Esporte", "Strategy": "Estratégia", "Tactical": "Tático", "Visual Novel": "Visual novel" };
const USUARIOS_DEMO = [
    { usuario: "joao", senha: "1234" },
    { usuario: "maria", senha: "senha" }
];
let modoCadastro = false;
let planoPendente = null;

const PLANOS = {
    Essencial: { descricao: "R$ 14,90 por mês · 1 dispositivo · Full HD" },
    Premium: { descricao: "R$ 29,90 por mês · 3 dispositivos · 4K" },
    Ultimate: { descricao: "R$ 49,90 por mês · 6 dispositivos · 8K" }
};

function obterUsuarioLogado() { return localStorage.getItem("ycloudUsuarioLogado"); }
function obterUsuariosCadastrados() {
    try { return JSON.parse(localStorage.getItem("ycloudUsuarios") || "[]"); }
    catch { return []; }
}
function obterTodosUsuarios() { return [...USUARIOS_DEMO, ...obterUsuariosCadastrados()]; }
function chaveBibliotecaDoUsuario(usuario = obterUsuarioLogado()) {
    return usuario ? `ycloudBiblioteca_${encodeURIComponent(usuario.toLowerCase())}` : null;
}
function chavePlanoDoUsuario(usuario = obterUsuarioLogado()) {
    return usuario ? `ycloudPlano_${encodeURIComponent(usuario.toLowerCase())}` : null;
}
function obterPlanoDoUsuario(usuario = obterUsuarioLogado()) {
    const chave = chavePlanoDoUsuario(usuario);
    const plano = chave ? localStorage.getItem(chave) : null;
    return PLANOS[plano] ? plano : null;
}
function atualizarAreaPlano() {
    const plano = obterPlanoDoUsuario();
    const titulo = document.getElementById("contaPlanoTitulo");
    const descricao = document.getElementById("contaPlanoDescricao");
    const botao = document.getElementById("contaPlanoBotao");

    if (titulo) titulo.textContent = plano ? `Plano ${plano}` : "Plano não selecionado";
    if (descricao) descricao.textContent = plano ? PLANOS[plano].descricao : "Escolha um plano para sua conta.";
    if (botao) botao.textContent = plano ? "Alterar plano" : "Ver planos";

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
function selecionarPlano(plano) {
    if (!PLANOS[plano]) return;
    if (!obterUsuarioLogado()) {
        planoPendente = plano;
        abrirLogin();
        mostrarToast("Entre ou crie uma conta para escolher um plano.");
        return;
    }
    localStorage.setItem(chavePlanoDoUsuario(), plano);
    planoPendente = null;
    atualizarAreaPlano();
    mostrarToast(`Plano ${plano} selecionado para sua conta.`);
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
    localStorage.setItem(chave, bibliotecaAntiga);
    localStorage.removeItem("biblioteca");
    localStorage.removeItem("favoritos");
}
function atualizarBotaoLogin() {
    const botao = document.getElementById("loginBtn");
    if (!botao) return;
    const usuario = obterUsuarioLogado();
    botao.textContent = usuario ? `SAIR (${usuario})` : "ENTRAR";
    botao.onclick = usuario ? sair : abrirLogin;
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
    if (titulo) titulo.textContent = cadastro ? "Crie sua conta" : "Entre na sua conta";
    if (ajuda) ajuda.innerHTML = cadastro ? "Escolha um usuário e uma senha para salvar neste navegador." : "Para testar: <strong>joao / 1234</strong> ou <strong>maria / senha</strong>.";
    if (enviar) enviar.textContent = cadastro ? "Criar conta" : "Entrar";
    if (alternar) alternar.textContent = cadastro ? "Já tenho uma conta" : "Criar uma conta nova";
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
function fazerLogin(evento) {
    evento.preventDefault();
    const usuario = document.getElementById("loginUsuario").value.trim();
    const senha = document.getElementById("loginSenha").value;
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
        const cadastrados = obterUsuariosCadastrados();
        cadastrados.push({ usuario, senha });
        localStorage.setItem("ycloudUsuarios", JSON.stringify(cadastrados));
        localStorage.setItem("ycloudUsuarioLogado", usuario);
        migrarBibliotecaLegada();
        fecharLogin();
        atualizarBotaoLogin();
        aplicarPlanoPendente();
        mostrarToast(`Conta criada. Bem-vindo, ${usuario}!`);
        return;
    }
    if (!valido) {
        erro.textContent = "Usuário ou senha inválidos.";
        return;
    }
    localStorage.setItem("ycloudUsuarioLogado", usuario);
    migrarBibliotecaLegada();
    fecharLogin();
    atualizarBotaoLogin();
    aplicarPlanoPendente();
    mostrarToast(`Bem-vindo, ${usuario}!`);
}
function sair() {
    localStorage.removeItem("ycloudUsuarioLogado");
    atualizarBotaoLogin();
    atualizarAreaPlano();
    mostrarPainel("inicio");
    mostrarToast("Você saiu da conta.");
}

function mostrarPainel(id) {
    if (id === "biblioteca" && !obterUsuarioLogado()) {
        fecharMenu();
        abrirLogin();
        mostrarToast("Entre para acessar sua biblioteca.");
        return;
    }
    const alvo = id === "planos" ? "inicio" : id;
    document.querySelectorAll(".painel").forEach(function(painel) {
        const ativo = painel.id === `painel-${alvo}`;
        painel.classList.toggle("painel-oculto", !ativo);
        painel.classList.toggle("ativo", ativo);
    });

    if (alvo === "jogos" && !catalogoCarregado) {
        carregarCatalogo(1);
    }

    if (alvo === "biblioteca") {
        renderizarBiblioteca();
        atualizarAreaPlano();
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

function iniciarCursor() {
    const cursor = document.getElementById("cursor");
    const ponto = document.getElementById("cursorDot");

    if (!cursor || !ponto || !window.matchMedia("(pointer: fine)").matches) return;

    document.body.classList.add("cursor-ativo");

    window.addEventListener("pointermove", function(evento) {
        const posicao = `translate(${evento.clientX}px, ${evento.clientY}px) translate(-50%, -50%)`;
        cursor.style.transform = posicao;
        ponto.style.transform = posicao;
    });

    document.querySelectorAll("a, button, input, select").forEach(function(elemento) {
        elemento.addEventListener("pointerenter", function() {
            document.body.classList.add("cursor-hover");
        });
        elemento.addEventListener("pointerleave", function() {
            document.body.classList.remove("cursor-hover");
        });
    });
}

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
    try { return JSON.parse(localStorage.getItem(chave) || "[]"); } catch { return []; }
}
function jogoEstaNaBiblioteca(id) { return obterBiblioteca().some(function(jogo) { return jogo.id === id; }); }
function alternarBiblioteca(jogo) {
    if (!obterUsuarioLogado()) {
        abrirLogin();
        mostrarToast("Entre para salvar jogos na biblioteca.");
        return;
    }
    const biblioteca = obterBiblioteca();
    const indice = biblioteca.findIndex(function(item) { return item.id === jogo.id; });
    if (indice >= 0) { biblioteca.splice(indice, 1); mostrarToast(`${jogo.name} removido da biblioteca`); }
    else { biblioteca.push(jogo); mostrarToast(`"${jogo.name}" adicionado a biblioteca`); }
    localStorage.setItem(chaveBibliotecaDoUsuario(), JSON.stringify(biblioteca));
    renderizarCatalogo();
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
        jogosCatalogo   = jogos;
        paginaAtual     = pagina;
        catalogoCarregado = true;
        renderizarCatalogo();

        if (pagina === 1 && !generoSelecionado && !pesquisaSelecionada) {
            preencherCatalogo(
                document.getElementById("jogos-populares"),
                jogos.slice(0, 4)
            );
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
    const card = document.createElement("article"); card.className = "jogo-card";
    const capa = document.createElement("div"); capa.className = "jogo-capa";
    if (jogo.cover?.image_id) { const imagem = document.createElement("img"); imagem.src = `https://images.igdb.com/igdb/image/upload/t_cover_big/${jogo.cover.image_id}.jpg`; imagem.alt = `Capa de ${jogo.name}`; imagem.loading = "lazy"; capa.appendChild(imagem); } else capa.textContent = "Y";
    const info = document.createElement("div"); info.className = "jogo-info";
    const titulo = document.createElement("h3"); titulo.className = "jogo-titulo"; titulo.textContent = jogo.name;
    const genero = document.createElement("p"); genero.className = "jogo-genero"; genero.textContent = jogo.genres?.length ? jogo.genres.map(function(item) { return GENEROS[item.name] || item.name; }).join(", ") : "Gênero não informado";
    const acoes = document.createElement("div"); acoes.className = "jogo-acoes";
    if (naBiblioteca) { const jogar = document.createElement("button"); jogar.className = "btn-jogar"; jogar.textContent = "Jogar"; jogar.addEventListener("click", function() { mostrarToast(`Abrindo ${jogo.name}...`); }); acoes.appendChild(jogar); }
    const biblioteca = document.createElement("button"); biblioteca.className = "btn-bib" + (jogoEstaNaBiblioteca(jogo.id) ? " salvo" : ""); biblioteca.textContent = jogoEstaNaBiblioteca(jogo.id) ? "Salvo" : "Biblioteca"; biblioteca.addEventListener("click", function() { alternarBiblioteca(jogo); }); acoes.appendChild(biblioteca);
    info.append(titulo, genero, acoes); card.append(capa, info); return card;
}
function mostrarErro(container, texto) { if (!container) return; const estado = document.createElement("p"); estado.className = "estado-texto"; estado.textContent = texto; container.replaceChildren(estado); }

function renderizarBiblioteca() {
    const pesquisa = document.getElementById("pesquisaBiblioteca")?.value.trim().toLowerCase() || "";
    const todos = obterBiblioteca(); const jogos = todos.filter(function(jogo) { return jogo.name.toLowerCase().includes(pesquisa); });
    preencherCatalogo(document.getElementById("catalogoBiblioteca"), jogos, "", true);
    const vazio = document.getElementById("bibVazio"); if (vazio) vazio.hidden = jogos.length > 0;
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


// ── Hero 3D (Three.js) — cluster de formas ao estilo Lusion ────────
function iniciarHeroCanvas() {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas || typeof THREE === "undefined") return;

    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzMovimento) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    const luz1 = new THREE.DirectionalLight(0xffffff, 1.1);
    luz1.position.set(4, 6, 6);
    scene.add(luz1);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const corAzul  = new THREE.MeshStandardMaterial({ color: 0x1a4bff, roughness: 0.35, metalness: 0.15 });
    const corPreta = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4, metalness: 0.1 });
    const corBranca = new THREE.MeshStandardMaterial({ color: 0xf5f5f3, roughness: 0.5, metalness: 0.05 });
    const materiais = [corAzul, corPreta, corBranca];

    const grupo = new THREE.Group();
    const total = 14;

    for (let i = 0; i < total; i++) {
        const tamanho   = 0.5 + Math.random() * 0.7;
        const geometria = new THREE.BoxGeometry(tamanho, tamanho, tamanho);
        const cubo      = new THREE.Mesh(geometria, materiais[i % materiais.length]);

        cubo.position.set(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4
        );
        cubo.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        grupo.add(cubo);
    }
    scene.add(grupo);

    let mouseX = 0, mouseY = 0;
    window.addEventListener("mousemove", e => {
        mouseX = (e.clientX / window.innerWidth) - 0.5;
        mouseY = (e.clientY / window.innerHeight) - 0.5;
    });

    function redimensionar() {
        const largura = canvas.clientWidth  || window.innerWidth;
        const altura  = canvas.clientHeight || window.innerHeight;
        camera.aspect = largura / altura;
        camera.updateProjectionMatrix();
        renderer.setSize(largura, altura, false);
    }

    let raf;
    function desenhar() {
        grupo.rotation.y += 0.0022;
        grupo.rotation.x += 0.0007;
        camera.position.x += (mouseX * 2 - camera.position.x) * 0.03;
        camera.position.y += (-mouseY * 2 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(desenhar);
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            cancelAnimationFrame(raf);
        } else {
            raf = requestAnimationFrame(desenhar);
        }
    });

    window.addEventListener("resize", redimensionar);

    redimensionar();
    desenhar();
}


// ── Init ───────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    iniciarCursor();
    iniciarHeroCanvas();
    atualizarBotaoLogin();
    atualizarAreaPlano();

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
    document.getElementById("loginForm")?.addEventListener("submit", fazerLogin);
    document.querySelectorAll(".plano-btn").forEach(function(botao) {
        botao.addEventListener("click", function() { selecionarPlano(botao.dataset.plano); });
    });

    // Fecha o menu com a tecla Esc
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") { fecharMenu(); fecharLogin(); }
    });
});
