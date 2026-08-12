/* =========================
   BUSCAR JOGOS NA API
========================= */

async function buscarJogos(pagina = 1) {
    try {
        // Envia a página que queremos buscar
        const resposta = await fetch(`/api/games?pagina=${pagina}`);

        if (!resposta.ok) {
            const dadosErro = await resposta.json().catch(function() {
                return {};
            });

            throw new Error(
                dadosErro.erro || `Erro ao buscar os jogos (${resposta.status})`
            );
        }

        // Converte a resposta para JSON
        const dados = await resposta.json();

        return dados;

    } catch (erro) {
        console.error("Erro ao buscar jogos:", erro);

        throw erro;
    }
}
