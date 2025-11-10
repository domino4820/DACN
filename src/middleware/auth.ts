import { createMiddleware } from 'hono/factory';
import type { JwtVariables } from 'hono/jwt';
import { jwt } from 'hono/jwt';

export const authMiddleware = createMiddleware<{
    Variables: JwtVariables & { username: string };
}>(async (c, next) => {
    const jwtMiddleware = jwt({
        secret: process.env.JWT_SECRET || ''
    });

    try {
        await jwtMiddleware(c, async () => {});
    } catch {
        return c.json(null, 401);
    }

    const payload = c.get('jwtPayload');
    if (!payload?.sub) {
        return c.json(null, 401);
    }
    c.set('username', payload.sub as string);
    return next();
});
