
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, formsTable, subscriptionsTable } from '../db/schema';
import { type GetSubscriptionsQuery } from '../schema';
import { getAllSubscriptions } from '../handlers/get_all_subscriptions';

// Test data setup
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashedpassword123',
  role: 'user' as const
};

const testUser2 = {
  email: 'test2@example.com',
  password_hash: 'hashedpassword456',
  role: 'manager' as const
};

const testForm = {
  name: 'Test Form',
  description: 'A test form',
  is_active: true
};

const testForm2 = {
  name: 'Test Form 2',
  description: 'Another test form',
  is_active: true
};

const testSubscription1 = {
  status: 'pending' as const,
  data: { field1: 'value1', field2: 'value2' }
};

const testSubscription2 = {
  status: 'approved' as const,
  data: { field1: 'value3', field2: 'value4' }
};

const testSubscription3 = {
  status: 'rejected' as const,
  data: { field1: 'value5', field2: 'value6' }
};

describe('getAllSubscriptions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all subscriptions when no filters are provided', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser, testUser2])
      .returning()
      .execute();

    // Create test forms
    const forms = await db.insert(formsTable)
      .values([
        { ...testForm, created_by_user_id: users[0].id },
        { ...testForm2, created_by_user_id: users[1].id }
      ])
      .returning()
      .execute();

    // Create test subscriptions
    await db.insert(subscriptionsTable)
      .values([
        { ...testSubscription1, form_id: forms[0].id, user_id: users[0].id },
        { ...testSubscription2, form_id: forms[1].id, user_id: users[1].id },
        { ...testSubscription3, form_id: forms[0].id, user_id: users[1].id }
      ])
      .execute();

    const result = await getAllSubscriptions({});

    expect(result).toHaveLength(3);
    expect(result[0].status).toBe('pending');
    expect(result[1].status).toBe('approved');
    expect(result[2].status).toBe('rejected');
    expect(result[0].data).toEqual({ field1: 'value1', field2: 'value2' });
    expect(result[0].submitted_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter subscriptions by form_id', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser, testUser2])
      .returning()
      .execute();

    // Create test forms
    const forms = await db.insert(formsTable)
      .values([
        { ...testForm, created_by_user_id: users[0].id },
        { ...testForm2, created_by_user_id: users[1].id }
      ])
      .returning()
      .execute();

    // Create test subscriptions
    await db.insert(subscriptionsTable)
      .values([
        { ...testSubscription1, form_id: forms[0].id, user_id: users[0].id },
        { ...testSubscription2, form_id: forms[1].id, user_id: users[1].id },
        { ...testSubscription3, form_id: forms[0].id, user_id: users[1].id }
      ])
      .execute();

    const query: GetSubscriptionsQuery = { form_id: forms[0].id };
    const result = await getAllSubscriptions(query);

    expect(result).toHaveLength(2);
    expect(result[0].form_id).toBe(forms[0].id);
    expect(result[1].form_id).toBe(forms[0].id);
    expect(result[0].status).toBe('pending');
    expect(result[1].status).toBe('rejected');
  });

  it('should filter subscriptions by user_id', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser, testUser2])
      .returning()
      .execute();

    // Create test forms
    const forms = await db.insert(formsTable)
      .values([
        { ...testForm, created_by_user_id: users[0].id },
        { ...testForm2, created_by_user_id: users[1].id }
      ])
      .returning()
      .execute();

    // Create test subscriptions
    await db.insert(subscriptionsTable)
      .values([
        { ...testSubscription1, form_id: forms[0].id, user_id: users[0].id },
        { ...testSubscription2, form_id: forms[1].id, user_id: users[1].id },
        { ...testSubscription3, form_id: forms[0].id, user_id: users[1].id }
      ])
      .execute();

    const query: GetSubscriptionsQuery = { user_id: users[1].id };
    const result = await getAllSubscriptions(query);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toBe(users[1].id);
    expect(result[1].user_id).toBe(users[1].id);
    expect(result[0].status).toBe('approved');
    expect(result[1].status).toBe('rejected');
  });

  it('should filter subscriptions by status', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser, testUser2])
      .returning()
      .execute();

    // Create test forms
    const forms = await db.insert(formsTable)
      .values([
        { ...testForm, created_by_user_id: users[0].id },
        { ...testForm2, created_by_user_id: users[1].id }
      ])
      .returning()
      .execute();

    // Create test subscriptions
    await db.insert(subscriptionsTable)
      .values([
        { ...testSubscription1, form_id: forms[0].id, user_id: users[0].id },
        { ...testSubscription2, form_id: forms[1].id, user_id: users[1].id },
        { ...testSubscription3, form_id: forms[0].id, user_id: users[1].id }
      ])
      .execute();

    const query: GetSubscriptionsQuery = { status: 'pending' };
    const result = await getAllSubscriptions(query);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('pending');
    expect(result[0].data).toEqual({ field1: 'value1', field2: 'value2' });
  });

  it('should filter subscriptions by multiple criteria', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser, testUser2])
      .returning()
      .execute();

    // Create test forms
    const forms = await db.insert(formsTable)
      .values([
        { ...testForm, created_by_user_id: users[0].id },
        { ...testForm2, created_by_user_id: users[1].id }
      ])
      .returning()
      .execute();

    // Create test subscriptions
    await db.insert(subscriptionsTable)
      .values([
        { ...testSubscription1, form_id: forms[0].id, user_id: users[0].id },
        { ...testSubscription2, form_id: forms[1].id, user_id: users[1].id },
        { ...testSubscription3, form_id: forms[0].id, user_id: users[1].id }
      ])
      .execute();

    const query: GetSubscriptionsQuery = {
      form_id: forms[0].id,
      user_id: users[1].id,
      status: 'rejected'
    };
    const result = await getAllSubscriptions(query);

    expect(result).toHaveLength(1);
    expect(result[0].form_id).toBe(forms[0].id);
    expect(result[0].user_id).toBe(users[1].id);
    expect(result[0].status).toBe('rejected');
    expect(result[0].data).toEqual({ field1: 'value5', field2: 'value6' });
  });

  it('should return empty array when no subscriptions match filters', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser, testUser2])
      .returning()
      .execute();

    // Create test forms
    const forms = await db.insert(formsTable)
      .values([
        { ...testForm, created_by_user_id: users[0].id },
        { ...testForm2, created_by_user_id: users[1].id }
      ])
      .returning()
      .execute();

    // Create test subscriptions
    await db.insert(subscriptionsTable)
      .values([
        { ...testSubscription1, form_id: forms[0].id, user_id: users[0].id },
        { ...testSubscription2, form_id: forms[1].id, user_id: users[1].id }
      ])
      .execute();

    const query: GetSubscriptionsQuery = { status: 'cancelled' };
    const result = await getAllSubscriptions(query);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no subscriptions exist', async () => {
    const result = await getAllSubscriptions({});

    expect(result).toHaveLength(0);
  });
});
