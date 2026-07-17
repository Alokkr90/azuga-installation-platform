import { query } from '../config/database';
import { hashPassword, comparePassword } from '../config/auth';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'installer';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'installer';
}

export interface UpdateUserInput {
  email?: string;
  full_name?: string;
  is_active?: boolean;
}

export class UserModel {
  static async create(input: CreateUserInput): Promise<User> {
    const id = uuidv4();
    const hashedPassword = await hashPassword(input.password);

    const result = await query(
      `INSERT INTO users (id, email, password, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, input.email, hashedPassword, input.full_name, input.role]
    );

    return result.rows[0];
  }

  static async findById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    return result.rows[0] || null;
  }

  static async findAll(limit: number = 50, offset: number = 0): Promise<User[]> {
    const result = await query(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return result.rows;
  }

  static async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(input.email);
    }

    if (input.full_name !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(input.full_name);
    }

    if (input.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(input.is_active);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    if (updates.length === 1) {
      // Only updated_at was set
      return this.findById(id);
    }

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );

    return result.rowCount! > 0;
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return comparePassword(password, user.password);
  }

  static async deactivate(id: string): Promise<User | null> {
    return this.update(id, { is_active: false });
  }

  static async activate(id: string): Promise<User | null> {
    return this.update(id, { is_active: true });
  }
}
