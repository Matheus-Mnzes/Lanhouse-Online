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
        const limite = 20;
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

                    where cover != null & rating != null;
                    sort rating desc;

                    limit ${limite};
                    offset ${offset};
                `
            }
        );

        const jogos = await igdbResponse.json();

        if (!igdbResponse.ok) {
            return response.status(igdbResponse.status).json({
                erro: "Erro ao consultar a API",
                detalhes: jogos
            });
        }

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
