import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const NODE_ENV = process.env.NODE_ENV || 'development';

const envFile =
    NODE_ENV === 'production'
        ? '.env.prod'
        : NODE_ENV === 'test'
            ? '.env.test'
            : '.env.dev';

const envPath = path.resolve(process.cwd(), envFile);

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded environment file: ${envFile}`);
} else {
    dotenv.config();
    console.log(`⚠️ No ${envFile} found → using process.env only`);
}

console.log(`🌍 NODE_ENV = ${NODE_ENV}`);

export { NODE_ENV };