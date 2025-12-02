import { createMiddleware } from 'hono/factory';
import type { JwtVariables } from 'hono/jwt';
import { jwt } from 'hono/jwt';

export const optionalAuthMiddleware = createMiddleware<{
    Variables: JwtVariables & { username?: string };
}>(async (c, next) => {
    const jwtMiddleware = jwt({
        secret: process.env.JWT_SECRET || ''
    });

    try {
        await jwtMiddleware(c, async () => {});
        const payload = c.get('jwtPayload');
        if (payload?.sub) {
            c.set('username', payload.sub as string);
        }
    } catch {
        //
    }

    return next();
});
