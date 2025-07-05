
import { serial, text, pgTable, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'manager', 'admin']);
export const fieldTypeEnum = pgEnum('field_type', ['text', 'number', 'textarea', 'date', 'select', 'checkbox', 'radio']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['pending', 'approved', 'rejected', 'cancelled']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Forms table
export const formsTable = pgTable('forms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_by_user_id: integer('created_by_user_id').notNull().references(() => usersTable.id),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Form fields table
export const formFieldsTable = pgTable('form_fields', {
  id: serial('id').primaryKey(),
  form_id: integer('form_id').notNull().references(() => formsTable.id),
  field_name: text('field_name').notNull(),
  field_type: fieldTypeEnum('field_type').notNull(),
  is_required: boolean('is_required').notNull().default(false),
  order: integer('order').notNull(),
  options: jsonb('options'), // Array of {value: string, label: string}
  placeholder: text('placeholder'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Subscriptions table
export const subscriptionsTable = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  form_id: integer('form_id').notNull().references(() => formsTable.id),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  status: subscriptionStatusEnum('status').notNull().default('pending'),
  submitted_at: timestamp('submitted_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  data: jsonb('data').notNull() // Key-value pairs of form field submissions
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  createdForms: many(formsTable),
  subscriptions: many(subscriptionsTable)
}));

export const formsRelations = relations(formsTable, ({ one, many }) => ({
  createdBy: one(usersTable, {
    fields: [formsTable.created_by_user_id],
    references: [usersTable.id]
  }),
  fields: many(formFieldsTable),
  subscriptions: many(subscriptionsTable)
}));

export const formFieldsRelations = relations(formFieldsTable, ({ one }) => ({
  form: one(formsTable, {
    fields: [formFieldsTable.form_id],
    references: [formsTable.id]
  })
}));

export const subscriptionsRelations = relations(subscriptionsTable, ({ one }) => ({
  form: one(formsTable, {
    fields: [subscriptionsTable.form_id],
    references: [formsTable.id]
  }),
  user: one(usersTable, {
    fields: [subscriptionsTable.user_id],
    references: [usersTable.id]
  })
}));

// TypeScript types for the tables
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Form = typeof formsTable.$inferSelect;
export type NewForm = typeof formsTable.$inferInsert;
export type FormField = typeof formFieldsTable.$inferSelect;
export type NewFormField = typeof formFieldsTable.$inferInsert;
export type Subscription = typeof subscriptionsTable.$inferSelect;
export type NewSubscription = typeof subscriptionsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  forms: formsTable,
  formFields: formFieldsTable,
  subscriptions: subscriptionsTable
};
