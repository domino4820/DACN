import prisma from '@/utils/prisma.js';
import { hash } from 'bcrypt';

const main = async () => {
    const hashedPassword = await hash('admin', 10);
    const admin = await prisma.admin.upsert({
        where: { username: 'admin' },
        update: {
            password: hashedPassword
        },
        create: {
            username: 'admin',
            password: hashedPassword
        }
    });
    console.log({ admin });
};

try {
    await main();
} catch (e) {
    console.error(e);
    process.exit(1);
} finally {
    await prisma.$disconnect();
}
