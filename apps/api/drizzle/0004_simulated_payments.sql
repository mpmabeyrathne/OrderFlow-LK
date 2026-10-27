CREATE TYPE "public"."payment_status" AS ENUM('succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "payments" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "order_id" uuid NOT NULL,
 "amount" numeric(12, 2) NOT NULL,
 "currency" varchar(3) NOT NULL,
 "status" "payment_status" NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 CONSTRAINT "payments_order_id_unique" UNIQUE("order_id"),
 CONSTRAINT "payments_amount_nonnegative" CHECK ("payments"."amount" >= 0)
);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;