import 'dotenv/config'

import {defineConfig} from 'drizzle-kit'

export default defineConfig({
    schema : './src/infra/postgres/schema/index.js',
    out : './src/infra/postgres/migrations',
    dialect : 'postgresql',
    dbCredentials : {
        url : process.env.DATABASE_URL
    }
})
