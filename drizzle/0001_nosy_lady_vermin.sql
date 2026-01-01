ALTER TABLE "email_automations" ADD COLUMN "order_id" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_order_trigger" ON "email_automations" USING btree ("order_id","trigger_type");--> statement-breakpoint
CREATE INDEX "idx_status_active" ON "email_automations" USING btree ("status","is_active");