CREATE TABLE "spine_account" (
	"userId" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "spine_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "spine_class_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"classId" uuid NOT NULL,
	"exerciseKey" varchar(48) NOT NULL,
	"order" integer NOT NULL,
	"duration" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spine_class" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar(255) NOT NULL,
	"name" varchar(80) NOT NULL,
	"isPublic" boolean DEFAULT false NOT NULL,
	"shareSlug" varchar(24),
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "spine_class_shareSlug_unique" UNIQUE("shareSlug")
);
--> statement-breakpoint
CREATE TABLE "spine_session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spine_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp with time zone,
	"image" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "spine_verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "spine_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "spine_account" ADD CONSTRAINT "spine_account_userId_spine_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."spine_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spine_class_item" ADD CONSTRAINT "spine_class_item_classId_spine_class_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."spine_class"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spine_class" ADD CONSTRAINT "spine_class_userId_spine_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."spine_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spine_session" ADD CONSTRAINT "spine_session_userId_spine_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."spine_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "spine_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "class_item_class_id_idx" ON "spine_class_item" USING btree ("classId");--> statement-breakpoint
CREATE INDEX "class_user_id_idx" ON "spine_class" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "t_user_id_idx" ON "spine_session" USING btree ("userId");