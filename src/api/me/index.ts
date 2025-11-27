import { Hono } from 'hono';
import type { JwtVariables } from 'hono/jwt';

import groups from '@/api/me/groups/groups.js';
import avatar from '@/api/me/profile/avatar.js';
import password from '@/api/me/profile/change-password.js';
import profile from '@/api/me/profile/profile.js';
import visibility from '@/api/me/profile/visibility.js';

const app = new Hono<{ Variables: JwtVariables & { username: string } }>();

app.route('/profile', profile);
app.route('/avatar', avatar);
app.route('/change-password', password);
app.route('/visibility', visibility);
app.route('/groups', groups);

export default app;
