
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

export const authRegister = async (input: RegisterInput): Promise<AuthResponse> => {
  try {
    // Check if user with this email already exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (existingUsers.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash the password (simplified - in real app would use bcrypt or similar)
    const password_hash = await Bun.password.hash(input.password);

    // Create new user with default role 'user'
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash,
        role: 'user' // Default role as specified
      })
      .returning()
      .execute();

    const user = result[0];

    // Generate JWT token (simplified - in real app would use proper JWT library)
    const token = btoa(JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      timestamp: Date.now()
    }));

    return {
      user,
      token
    };
  } catch (error) {
    console.error('User registration failed:', error);
    throw error;
  }
};
