import roadmaps from '@/api/public/roadmaps.js';
import topics from '@/api/public/topics.js';
import { Hono } from 'hono';
const app = new Hono();

import adminLogin from '@/api/public/auth/admin-login.js';
import login from '@/api/public/auth/login.js';
import register from '@/api/public/auth/register.js';
import verify from '@/api/public/auth/verify.js';

app.route('/login', login);
app.route('/admin-login', adminLogin);
app.route('/register', register);
app.route('/verify', verify);
app.route('/roadmaps', roadmaps);
app.route('/topics', topics);
export default app;
