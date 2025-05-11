import { Migration } from '@mikro-orm/migrations';

export class Migration20250508091155 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "review" add column if not exists "customer_id" text not null, add column if not exists "product_id" text not null;`);
    this.addSql(`alter table if exists "review" alter column "rating" type real using ("rating"::real);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "review" drop column if exists "customer_id", drop column if exists "product_id";`);

    this.addSql(`alter table if exists "review" alter column "rating" type integer using ("rating"::integer);`);
  }

}
