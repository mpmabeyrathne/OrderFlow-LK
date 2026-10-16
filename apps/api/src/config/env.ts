import z from "zod";
import dotenv from "dotenv";

dotenv.config({
    quiet: true
});

const ENV = z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    NODE_ENV: z.enum(['dev','prod','stage']).default('dev'),
    DB_URL: z.string().min(1),
})

const env = ENV.parse(process.env);

export default env;