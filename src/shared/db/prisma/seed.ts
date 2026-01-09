import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const tablenames = await prisma.$queryRaw<
  Array<{ tablename: string }>
>`SELECT tablename FROM pg_tables WHERE schemaname='public'`

const tables = tablenames
  .map(({ tablename }) => tablename)
  .filter(name => name !== '_prisma_migrations')
  .map(name => `"public"."${name}"`)
  .join(', ')

try {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
} catch (error) {
  console.log({ error })
}
