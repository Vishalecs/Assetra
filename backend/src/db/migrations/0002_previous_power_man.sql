ALTER TABLE "audit_logs" ADD COLUMN "target_employee_id" varchar(32);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "previous_value" jsonb;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "new_value" jsonb;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "reason" text;