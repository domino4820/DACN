import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import 'dotenv/config';
import { Hono } from 'hono';

import adminApi from '@/api/admin/index.js';
import meApi from '@/api/me/index.js';
import publicApi from '@/api/public/index.js';
import { adminMiddleware } from '@/middleware/admin.js';
import { authMiddleware } from '@/middleware/auth.js';

const app = new Hono();

app.use('/uploads/*', serveStatic({ root: './' }));

const api = new Hono().basePath('/api');

api.use('/admin/*', adminMiddleware);
api.route('/admin', adminApi);

api.use('/me/*', authMiddleware);
api.route('/me', meApi);

api.route('/', publicApi);
app.route('/', api);

serve(
    {
        fetch: app.fetch,
        port: 3000
    },
    (info) => {
        console.log(`server is running on http://localhost:${info.port}`);
    }
);
