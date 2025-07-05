
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, formsTable, subscriptionsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { getUserSubscriptionById } from '../handlers/get_user_subscription_by_id';

// Test data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashedpassword123',
  role: 'user' as const
};

const testForm = {
  name: 'Test Form',
  description: 'A test form',
  is_active: true
};

const testSubscription = {
  status: 'pending' as const,
  data: { name: 'John Doe', email: 'john@example.com' }
};

describe('getUserSubscriptionById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get subscription by id', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user = userResult[0];

    const formResult = await db.insert(formsTable)
      .values({
        ...testForm,
        created_by_user_id: user.id
      })
      .returning()
      .execute();
    const form = formResult[0];

    const subscriptionResult = await db.insert(subscriptionsTable)
      .values({
        ...testSubscription,
        form_id: form.id,
        user_id: user.id
      })
      .returning()
      .execute();
    const subscription = subscriptionResult[0];

    // Test the handler
    const params: IdParam = { id: subscription.id };
    const result = await getUserSubscriptionById(params);

    // Verify the result
    expect(result.id).toEqual(subscription.id);
    expect(result.form_id).toEqual(form.id);
    expect(result.user_id).toEqual(user.id);
    expect(result.status).toEqual('pending');
    expect(result.data).toEqual({ name: 'John Doe', email: 'john@example.com' });
    expect(result.submitted_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when subscription not found', async () => {
    const params: IdParam = { id: 999 };

    await expect(getUserSubscriptionById(params)).rejects.toThrow(/subscription not found/i);
  });

  it('should fetch subscription with different status', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user = userResult[0];

    const formResult = await db.insert(formsTable)
      .values({
        ...testForm,
        created_by_user_id: user.id
      })
      .returning()
      .execute();
    const form = formResult[0];

    const subscriptionResult = await db.insert(subscriptionsTable)
      .values({
        ...testSubscription,
        form_id: form.id,
        user_id: user.id,
        status: 'approved'
      })
      .returning()
      .execute();
    const subscription = subscriptionResult[0];

    // Test the handler
    const params: IdParam = { id: subscription.id };
    const result = await getUserSubscriptionById(params);

    // Verify the result
    expect(result.status).toEqual('approved');
    expect(result.id).toEqual(subscription.id);
    expect(result.form_id).toEqual(form.id);
    expect(result.user_id).toEqual(user.id);
  });
});
