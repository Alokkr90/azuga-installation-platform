import { Router, Response } from 'express';
import { DeviceModel } from '../models/Device';
import { authMiddleware, AuthenticatedRequest, adminOnly } from '../middleware/auth';

const router = Router();

// Create device (admin only)
router.post('/', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Missing required field: name' });
      return;
    }

    const device = await DeviceModel.create(req.body);

    res.status(201).json(device);
  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({ error: 'Failed to create device' });
  }
});

// Get all devices
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const devices = await DeviceModel.findAll(limit, offset);

    res.json(devices);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

// Search devices
router.get('/search', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const q = req.query.q as string;
    if (!q) {
      res.status(400).json({ error: 'Missing search query' });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const devices = await DeviceModel.search(q, limit, offset);

    res.json(devices);
  } catch (error) {
    console.error('Search devices error:', error);
    res.status(500).json({ error: 'Failed to search devices' });
  }
});

// Get device by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const device = await DeviceModel.findById(req.params.id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    res.json(device);
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({ error: 'Failed to get device' });
  }
});

// Update device (admin only)
router.put('/:id', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const device = await DeviceModel.update(req.params.id, req.body);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    res.json(device);
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// Delete device (admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const deleted = await DeviceModel.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

export default router;
