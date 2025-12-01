#!/bin/sh
pnpm prisma migrate reset
pnpm prisma generate
pnpm prisma migrate dev --create-only --name init
pnpm prisma migrate reset
pnpm prisma db seed
pnpm start
