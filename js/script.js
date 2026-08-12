let paginaAtual = 1;
let generoSelecionado = "";
let jogosCatalogo = [];
let pesquisaSelecionada = "";
let temporizadorPesquisa;

const traducoesGeneros = {
    "Adventure": "Aventura", "Arcade": "Arcade", "Card & Board Game": "Cartas e tabuleiro",
    "Fighting": "Luta", "Hack and slash/Beat 'em up": "Hack and slash",
    "Indie": "Independente", "Music": "Música", "Pinball": "Pinball", "Platform": "Plataforma",
    "Point-and-click": "Apontar e clicar", "Puzzle": "Quebra-cabeça", "Quiz/Trivia": "Quiz e trivia",
    "Racing": "Corrida", "Real Time Strategy (RTS)": "Estratégia em tempo real",
    "Role-playing (RPG)": "RPG", "Shooter": "Tiro", "Simulator": "Simulação",
    "Sport": "Esporte", "Strategy": "Estratégia", "Tactical": "Tático",
    "Turn-based strategy (TBS)": "Estratégia por turnos", "Visual Novel": "Visual novel"
};

function abrirAba(id, botao) {
    document.querySelectorAll(".aba").forEach(function(aba) { aba.classList.remove("ativa"); });
    const abaSelecionada = document.getElementById(id);
    if (abaSelecionada) abaSelecionada.classList.add("ativa");

    document.querySelectorAll(".menu-item").forEach(function(item) { item.classList.remove("ativo"); });
    if (botao) botao.classList.add("ativo");
    if (id === "favoritos") renderizarFavoritos();
}

function jogar(nomeJogo) { alert("Abrindo o jogo: " + nomeJogo); }

function alternarTema() {
    document.body.classList.toggle("dark");
    const estaEscuro = document.body.classList.contains("dark");
    const botao = document.getElementById("temaBtn");
    if (botao) botao.textContent = estaEscuro ? "☀️ Desativar" : "🌙 Ativar";
    localStorage.setItem("tema", estaEscuro ? "dark" : "light");
}

function carregarTema() {
    if (localStorage.getItem("tema") !== "dark") return;
    document.body.classList.add("dark");
    const botao = document.getElementById("temaBtn");
    if (botao) botao.textContent = "☀️ Desativar";
}

function obterFavoritos() {
    try { return JSON.parse(localStorage.getItem("favoritos") || "[]"); }
    catch { return []; }
}

function jogoEhFavorito(id) { return obterFavoritos().some(function(jogo) { return jogo.id === id; }); }

function alternarFavorito(jogo) {
    const favoritos = obterFavoritos();
    const indice = favoritos.findIndex(function(item) { return item.id === jogo.id; });
    if (indice >= 0) favoritos.splice(indice, 1);
    else favoritos.push(jogo);
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    renderizarCatalogoAtual();
    renderizarFavoritos();
}

async function carregarCatalogo(pagina, adicionar) {
    const botaoMais = document.getElementById("carregarMais");
    if (botaoMais) { botaoMais.disabled = true; botaoMais.textContent = "Carregando..."; }

    try {
        const dados = await buscarJogos(pagina, generoSelecionado, pesquisaSelecionada);
        const jogos = dados.jogos || [];
        jogosCatalogo = adicionar ? jogosCatalogo.concat(jogos) : jogos;
        paginaAtual = pagina;
        renderizarCatalogoAtual();

        if (!adicionar && !generoSelecionado && !pesquisaSelecionada) {
            preencherCatalogo(document.getElementById("jogos-populares"), jogos.slice(0, 3));
        }

        if (botaoMais) {
            botaoMais.hidden = jogos.length < dados.limite;
            botaoMais.disabled = false;
            botaoMais.textContent = "Carregar mais";
        }
    } catch (erro) {
        mostrarErroCatalogo(document.getElementById("catalogo"), erro.message || "Não foi possível carregar os jogos.");
        if (botaoMais) { botaoMais.disabled = false; botaoMais.textContent = "Tentar novamente"; }
    }
}

function renderizarCatalogoAtual() {
    preencherCatalogo(document.getElementById("catalogo"), jogosCatalogo, "Nenhum jogo encontrado.");
}

function preencherCatalogo(catalogo, jogos, mensagemVazia) {
    if (!catalogo) return;
    catalogo.replaceChildren();

    if (!jogos.length) {
        if (mensagemVazia) mostrarErroCatalogo(catalogo, mensagemVazia);
        return;
    }

    jogos.forEach(function(jogo) { catalogo.appendChild(criarCardJogo(jogo)); });
}

function criarCardJogo(jogo) {
    const card = document.createElement("article");
    card.className = "jogo-card";

    const imagem = document.createElement("div");
    imagem.className = "jogo-imagem";
    if (jogo.cover?.image_id) {
        const capa = document.createElement("img");
        capa.src = `https://images.igdb.com/igdb/image/upload/t_cover_big/${jogo.cover.image_id}.jpg`;
        capa.alt = `Capa de ${jogo.name}`;
        capa.loading = "lazy";
        imagem.appendChild(capa);
    } else imagem.textContent = "🎮";

    const info = document.createElement("div");
    info.className = "jogo-info";
    const titulo = document.createElement("h3");
    titulo.textContent = jogo.name;
    const genero = document.createElement("p");
    genero.textContent = jogo.genres?.length
        ? jogo.genres.map(function(item) { return traduzirGenero(item.name); }).join(", ")
        : "Gênero não informado";

    const acoes = document.createElement("div");
    acoes.className = "jogo-acoes";
    const jogarBotao = document.createElement("button");
    jogarBotao.type = "button";
    jogarBotao.textContent = "Jogar";
    jogarBotao.addEventListener("click", function() { jogar(jogo.name); });

    const favoritoBotao = document.createElement("button");
    favoritoBotao.type = "button";
    favoritoBotao.className = "botao-favorito" + (jogoEhFavorito(jogo.id) ? " favorito" : "");
    favoritoBotao.textContent = jogoEhFavorito(jogo.id) ? "★ Favorito" : "☆ Favoritar";
    favoritoBotao.setAttribute("aria-label", `Favoritar ${jogo.name}`);
    favoritoBotao.addEventListener("click", function() { alternarFavorito(jogo); });

    acoes.append(jogarBotao, favoritoBotao);
    info.append(titulo, genero, acoes);
    card.append(imagem, info);
    return card;
}

function traduzirGenero(nome) { return traducoesGeneros[nome] || nome; }

function renderizarFavoritos() {
    const termo = document.getElementById("pesquisaFavoritos")?.value.trim().toLocaleLowerCase("pt-BR") || "";
    const favoritos = obterFavoritos().filter(function(jogo) {
        return jogo.name.toLocaleLowerCase("pt-BR").includes(termo);
    });
    const todosFavoritos = obterFavoritos();
    const mensagem = document.getElementById("mensagemFavoritosVazia");
    preencherCatalogo(document.getElementById("catalogoFavoritos"), favoritos);
    if (mensagem) {
        mensagem.hidden = todosFavoritos.length > 0;
        if (todosFavoritos.length > 0 && !favoritos.length) {
            mensagem.hidden = false;
            mensagem.querySelector("h2").textContent = "Nenhum favorito encontrado";
            mensagem.querySelector("p").textContent = "Tente outra pesquisa.";
        } else if (!todosFavoritos.length) {
            mensagem.querySelector("h2").textContent = "Nenhum favorito ainda";
            mensagem.querySelector("p").textContent = "Adicione seus jogos favoritos para encontrá-los rapidamente.";
        }
    }
}

function mostrarErroCatalogo(catalogo, texto) {
    if (!catalogo) return;
    catalogo.replaceChildren();
    const mensagem = document.createElement("p");
    mensagem.className = "catalogo-status";
    mensagem.textContent = texto;
    catalogo.appendChild(mensagem);
}

async function carregarFiltroGeneros() {
    const filtro = document.getElementById("filtroGenero");
    if (!filtro) return;
    try {
        const generos = await buscarGeneros();
        filtro.replaceChildren(new Option("Todos os gêneros", ""));
        generos.forEach(function(genero) { filtro.add(new Option(traduzirGenero(genero.name), genero.id)); });
        filtro.disabled = false;
    } catch (erro) { filtro.replaceChildren(new Option("Não foi possível carregar gêneros", "")); }
}

document.addEventListener("DOMContentLoaded", function() {
    carregarTema();
    carregarCatalogo(1, false);
    carregarFiltroGeneros();
    renderizarFavoritos();

    document.getElementById("carregarMais")?.addEventListener("click", function() { carregarCatalogo(paginaAtual + 1, true); });
    document.getElementById("filtroGenero")?.addEventListener("change", function(evento) {
        generoSelecionado = evento.target.value;
        carregarCatalogo(1, false);
    });
    document.getElementById("pesquisaJogos")?.addEventListener("input", function(evento) {
        clearTimeout(temporizadorPesquisa);
        temporizadorPesquisa = setTimeout(function() {
            pesquisaSelecionada = evento.target.value.trim();
            carregarCatalogo(1, false);
        }, 350);
    });
    document.getElementById("pesquisaFavoritos")?.addEventListener("input", renderizarFavoritos);
});
