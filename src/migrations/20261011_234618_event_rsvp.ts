import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_form_submissions_form_type" ADD VALUE 'rsvp';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_submissions" ALTER COLUMN "form_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_form_submissions_form_type";
  CREATE TYPE "public"."enum_form_submissions_form_type" AS ENUM('contact', 'volunteer', 'partnership', 'school-visit', 'join', 'pledge');
  ALTER TABLE "form_submissions" ALTER COLUMN "form_type" SET DATA TYPE "public"."enum_form_submissions_form_type" USING "form_type"::"public"."enum_form_submissions_form_type";`)
}
