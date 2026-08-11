export default async function handler(request, response) {
    try {
        // Credenciais armazenadas nas Environment Variables da Vercel
        const clientId = process.env.TWITCH_CLIENT_ID;
        const clientSecret = process.env.TWITCH_CLIENT_SECRET;

        // 1. Pegar o Access Token da Twitch
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

        // 2. Consultar a IGDB
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
                    where cover != null;
                    limit 10;
                `
            }
        );

        const jogos = await igdbResponse.json();

        if (!igdbResponse.ok) {
            return response.status(igdbResponse.status).json({
                erro: "Erro ao consultar a IGDB",
                detalhes: jogos
            });
        }

        // 3. Devolver os jogos para o navegador
        return response.status(200).json(jogos);

    } catch (erro) {
        return response.status(500).json({
            erro: "Erro interno",
            detalhes: erro.message
        });
    }
}