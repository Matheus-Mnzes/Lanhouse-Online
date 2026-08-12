/* =========================
   TROCAR DE ABA
========================= */

function abrirAba(id, botao) {
    // Esconde todas as abas
    document.querySelectorAll(".aba").forEach(function(aba) {
        aba.classList.remove("ativa");
    });

    // Mostra a aba selecionada
    const abaSelecionada = document.getElementById(id);
    if (abaSelecionada) {
        abaSelecionada.classList.add("ativa");
    }

    // Remove o estado ativo dos botões
    document.querySelectorAll(".menu-item").forEach(function(item) {
        item.classList.remove("ativo");
    });

    // Ativa o botão clicado
    if (botao) {
        botao.classList.add("ativo");
    }
}

/* =========================
   JOGAR
========================= */

function jogar(nomeJogo) {
    alert("Abrindo o jogo: " + nomeJogo);
}

/* =========================
   TEMA
========================= */

function alternarTema() {
    document.body.classList.toggle("dark");

    const estaEscuro = document.body.classList.contains("dark");
    const botao = document.getElementById("temaBtn");

    if (botao) {
        botao.textContent = estaEscuro ? "☀️ Desativar" : "🌙 Ativar";
    }

    localStorage.setItem("tema", estaEscuro ? "dark" : "light");
}

/* =========================
   CARREGAR TEMA SALVO
========================= */

function carregarTema() {
    if (localStorage.getItem("tema") !== "dark") {
        return;
    }

    document.body.classList.add("dark");

    const botao = document.getElementById("temaBtn");
    if (botao) {
        botao.textContent = "☀️ Desativar";
    }
}

/* =========================
   CATÁLOGO DE JOGOS
========================= */

let paginaAtual = 1;

async function carregarCatalogo(pagina = 1) {
    try {
        // Busca os jogos através do api.js
        const dados = await buscarJogos(pagina);
        const jogos = dados.jogos;

        const catalogo = document.getElementById("catalogo");

        if (!catalogo) {
            console.error("Elemento #catalogo não encontrado.");
            return;
        }

        preencherCatalogo(catalogo, jogos);
        paginaAtual = pagina;

    } catch (erro) {
        console.error("Erro ao carregar catálogo:", erro);

        const catalogo = document.getElementById("catalogo");
        mostrarErroCatalogo(catalogo, "Não foi possível carregar os jogos.");
    }
}

/* =========================
   PREENCHER CATÁLOGO
========================= */

function preencherCatalogo(catalogo, jogos) {
    if (!catalogo) {
        return;
    }

    catalogo.replaceChildren();

    if (!jogos || !jogos.length) {
        const mensagem = document.createElement("p");
        mensagem.className = "catalogo-status";
        mensagem.textContent = "A API não retornou jogos no momento.";
        catalogo.appendChild(mensagem);
        return;
    }

    // Cria um card para cada jogo
    jogos.forEach(function(jogo) {
        const card = document.createElement("article");
        card.className = "jogo-card";

        /* CAPA DO JOGO */

        const imagem = document.createElement("div");
        imagem.className = "jogo-imagem";

        if (jogo.cover?.image_id) {
            const capa = document.createElement("img");
            capa.src = `https://images.igdb.com/igdb/image/upload/t_cover_big/${jogo.cover.image_id}.jpg`;
            capa.alt = `Capa de ${jogo.name}`;
            capa.loading = "lazy";
            imagem.appendChild(capa);
        } else {
            imagem.textContent = "🎮";
        }

        /* INFORMAÇÕES DO JOGO */

        const info = document.createElement("div");
        info.className = "jogo-info";

        const titulo = document.createElement("h3");
        titulo.textContent = jogo.name;

        const genero = document.createElement("p");
        genero.textContent = jogo.genres?.length
            ? jogo.genres.map(function(item) {
                return item.name;
            }).join(", ")
            : "Gênero não informado";

        /* BOTÃO JOGAR */

        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = "Jogar";

        botao.addEventListener("click", function() {
            jogar(jogo.name);
        });

        info.append(titulo, genero, botao);
        card.append(imagem, info);
        catalogo.appendChild(card);
    });
}

/* =========================
   ERRO DO CATÁLOGO
========================= */

function mostrarErroCatalogo(catalogo, texto) {
    if (!catalogo) {
        return;
    }

    catalogo.replaceChildren();

    const mensagem = document.createElement("p");
    mensagem.className = "catalogo-status";
    mensagem.textContent = texto;
    catalogo.appendChild(mensagem);
}

/* =========================
   INICIALIZAÇÃO
========================= */

document.addEventListener("DOMContentLoaded", function() {
    carregarTema();
    carregarCatalogo(1);
});