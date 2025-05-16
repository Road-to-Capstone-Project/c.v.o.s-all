import { Migration } from '@mikro-orm/migrations';

export class Migration20250516033504 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "related_product" ("id" text not null, "candidate_product_id" text not null, "query_product_id" text not null, "copurchase_frequency" integer not null default 1, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "related_product_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_related_product_deleted_at" ON "related_product" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "related_product" cascade;`);
  }

}
