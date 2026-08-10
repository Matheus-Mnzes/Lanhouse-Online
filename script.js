
/* =========================
   TROCAR DE ABA
========================= */

function abrirAba(id, botao) {

    // Esconde todas as abas
    const abas = document.querySelectorAll(".aba");

    abas.forEach(function(aba) {
        aba.classList.remove("ativa");
    });


    // Mostra a aba selecionada
    const abaSelecionada = document.getElementById(id);

    if (abaSelecionada) {
        abaSelecionada.classList.add("ativa");
    }


    // Remove o estado ativo dos botões
    const botoes = document.querySelectorAll(".menu-item");

    botoes.forEach(function(item) {
        item.classList.remove("ativo");
    });


    // Ativa o botão clicado
    if (botao) {
        botao.classList.add("ativo");
    }

}


/* =========================
   BOTÃO "VER JOGOS"
========================= */

function irParaJogos() {

    abrirAba("jogos");

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


    const estaEscuro =
        document.body.classList.contains("dark");


    const botao =
        document.getElementById("temaBtn");


    if (estaEscuro) {

        botao.textContent = "☀️ Desativar";

        localStorage.setItem("tema", "dark");

    } else {

        botao.textContent = "🌙 Ativar";

        localStorage.setItem("tema", "light");

    }

}


/* =========================
   CARREGAR TEMA SALVO
========================= */

function carregarTema() {

    const tema =
        localStorage.getItem("tema");


    if (tema === "dark") {

        document.body.classList.add("dark");


        const botao =
            document.getElementById("temaBtn");


        if (botao) {
            botao.textContent = "☀️ Desativar";
        }

    }

}


/* Executa quando a página carrega */

document.addEventListener(
    "DOMContentLoaded",
    carregarTema
);