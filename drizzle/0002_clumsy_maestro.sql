ALTER TABLE "profiles" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "longitude" double precision;--> statement-breakpoint
CREATE INDEX "idx_profiles_lat_lng" ON "profiles" USING btree ("latitude","longitude");