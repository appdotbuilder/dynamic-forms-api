
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type GetSubscriptionsQuery, type Subscription } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export const getAllSubscriptions = async (query: GetSubscriptionsQuery): Promise<Subscription[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (query.form_id !== undefined) {
      conditions.push(eq(subscriptionsTable.form_id, query.form_id));
    }

    if (query.user_id !== undefined) {
      conditions.push(eq(subscriptionsTable.user_id, query.user_id));
    }

    if (query.status !== undefined) {
      conditions.push(eq(subscriptionsTable.status, query.status));
    }

    // Execute query with or without conditions
    const results = conditions.length > 0
      ? await db.select()
          .from(subscriptionsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(subscriptionsTable)
          .execute();

    return results.map(result => ({
      ...result,
      data: result.data as Record<string, any>
    }));
  } catch (error) {
    console.error('Get all subscriptions failed:', error);
    throw error;
  }
};
