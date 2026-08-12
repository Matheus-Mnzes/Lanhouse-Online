export default async function handler(request, response) {
    try {
        // Credenciais armazenadas nas variáveis de ambiente da Vercel
        const clientId = process.env.TWITCH_CLIENT_ID;
        const clientSecret = process.env.TWITCH_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return response.status(500).json({
                erro: "Credenciais da Twitch/IGDB não configuradas no servidor."
            });
        }

        // 1. Paginação
        const url = new URL(request.url, "https://ycloud.local");
        const paginaSolicitada = Number(url.searchParams.get("pagina"));
        const pagina = Number.isInteger(paginaSolicitada) && paginaSolicitada > 0
            ? paginaSolicitada
            : 1;
        const generoSolicitado = Number(url.searchParams.get("genero"));
        const genero = Number.isInteger(generoSolicitado) && generoSolicitado > 0
            ? generoSolicitado
            : null;
        const pesquisa = (url.searchParams.get("pesquisa") || "")
            .trim()
            .slice(0, 100)
            .replace(/[\\"]/g, "\\$&");
        const recurso = url.searchParams.get("recurso");
        const limite = 15;
        const offset = (pagina - 1) * limite;

        // 2. Pegar o Access Token da API
        const tokenResponse = await fetch(
            "https://id.twitch.tv/oauth2/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: "client_credentials"
                })
            }
        );

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            return response.status(tokenResponse.status).json({
                erro: "Erro ao obter o token da Twitch",
                detalhes: tokenData
            });
        }

        const accessToken = tokenData.access_token;

        if (recurso === "generos") {
            const generosResponse = await fetch(
                "https://api.igdb.com/v4/genres",
                {
                    method: "POST",
                    headers: {
                        "Client-ID": clientId,
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "text/plain"
                    },
                    body: "fields id, name; sort name asc; limit 500;"
                }
            );

            const generos = await generosResponse.json();

            if (!generosResponse.ok) {
                return response.status(generosResponse.status).json({
                    erro: "Erro ao consultar os gêneros na API",
                    detalhes: generos
                });
            }

            return response.status(200).json(generos);
        }

        // 3. Consultar a API
        const igdbResponse = await fetch(
            "https://api.igdb.com/v4/games",
            {
                method: "POST",
                headers: {
                    "Client-ID": clientId,
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "text/plain"
                },
                body: `
                    fields
                        id,
                        name,
                        rating,
                        cover.image_id,
                        genres.name,
                        first_release_date,
                        platforms.name;

                    ${pesquisa ? `search "${pesquisa}";` : ""}
                    where cover != null & rating != null & rating_count >= 500 ${genero ? ` & genres = (${genero})` : ""};

                    ${pesquisa ? "" : "sort rating desc;"}

                    limit ${limite};
                    offset ${offset};
                `
            }
        );

        const jogos = await igdbResponse.json();

        if (!igdbResponse.ok) {
            return response.status(igdbResponse.status).json({
                erro: jogos.message || "Erro ao consultar a API",
                detalhes: jogos
            });
        }

        const traducoesGeneros = {
            "Pinball": "Pinball",
            "Adventure": "Aventura",
            "Indie": "Indie",
            "Arcade": "Arcade",
            "Visual Novel": "Visual Novel",
            "Card & Board Game": "Jogos de Cartas e Tabuleiro",
            "MOBA": "MOBA",
            "Point-and-click": "Aponte e Clique",
            "Fighting": "Luta",
            "Shooter": "Tiro",
            "Music": "Música",
            "Platform": "Plataforma",
            "Puzzle": "Quebra-cabeça",
            "Racing": "Corrida",
            "Real Time Strategy (RTS)": "Estratégia em Tempo Real",
            "Role-playing (RPG)": "RPG",
            "Simulator": "Simulação",
            "Sport": "Esporte",
            "Strategy": "Estratégia",
            "Turn-based strategy (TBS)": "Estratégia por Turnos",
            "Tactical": "Tático",
            "Hack and slash/Beat 'em up": "Hack and Slash / Beat 'em Up",
            "Quiz/Trivia": "Quiz/Trivia"
        };

        jogos.forEach(jogo => {
            if (jogo.genres) {
                jogo.genres.forEach(genero => {
                    genero.name = traducoesGeneros[genero.name] || genero.name;
                });
            }
        });

        // 4. Devolver os jogos para o navegador
        return response.status(200).json({
            pagina: pagina,
            limite: limite,
            jogos: jogos
        });

    } catch (erro) {
        return response.status(500).json({
            erro: "Erro interno",
            detalhes: erro.message
        });
    }
}
