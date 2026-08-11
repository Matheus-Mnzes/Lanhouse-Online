async function buscarJogos() {
    try {
        const resposta = await fetch("/api/games");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar os jogos");
        }

        const jogos = await resposta.json();

        const catalogo = document.getElementById("catalogo");

        jogos.forEach(jogo => {
            const card = document.createElement("div");

            const capa = jogo.cover
                ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${jogo.cover.image_id}.jpg`
                : "";

            card.innerHTML = `
                ${capa ? `<img src="${capa}" alt="Capa de ${jogo.name}">` : ""}
                <h2>${jogo.name}</h2>
                <p>ID: ${jogo.id}</p>
            `;

            catalogo.appendChild(card);
        });

    } catch (erro) {
        console.error("Erro:", erro);
    }
}

buscarJogos();