
import dotenv from 'dotenv'
import { defineConfig } from "drizzle-kit";

dotenv.config({
    quiet: true
});

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DB_URL!,
  },
  strict: true,
  verbose: true,
});
