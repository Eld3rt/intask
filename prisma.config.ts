import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'src/shared/db/prisma/schema.prisma',
  migrations: {
    path: 'src/shared/db/prisma/migrations',
    seed: 'tsx src/shared/db/prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
})
