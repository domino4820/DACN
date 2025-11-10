import { Hono } from 'hono';
import type { JwtVariables } from 'hono/jwt';

import config from '@/api/admin/config.js';
import roadmap from '@/api/admin/roadmap.js';
import topics from '@/api/admin/topics.js';

const app = new Hono<{ Variables: JwtVariables & { username: string } }>();

app.route('/topics', topics);
app.route('/roadmap', roadmap);
app.route('/config', config);

export default app;
