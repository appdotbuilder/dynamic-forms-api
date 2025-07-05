
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type UpdateSubscriptionStatusInput, type Subscription } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSubscriptionStatus = async (input: UpdateSubscriptionStatusInput): Promise<Subscription> => {
  try {
    // Update subscription status
    const result = await db.update(subscriptionsTable)
      .set({
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(subscriptionsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Subscription not found');
    }

    // Convert the database result to match the Subscription schema
    const subscription = result[0];
    return {
      ...subscription,
      data: subscription.data as Record<string, any>
    };
  } catch (error) {
    console.error('Subscription status update failed:', error);
    throw error;
  }
};
