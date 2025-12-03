import { Hono } from 'hono';
import type { JwtVariables } from 'hono/jwt';

import auth from '@/api/admin/change-password.js';
import config from '@/api/admin/config.js';
import genRoadmap from '@/api/admin/gen-roadmap.js';
import quizzes from '@/api/admin/quizzes.js';
import roadmap from '@/api/admin/roadmap.js';
import topics from '@/api/admin/topics.js';
import users from '@/api/admin/users.js';

const app = new Hono<{ Variables: JwtVariables & { username: string } }>();

app.route('/change-password', auth);
app.route('/topics', topics);
app.route('/roadmap', roadmap);
app.route('/gen-roadmap', genRoadmap);
app.route('/config', config);
app.route('/quizzes', quizzes);
app.route('/users', users);

export default app;
