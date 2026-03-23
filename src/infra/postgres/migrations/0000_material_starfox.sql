CREATE TABLE "job_executions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"job_id" uuid,
	"job_status" varchar(20) DEFAULT 'running' NOT NULL,
	"schedule_at" timestamp,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"executed_by" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" varchar(255) NOT NULL,
	"cron_expression" varchar(100) NOT NULL,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"handler_type" text NOT NULL,
	"handler_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"max_retry" integer DEFAULT 3 NOT NULL,
	"max_time_run" integer,
	"run_count" integer DEFAULT 0 NOT NULL,
	"next_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_executions" ADD CONSTRAINT "job_executions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_executions_job_id_schedule_at" ON "job_executions" USING btree ("job_id","schedule_at") WHERE "job_executions"."schedule_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_executions_job_id" ON "job_executions" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_executions_status" ON "job_executions" USING btree ("job_status");--> statement-breakpoint
CREATE INDEX "idx_executions_started_at" ON "job_executions" USING btree ("started_at") WHERE "job_executions"."job_status"::text = 'running';--> statement-breakpoint
CREATE INDEX "idx_executions_job_id_started_at" ON "job_executions" USING btree ("job_id","started_at");--> statement-breakpoint
CREATE INDEX "index_to_fetch_next_run_at" ON "jobs" USING btree ("next_run_at") WHERE "jobs"."is_active" = true;--> statement-breakpoint
CREATE INDEX "idx_jobs_name" ON "jobs" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_jobs_name_trgm" ON "jobs" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_jobs_handler_type_trgm" ON "jobs" USING gin ("handler_type" gin_trgm_ops);