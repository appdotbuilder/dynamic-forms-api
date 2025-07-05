
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  registerInputSchema,
  loginInputSchema,
  updateUserInputSchema,
  createFormInputSchema,
  updateFormInputSchema,
  createFormFieldInputSchema,
  updateFormFieldInputSchema,
  createSubscriptionInputSchema,
  updateSubscriptionStatusInputSchema,
  getSubscriptionsQuerySchema,
  idParamSchema
} from './schema';

// Import handlers
import { authRegister } from './handlers/auth_register';
import { authLogin } from './handlers/auth_login';
import { getCurrentUser } from './handlers/get_current_user';
import { getAllUsers } from './handlers/get_all_users';
import { getUserById } from './handlers/get_user_by_id';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';
import { createForm } from './handlers/create_form';
import { getAllForms } from './handlers/get_all_forms';
import { getFormById } from './handlers/get_form_by_id';
import { updateForm } from './handlers/update_form';
import { deleteForm } from './handlers/delete_form';
import { createFormField } from './handlers/create_form_field';
import { updateFormField } from './handlers/update_form_field';
import { deleteFormField } from './handlers/delete_form_field';
import { getAllSubscriptions } from './handlers/get_all_subscriptions';
import { getSubscriptionById } from './handlers/get_subscription_by_id';
import { updateSubscriptionStatus } from './handlers/update_subscription_status';
import { getAvailableForms } from './handlers/get_available_forms';
import { submitForm } from './handlers/submit_form';
import { getUserSubscriptions } from './handlers/get_user_subscriptions';
import { getUserSubscriptionById } from './handlers/get_user_subscription_by_id';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  authRegister: publicProcedure
    .input(registerInputSchema)
    .mutation(({ input }) => authRegister(input)),
  
  authLogin: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => authLogin(input)),
  
  getCurrentUser: publicProcedure
    .query(() => getCurrentUser()),

  // User management routes (Admin role required)
  getAllUsers: publicProcedure
    .query(() => getAllUsers()),
  
  getUserById: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getUserById(input)),
  
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),
  
  deleteUser: publicProcedure
    .input(idParamSchema)
    .mutation(({ input }) => deleteUser(input)),

  // Form management routes (Manager/Admin role required)
  createForm: publicProcedure
    .input(createFormInputSchema)
    .mutation(({ input }) => createForm(input)),
  
  getAllForms: publicProcedure
    .query(() => getAllForms()),
  
  getFormById: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getFormById(input)),
  
  updateForm: publicProcedure
    .input(updateFormInputSchema)
    .mutation(({ input }) => updateForm(input)),
  
  deleteForm: publicProcedure
    .input(idParamSchema)
    .mutation(({ input }) => deleteForm(input)),

  // Form field management routes (Manager/Admin role required)
  createFormField: publicProcedure
    .input(createFormFieldInputSchema)
    .mutation(({ input }) => createFormField(input)),
  
  updateFormField: publicProcedure
    .input(updateFormFieldInputSchema)
    .mutation(({ input }) => updateFormField(input)),
  
  deleteFormField: publicProcedure
    .input(idParamSchema)
    .mutation(({ input }) => deleteFormField(input)),

  // Subscription management routes (Manager/Admin role required)
  getAllSubscriptions: publicProcedure
    .input(getSubscriptionsQuerySchema)
    .query(({ input }) => getAllSubscriptions(input)),
  
  getSubscriptionById: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getSubscriptionById(input)),
  
  updateSubscriptionStatus: publicProcedure
    .input(updateSubscriptionStatusInputSchema)
    .mutation(({ input }) => updateSubscriptionStatus(input)),

  // User submission routes (User role required)
  getAvailableForms: publicProcedure
    .query(() => getAvailableForms()),
  
  submitForm: publicProcedure
    .input(createSubscriptionInputSchema)
    .mutation(({ input }) => submitForm(input)),
  
  getUserSubscriptions: publicProcedure
    .query(() => getUserSubscriptions()),
  
  getUserSubscriptionById: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getUserSubscriptionById(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
