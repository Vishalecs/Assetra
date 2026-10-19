CREATE TABLE IF NOT EXISTS "permissions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"key" varchar(128) NOT NULL,
	"module" text NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_permissions" (
	"role_id" varchar(64) NOT NULL,
	"permission_id" varchar(64) NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employee_permissions" (
	"employee_id" varchar(32) NOT NULL,
	"permission_id" varchar(64) NOT NULL,
	CONSTRAINT "employee_permissions_employee_id_permission_id_pk" PRIMARY KEY("employee_id","permission_id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS employee_code_seq START WITH 10000 INCREMENT BY 1 NO CYCLE;
--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "alternate_mobile_number" varchar(24);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "address_line_1" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "address_line_2" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "district" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "pincode" varchar(12);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bank_account_number" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bank_ifsc" varchar(32);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bank_branch" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "created_by" varchar(32);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "updated_by" varchar(32);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_password_reset_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_permissions" ADD CONSTRAINT "employee_permissions_employee_id_employees_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("employee_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employee_permissions" ADD CONSTRAINT "employee_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
