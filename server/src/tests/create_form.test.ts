
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { formsTable, usersTable } from '../db/schema';
import { type CreateFormInput } from '../schema';
import { createForm } from '../handlers/create_form';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashedpassword123',
  role: 'manager' as const
};

// Test form input
const testInput: CreateFormInput = {
  name: 'Test Form',
  description: 'A form for testing',
  is_active: true
};

describe('createForm', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a form with all fields', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const result = await createForm(testInput, userId);

    // Basic field validation
    expect(result.name).toEqual('Test Form');
    expect(result.description).toEqual('A form for testing');
    expect(result.created_by_user_id).toEqual(userId);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a form with minimal fields', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const minimalInput: CreateFormInput = {
      name: 'Minimal Form'
    };

    const result = await createForm(minimalInput, userId);

    expect(result.name).toEqual('Minimal Form');
    expect(result.description).toBeNull();
    expect(result.created_by_user_id).toEqual(userId);
    expect(result.is_active).toEqual(true); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save form to database', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const result = await createForm(testInput, userId);

    // Query using proper drizzle syntax
    const forms = await db.select()
      .from(formsTable)
      .where(eq(formsTable.id, result.id))
      .execute();

    expect(forms).toHaveLength(1);
    expect(forms[0].name).toEqual('Test Form');
    expect(forms[0].description).toEqual('A form for testing');
    expect(forms[0].created_by_user_id).toEqual(userId);
    expect(forms[0].is_active).toEqual(true);
    expect(forms[0].created_at).toBeInstanceOf(Date);
    expect(forms[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const inputWithNullDescription: CreateFormInput = {
      name: 'Form with null description',
      description: null
    };

    const result = await createForm(inputWithNullDescription, userId);

    expect(result.description).toBeNull();

    // Verify in database
    const forms = await db.select()
      .from(formsTable)
      .where(eq(formsTable.id, result.id))
      .execute();

    expect(forms[0].description).toBeNull();
  });

  it('should handle is_active false', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const inputWithInactive: CreateFormInput = {
      name: 'Inactive Form',
      is_active: false
    };

    const result = await createForm(inputWithInactive, userId);

    expect(result.is_active).toEqual(false);

    // Verify in database
    const forms = await db.select()
      .from(formsTable)
      .where(eq(formsTable.id, result.id))
      .execute();

    expect(forms[0].is_active).toEqual(false);
  });
});
