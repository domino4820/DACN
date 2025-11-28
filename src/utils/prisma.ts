import { PrismaClient } from '@/generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dacn?schema=public'
});

const prisma = new PrismaClient({ adapter });
export default prisma;
