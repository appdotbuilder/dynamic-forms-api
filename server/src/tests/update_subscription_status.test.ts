
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, formsTable, subscriptionsTable } from '../db/schema';
import { type UpdateSubscriptionStatusInput } from '../schema';
import { updateSubscriptionStatus } from '../handlers/update_subscription_status';
import { eq } from 'drizzle-orm';

describe('updateSubscriptionStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update subscription status', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    const form = await db.insert(formsTable)
      .values({
        name: 'Test Form',
        description: 'Test form description',
        created_by_user_id: user[0].id,
        is_active: true
      })
      .returning()
      .execute();

    const subscription = await db.insert(subscriptionsTable)
      .values({
        form_id: form[0].id,
        user_id: user[0].id,
        status: 'pending',
        data: { test: 'data' }
      })
      .returning()
      .execute();

    // Test input
    const input: UpdateSubscriptionStatusInput = {
      id: subscription[0].id,
      status: 'approved'
    };

    const result = await updateSubscriptionStatus(input);

    // Verify status update
    expect(result.id).toEqual(subscription[0].id);
    expect(result.status).toEqual('approved');
    expect(result.form_id).toEqual(form[0].id);
    expect(result.user_id).toEqual(user[0].id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(subscription[0].updated_at.getTime());
  });

  it('should save updated status to database', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    const form = await db.insert(formsTable)
      .values({
        name: 'Test Form',
        description: 'Test form description',
        created_by_user_id: user[0].id,
        is_active: true
      })
      .returning()
      .execute();

    const subscription = await db.insert(subscriptionsTable)
      .values({
        form_id: form[0].id,
        user_id: user[0].id,
        status: 'pending',
        data: { test: 'data' }
      })
      .returning()
      .execute();

    const input: UpdateSubscriptionStatusInput = {
      id: subscription[0].id,
      status: 'rejected'
    };

    await updateSubscriptionStatus(input);

    // Verify database update
    const subscriptions = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, subscription[0].id))
      .execute();

    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0].status).toEqual('rejected');
    expect(subscriptions[0].updated_at).toBeInstanceOf(Date);
    expect(subscriptions[0].updated_at.getTime()).toBeGreaterThan(subscription[0].updated_at.getTime());
  });

  it('should throw error for non-existent subscription', async () => {
    const input: UpdateSubscriptionStatusInput = {
      id: 999,
      status: 'approved'
    };

    await expect(updateSubscriptionStatus(input)).rejects.toThrow(/subscription not found/i);
  });

  it('should handle different status values', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    const form = await db.insert(formsTable)
      .values({
        name: 'Test Form',
        description: 'Test form description',
        created_by_user_id: user[0].id,
        is_active: true
      })
      .returning()
      .execute();

    const subscription = await db.insert(subscriptionsTable)
      .values({
        form_id: form[0].id,
        user_id: user[0].id,
        status: 'pending',
        data: { test: 'data' }
      })
      .returning()
      .execute();

    // Test cancelled status
    const input: UpdateSubscriptionStatusInput = {
      id: subscription[0].id,
      status: 'cancelled'
    };

    const result = await updateSubscriptionStatus(input);

    expect(result.status).toEqual('cancelled');
    expect(result.id).toEqual(subscription[0].id);
  });
});
