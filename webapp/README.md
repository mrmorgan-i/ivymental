# Ivymental

YouTube comment sentiment analysis dashboard. Visualizes sentiment data collected by an Azure Function pipeline that pulls comments and scores them with Azure AI Language.

## Stack

- Next.js 16 (App Router, React 19)
- Drizzle ORM + Neon PostgreSQL
- shadcn/ui + Tailwind CSS v4
- Recharts, react-wordcloud

## Setup

```bash
pnpm install
cp env.example .env.local  # fill in DATABASE_URL
pnpm dev
```

## Environment

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
