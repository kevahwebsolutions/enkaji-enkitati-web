import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_form_submissions_email_status" AS ENUM('pending', 'sent', 'failed', 'skipped');
  ALTER TYPE "public"."enum_form_submissions_form_type" ADD VALUE 'newsletter';
  ALTER TYPE "public"."enum_audit_log_action" ADD VALUE 'export';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'purgeOldSubmissions' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'purgeOldSubmissions' BEFORE 'schedulePublish';
  CREATE TABLE "payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "form_submissions" ADD COLUMN "email_status" "enum_form_submissions_email_status" DEFAULT 'pending';
  ALTER TABLE "payload_jobs" ADD COLUMN "meta" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload_jobs_stats" CASCADE;
  ALTER TABLE "form_submissions" ALTER COLUMN "form_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_form_submissions_form_type";
  CREATE TYPE "public"."enum_form_submissions_form_type" AS ENUM('contact', 'volunteer', 'partnership', 'school-visit', 'join', 'pledge', 'rsvp');
  ALTER TABLE "form_submissions" ALTER COLUMN "form_type" SET DATA TYPE "public"."enum_form_submissions_form_type" USING "form_type"::"public"."enum_form_submissions_form_type";
  ALTER TABLE "audit_log" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_log_action";
  CREATE TYPE "public"."enum_audit_log_action" AS ENUM('create', 'update', 'publish', 'delete');
  ALTER TABLE "audit_log" ALTER COLUMN "action" SET DATA TYPE "public"."enum_audit_log_action" USING "action"::"public"."enum_audit_log_action";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  ALTER TABLE "form_submissions" DROP COLUMN "email_status";
  ALTER TABLE "payload_jobs" DROP COLUMN "meta";
  DROP TYPE "public"."enum_form_submissions_email_status";`)
}
