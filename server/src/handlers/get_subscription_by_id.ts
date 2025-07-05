
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type IdParam, type Subscription } from '../schema';

export const getSubscriptionById = async (params: IdParam): Promise<Subscription> => {
  try {
    // Query subscription by ID
    const results = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, params.id))
      .execute();

    if (results.length === 0) {
      throw new Error(`Subscription with ID ${params.id} not found`);
    }

    const subscription = results[0];
    
    // Return the subscription data
    return {
      id: subscription.id,
      form_id: subscription.form_id,
      user_id: subscription.user_id,
      status: subscription.status,
      submitted_at: subscription.submitted_at,
      updated_at: subscription.updated_at,
      data: subscription.data as Record<string, any>
    };
  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    throw error;
  }
};
