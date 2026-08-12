/* =========================
   SCRIPT PRINCIPAL — YCloud
========================= */

"use strict";

// ── Estado global ──────────────────────────────────────────────
let paginaAtual       = 1;
let generoSelecionado = "";
let pesquisaSelecionada = "";
let jogosCatalogo     = [];
let temporizadorPesquisa;
let sidebarAberta     = true;

// ── Traduções de gêneros ───────────────────────────────────────
const GENEROS = {
    "Adventure":                     "Aventura",
    "Arcade":                        "Arcade",
    "Card & Board Game":             "Cartas e tabuleiro",
    "Fighting":                      "Luta",
    "Hack and slash/Beat 'em up":    "Hack and slash",
    "Indie":                         "Independente",
    "Music":                         "Música",
    "Pinball":                       "Pinball",
    "Platform":                      "Plataforma",
    "Point-and-click":               "Apontar e clicar",
    "Puzzle":                        "Quebra-cabeça",
    "Quiz/Trivia":                   "Quiz e trivia",
    "Racing":                        "Corrida",
    "Real Time Strategy (RTS)":      "Estratégia em tempo real",
    "Role-playing (RPG)":            "RPG",
    "Shooter":                       "Tiro",
    "Simulator":                     "Simulação",
    "Sport":                         "Esporte",
    "Strategy":                      "Estratégia",
    "Tactical":                      "Tático",
    "Turn-based strategy (TBS)":     "Estratégia por turnos",
    "Visual Novel":                  "Visual Novel",
};

function traduzirGenero(nome) {
    return GENEROS[nome] || nome;
}


// ── Navegação por abas ─────────────────────────────────────────
function abrirAba(id, botao) {
    document.querySelectorAll(".aba").forEach(el => el.classList.remove("ativa"));
    document.getElementById(id)?.classList.add("ativa");

    document.querySelectorAll(".menu-item").forEach(el => {
        el.classList.remove("ativo");
        el.setAttribute("aria-current", "false");
    });

    // Aceita tanto elemento DOM quanto seletor data-aba
    const itemAtivo = botao instanceof Element
        ? botao
        : document.querySelector(`[data-aba="${id}"]`);

    if (itemAtivo) {
        itemAtivo.classList.add("ativo");
        itemAtivo.setAttribute("aria-current", "page");
    }

    if (id === "biblioteca") renderizarBiblioteca();

    // Fecha sidebar em mobile ao navegar
    if (window.innerWidth < 768) fecharSidebar();

    window.scrollTo({ top: 0, behavior: "smooth" });
}


// ── Sidebar toggle ─────────────────────────────────────────────
function toggleSidebar() {
    sidebarAberta ? fecharSidebar() : abrirSidebar();
}

function abrirSidebar() {
    document.getElementById("sidebar")?.classList.remove("sidebar-fechada");
    document.getElementById("conteudo")?.classList.remove("conteudo-expandido");
    sidebarAberta = true;
}

function fecharSidebar() {
    document.getElementById("sidebar")?.classList.add("sidebar-fechada");
    document.getElementById("conteudo")?.classList.add("conteudo-expandido");
    sidebarAberta = false;
}


// ── Tema ───────────────────────────────────────────────────────
function alternarTema() {
    const isLight = document.body.classList.toggle("tema-claro");
    localStorage.setItem("tema", isLight ? "light" : "dark");
    sincronizarToggleTema(isLight);
}

function sincronizarToggleTema(isLight) {
    const toggle = document.getElementById("temaToggle");
    if (toggle) toggle.setAttribute("aria-checked", String(isLight));
    if (isLight) {
        toggle?.classList.add("ativo");
    } else {
        toggle?.classList.remove("ativo");
    }
}

function carregarTema() {
    const tema = localStorage.getItem("tema");
    const isLight = tema === "light";
    if (isLight) document.body.classList.add("tema-claro");
    sincronizarToggleTema(isLight);
}


// ── Animações reduzidas ────────────────────────────────────────
function alternarAnimacoes() {
    const ativo = document.documentElement.classList.toggle("reducao-animacao");
    localStorage.setItem("reducao-animacao", ativo ? "1" : "0");
    const toggle = document.getElementById("animacaoToggle");
    if (toggle) toggle.setAttribute("aria-checked", String(ativo));
    if (ativo) toggle?.classList.add("ativo");
    else toggle?.classList.remove("ativo");
}

function carregarAnimacoes() {
    const ativo = localStorage.getItem("reducao-animacao") === "1"
        || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (ativo) {
        document.documentElement.classList.add("reducao-animacao");
        const toggle = document.getElementById("animacaoToggle");
        if (toggle) {
            toggle.setAttribute("aria-checked", "true");
            toggle.classList.add("ativo");
        }
    }
}


// ── Biblioteca (localStorage) ──────────────────────────────────
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
    const idx = biblioteca.findIndex(j => j.id === jogo.id);

    if (idx >= 0) {
        biblioteca.splice(idx, 1);
        mostrarToast(`${jogo.name} removido da biblioteca`);
    } else {
        biblioteca.push(jogo);
        mostrarToast(`${jogo.name} adicionado à biblioteca ✓`);
    }

    localStorage.setItem("biblioteca", JSON.stringify(biblioteca));
    renderizarCatalogo();
    renderizarBiblioteca();
}

function limparBiblioteca() {
    if (!confirm("Remover todos os jogos da biblioteca?")) return;
    localStorage.removeItem("biblioteca");
    renderizarBiblioteca();
    mostrarToast("Biblioteca limpa");
}


// ── Toast de notificação ───────────────────────────────────────
function mostrarToast(mensagem) {
    const existente = document.querySelector(".toast");
    existente?.remove();

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = mensagem;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add("toast-visivel"));
    });

    setTimeout(() => {
        toast.classList.remove("toast-visivel");
        toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    }, 2800);
}


// ── Carregar e renderizar catálogo ─────────────────────────────
async function carregarCatalogo(pagina, adicionar) {
    const botaoMais = document.getElementById("carregarMais");
    const catalogo  = document.getElementById("catalogo");

    if (botaoMais) {
        botaoMais.disabled  = true;
        botaoMais.textContent = "Carregando…";
    }

    // Skeletons ao iniciar nova busca
    if (!adicionar && catalogo) {
        catalogo.replaceChildren(...Array.from({ length: 6 }, () => {
            const sk = document.createElement("div");
            sk.className = "skeleton-card";
            return sk;
        }));
    }

    try {
        const dados = await buscarJogos(pagina, generoSelecionado, pesquisaSelecionada);
        if (!dados) return; // requisição cancelada

        const jogos = dados.jogos || [];
        jogosCatalogo = adicionar ? jogosCatalogo.concat(jogos) : jogos;
        paginaAtual   = pagina;
        renderizarCatalogo();

        // Jogos populares na home (primeira carga, sem filtros)
        if (!adicionar && !generoSelecionado && !pesquisaSelecionada) {
            preencherCatalogo(
                document.getElementById("jogos-populares"),
                jogos.slice(0, 4)
            );
        }

        if (botaoMais) {
            const temMais = jogos.length >= (dados.limite ?? jogos.length);
            botaoMais.hidden    = !temMais;
            botaoMais.disabled  = false;
            botaoMais.textContent = "Carregar mais jogos";
        }

    } catch (erro) {
        mostrarErro(catalogo, erro.message || "Não foi possível carregar os jogos.");
        if (botaoMais) {
            botaoMais.disabled  = false;
            botaoMais.textContent = "Tentar novamente";
        }
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
        // Atraso escalonado para animação de entrada
        card.style.animationDelay = `${i * 50}ms`;
        container.appendChild(card);
    });
}

function criarCardJogo(jogo, naBiblioteca = false) {
    const naBib = jogoEstaNaBiblioteca(jogo.id);

    const card = document.createElement("article");
    card.className = "jogo-card";

    // ── Imagem ──
    const imgWrap = document.createElement("div");
    imgWrap.className = "jogo-capa";

    if (jogo.cover?.image_id) {
        const img = document.createElement("img");
        img.src     = `https://images.igdb.com/igdb/image/upload/t_cover_big/${jogo.cover.image_id}.jpg`;
        img.alt     = `Capa de ${jogo.name}`;
        img.loading = "lazy";
        img.decoding = "async";
        imgWrap.appendChild(img);
    } else {
        imgWrap.innerHTML = `<div class="jogo-capa-placeholder">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01M7 12h.01M17 12h.01M12 9v6"/>
            </svg>
        </div>`;
    }

    // Badge de rating
    if (jogo.rating) {
        const badge = document.createElement("div");
        badge.className = "jogo-rating";
        badge.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> ${(jogo.rating / 10).toFixed(1)}`;
        imgWrap.appendChild(badge);
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
        ? jogo.genres.map(g => traduzirGenero(g.name)).join(", ")
        : "Gênero não informado";

    const acoes = document.createElement("div");
    acoes.className = "jogo-acoes";

    if (naBiblioteca) {
        const btnJogar = document.createElement("button");
        btnJogar.type = "button";
        btnJogar.className = "btn-jogar";
        btnJogar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Jogar`;
        btnJogar.addEventListener("click", () => jogar(jogo.name));
        acoes.appendChild(btnJogar);
    }

    const btnBib = document.createElement("button");
    btnBib.type = "button";
    btnBib.className = "btn-biblioteca" + (naBib ? " btn-biblioteca-ativa" : "");
    btnBib.setAttribute("aria-pressed", String(naBib));
    btnBib.setAttribute("aria-label", naBib ? "Remover da biblioteca" : "Adicionar à biblioteca");
    btnBib.innerHTML = naBib
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6L9 17l-5-5"/></svg> Salvo`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Biblioteca`;
    btnBib.addEventListener("click", () => alternarBiblioteca(jogo));
    acoes.appendChild(btnBib);

    info.append(titulo, generoEl, acoes);
    card.append(imgWrap, info);
    return card;
}

function mostrarErro(container, texto) {
    if (!container) return;
    const el = document.createElement("p");
    el.className = "estado-texto";
    el.textContent = texto;
    container.replaceChildren(el);
}


// ── Biblioteca ─────────────────────────────────────────────────
function renderizarBiblioteca() {
    const termo    = document.getElementById("pesquisaBiblioteca")?.value.trim().toLocaleLowerCase("pt-BR") || "";
    const todos    = obterBiblioteca();
    const filtrado = todos.filter(j => j.name.toLocaleLowerCase("pt-BR").includes(termo));
    const mensagem = document.getElementById("mensagemBibliotecaVazia");

    preencherCatalogo(document.getElementById("catalogoBiblioteca"), filtrado, "", true);

    if (!mensagem) return;
    const vazio = filtrado.length === 0;
    mensagem.hidden = !vazio;

    if (vazio) {
        mensagem.querySelector("h2").textContent =
            todos.length ? "Nenhum resultado" : "Biblioteca vazia";
        mensagem.querySelector("p").textContent =
            todos.length ? "Tente outra busca." : "Adicione jogos ao explorar o catálogo.";
    }
}


// ── Filtro de gêneros ──────────────────────────────────────────
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


// ── Jogar ──────────────────────────────────────────────────────
function jogar(nomeJogo) {
    mostrarToast(`Abrindo ${nomeJogo}…`);
}


// ── Canvas hero (partículas) ───────────────────────────────────
function iniciarHeroCanvas() {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas) return;

    const ctx    = canvas.getContext("2d");
    let pontos   = [];
    let raf;

    function redimensionar() {
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    function criarPontos() {
        const qtd = Math.floor((canvas.width * canvas.height) / 14000);
        pontos = Array.from({ length: qtd }, () => ({
            x:   Math.random() * canvas.width,
            y:   Math.random() * canvas.height,
            vx:  (Math.random() - 0.5) * 0.35,
            vy:  (Math.random() - 0.5) * 0.35,
            r:   Math.random() * 1.5 + 0.5,
        }));
    }

    function desenhar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        pontos.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height)  p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(134, 239, 22, 0.45)";
            ctx.fill();
        });

        // Linhas entre pontos próximos
        for (let i = 0; i < pontos.length; i++) {
            for (let j = i + 1; j < pontos.length; j++) {
                const dx   = pontos[i].x - pontos[j].x;
                const dy   = pontos[i].y - pontos[j].y;
                const dist = Math.hypot(dx, dy);
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(pontos[i].x, pontos[i].y);
                    ctx.lineTo(pontos[j].x, pontos[j].y);
                    ctx.strokeStyle = `rgba(134,239,22,${0.12 * (1 - dist / 100)})`;
                    ctx.lineWidth   = 0.6;
                    ctx.stroke();
                }
            }
        }

        raf = requestAnimationFrame(desenhar);
    }

    const pausar = () => cancelAnimationFrame(raf);
    const retomar = () => { raf = requestAnimationFrame(desenhar); };

    const obs = new IntersectionObserver(entries => {
        entries[0].isIntersecting ? retomar() : pausar();
    }, { threshold: 0.1 });
    obs.observe(canvas);

    window.addEventListener("resize", () => {
        redimensionar();
        criarPontos();
    });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    redimensionar();
    criarPontos();
    desenhar();
}


// ── Pesquisa global na topbar ──────────────────────────────────
function iniciarPesquisaGlobal() {
    const input = document.getElementById("pesquisaGlobal");
    if (!input) return;

    let timer;
    input.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            const valor = input.value.trim();
            if (!valor) return;

            // Vai para a aba de jogos e aplica pesquisa
            abrirAba("jogos", document.querySelector("[data-aba=jogos]"));
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


// ── Init ───────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    carregarTema();
    carregarAnimacoes();
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
    });

    document.getElementById("pesquisaJogos")?.addEventListener("input", e => {
        clearTimeout(temporizadorPesquisa);
        temporizadorPesquisa = setTimeout(() => {
            pesquisaSelecionada = e.target.value.trim();
            carregarCatalogo(1, false);
        }, 350);
    });

    document.getElementById("pesquisaBiblioteca")?.addEventListener("input", renderizarBiblioteca);

    // Fechar sidebar ao clicar fora (mobile)
    document.getElementById("conteudo")?.addEventListener("click", () => {
        if (window.innerWidth < 768 && sidebarAberta) fecharSidebar();
    });
});