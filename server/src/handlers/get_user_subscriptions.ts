
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Subscription } from '../schema';

export const getUserSubscriptions = async (userId: number): Promise<Subscription[]> => {
  try {
    const results = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.user_id, userId))
      .execute();

    return results.map(subscription => ({
      ...subscription,
      data: subscription.data || {}
    }));
  } catch (error) {
    console.error('Failed to fetch user subscriptions:', error);
    throw error;
  }
};
