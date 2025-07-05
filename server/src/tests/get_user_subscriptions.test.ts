
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, formsTable, subscriptionsTable } from '../db/schema';
import { getUserSubscriptions } from '../handlers/get_user_subscriptions';

describe('getUserSubscriptions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no subscriptions', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const result = await getUserSubscriptions(userId);

    expect(result).toEqual([]);
  });

  it('should return user subscriptions', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a form
    const formResult = await db.insert(formsTable)
      .values({
        name: 'Test Form',
        description: 'Test form description',
        created_by_user_id: userId,
        is_active: true
      })
      .returning()
      .execute();

    const formId = formResult[0].id;

    // Create subscription
    const subscriptionData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    };

    const subscriptionResult = await db.insert(subscriptionsTable)
      .values({
        form_id: formId,
        user_id: userId,
        status: 'pending',
        data: subscriptionData
      })
      .returning()
      .execute();

    const result = await getUserSubscriptions(userId);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(subscriptionResult[0].id);
    expect(result[0].form_id).toEqual(formId);
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].status).toEqual('pending');
    expect(result[0].data).toEqual(subscriptionData);
    expect(result[0].submitted_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return only subscriptions for the specified user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create a form
    const formResult = await db.insert(formsTable)
      .values({
        name: 'Test Form',
        description: 'Test form description',
        created_by_user_id: user1Id,
        is_active: true
      })
      .returning()
      .execute();

    const formId = formResult[0].id;

    // Create subscriptions for both users
    await db.insert(subscriptionsTable)
      .values([
        {
          form_id: formId,
          user_id: user1Id,
          status: 'pending',
          data: { name: 'User 1' }
        },
        {
          form_id: formId,
          user_id: user2Id,
          status: 'approved',
          data: { name: 'User 2' }
        }
      ])
      .execute();

    // Get subscriptions for user 1
    const user1Subscriptions = await getUserSubscriptions(user1Id);
    expect(user1Subscriptions).toHaveLength(1);
    expect(user1Subscriptions[0].user_id).toEqual(user1Id);
    expect(user1Subscriptions[0].data['name']).toEqual('User 1');

    // Get subscriptions for user 2
    const user2Subscriptions = await getUserSubscriptions(user2Id);
    expect(user2Subscriptions).toHaveLength(1);
    expect(user2Subscriptions[0].user_id).toEqual(user2Id);
    expect(user2Subscriptions[0].data['name']).toEqual('User 2');
  });

  it('should handle empty data field correctly', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a form
    const formResult = await db.insert(formsTable)
      .values({
        name: 'Test Form',
        description: 'Test form description',
        created_by_user_id: userId,
        is_active: true
      })
      .returning()
      .execute();

    const formId = formResult[0].id;

    // Create subscription with empty data
    await db.insert(subscriptionsTable)
      .values({
        form_id: formId,
        user_id: userId,
        status: 'pending',
        data: {}
      })
      .execute();

    const result = await getUserSubscriptions(userId);

    expect(result).toHaveLength(1);
    expect(result[0].data).toEqual({});
  });
});
