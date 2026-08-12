function abrirAba(id, botao) {
    document.querySelectorAll(".aba").forEach(function(aba) {
        aba.classList.remove("ativa");
    });

    const abaSelecionada = document.getElementById(id);
    if (abaSelecionada) {
        abaSelecionada.classList.add("ativa");
    }

    document.querySelectorAll(".menu-item").forEach(function(item) {
        item.classList.remove("ativo");
    });

    if (botao) {
        botao.classList.add("ativo");
    }
}

function jogar(nomeJogo) {
    alert("Abrindo o jogo: " + nomeJogo);
}

function alternarTema() {
    document.body.classList.toggle("dark");

    const estaEscuro = document.body.classList.contains("dark");
    const botao = document.getElementById("temaBtn");

    if (botao) {
        botao.textContent = estaEscuro ? "☀️ Desativar" : "🌙 Ativar";
    }

    localStorage.setItem("tema", estaEscuro ? "dark" : "light");
}

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

async function carregarCatalogo() {
    try {
        const jogos = await buscarJogos();

        preencherCatalogo(document.getElementById("catalogo"), jogos);
        preencherCatalogo(document.getElementById("jogos-populares"), jogos.slice(0, 3));
    } catch (erro) {
        const mensagem = erro.message === "Failed to fetch"
            ? "A API não está disponível neste servidor. Abra o projeto pela Vercel."
            : erro.message;

        mostrarErroCatalogo(document.getElementById("catalogo"), mensagem);
        mostrarErroCatalogo(document.getElementById("jogos-populares"), mensagem);
    }
}

function preencherCatalogo(catalogo, jogos) {
    if (!catalogo) {
        return;
    }

    catalogo.replaceChildren();

    if (!jogos.length) {
        const mensagem = document.createElement("p");
        mensagem.className = "catalogo-status";
        mensagem.textContent = "A API não retornou jogos no momento.";
        catalogo.appendChild(mensagem);
        return;
    }

    jogos.forEach(function(jogo) {
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
        } else {
            imagem.textContent = "🎮";
        }

        const info = document.createElement("div");
        info.className = "jogo-info";

        const titulo = document.createElement("h3");
        titulo.textContent = jogo.name;

        const genero = document.createElement("p");
        genero.textContent = jogo.genres?.length
            ? jogo.genres.map(function(item) { return item.name; }).join(", ")
            : "Gênero não informado";

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

document.addEventListener("DOMContentLoaded", function() {
    carregarTema();
    carregarCatalogo();
});
