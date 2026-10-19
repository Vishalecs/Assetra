DO $$ BEGIN
 CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."employee_status" AS ENUM('ACTIVE', 'INACTIVE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('SUPER_ADMIN', 'IT_ADMIN', 'EMPLOYEE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "applications" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"application_number" varchar(32) NOT NULL,
	"customer_name" text NOT NULL,
	"customer_id" varchar(32),
	"branch" text,
	"loan_officer" text,
	"loan_type" text,
	"requested_amount" integer DEFAULT 0,
	"application_date" text,
	"status" text DEFAULT 'PENDING',
	"assigned_credit_officer" text,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_application_number_unique" UNIQUE("application_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"actor_employee_id" varchar(32) NOT NULL,
	"actor_name" text NOT NULL,
	"action" text NOT NULL,
	"details" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employees" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"employee_id" varchar(32) NOT NULL,
	"name" text NOT NULL,
	"father_name" text,
	"mother_name" text,
	"mobile_number" varchar(24),
	"email" varchar(255),
	"dob" text,
	"gender" "gender" DEFAULT 'MALE',
	"designation" text,
	"system_role" "user_role" NOT NULL,
	"department" text,
	"branch" text,
	"joining_date" text,
	"reporting_manager" text,
	"status" "employee_status" DEFAULT 'ACTIVE' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employees_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" "user_role" NOT NULL,
	"description" text,
	"is_system_role" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"employee_id" varchar(32) NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" NOT NULL,
	"password_hash" text NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "employee_status" DEFAULT 'ACTIVE' NOT NULL,
	"first_login_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "branches" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(32),
	"region" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "departments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "designations" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
