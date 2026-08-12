"use strict";

let paginaAtual = 1;
let generoSelecionado = "";
let pesquisaSelecionada = "";
let jogosCatalogo = [];
let temporizadorPesquisa;

const GENEROS = { "Adventure": "Aventura", "Arcade": "Arcade", "Card & Board Game": "Cartas e tabuleiro", "Fighting": "Luta", "Indie": "Independente", "Music": "Música", "Platform": "Plataforma", "Puzzle": "Quebra-cabeça", "Racing": "Corrida", "Role-playing (RPG)": "RPG", "Shooter": "Tiro", "Simulator": "Simulação", "Sport": "Esporte", "Strategy": "Estratégia", "Tactical": "Tático", "Visual Novel": "Visual novel" };

function mostrarPainel(id) {
    const alvo = id === "planos" ? "inicio" : id;
    document.querySelectorAll(".painel").forEach(function(painel) {
        const ativo = painel.id === `painel-${alvo}`;
        painel.classList.toggle("painel-oculto", !ativo);
        painel.classList.toggle("ativo", ativo);
    });
    if (alvo === "biblioteca") renderizarBiblioteca();
    if (id === "planos") document.getElementById("painel-planos")?.scrollIntoView({ behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
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

function obterBiblioteca() { try { return JSON.parse(localStorage.getItem("biblioteca") || localStorage.getItem("favoritos") || "[]"); } catch { return []; } }
function jogoEstaNaBiblioteca(id) { return obterBiblioteca().some(function(jogo) { return jogo.id === id; }); }
function alternarBiblioteca(jogo) {
    const biblioteca = obterBiblioteca();
    const indice = biblioteca.findIndex(function(item) { return item.id === jogo.id; });
    if (indice >= 0) { biblioteca.splice(indice, 1); mostrarToast(`${jogo.name} removido da biblioteca`); }
    else { biblioteca.push(jogo); mostrarToast(`"${jogo.name}" adicionado a biblioteca`); }
    localStorage.setItem("biblioteca", JSON.stringify(biblioteca));
    localStorage.removeItem("favoritos");
    renderizarCatalogo();
    renderizarBiblioteca();
}

async function carregarCatalogo(pagina) {
    const anterior = document.getElementById("paginaAnterior");
    const proxima = document.getElementById("paginaProxima");
    const indicador = document.getElementById("paginaIndicador");
    if (anterior) anterior.disabled = true;
    if (proxima) proxima.disabled = true;
    if (indicador) indicador.textContent = "Carregando...";
    try {
        const dados = await buscarJogos(pagina, generoSelecionado, pesquisaSelecionada);
        jogosCatalogo = dados.jogos || [];
        paginaAtual = pagina;
        renderizarCatalogo();
        if (pagina === 1 && !generoSelecionado && !pesquisaSelecionada) preencherCatalogo(document.getElementById("jogos-populares"), jogosCatalogo.slice(0, 3));
        if (anterior) anterior.disabled = pagina === 1;
        if (proxima) proxima.disabled = jogosCatalogo.length < (dados.limite || 15);
        if (indicador) indicador.textContent = `Página ${pagina}`;
    } catch (erro) {
        mostrarErro(document.getElementById("catalogo"), erro.message || "Não foi possível carregar os jogos.");
        if (anterior) anterior.disabled = pagina === 1;
        if (proxima) proxima.disabled = false;
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
async function carregarFiltroGeneros() { const filtro = document.getElementById("filtroGenero"); if (!filtro) return; try { const generos = await buscarGeneros(); filtro.replaceChildren(new Option("Todos", "")); generos.forEach(function(genero) { filtro.add(new Option(GENEROS[genero.name] || genero.name, genero.id)); }); filtro.disabled = false; } catch { filtro.replaceChildren(new Option("Erro ao carregar gêneros", "")); } }

document.addEventListener("DOMContentLoaded", function() {
    carregarCatalogo(1); carregarFiltroGeneros(); renderizarBiblioteca();
    document.getElementById("paginaAnterior")?.addEventListener("click", function() { carregarCatalogo(paginaAtual - 1); });
    document.getElementById("paginaProxima")?.addEventListener("click", function() { carregarCatalogo(paginaAtual + 1); });
    document.getElementById("filtroGenero")?.addEventListener("change", function(evento) { generoSelecionado = evento.target.value; carregarCatalogo(1); });
    document.getElementById("pesquisaJogos")?.addEventListener("input", function(evento) { clearTimeout(temporizadorPesquisa); temporizadorPesquisa = setTimeout(function() { pesquisaSelecionada = evento.target.value.trim(); carregarCatalogo(1); }, 350); });
    document.getElementById("pesquisaBiblioteca")?.addEventListener("input", renderizarBiblioteca);
    document.addEventListener("keydown", function(evento) { if (evento.key === "Escape") fecharMenu(); });
});
