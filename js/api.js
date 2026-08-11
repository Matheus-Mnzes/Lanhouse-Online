async function buscarJogos() {
    try {
        const resposta = await fetch("/api/games");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar os jogos");
        }

        const jogos = await resposta.json();

        return jogos;

    } catch (erro) {
        console.error("Erro ao buscar jogos:", erro);
        return [];
    }
}