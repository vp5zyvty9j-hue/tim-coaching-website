import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const accounts = sqliteTable('accounts', {
 userId: text('user_id').primaryKey(),
 email: text('email').notNull(),
 name: text('name').notNull(),
 package: text('package').notNull().default('none'),
 status: text('status').notNull().default('pending'),
 startDate: text('start_date'),
 endDate: text('end_date'),
 revision: integer('revision').notNull().default(0),
 createdAt: text('created_at').notNull(),
 updatedAt: text('updated_at').notNull(),
});
export const coach = sqliteTable('coach', {
 key: text('key').primaryKey(),
 userId: text('user_id').notNull().unique(),
});

export const invoices = sqliteTable('invoices', {
 id: text('id').primaryKey(),
 userId: text('user_id').notNull().references(()=>accounts.userId),
 number: text('number').notNull().unique(),
 amountCents: integer('amount_cents').notNull(),
 currency: text('currency').notNull().default('CHF'),
 status: text('status').notNull().default('open'),
 issuedDate: text('issued_date').notNull(),
 dueDate: text('due_date'),
}, table => [index('invoices_user_id_idx').on(table.userId)]);

export const workouts = sqliteTable('workouts', {
 id:text('id').primaryKey(), userId:text('user_id').notNull().references(()=>accounts.userId),
 date:text('date').notNull(), title:text('title').notNull(), sport:text('sport').notNull(),
 body:text('body').notNull(), revision:integer('revision').notNull().default(0), updatedAt:text('updated_at').notNull(),
},t=>[index('workouts_user_date').on(t.userId,t.date)]);
export const templates = sqliteTable('workout_templates', {id:text('id').primaryKey(),title:text('title').notNull(),sport:text('sport').notNull(),body:text('body').notNull()});
export const results = sqliteTable('workout_results', {
 workoutId:text('workout_id').primaryKey().references(()=>workouts.id,{onDelete:'cascade'}),
 userId:text('user_id').notNull().references(()=>accounts.userId), score:integer('score').notNull(), rpe:integer('rpe').notNull(),
 distanceM:integer('distance_m').notNull().default(0), shoeId:text('shoe_id'), body:text('body').notNull(),updatedAt:text('updated_at').notNull(),
});
export const shoes = sqliteTable('shoes', {id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>accounts.userId),name:text('name').notNull(),initialM:integer('initial_m').notNull(),limitM:integer('limit_m').notNull(),archived:integer('archived').notNull().default(0)});
export const profiles = sqliteTable('profiles', {userId:text('user_id').primaryKey().references(()=>accounts.userId),avatar:text('avatar').notNull().default('')});
