
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, formsTable, subscriptionsTable } from '../db/schema';
import { getSubscriptionById } from '../handlers/get_subscription_by_id';

describe('getSubscriptionById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a subscription by ID', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    const formResult = await db.insert(formsTable)
      .values({
        name: 'Test Form',
        description: 'A test form',
        created_by_user_id: userResult[0].id,
        is_active: true
      })
      .returning()
      .execute();

    const subscriptionResult = await db.insert(subscriptionsTable)
      .values({
        form_id: formResult[0].id,
        user_id: userResult[0].id,
        status: 'pending',
        data: { field1: 'value1', field2: 'value2' }
      })
      .returning()
      .execute();

    const result = await getSubscriptionById({ id: subscriptionResult[0].id });

    expect(result.id).toEqual(subscriptionResult[0].id);
    expect(result.form_id).toEqual(formResult[0].id);
    expect(result.user_id).toEqual(userResult[0].id);
    expect(result.status).toEqual('pending');
    expect(result.submitted_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.data).toEqual({ field1: 'value1', field2: 'value2' });
  });

  it('should return subscription with different status', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'admin@example.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    const formResult = await db.insert(formsTable)
      .values({
        name: 'Admin Form',
        description: 'An admin form',
        created_by_user_id: userResult[0].id,
        is_active: true
      })
      .returning()
      .execute();

    const subscriptionResult = await db.insert(subscriptionsTable)
      .values({
        form_id: formResult[0].id,
        user_id: userResult[0].id,
        status: 'approved',
        data: { name: 'John Doe', email: 'john@example.com' }
      })
      .returning()
      .execute();

    const result = await getSubscriptionById({ id: subscriptionResult[0].id });

    expect(result.id).toEqual(subscriptionResult[0].id);
    expect(result.status).toEqual('approved');
    expect(result.data).toEqual({ name: 'John Doe', email: 'john@example.com' });
  });

  it('should throw error for non-existent subscription', async () => {
    expect(async () => {
      await getSubscriptionById({ id: 999 });
    }).toThrow(/Subscription with ID 999 not found/i);
  });

  it('should handle empty data object', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'empty@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    const formResult = await db.insert(formsTable)
      .values({
        name: 'Empty Form',
        description: 'A form with empty data',
        created_by_user_id: userResult[0].id,
        is_active: true
      })
      .returning()
      .execute();

    const subscriptionResult = await db.insert(subscriptionsTable)
      .values({
        form_id: formResult[0].id,
        user_id: userResult[0].id,
        status: 'rejected',
        data: {}
      })
      .returning()
      .execute();

    const result = await getSubscriptionById({ id: subscriptionResult[0].id });

    expect(result.id).toEqual(subscriptionResult[0].id);
    expect(result.status).toEqual('rejected');
    expect(result.data).toEqual({});
  });
});
