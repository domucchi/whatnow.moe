CREATE EXTENSION IF NOT EXISTS citext;--> statement-breakpoint
CREATE TABLE "anime" (
	"id" integer PRIMARY KEY NOT NULL,
	"mal_id" integer,
	"title_romaji" text,
	"title_english" text,
	"genres" text[] DEFAULT '{}'::text[] NOT NULL,
	"average_score" integer,
	"popularity" integer,
	"episodes" integer,
	"format" text,
	"status" text,
	"season_year" integer,
	"site_url" text,
	"cover_medium" text,
	"cover_large" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anime_mal_id_unique" UNIQUE("mal_id")
);
--> statement-breakpoint
CREATE TABLE "user_planning_entries" (
	"user_id" integer NOT NULL,
	"anime_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'anilist' NOT NULL,
	"username" "citext" NOT NULL,
	"external_id" integer,
	"last_fetched_at" timestamp with time zone,
	"not_found" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_planning_entries" ADD CONSTRAINT "user_planning_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_planning_entries" ADD CONSTRAINT "user_planning_entries_anime_id_anime_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "anime_mal_id_idx" ON "anime" USING btree ("mal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_planning_entries_pk" ON "user_planning_entries" USING btree ("user_id","anime_id");--> statement-breakpoint
CREATE INDEX "user_planning_entries_anime_id_idx" ON "user_planning_entries" USING btree ("anime_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_provider_username_unique" ON "users" USING btree ("provider","username");