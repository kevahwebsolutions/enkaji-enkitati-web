import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "impact_annual_plan" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"objective" varchar NOT NULL,
  	"amount_kes" numeric NOT NULL
  );
  
  ALTER TABLE "impact_annual_plan" ADD CONSTRAINT "impact_annual_plan_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."impact"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "impact_annual_plan_order_idx" ON "impact_annual_plan" USING btree ("_order");
  CREATE INDEX "impact_annual_plan_parent_id_idx" ON "impact_annual_plan" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "impact_annual_plan" CASCADE;`)
}
