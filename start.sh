#!/bin/sh

pnpm prisma generate
pnpm prisma migrate deploy
pnpm prisma db seed
pnpm start
