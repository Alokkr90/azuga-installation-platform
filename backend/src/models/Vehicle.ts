import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin_pattern: string | null;
  base_image_url: string | null;
  model_2d_url: string | null;
  model_3d_url: string | null;
  geometry_data: any;
  specifications: any;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateVehicleInput {
  make: string;
  model: string;
  year: number;
  vin_pattern?: string;
  base_image_url?: string;
  model_2d_url?: string;
  model_3d_url?: string;
  geometry_data?: any;
  specifications?: any;
}

export interface UpdateVehicleInput {
  make?: string;
  model?: string;
  year?: number;
  vin_pattern?: string;
  base_image_url?: string;
  model_2d_url?: string;
  model_3d_url?: string;
  geometry_data?: any;
  specifications?: any;
  is_active?: boolean;
}

export class VehicleModel {
  static async create(input: CreateVehicleInput): Promise<Vehicle> {
    const id = uuidv4();

    const result = await query(
      `INSERT INTO vehicles (id, make, model, year, vin_pattern, base_image_url, model_2d_url, model_3d_url, geometry_data, specifications)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id,
        input.make,
        input.model,
        input.year,
        input.vin_pattern || null,
        input.base_image_url || null,
        input.model_2d_url || null,
        input.model_3d_url || null,
        input.geometry_data ? JSON.stringify(input.geometry_data) : null,
        input.specifications ? JSON.stringify(input.specifications) : null,
      ]
    );

    return result.rows[0];
  }

  static async findById(id: string): Promise<Vehicle | null> {
    const result = await query(
      'SELECT * FROM vehicles WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  static async findByMakeModelYear(make: string, model: string, year: number): Promise<Vehicle | null> {
    const result = await query(
      'SELECT * FROM vehicles WHERE make = $1 AND model = $2 AND year = $3',
      [make, model, year]
    );

    return result.rows[0] || null;
  }

  static async findAll(limit: number = 50, offset: number = 0, onlyActive: boolean = true): Promise<Vehicle[]> {
    let sql = 'SELECT * FROM vehicles';
    const params: any[] = [];

    if (onlyActive) {
      sql += ' WHERE is_active = true';
    }

    sql += ' ORDER BY make, model, year DESC LIMIT $1 OFFSET $2';
    params.push(limit, offset);

    const result = await query(sql, params);

    return result.rows;
  }

  static async search(
    make?: string,
    model?: string,
    year?: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<Vehicle[]> {
    let sql = 'SELECT * FROM vehicles WHERE is_active = true';
    const params: any[] = [];
    let paramIndex = 1;

    if (make) {
      sql += ` AND make ILIKE $${paramIndex++}`;
      params.push(`%${make}%`);
    }

    if (model) {
      sql += ` AND model ILIKE $${paramIndex++}`;
      params.push(`%${model}%`);
    }

    if (year) {
      sql += ` AND year = $${paramIndex++}`;
      params.push(year);
    }

    sql += ` ORDER BY make, model, year DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    return result.rows;
  }

  static async update(id: string, input: UpdateVehicleInput): Promise<Vehicle | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.make !== undefined) {
      updates.push(`make = $${paramIndex++}`);
      values.push(input.make);
    }

    if (input.model !== undefined) {
      updates.push(`model = $${paramIndex++}`);
      values.push(input.model);
    }

    if (input.year !== undefined) {
      updates.push(`year = $${paramIndex++}`);
      values.push(input.year);
    }

    if (input.vin_pattern !== undefined) {
      updates.push(`vin_pattern = $${paramIndex++}`);
      values.push(input.vin_pattern || null);
    }

    if (input.base_image_url !== undefined) {
      updates.push(`base_image_url = $${paramIndex++}`);
      values.push(input.base_image_url || null);
    }

    if (input.model_2d_url !== undefined) {
      updates.push(`model_2d_url = $${paramIndex++}`);
      values.push(input.model_2d_url || null);
    }

    if (input.model_3d_url !== undefined) {
      updates.push(`model_3d_url = $${paramIndex++}`);
      values.push(input.model_3d_url || null);
    }

    if (input.geometry_data !== undefined) {
      updates.push(`geometry_data = $${paramIndex++}`);
      values.push(input.geometry_data ? JSON.stringify(input.geometry_data) : null);
    }

    if (input.specifications !== undefined) {
      updates.push(`specifications = $${paramIndex++}`);
      values.push(input.specifications ? JSON.stringify(input.specifications) : null);
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
      `UPDATE vehicles SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM vehicles WHERE id = $1',
      [id]
    );

    return result.rowCount! > 0;
  }

  static async deactivate(id: string): Promise<Vehicle | null> {
    return this.update(id, { is_active: false });
  }

  static async activate(id: string): Promise<Vehicle | null> {
    return this.update(id, { is_active: true });
  }
}
