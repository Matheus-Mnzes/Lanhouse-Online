let paginaAtual = 1;

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

async function carregarCatalogo(pagina, adicionar) {
    const botaoMais = document.getElementById("carregarMais");

    if (botaoMais) {
        botaoMais.disabled = true;
        botaoMais.textContent = "Carregando...";
    }

    try {
        const dados = await buscarJogos(pagina);
        const jogos = dados.jogos || [];
        const catalogo = document.getElementById("catalogo");

        preencherCatalogo(catalogo, jogos, adicionar);

        if (!adicionar) {
            preencherCatalogo(
                document.getElementById("jogos-populares"),
                jogos.slice(0, 3),
                false
            );
        }

        paginaAtual = pagina;

        if (botaoMais) {
            if (jogos.length < dados.limite) {
                botaoMais.hidden = true;
            } else {
                botaoMais.hidden = false;
                botaoMais.disabled = false;
                botaoMais.textContent = "Carregar mais";
            }
        }
    } catch (erro) {
        const mensagem = erro.message || "Não foi possível carregar os jogos.";
        mostrarErroCatalogo(document.getElementById("catalogo"), mensagem);

        if (!adicionar) {
            mostrarErroCatalogo(document.getElementById("jogos-populares"), mensagem);
        }

        if (botaoMais) {
            botaoMais.disabled = false;
            botaoMais.textContent = "Tentar novamente";
        }
    }
}

function preencherCatalogo(catalogo, jogos, adicionar) {
    if (!catalogo) {
        return;
    }

    if (!adicionar) {
        catalogo.replaceChildren();
    }

    if (!jogos.length && !adicionar) {
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
    carregarCatalogo(1, false);

    const botaoMais = document.getElementById("carregarMais");
    if (botaoMais) {
        botaoMais.addEventListener("click", function() {
            carregarCatalogo(paginaAtual + 1, true);
        });
    }
});
