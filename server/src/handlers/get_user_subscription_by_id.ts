
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type IdParam, type Subscription } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserSubscriptionById = async (params: IdParam): Promise<Subscription> => {
  try {
    const result = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, params.id))
      .execute();

    if (result.length === 0) {
      throw new Error('Subscription not found');
    }

    const subscription = result[0];
    return {
      ...subscription,
      data: subscription.data as Record<string, any>
    };
  } catch (error) {
    console.error('Get user subscription by ID failed:', error);
    throw error;
  }
};
