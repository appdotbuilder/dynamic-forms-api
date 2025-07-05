
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

export const authLogin = async (input: LoginInput): Promise<AuthResponse> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = users[0];

    // For this implementation, we'll do a simple password comparison
    // In a real app, you would use bcrypt.compare() or similar
    if (user.password_hash !== input.password) {
      throw new Error('Invalid credentials');
    }

    // Generate a simple JWT token (in real app, use proper JWT library)
    const token = `jwt_token_${user.id}_${Date.now()}`;

    return {
      user: {
        id: user.id,
        email: user.email,
        password_hash: user.password_hash,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
