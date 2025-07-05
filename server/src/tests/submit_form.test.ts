
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, formsTable, subscriptionsTable } from '../db/schema';
import { type CreateSubscriptionInput } from '../schema';
import { submitForm } from '../handlers/submit_form';
import { eq } from 'drizzle-orm';

describe('submitForm', () => {
  let testUserId: number;
  let testFormId: number;
  let inactiveFormId: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test form (active)
    const formResult = await db.insert(formsTable)
      .values({
        name: 'Test Form',
        description: 'A test form',
        created_by_user_id: testUserId,
        is_active: true
      })
      .returning()
      .execute();
    testFormId = formResult[0].id;

    // Create inactive form
    const inactiveFormResult = await db.insert(formsTable)
      .values({
        name: 'Inactive Form',
        description: 'An inactive form',
        created_by_user_id: testUserId,
        is_active: false
      })
      .returning()
      .execute();
    inactiveFormId = inactiveFormResult[0].id;
  });

  afterEach(resetDB);

  it('should submit form successfully', async () => {
    const input: CreateSubscriptionInput = {
      form_id: testFormId,
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      }
    };

    const result = await submitForm(input, testUserId);

    expect(result.id).toBeDefined();
    expect(result.form_id).toEqual(testFormId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.status).toEqual('pending');
    expect(result.data).toEqual(input.data);
    expect(result.submitted_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save subscription to database', async () => {
    const input: CreateSubscriptionInput = {
      form_id: testFormId,
      data: {
        name: 'Jane Doe',
        email: 'jane@example.com'
      }
    };

    const result = await submitForm(input, testUserId);

    const subscriptions = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, result.id))
      .execute();

    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0].form_id).toEqual(testFormId);
    expect(subscriptions[0].user_id).toEqual(testUserId);
    expect(subscriptions[0].status).toEqual('pending');
    expect(subscriptions[0].data).toEqual(input.data);
  });

  it('should throw error when form does not exist', async () => {
    const input: CreateSubscriptionInput = {
      form_id: 999, // Non-existent form
      data: {
        name: 'Test User'
      }
    };

    await expect(submitForm(input, testUserId)).rejects.toThrow(/form not found/i);
  });

  it('should throw error when form is inactive', async () => {
    const input: CreateSubscriptionInput = {
      form_id: inactiveFormId,
      data: {
        name: 'Test User'
      }
    };

    await expect(submitForm(input, testUserId)).rejects.toThrow(/form is not active/i);
  });

  it('should throw error when user does not exist', async () => {
    const input: CreateSubscriptionInput = {
      form_id: testFormId,
      data: {
        name: 'Test User'
      }
    };

    await expect(submitForm(input, 999)).rejects.toThrow(/user not found/i);
  });

  it('should handle complex form data', async () => {
    const input: CreateSubscriptionInput = {
      form_id: testFormId,
      data: {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          age: 30
        },
        preferences: ['option1', 'option2'],
        agreement: true,
        comments: 'This is a test submission'
      }
    };

    const result = await submitForm(input, testUserId);

    expect(result.data).toEqual(input.data);
    expect(result.data['personalInfo']['firstName']).toEqual('John');
    expect(result.data['preferences']).toEqual(['option1', 'option2']);
    expect(result.data['agreement']).toEqual(true);
  });
});
