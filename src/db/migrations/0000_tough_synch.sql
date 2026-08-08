CREATE TYPE "public"."book_condition" AS ENUM('good', 'damaged', 'lost');--> statement-breakpoint
CREATE TYPE "public"."book_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."borrow_status" AS ENUM('borrowed', 'returned', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."fine_status" AS ENUM('unpaid', 'paid');--> statement-breakpoint
CREATE TYPE "public"."inventory_status" AS ENUM('available', 'borrowed', 'maintenance', 'lost');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar NOT NULL,
	"module" varchar NOT NULL,
	"description" text,
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"biography" text,
	"photo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_inventories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_code" varchar NOT NULL,
	"book_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"shelf_id" uuid,
	"condition" "book_condition" DEFAULT 'good' NOT NULL,
	"status" "inventory_status" DEFAULT 'available' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "book_inventories_inventory_code_unique" UNIQUE("inventory_code")
);
--> statement-breakpoint
CREATE TABLE "book_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "book_sources_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"isbn" varchar NOT NULL,
	"title" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" text,
	"synopsis" text,
	"cover_image" text,
	"author_id" uuid,
	"publisher_id" uuid,
	"category_id" uuid,
	"publication_year" integer,
	"language" varchar,
	"pages" integer,
	"status" "book_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "books_isbn_unique" UNIQUE("isbn"),
	CONSTRAINT "books_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "borrowing_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"borrowing_id" uuid NOT NULL,
	"book_inventory_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "borrowings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"borrow_code" varchar NOT NULL,
	"borrow_date" date NOT NULL,
	"due_date" date NOT NULL,
	"return_date" date,
	"status" "borrow_status" DEFAULT 'borrowed' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "borrowings_borrow_code_unique" UNIQUE("borrow_code")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "fines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"borrowing_id" uuid NOT NULL,
	"amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"paid_at" timestamp with time zone,
	"status" "fine_status" DEFAULT 'unpaid' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fines_borrowing_id_unique" UNIQUE("borrowing_id")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"member_code" varchar NOT NULL,
	"phone" varchar,
	"address" text,
	"birth_date" date,
	"join_date" date NOT NULL,
	"status" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "members_member_code_unique" UNIQUE("member_code")
);
--> statement-breakpoint
CREATE TABLE "publishers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"address" text,
	"email" varchar,
	"phone" varchar,
	"website" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"borrowing_id" uuid NOT NULL,
	"return_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'returned' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "shelves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar NOT NULL,
	"name" varchar NOT NULL,
	"floor" integer,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shelves_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid,
	"name" varchar(150) NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" text NOT NULL,
	"avatar_url" text,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"last_login" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_inventories" ADD CONSTRAINT "book_inventories_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_inventories" ADD CONSTRAINT "book_inventories_source_id_book_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."book_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_inventories" ADD CONSTRAINT "book_inventories_shelf_id_shelves_id_fk" FOREIGN KEY ("shelf_id") REFERENCES "public"."shelves"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrowing_details" ADD CONSTRAINT "borrowing_details_borrowing_id_borrowings_id_fk" FOREIGN KEY ("borrowing_id") REFERENCES "public"."borrowings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrowing_details" ADD CONSTRAINT "borrowing_details_book_inventory_id_book_inventories_id_fk" FOREIGN KEY ("book_inventory_id") REFERENCES "public"."book_inventories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrowings" ADD CONSTRAINT "borrowings_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_borrowing_id_borrowings_id_fk" FOREIGN KEY ("borrowing_id") REFERENCES "public"."borrowings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_borrowing_id_borrowings_id_fk" FOREIGN KEY ("borrowing_id") REFERENCES "public"."borrowings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;