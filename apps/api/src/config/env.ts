import z from "zod";
import dotenv from "dotenv";

dotenv.config();

const ENV = z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    NODE_ENV: z.enum(['dev','prod','stage']).default('dev')
})

const env = ENV.parse(process.env);

export default env;