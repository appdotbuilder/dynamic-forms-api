
import { db } from '../db';
import { subscriptionsTable, formsTable, usersTable } from '../db/schema';
import { type CreateSubscriptionInput, type Subscription } from '../schema';
import { eq } from 'drizzle-orm';

export const submitForm = async (input: CreateSubscriptionInput, user_id: number): Promise<Subscription> => {
  try {
    // Verify the form exists and is active
    const form = await db.select()
      .from(formsTable)
      .where(eq(formsTable.id, input.form_id))
      .execute();

    if (form.length === 0) {
      throw new Error('Form not found');
    }

    if (!form[0].is_active) {
      throw new Error('Form is not active');
    }

    // Verify the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Create the subscription
    const result = await db.insert(subscriptionsTable)
      .values({
        form_id: input.form_id,
        user_id: user_id,
        status: 'pending',
        data: input.data
      })
      .returning()
      .execute();

    // Return with proper type casting for the data field
    return {
      ...result[0],
      data: result[0].data as Record<string, any>
    };
  } catch (error) {
    console.error('Form submission failed:', error);
    throw error;
  }
};
