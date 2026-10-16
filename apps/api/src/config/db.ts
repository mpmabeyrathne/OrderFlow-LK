import { neon } from '@neondatabase/serverless';
import env from './env.js';

export const db = neon(env.DB_URL);
