# DACN

## db setup

```bash
curl -fsSL https://get.docker.com | sh
docker compose up -d
pnpm prisma migrate dev --create-only --name init
pnpm prisma migrate reset
pnpm prisma db seed
```
