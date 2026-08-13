# YCloud — Lanhouse Online

Projeto acadêmico de uma plataforma de locação de jogos (front-end com catálogo via API).

## Configuração da API de jogos

O catálogo usa a API IGDB por meio de uma função da Vercel. Para funcionar, o projeto precisa ser executado ou publicado pela Vercel — abrir o `index.html` ou usar o Live Server não disponibiliza a rota `/api/games`.

1. Crie uma aplicação no [Twitch Developers](https://dev.twitch.tv/console/apps) e copie o Client ID e o Client Secret.
2. Na Vercel, abra o projeto em **Settings → Environment Variables** e cadastre `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET`.
3. Faça um novo deploy.

Para testar localmente, instale a CLI da Vercel, crie um arquivo `.env.local` a partir de `.env.example` com suas credenciais e execute `vercel dev` na pasta do projeto.
