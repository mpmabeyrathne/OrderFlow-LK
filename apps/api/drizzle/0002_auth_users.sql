CREATE TYPE "public"."user_role" AS ENUM('customer', 'admin', 'manager');--> statement-breakpoint
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255) NOT NULL,
  "password_hash" text NOT NULL,
  "role" "user_role" DEFAULT 'customer' NOT NULL,
  "customer_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email"),
  CONSTRAINT "users_customer_id_unique" UNIQUE("customer_id")
);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_customer_link_check" CHECK (("role" = 'customer' AND "customer_id" IS NOT NULL) OR ("role" <> 'customer' AND "customer_id" IS NULL));
