CREATE TABLE "cart_items" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "user_id" uuid NOT NULL,
 "product_id" uuid NOT NULL,
 "quantity" integer NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
 CONSTRAINT "cart_items_quantity_positive" CHECK ("cart_items"."quantity" > 0 AND "cart_items"."quantity" <= 100)
);--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_user_product_unique" ON "cart_items" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "cart_items_user_idx" ON "cart_items" USING btree ("user_id");