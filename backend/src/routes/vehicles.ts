import { Router, Response } from 'express';
import { VehicleModel } from '../models/Vehicle';
import { authMiddleware, AuthenticatedRequest, adminOnly } from '../middleware/auth';

const router = Router();

// Create vehicle (admin only)
router.post('/', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { make, model, year, ...rest } = req.body;

    if (!make || !model || !year) {
      res.status(400).json({ error: 'Missing required fields: make, model, year' });
      return;
    }

    const vehicle = await VehicleModel.create({
      make,
      model,
      year,
      ...rest,
    });

    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

// Get all vehicles
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const vehicles = await VehicleModel.findAll(limit, offset);

    res.json(vehicles);
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Failed to get vehicles' });
  }
});

// Search vehicles
router.get('/search', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const make = req.query.make as string | undefined;
    const model = req.query.model as string | undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const vehicles = await VehicleModel.search(make, model, year, limit, offset);

    res.json(vehicles);
  } catch (error) {
    console.error('Search vehicles error:', error);
    res.status(500).json({ error: 'Failed to search vehicles' });
  }
});

// Get vehicle by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await VehicleModel.findById(req.params.id);
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Failed to get vehicle' });
  }
});

// Update vehicle (admin only)
router.put('/:id', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await VehicleModel.update(req.params.id, req.body);
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// Delete vehicle (admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const deleted = await VehicleModel.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// Deactivate vehicle (admin only)
router.post('/:id/deactivate', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await VehicleModel.deactivate(req.params.id);
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Deactivate vehicle error:', error);
    res.status(500).json({ error: 'Failed to deactivate vehicle' });
  }
});

// Activate vehicle (admin only)
router.post('/:id/activate', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const vehicle = await VehicleModel.activate(req.params.id);
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Activate vehicle error:', error);
    res.status(500).json({ error: 'Failed to activate vehicle' });
  }
});

export default router;
