import { Router, Response } from 'express';
import { UserModel } from '../models/User';
import { generateToken, comparePassword } from '../config/auth';
import { authMiddleware, AuthenticatedRequest, adminOnly } from '../middleware/auth';

const router = Router();

// Register
router.post('/register', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    const user = await UserModel.create({
      email,
      password,
      full_name,
      role: role || 'installer',
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Missing email or password' });
      return;
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ error: 'User account is inactive' });
      return;
    }

    const isPasswordValid = await UserModel.verifyPassword(user, password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await UserModel.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get all users (admin only)
router.get('/', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const users = await UserModel.findAll(limit, offset);
    const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);

    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user by ID (admin only)
router.get('/:id', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Users can only update their own profile unless they're admin
    if (req.user?.userId !== req.params.id && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const updatedUser = await UserModel.update(req.params.id, req.body);
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Deactivate user (admin only)
router.post('/:id/deactivate', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const updatedUser = await UserModel.deactivate(req.params.id);
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// Activate user (admin only)
router.post('/:id/activate', authMiddleware, adminOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const updatedUser = await UserModel.activate(req.params.id);
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ error: 'Failed to activate user' });
  }
});

export default router;
