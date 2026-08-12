let paginaAtual = 1;
let generoSelecionado = "";
let pesquisaSelecionada = "";
let jogosCatalogo = [];
let temporizadorPesquisa;

const traducoesGeneros = {
    "Adventure": "Aventura", "Arcade": "Arcade", "Card & Board Game": "Cartas e tabuleiro",
    "Fighting": "Luta", "Hack and slash/Beat 'em up": "Hack and slash", "Indie": "Independente",
    "Music": "Música", "Pinball": "Pinball", "Platform": "Plataforma", "Point-and-click": "Apontar e clicar",
    "Puzzle": "Quebra-cabeça", "Quiz/Trivia": "Quiz e trivia", "Racing": "Corrida",
    "Real Time Strategy (RTS)": "Estratégia em tempo real", "Role-playing (RPG)": "RPG",
    "Shooter": "Tiro", "Simulator": "Simulação", "Sport": "Esporte", "Strategy": "Estratégia",
    "Tactical": "Tático", "Turn-based strategy (TBS)": "Estratégia por turnos", "Visual Novel": "Visual novel"
};

function abrirAba(id, botao) {
    document.querySelectorAll(".aba").forEach(function(aba) { aba.classList.remove("ativa"); });
    document.getElementById(id)?.classList.add("ativa");
    document.querySelectorAll(".menu-item").forEach(function(item) { item.classList.remove("ativo"); });
    if (botao) botao.classList.add("ativo");
    if (id === "biblioteca") renderizarBiblioteca();
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

function obterBiblioteca() {
    try {
        return JSON.parse(localStorage.getItem("biblioteca") || localStorage.getItem("favoritos") || "[]");
    } catch { return []; }
}

function jogoEstaNaBiblioteca(id) {
    return obterBiblioteca().some(function(jogo) { return jogo.id === id; });
}

function alternarBiblioteca(jogo) {
    const biblioteca = obterBiblioteca();
    const indice = biblioteca.findIndex(function(item) { return item.id === jogo.id; });
    if (indice >= 0) biblioteca.splice(indice, 1);
    else biblioteca.push(jogo);
    localStorage.setItem("biblioteca", JSON.stringify(biblioteca));
    localStorage.removeItem("favoritos");
    renderizarCatalogo();
    renderizarBiblioteca();
}

async function carregarCatalogo(pagina, adicionar) {
    const botaoMais = document.getElementById("carregarMais");
    if (botaoMais) { botaoMais.disabled = true; botaoMais.textContent = "Carregando..."; }

    try {
        const dados = await buscarJogos(pagina, generoSelecionado, pesquisaSelecionada);
        const jogos = dados.jogos || [];
        jogosCatalogo = adicionar ? jogosCatalogo.concat(jogos) : jogos;
        paginaAtual = pagina;
        renderizarCatalogo();

        if (!adicionar && !generoSelecionado && !pesquisaSelecionada) {
            preencherCatalogo(document.getElementById("jogos-populares"), jogos.slice(0, 3));
        }

        if (botaoMais) {
            botaoMais.hidden = jogos.length < dados.limite;
            botaoMais.disabled = false;
            botaoMais.textContent = "Carregar mais";
        }
    } catch (erro) {
        mostrarMensagem(document.getElementById("catalogo"), erro.message || "Não foi possível carregar os jogos.");
        if (botaoMais) { botaoMais.disabled = false; botaoMais.textContent = "Tentar novamente"; }
    }
}

function renderizarCatalogo() {
    preencherCatalogo(document.getElementById("catalogo"), jogosCatalogo, "Nenhum jogo encontrado.");
}

function preencherCatalogo(catalogo, jogos, mensagemVazia, naBiblioteca) {
    if (!catalogo) return;
    catalogo.replaceChildren();
    if (!jogos.length) {
        if (mensagemVazia) mostrarMensagem(catalogo, mensagemVazia);
        return;
    }
    jogos.forEach(function(jogo) { catalogo.appendChild(criarCardJogo(jogo, naBiblioteca)); });
}

function criarCardJogo(jogo, naBiblioteca) {
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
    if (naBiblioteca) {
        const jogarBotao = document.createElement("button");
        jogarBotao.type = "button";
        jogarBotao.textContent = "Jogar";
        jogarBotao.addEventListener("click", function() { jogar(jogo.name); });
        acoes.appendChild(jogarBotao);
    }

    const bibliotecaBotao = document.createElement("button");
    bibliotecaBotao.type = "button";
    bibliotecaBotao.className = "botao-favorito" + (jogoEstaNaBiblioteca(jogo.id) ? " favorito" : "");
    bibliotecaBotao.textContent = jogoEstaNaBiblioteca(jogo.id) ? "✓ Na biblioteca" : "+ Biblioteca";
    bibliotecaBotao.addEventListener("click", function() { alternarBiblioteca(jogo); });
    acoes.appendChild(bibliotecaBotao);

    info.append(titulo, genero, acoes);
    card.append(imagem, info);
    return card;
}

function traduzirGenero(nome) { return traducoesGeneros[nome] || nome; }

function renderizarBiblioteca() {
    const termo = document.getElementById("pesquisaBiblioteca")?.value.trim().toLocaleLowerCase("pt-BR") || "";
    const todosJogos = obterBiblioteca();
    const jogos = todosJogos.filter(function(jogo) { return jogo.name.toLocaleLowerCase("pt-BR").includes(termo); });
    preencherCatalogo(document.getElementById("catalogoBiblioteca"), jogos, undefined, true);

    const mensagem = document.getElementById("mensagemBibliotecaVazia");
    if (!mensagem) return;
    mensagem.hidden = todosJogos.length > 0 && jogos.length > 0;
    mensagem.querySelector("h2").textContent = todosJogos.length ? "Nenhum jogo encontrado" : "Nenhum jogo na biblioteca";
    mensagem.querySelector("p").textContent = todosJogos.length ? "Tente outra pesquisa." : "Adicione jogos para encontrá-los rapidamente.";
}

function mostrarMensagem(catalogo, texto) {
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
    } catch { filtro.replaceChildren(new Option("Não foi possível carregar gêneros", "")); }
}

document.addEventListener("DOMContentLoaded", function() {
    carregarTema();
    carregarCatalogo(1, false);
    carregarFiltroGeneros();
    renderizarBiblioteca();
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
    document.getElementById("pesquisaBiblioteca")?.addEventListener("input", renderizarBiblioteca);
});
