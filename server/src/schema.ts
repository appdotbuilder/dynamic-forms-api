
import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['user', 'manager', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Form field type enum
export const fieldTypeSchema = z.enum(['text', 'number', 'textarea', 'date', 'select', 'checkbox', 'radio']);
export type FieldType = z.infer<typeof fieldTypeSchema>;

// Subscription status enum
export const subscriptionStatusSchema = z.enum(['pending', 'approved', 'rejected', 'cancelled']);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

// Field option schema for select, checkbox, radio types
export const fieldOptionSchema = z.object({
  value: z.string(),
  label: z.string()
});
export type FieldOption = z.infer<typeof fieldOptionSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  role: userRoleSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type User = z.infer<typeof userSchema>;

// Form schema
export const formSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_by_user_id: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type Form = z.infer<typeof formSchema>;

// FormField schema
export const formFieldSchema = z.object({
  id: z.number(),
  form_id: z.number(),
  field_name: z.string(),
  field_type: fieldTypeSchema,
  is_required: z.boolean(),
  order: z.number().int(),
  options: z.array(fieldOptionSchema).nullable(),
  placeholder: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type FormField = z.infer<typeof formFieldSchema>;

// Subscription schema
export const subscriptionSchema = z.object({
  id: z.number(),
  form_id: z.number(),
  user_id: z.number(),
  status: subscriptionStatusSchema,
  submitted_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  data: z.record(z.string(), z.any())
});
export type Subscription = z.infer<typeof subscriptionSchema>;

// Input schemas for authentication
export const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
export type LoginInput = z.infer<typeof loginInputSchema>;

// Input schemas for user management
export const updateUserInputSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  role: userRoleSchema.optional()
});
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Input schemas for form management
export const createFormInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional()
});
export type CreateFormInput = z.infer<typeof createFormInputSchema>;

export const updateFormInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional()
});
export type UpdateFormInput = z.infer<typeof updateFormInputSchema>;

// Input schemas for form field management
export const createFormFieldInputSchema = z.object({
  form_id: z.number(),
  field_name: z.string(),
  field_type: fieldTypeSchema,
  is_required: z.boolean().optional(),
  order: z.number().int(),
  options: z.array(fieldOptionSchema).nullable().optional(),
  placeholder: z.string().nullable().optional()
});
export type CreateFormFieldInput = z.infer<typeof createFormFieldInputSchema>;

export const updateFormFieldInputSchema = z.object({
  id: z.number(),
  form_id: z.number(),
  field_name: z.string().optional(),
  field_type: fieldTypeSchema.optional(),
  is_required: z.boolean().optional(),
  order: z.number().int().optional(),
  options: z.array(fieldOptionSchema).nullable().optional(),
  placeholder: z.string().nullable().optional()
});
export type UpdateFormFieldInput = z.infer<typeof updateFormFieldInputSchema>;

// Input schemas for subscription management
export const createSubscriptionInputSchema = z.object({
  form_id: z.number(),
  data: z.record(z.string(), z.any())
});
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionInputSchema>;

export const updateSubscriptionStatusInputSchema = z.object({
  id: z.number(),
  status: subscriptionStatusSchema
});
export type UpdateSubscriptionStatusInput = z.infer<typeof updateSubscriptionStatusInputSchema>;

// Query schemas
export const getSubscriptionsQuerySchema = z.object({
  form_id: z.number().optional(),
  user_id: z.number().optional(),
  status: subscriptionStatusSchema.optional()
});
export type GetSubscriptionsQuery = z.infer<typeof getSubscriptionsQuerySchema>;

export const idParamSchema = z.object({
  id: z.number()
});
export type IdParam = z.infer<typeof idParamSchema>;

// Response schemas
export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string()
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const formWithFieldsSchema = formSchema.extend({
  fields: z.array(formFieldSchema)
});
export type FormWithFields = z.infer<typeof formWithFieldsSchema>;
