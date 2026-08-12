async function buscarJogos() {
    try {
        const resposta = await fetch("/api/games");

        if (!resposta.ok) {
            const dadosErro = await resposta.json().catch(function() {
                return {};
            });

            throw new Error(
                dadosErro.erro || `Erro ao buscar os jogos (${resposta.status})`
            );
        }

        const jogos = await resposta.json();

        return jogos;

    } catch (erro) {
        console.error("Erro ao buscar jogos:", erro);
        throw erro;
    }
}
