# YCloud — Lanhouse Online

YCloud é uma plataforma acadêmica de jogos desenvolvida em HTML, CSS e JavaScript puro, com foco em catálogo, biblioteca pessoal, planos e autenticação de usuário.

## Visão geral

O projeto simula um serviço de streaming e locação de jogos, com:

- catálogo de jogos em destaque
- biblioteca pessoal do usuário
- seleção de planos
- área de conta com dados do perfil
- login e criação de conta
- painel administrativo para adicionar jogos e planos
- integração com API externa via Vercel

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript vanilla
- LocalStorage para persistência do cliente
- Vercel Functions para rota de API
- Twitch/IGDB para dados do catálogo

## Estrutura do projeto

- `index.html` — estrutura principal da aplicação
- `css/` — estilos globais e hero layout
- `js/` — lógica da interface, autenticação, biblioteca e catálogo
- `api/games.js` — endpoint serverless para buscar dados de jogos

## Funcionalidades

### Catálogo
- exibição de jogos em destaque
- filtros por gênero e busca
- paginação básica
- cards com capa, nome e gênero

### Biblioteca
- adição e remoção de jogos favoritos/biblioteca
- persistência por usuário no LocalStorage
- estado visual atualizado em tempo real

### Conta
- login de usuário
- criação de conta com dados pessoais
- edição de dados cadastrais
- visualização de informações na área da conta

### Planos
- cards de assinatura
- seleção de plano por usuário
- atualização do plano atual

### Administração
- cadastro de novos jogos
- cadastro de planos customizados
- gerenciamento interno simplificado

## Como executar

### 1. Clone o projeto

```bash
git clone https://github.com/seu-usuario/Lanhouse-Online.git
cd Lanhouse-Online
```

### 2. Configure as variáveis de ambiente

Este projeto usa a API da IGDB por meio de uma função serverless da Vercel. Para funcionar corretamente, deve ser executado em ambiente Vercel ou em um ambiente equivalente com as variáveis configuradas.

Crie as seguintes variáveis de ambiente:

- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`

Essas chaves devem ser obtidas no portal de desenvolvedores da Twitch.

### 3. Rode localmente com Vercel

```bash
vercel dev
```

> Importante: abrir o arquivo `index.html` diretamente não vai disponibilizar a rota `/api/games`, então a execução via Vercel é necessária para o catálogo funcionar.

## Contas de teste

As contas padrão do projeto são:

- Usuário: `joao` / senha: `1234`
- Usuário: `maria` / senha: `senha`
- Administrador: `admin` / senha: `admin`

## Deploy

Para publicar o projeto:

1. conecte o repositório à Vercel
2. configure as variáveis de ambiente
3. faça o deploy do projeto

## Observações

- o armazenamento principal da aplicação é feito no navegador via LocalStorage
- a API externa depende de credenciais válidas do Twitch/IGDB
- o projeto foi pensado como aplicação acadêmica e de demonstração

## Licença

Este projeto está sob a licença MIT. Consulte o arquivo LICENSE para mais detalhes.
