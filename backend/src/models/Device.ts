import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Device {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  created_at: Date;
}

export interface CreateDeviceInput {
  name: string;
  description?: string;
  icon_url?: string;
}

export interface UpdateDeviceInput {
  name?: string;
  description?: string;
  icon_url?: string;
}

export class DeviceModel {
  static async create(input: CreateDeviceInput): Promise<Device> {
    const id = uuidv4();

    const result = await query(
      `INSERT INTO devices (id, name, description, icon_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, input.name, input.description || null, input.icon_url || null]
    );

    return result.rows[0];
  }

  static async findById(id: string): Promise<Device | null> {
    const result = await query(
      'SELECT * FROM devices WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  static async findByName(name: string): Promise<Device | null> {
    const result = await query(
      'SELECT * FROM devices WHERE name = $1',
      [name]
    );

    return result.rows[0] || null;
  }

  static async findAll(limit: number = 50, offset: number = 0): Promise<Device[]> {
    const result = await query(
      'SELECT * FROM devices ORDER BY name ASC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return result.rows;
  }

  static async search(query_text: string, limit: number = 50, offset: number = 0): Promise<Device[]> {
    const result = await query(
      `SELECT * FROM devices WHERE name ILIKE $1 OR description ILIKE $1 
       ORDER BY name ASC LIMIT $2 OFFSET $3`,
      [`%${query_text}%`, limit, offset]
    );

    return result.rows;
  }

  static async update(id: string, input: UpdateDeviceInput): Promise<Device | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(input.description || null);
    }

    if (input.icon_url !== undefined) {
      updates.push(`icon_url = $${paramIndex++}`);
      values.push(input.icon_url || null);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE devices SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM devices WHERE id = $1',
      [id]
    );

    return result.rowCount! > 0;
  }
}
