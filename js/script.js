/* =========================
   SCRIPT PRINCIPAL — YCloud (v2, estilo Lusion)
========================= */

"use strict";

// ── Estado global ──────────────────────────────────────────────
let paginaAtual         = 1;
let generoSelecionado    = "";
let pesquisaSelecionada  = "";
let jogosCatalogo        = [];
let catalogoCarregado    = false;
let temporizadorPesquisa;

// ── Traduções de gêneros (usado só no filtro — a lista de jogos
//    já vem traduzida do servidor em api/games.js) ──────────────
const GENEROS = {
    "Adventure":                  "Aventura",
    "Arcade":                     "Arcade",
    "Card & Board Game":          "Cartas e tabuleiro",
    "Fighting":                   "Luta",
    "Hack and slash/Beat 'em up": "Hack and slash",
    "Indie":                      "Independente",
    "Music":                      "Música",
    "Pinball":                    "Pinball",
    "Platform":                   "Plataforma",
    "Point-and-click":            "Apontar e clicar",
    "Puzzle":                     "Quebra-cabeça",
    "Quiz/Trivia":                "Quiz e trivia",
    "Racing":                     "Corrida",
    "Real Time Strategy (RTS)":   "Estratégia em tempo real",
    "Role-playing (RPG)":         "RPG",
    "Shooter":                    "Tiro",
    "Simulator":                  "Simulação",
    "Sport":                      "Esporte",
    "Strategy":                   "Estratégia",
    "Tactical":                   "Tático",
    "Turn-based strategy (TBS)":  "Estratégia por turnos",
    "Visual Novel":               "Visual Novel",
};

function traduzirGenero(nome) {
    return GENEROS[nome] || nome;
}


// ── Navegação por painéis ──────────────────────────────────────
function mostrarPainel(id) {
    // "Planos" é uma seção dentro do painel "Início", não um painel próprio
    const idAlvo = id === "planos" ? "inicio" : id;

    document.querySelectorAll(".painel").forEach(el => {
        const ativo = el.id === `painel-${idAlvo}`;
        el.classList.toggle("painel-oculto", !ativo);
        el.classList.toggle("ativo", ativo);
    });

    if (idAlvo === "jogos" && !catalogoCarregado) {
        carregarCatalogo(1, false);
    }

    if (idAlvo === "biblioteca") {
        renderizarBiblioteca();
    }

    if (id === "planos") {
        document.getElementById("painel-planos")?.scrollIntoView({ behavior: "smooth" });
    } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

function fecharMenuE(id) {
    fecharMenu();
    mostrarPainel(id);
}


// ── Menu overlay ────────────────────────────────────────────────
function toggleMenu() {
    document.body.classList.contains("menu-aberto") ? fecharMenu() : abrirMenu();
}

function abrirMenu() {
    document.body.classList.add("menu-aberto");
    document.getElementById("menuOverlay")?.setAttribute("aria-hidden", "false");
    document.getElementById("menuBtn")?.setAttribute("aria-expanded", "true");
}

function fecharMenu() {
    document.body.classList.remove("menu-aberto");
    document.getElementById("menuOverlay")?.setAttribute("aria-hidden", "true");
    document.getElementById("menuBtn")?.setAttribute("aria-expanded", "false");
}


// ── Cursor customizado ──────────────────────────────────────────
function iniciarCursor() {
    const cursor    = document.getElementById("cursor");
    const cursorDot = document.getElementById("cursorDot");
    if (!cursor || !cursorDot) return;

    // Dispositivos sem mouse (touch) não precisam do cursor custom
    if (window.matchMedia("(pointer: coarse)").matches) {
        cursor.style.display = "none";
        cursorDot.style.display = "none";
        return;
    }

    let alvoX = 0, alvoY = 0;
    let dotX  = 0, dotY  = 0;

    window.addEventListener("mousemove", e => {
        alvoX = e.clientX;
        alvoY = e.clientY;
        cursor.style.left = `${alvoX}px`;
        cursor.style.top  = `${alvoY}px`;
    });

    (function seguirPonto() {
        dotX += (alvoX - dotX) * 0.35;
        dotY += (alvoY - dotY) * 0.35;
        cursorDot.style.left = `${dotX}px`;
        cursorDot.style.top  = `${dotY}px`;
        requestAnimationFrame(seguirPonto);
    })();

    const seletorHover = "a, button, input, select, .jogo-card, [role='button']";

    document.addEventListener("mouseover", e => {
        if (e.target.closest(seletorHover)) document.body.classList.add("cursor-hover");
    });

    document.addEventListener("mouseout", e => {
        if (e.target.closest(seletorHover)) document.body.classList.remove("cursor-hover");
    });

    document.getElementById("menuBtn")?.addEventListener("mouseenter", () => {
        document.body.classList.add("cursor-menu");
    });
    document.getElementById("menuBtn")?.addEventListener("mouseleave", () => {
        document.body.classList.remove("cursor-menu");
    });
}


// ── Toast de notificação ────────────────────────────────────────
function mostrarToast(mensagem) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    clearTimeout(toast._timer);
    toast.textContent = mensagem;
    toast.classList.add("visivel");

    toast._timer = setTimeout(() => {
        toast.classList.remove("visivel");
    }, 2800);
}


// ── Biblioteca (localStorage) ───────────────────────────────────
function obterBiblioteca() {
    try {
        return JSON.parse(localStorage.getItem("biblioteca") || "[]");
    } catch {
        return [];
    }
}

function jogoEstaNaBiblioteca(id) {
    return obterBiblioteca().some(j => j.id === id);
}

function alternarBiblioteca(jogo) {
    const biblioteca = obterBiblioteca();
<<<<<<< HEAD
    const indice = biblioteca.findIndex(function(item) { return item.id === jogo.id; });
    if (indice >= 0) {
        biblioteca.splice(indice, 1);
    } else {
        biblioteca.push(jogo);
        alert(`"${jogo.name}" adicionado a biblioteca`);
    }
=======
    const idx = biblioteca.findIndex(j => j.id === jogo.id);

    if (idx >= 0) {
        biblioteca.splice(idx, 1);
        mostrarToast(`${jogo.name} removido da biblioteca`);
    } else {
        biblioteca.push(jogo);
        mostrarToast(`${jogo.name} adicionado à biblioteca ✓`);
    }

>>>>>>> 8b7a45e9eeec744acc84841309633c06eceaf11a
    localStorage.setItem("biblioteca", JSON.stringify(biblioteca));
    renderizarCatalogo();
    renderizarBiblioteca();
}

<<<<<<< HEAD
async function carregarCatalogo(pagina) {
    const botaoAnterior = document.getElementById("paginaAnterior");
    const botaoProxima = document.getElementById("paginaProxima");
    const indicador = document.getElementById("paginaIndicador");
    if (botaoAnterior) botaoAnterior.disabled = true;
    if (botaoProxima) botaoProxima.disabled = true;
    if (indicador) indicador.textContent = "Carregando...";
=======

// ── Carregar e renderizar catálogo ──────────────────────────────
async function carregarCatalogo(pagina, adicionar) {
    const botaoMais = document.getElementById("carregarMais");
    const catalogo  = document.getElementById("catalogo");

    if (botaoMais) {
        botaoMais.disabled    = true;
        botaoMais.textContent = "Carregando…";
    }

    if (!adicionar && catalogo) {
        catalogo.replaceChildren(...Array.from({ length: 6 }, () => {
            const sk = document.createElement("div");
            sk.className = "skel";
            return sk;
        }));
    }
>>>>>>> 8b7a45e9eeec744acc84841309633c06eceaf11a

    try {
        const dados = await buscarJogos(pagina, generoSelecionado, pesquisaSelecionada);
        if (!dados) return;

        const jogos = dados.jogos || [];
<<<<<<< HEAD
        jogosCatalogo = jogos;
        paginaAtual = pagina;
        renderizarCatalogo();

        if (!generoSelecionado && !pesquisaSelecionada) {
            preencherCatalogo(document.getElementById("jogos-populares"), jogos.slice(0, 3));
        }

        if (botaoAnterior) botaoAnterior.disabled = pagina === 1;
        if (botaoProxima) botaoProxima.disabled = jogos.length < dados.limite;
        if (indicador) indicador.textContent = `Página ${pagina}`;
    } catch (erro) {
        mostrarMensagem(document.getElementById("catalogo"), erro.message || "Não foi possível carregar os jogos.");
        if (botaoAnterior) botaoAnterior.disabled = pagina === 1;
        if (botaoProxima) botaoProxima.disabled = false;
        if (indicador) indicador.textContent = `Página ${pagina}`;
=======
        jogosCatalogo   = adicionar ? jogosCatalogo.concat(jogos) : jogos;
        paginaAtual     = pagina;
        catalogoCarregado = true;
        renderizarCatalogo();

        if (!adicionar && !generoSelecionado && !pesquisaSelecionada) {
            preencherCatalogo(
                document.getElementById("jogos-populares"),
                jogos.slice(0, 4)
            );
        }

        if (botaoMais) {
            const temMais = jogos.length >= (dados.limite ?? jogos.length);
            botaoMais.hidden      = !temMais;
            botaoMais.disabled    = false;
            botaoMais.textContent = "Carregar mais";
        }

    } catch (erro) {
        mostrarErro(catalogo, erro.message || "Não foi possível carregar os jogos.");
        if (botaoMais) {
            botaoMais.disabled    = false;
            botaoMais.textContent = "Tentar novamente";
        }
>>>>>>> 8b7a45e9eeec744acc84841309633c06eceaf11a
    }
}

function renderizarCatalogo() {
    preencherCatalogo(
        document.getElementById("catalogo"),
        jogosCatalogo,
        "Nenhum jogo encontrado."
    );
}

function preencherCatalogo(container, jogos, mensagemVazia = "", naBiblioteca = false) {
    if (!container) return;
    container.replaceChildren();

    if (!jogos.length) {
        if (mensagemVazia) mostrarErro(container, mensagemVazia);
        return;
    }

    jogos.forEach((jogo, i) => {
        const card = criarCardJogo(jogo, naBiblioteca);
        card.style.animationDelay = `${i * 50}ms`;
        container.appendChild(card);
    });
}

function criarCardJogo(jogo, naBiblioteca = false) {
    const naBib = jogoEstaNaBiblioteca(jogo.id);

    const card = document.createElement("article");
    card.className = "jogo-card";

    // ── Capa ──
    const capa = document.createElement("div");
    capa.className = "jogo-capa";

    if (jogo.cover?.image_id) {
        const img = document.createElement("img");
        img.src      = `https://images.igdb.com/igdb/image/upload/t_cover_big/${jogo.cover.image_id}.jpg`;
        img.alt      = `Capa de ${jogo.name}`;
        img.loading  = "lazy";
        img.decoding = "async";
        capa.appendChild(img);
    } else {
        capa.innerHTML = `<div class="jogo-capa-placeholder">Y</div>`;
    }

    if (jogo.rating) {
        const badge = document.createElement("div");
        badge.className = "jogo-rating-badge";
        badge.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> ${(jogo.rating / 10).toFixed(1)}`;
        capa.appendChild(badge);
    }

    // ── Info ──
    const info = document.createElement("div");
    info.className = "jogo-info";

    const titulo = document.createElement("h3");
    titulo.className = "jogo-titulo";
    titulo.textContent = jogo.name;

    const generoEl = document.createElement("p");
    generoEl.className = "jogo-genero";
    generoEl.textContent = jogo.genres?.length
        ? jogo.genres.map(g => g.name).join(", ")
        : "Gênero não informado";

    const acoes = document.createElement("div");
    acoes.className = "jogo-acoes";

    if (naBiblioteca) {
        const btnJogar = document.createElement("button");
        btnJogar.type = "button";
        btnJogar.className = "btn-jogar";
        btnJogar.textContent = "Jogar";
        btnJogar.addEventListener("click", () => jogar(jogo.name));
        acoes.appendChild(btnJogar);
    }

    const btnBib = document.createElement("button");
    btnBib.type = "button";
    btnBib.className = "btn-bib" + (naBib ? " salvo" : "");
    btnBib.setAttribute("aria-pressed", String(naBib));
    btnBib.setAttribute("aria-label", naBib ? "Remover da biblioteca" : "Adicionar à biblioteca");
    btnBib.textContent = naBib ? "Salvo" : "Biblioteca";
    btnBib.addEventListener("click", () => alternarBiblioteca(jogo));
    acoes.appendChild(btnBib);

    info.append(titulo, generoEl, acoes);
    card.append(capa, info);
    return card;
}

function mostrarErro(container, texto) {
    if (!container) return;
    const el = document.createElement("p");
    el.className = "estado-texto";
    el.textContent = texto;
    container.replaceChildren(el);
}


// ── Biblioteca ───────────────────────────────────────────────────
function renderizarBiblioteca() {
    const termo    = document.getElementById("pesquisaBiblioteca")?.value.trim().toLocaleLowerCase("pt-BR") || "";
    const todos    = obterBiblioteca();
    const filtrado = todos.filter(j => j.name.toLocaleLowerCase("pt-BR").includes(termo));

    preencherCatalogo(document.getElementById("catalogoBiblioteca"), filtrado, "", true);

    const vazio = document.getElementById("bibVazio");
    if (!vazio) return;

    const semResultados = filtrado.length === 0;
    vazio.hidden = !semResultados;

    if (semResultados) {
        const titulo = document.getElementById("bibVazioTitulo");
        const desc   = document.getElementById("bibVazioDesc");
        if (titulo) titulo.textContent = todos.length ? "Nenhum resultado" : "Biblioteca vazia";
        if (desc)   desc.textContent   = todos.length ? "Tente outra busca." : "Adicione jogos ao explorar o catálogo.";
    }
}


// ── Filtro de gêneros ─────────────────────────────────────────────
async function carregarFiltroGeneros() {
    const filtro = document.getElementById("filtroGenero");
    if (!filtro) return;

    try {
        const generos = await buscarGeneros();
        filtro.replaceChildren(new Option("Todos os gêneros", ""));
        generos.forEach(g => filtro.add(new Option(traduzirGenero(g.name), g.id)));
        filtro.disabled = false;
    } catch {
        filtro.replaceChildren(new Option("Erro ao carregar gêneros", ""));
    }
}

<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", function() {
    carregarTema();
    carregarCatalogo(1);
    carregarFiltroGeneros();
    renderizarBiblioteca();
    document.getElementById("paginaAnterior")?.addEventListener("click", function() { carregarCatalogo(paginaAtual - 1); });
    document.getElementById("paginaProxima")?.addEventListener("click", function() { carregarCatalogo(paginaAtual + 1); });
    document.getElementById("filtroGenero")?.addEventListener("change", function(evento) {
        generoSelecionado = evento.target.value;
        carregarCatalogo(1);
=======

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


// ── Pesquisa global na topbar ────────────────────────────────────
function iniciarPesquisaGlobal() {
    const input = document.getElementById("pesquisaGlobal");
    if (!input) return;

    let timer;
    input.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            const valor = input.value.trim();
            if (!valor) return;

            mostrarPainel("jogos");
            const campoPrincipal = document.getElementById("pesquisaJogos");
            if (campoPrincipal) {
                campoPrincipal.value = valor;
                pesquisaSelecionada  = valor;
                carregarCatalogo(1, false);
            }
            input.value = "";
        }, 400);
    });
}


// ── Init ───────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    iniciarCursor();
    iniciarHeroCanvas();
    iniciarPesquisaGlobal();

    carregarCatalogo(1, false);
    carregarFiltroGeneros();
    renderizarBiblioteca();

    document.getElementById("carregarMais")?.addEventListener("click", () => {
        carregarCatalogo(paginaAtual + 1, true);
    });

    document.getElementById("filtroGenero")?.addEventListener("change", e => {
        generoSelecionado = e.target.value;
        carregarCatalogo(1, false);
>>>>>>> 8b7a45e9eeec744acc84841309633c06eceaf11a
    });

    document.getElementById("pesquisaJogos")?.addEventListener("input", e => {
        clearTimeout(temporizadorPesquisa);
<<<<<<< HEAD
        temporizadorPesquisa = setTimeout(function() {
            pesquisaSelecionada = evento.target.value.trim();
            carregarCatalogo(1);
=======
        temporizadorPesquisa = setTimeout(() => {
            pesquisaSelecionada = e.target.value.trim();
            carregarCatalogo(1, false);
>>>>>>> 8b7a45e9eeec744acc84841309633c06eceaf11a
        }, 350);
    });

    document.getElementById("pesquisaBiblioteca")?.addEventListener("input", renderizarBiblioteca);

    // Fecha o menu com a tecla Esc
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") fecharMenu();
    });
});