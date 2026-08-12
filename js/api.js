/* =========================
   BUSCAR JOGOS NA API
========================= */

async function buscarJogos(pagina = 1) {
    try {
        // Envia a página que queremos buscar
        const resposta = await fetch(`/api/games?pagina=${pagina}`);

        if (!resposta.ok) {
            throw new Error("Erro ao buscar os jogos");
        }

        // Converte a resposta para JSON
        const dados = await resposta.json();

        return dados;

    } catch (erro) {
        console.error("Erro ao buscar jogos:", erro);

        return {
            pagina: pagina,
            limite: 20,
            jogos: []
        };
    }
}