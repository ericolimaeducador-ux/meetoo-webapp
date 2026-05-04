# Meetoo Webapp

Aplicativo React/Vite para descoberta local consentida, perfis verificados, solicitacoes de conversa e chat.

## Stack

- React 18
- Vite
- Tailwind CSS
- Supabase como backend, autenticacao, banco e storage
- Google Maps preparado para integracao futura

## Ambiente

Crie um `.env.local` com:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_MAPS_API_KEY=
```

`VITE_GOOGLE_MAPS_API_KEY` esta reservado para a integracao futura de mapas.

## Supabase

Nome recomendado do projeto e do repositorio: `meetoo-webapp`.

1. Crie um projeto no Supabase chamado `meetoo-webapp`.
2. Copie `Project URL` para `VITE_SUPABASE_URL`.
3. Copie a chave `anon public` para `VITE_SUPABASE_ANON_KEY`.
4. Rode o SQL de `supabase/migrations/20260504130000_initial_schema.sql` no SQL Editor do Supabase.
5. Em Authentication > Providers, habilite Email. O app usa login por link magico via `signInWithOtp`.
6. Em Authentication > URL Configuration, adicione a URL local e a URL de producao em Redirect URLs.

Para usar a tela `/admin`, defina `app_metadata.role = "admin"` no usuario administrador. Isso deve ser feito pelo painel do Supabase ou por uma rotina server-side com service role, nunca no frontend.

## Rodar localmente

```bash
npm install
npm run dev
```

## Tabelas esperadas no Supabase

- `profiles`
- `conversation_requests`
- `conversations`
- `messages`
- `blocks`
- `reports`

O schema SQL esta em `supabase/migrations/20260504130000_initial_schema.sql`.
Os schemas de referencia estao preservados em `Entities/`.
