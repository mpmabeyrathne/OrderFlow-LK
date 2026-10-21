import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from 'ws';
import env from "../config/env.js";
import * as schema from "./schema.js";

neonConfig.webSocketConstructor = ws;

export const pool = new Pool({
  connectionString: env.DB_URL,
});

export const query = drizzle({
  client: pool,
  schema,
});