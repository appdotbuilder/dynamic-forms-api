
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getAllUsers } from '../handlers/get_all_users';

describe('getAllUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getAllUsers();
    expect(result).toEqual([]);
  });

  it('should return all users when users exist', async () => {
    // Create test users
    await db.insert(usersTable).values([
      {
        email: 'user1@example.com',
        password_hash: 'hash1',
        role: 'user'
      },
      {
        email: 'admin@example.com',
        password_hash: 'hash2',
        role: 'admin'
      },
      {
        email: 'manager@example.com',
        password_hash: 'hash3',
        role: 'manager'
      }
    ]);

    const result = await getAllUsers();

    expect(result).toHaveLength(3);
    
    // Check that all users are returned
    const emails = result.map(user => user.email);
    expect(emails).toContain('user1@example.com');
    expect(emails).toContain('admin@example.com');
    expect(emails).toContain('manager@example.com');

    // Check that all required fields are present
    result.forEach(user => {
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.password_hash).toBeDefined();
      expect(user.role).toBeDefined();
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return users with correct role types', async () => {
    // Create users with different roles
    await db.insert(usersTable).values([
      {
        email: 'user@example.com',
        password_hash: 'hash1',
        role: 'user'
      },
      {
        email: 'admin@example.com',
        password_hash: 'hash2',
        role: 'admin'
      }
    ]);

    const result = await getAllUsers();

    expect(result).toHaveLength(2);
    
    const userRecord = result.find(u => u.email === 'user@example.com');
    const adminRecord = result.find(u => u.email === 'admin@example.com');
    
    expect(userRecord?.role).toBe('user');
    expect(adminRecord?.role).toBe('admin');
  });
});
