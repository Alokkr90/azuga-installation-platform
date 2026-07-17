import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Installation {
  id: string;
  guide_id: string;
  installer_id: string;
  vehicle_id: string;
  device_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInstallationInput {
  guide_id: string;
  installer_id: string;
  vehicle_id: string;
  device_id: string;
  notes?: string;
}

export interface UpdateInstallationInput {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  started_at?: Date;
  completed_at?: Date;
}

export class InstallationModel {
  static async create(input: CreateInstallationInput): Promise<Installation> {
    const id = uuidv4();

    const result = await query(
      `INSERT INTO installations (id, guide_id, installer_id, vehicle_id, device_id, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        input.guide_id,
        input.installer_id,
        input.vehicle_id,
        input.device_id,
        input.notes || null,
        'pending',
      ]
    );

    return result.rows[0];
  }

  static async findById(id: string): Promise<Installation | null> {
    const result = await query(
      'SELECT * FROM installations WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  static async findByInstaller(installerId: string, limit: number = 50, offset: number = 0): Promise<Installation[]> {
    const result = await query(
      'SELECT * FROM installations WHERE installer_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [installerId, limit, offset]
    );

    return result.rows;
  }

  static async findByGuide(guideId: string, limit: number = 50, offset: number = 0): Promise<Installation[]> {
    const result = await query(
      'SELECT * FROM installations WHERE guide_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [guideId, limit, offset]
    );

    return result.rows;
  }

  static async findByStatus(
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
    limit: number = 50,
    offset: number = 0
  ): Promise<Installation[]> {
    const result = await query(
      'SELECT * FROM installations WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [status, limit, offset]
    );

    return result.rows;
  }

  static async findAll(limit: number = 50, offset: number = 0): Promise<Installation[]> {
    const result = await query(
      'SELECT * FROM installations ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return result.rows;
  }

  static async update(id: string, input: UpdateInstallationInput): Promise<Installation | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(input.status);
    }

    if (input.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(input.notes || null);
    }

    if (input.started_at !== undefined) {
      updates.push(`started_at = $${paramIndex++}`);
      values.push(input.started_at || null);
    }

    if (input.completed_at !== undefined) {
      updates.push(`completed_at = $${paramIndex++}`);
      values.push(input.completed_at || null);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    if (updates.length === 1) {
      return this.findById(id);
    }

    const result = await query(
      `UPDATE installations SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM installations WHERE id = $1',
      [id]
    );

    return result.rowCount! > 0;
  }

  static async start(id: string): Promise<Installation | null> {
    return this.update(id, {
      status: 'in_progress',
      started_at: new Date(),
    });
  }

  static async complete(id: string): Promise<Installation | null> {
    return this.update(id, {
      status: 'completed',
      completed_at: new Date(),
    });
  }

  static async cancel(id: string): Promise<Installation | null> {
    return this.update(id, { status: 'cancelled' });
  }
}
