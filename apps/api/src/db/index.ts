
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import env from "../config/env.js";
import * as schema from "./schema.js";

const sql = neon(env.DB_URL);

export const query = drizzle({
  client: sql,
  schema,
});
