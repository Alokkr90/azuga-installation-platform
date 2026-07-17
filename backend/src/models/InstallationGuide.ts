import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface InstallationGuide {
  id: string;
  vehicle_id: string;
  device_id: string;
  title: string;
  description: string | null;
  difficulty_level: 'easy' | 'medium' | 'hard' | null;
  estimated_duration_minutes: number | null;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateGuideInput {
  vehicle_id: string;
  device_id: string;
  title: string;
  description?: string;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  estimated_duration_minutes?: number;
  is_published?: boolean;
}

export interface UpdateGuideInput {
  title?: string;
  description?: string;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  estimated_duration_minutes?: number;
  is_published?: boolean;
}

export class InstallationGuideModel {
  static async create(input: CreateGuideInput): Promise<InstallationGuide> {
    const id = uuidv4();

    const result = await query(
      `INSERT INTO installation_guides (id, vehicle_id, device_id, title, description, difficulty_level, estimated_duration_minutes, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        input.vehicle_id,
        input.device_id,
        input.title,
        input.description || null,
        input.difficulty_level || null,
        input.estimated_duration_minutes || null,
        input.is_published || false,
      ]
    );

    return result.rows[0];
  }

  static async findById(id: string): Promise<InstallationGuide | null> {
    const result = await query(
      'SELECT * FROM installation_guides WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  static async findByVehicleAndDevice(vehicleId: string, deviceId: string): Promise<InstallationGuide | null> {
    const result = await query(
      'SELECT * FROM installation_guides WHERE vehicle_id = $1 AND device_id = $2',
      [vehicleId, deviceId]
    );

    return result.rows[0] || null;
  }

  static async findByVehicle(vehicleId: string, limit: number = 50, offset: number = 0): Promise<InstallationGuide[]> {
    const result = await query(
      'SELECT * FROM installation_guides WHERE vehicle_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [vehicleId, limit, offset]
    );

    return result.rows;
  }

  static async findByDevice(deviceId: string, limit: number = 50, offset: number = 0): Promise<InstallationGuide[]> {
    const result = await query(
      'SELECT * FROM installation_guides WHERE device_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [deviceId, limit, offset]
    );

    return result.rows;
  }

  static async findAll(limit: number = 50, offset: number = 0, onlyPublished: boolean = false): Promise<InstallationGuide[]> {
    let sql = 'SELECT * FROM installation_guides';
    const params: any[] = [];

    if (onlyPublished) {
      sql += ' WHERE is_published = true';
    }

    sql += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    params.push(limit, offset);

    const result = await query(sql, params);

    return result.rows;
  }

  static async update(id: string, input: UpdateGuideInput): Promise<InstallationGuide | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(input.title);
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(input.description || null);
    }

    if (input.difficulty_level !== undefined) {
      updates.push(`difficulty_level = $${paramIndex++}`);
      values.push(input.difficulty_level || null);
    }

    if (input.estimated_duration_minutes !== undefined) {
      updates.push(`estimated_duration_minutes = $${paramIndex++}`);
      values.push(input.estimated_duration_minutes || null);
    }

    if (input.is_published !== undefined) {
      updates.push(`is_published = $${paramIndex++}`);
      values.push(input.is_published);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    if (updates.length === 1) {
      return this.findById(id);
    }

    const result = await query(
      `UPDATE installation_guides SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM installation_guides WHERE id = $1',
      [id]
    );

    return result.rowCount! > 0;
  }

  static async publish(id: string): Promise<InstallationGuide | null> {
    return this.update(id, { is_published: true });
  }

  static async unpublish(id: string): Promise<InstallationGuide | null> {
    return this.update(id, { is_published: false });
  }
}
