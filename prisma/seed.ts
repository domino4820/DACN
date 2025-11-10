import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

const main = async () => {
    const hashedPassword = await hash('admin', 10);
    await prisma.admin.upsert({
        where: { username: 'admin' },
        update: {
            password: hashedPassword
        },
        create: {
            username: 'admin',
            password: hashedPassword
        }
    });
};

try {
    await main();
} catch (e) {
    console.error(e);
    process.exit(1);
} finally {
    await prisma.$disconnect();
}
