import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "programs" ADD COLUMN "body" jsonb;
  ALTER TABLE "_programs_v" ADD COLUMN "version_body" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "programs" DROP COLUMN "body";
  ALTER TABLE "_programs_v" DROP COLUMN "version_body";`)
}
