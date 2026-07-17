import { Router, Response } from 'express';
import { InstallationGuideModel } from '../models/InstallationGuide';
import { authMiddleware, AuthenticatedRequest, adminOnly } from '../middleware/auth';

const router = Router();

// Create guide (admin only)
router.post('/', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { vehicle_id, device_id, title } = req.body;

    if (!vehicle_id || !device_id || !title) {
      res.status(400).json({ error: 'Missing required fields: vehicle_id, device_id, title' });
      return;
    }

    const guide = await InstallationGuideModel.create(req.body);

    res.status(201).json(guide);
  } catch (error) {
    console.error('Create guide error:', error);
    res.status(500).json({ error: 'Failed to create guide' });
  }
});

// Get all guides
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const onlyPublished = req.query.published === 'true';

    const guides = await InstallationGuideModel.findAll(limit, offset, onlyPublished);

    res.json(guides);
  } catch (error) {
    console.error('Get guides error:', error);
    res.status(500).json({ error: 'Failed to get guides' });
  }
});

// Get guides by vehicle
router.get('/vehicle/:vehicleId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const guides = await InstallationGuideModel.findByVehicle(req.params.vehicleId, limit, offset);

    res.json(guides);
  } catch (error) {
    console.error('Get vehicle guides error:', error);
    res.status(500).json({ error: 'Failed to get guides' });
  }
});

// Get guides by device
router.get('/device/:deviceId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const guides = await InstallationGuideModel.findByDevice(req.params.deviceId, limit, offset);

    res.json(guides);
  } catch (error) {
    console.error('Get device guides error:', error);
    res.status(500).json({ error: 'Failed to get guides' });
  }
});

// Get guide by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const guide = await InstallationGuideModel.findById(req.params.id);
    if (!guide) {
      res.status(404).json({ error: 'Guide not found' });
      return;
    }

    res.json(guide);
  } catch (error) {
    console.error('Get guide error:', error);
    res.status(500).json({ error: 'Failed to get guide' });
  }
});

// Update guide (admin only)
router.put('/:id', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const guide = await InstallationGuideModel.update(req.params.id, req.body);
    if (!guide) {
      res.status(404).json({ error: 'Guide not found' });
      return;
    }

    res.json(guide);
  } catch (error) {
    console.error('Update guide error:', error);
    res.status(500).json({ error: 'Failed to update guide' });
  }
});

// Delete guide (admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const deleted = await InstallationGuideModel.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Guide not found' });
      return;
    }

    res.json({ message: 'Guide deleted successfully' });
  } catch (error) {
    console.error('Delete guide error:', error);
    res.status(500).json({ error: 'Failed to delete guide' });
  }
});

// Publish guide (admin only)
router.post('/:id/publish', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const guide = await InstallationGuideModel.publish(req.params.id);
    if (!guide) {
      res.status(404).json({ error: 'Guide not found' });
      return;
    }

    res.json(guide);
  } catch (error) {
    console.error('Publish guide error:', error);
    res.status(500).json({ error: 'Failed to publish guide' });
  }
});

// Unpublish guide (admin only)
router.post('/:id/unpublish', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const guide = await InstallationGuideModel.unpublish(req.params.id);
    if (!guide) {
      res.status(404).json({ error: 'Guide not found' });
      return;
    }

    res.json(guide);
  } catch (error) {
    console.error('Unpublish guide error:', error);
    res.status(500).json({ error: 'Failed to unpublish guide' });
  }
});

export default router;
