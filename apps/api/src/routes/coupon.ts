import { Hono } from 'hono';
import { CouponService } from '../services/coupon';
import { requireAuth } from '../middleware/auth';
import { createCouponSchema, updateCouponSchema } from '../validation/coupon';
import { User, AuthSession } from '../types/auth';

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

const couponRoutes = new Hono<{
  Bindings: Env;
  Variables: { user: User; session: AuthSession };
}>();

// Apply auth middleware to all coupon routes
couponRoutes.use('*', requireAuth());

// GET /api/v1/coupons - Get all coupons for the authenticated user
couponRoutes.get('/', async (c) => {
  try {
    const user = c.get('user');
    const couponService = new CouponService(c.env.DB);
    const coupons = await couponService.getCouponsByUser(user.id);

    return c.json({ coupons });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return c.json({ error: 'Failed to fetch coupons' }, 500);
  }
});

// POST /api/v1/coupons - Create a new coupon
couponRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    // Validate request body
    const validatedData = createCouponSchema.parse(body);
    
    const couponService = new CouponService(c.env.DB);
    const coupon = await couponService.createCoupon(user.id, validatedData);

    return c.json({ coupon }, 201);
  } catch (error) {
    console.error('Error creating coupon:', error);
    
    if (error instanceof Error && error.message.includes('parse')) {
      return c.json({ error: 'Invalid request data' }, 400);
    }
    
    return c.json({ error: 'Failed to create coupon' }, 500);
  }
});

// GET /api/v1/coupons/:id - Get a specific coupon
couponRoutes.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    
    const couponService = new CouponService(c.env.DB);
    const coupon = await couponService.getCouponById(id, user.id);

    if (!coupon) {
      return c.json({ error: 'Coupon not found' }, 404);
    }

    return c.json({ coupon });
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return c.json({ error: 'Failed to fetch coupon' }, 500);
  }
});

// PUT /api/v1/coupons/:id - Update a coupon (e.g., mark as used)
couponRoutes.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Validate request body
    const validatedData = updateCouponSchema.parse(body);
    
    const couponService = new CouponService(c.env.DB);
    const updatedCoupon = await couponService.updateCoupon(id, user.id, validatedData);

    if (!updatedCoupon) {
      return c.json({ error: 'Coupon not found' }, 404);
    }

    return c.json({ coupon: updatedCoupon });
  } catch (error) {
    console.error('Error updating coupon:', error);
    
    if (error instanceof Error && error.message.includes('parse')) {
      return c.json({ error: 'Invalid request data' }, 400);
    }
    
    return c.json({ error: 'Failed to update coupon' }, 500);
  }
});

// DELETE /api/v1/coupons/:id - Delete a coupon
couponRoutes.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    
    const couponService = new CouponService(c.env.DB);
    const deleted = await couponService.deleteCoupon(id, user.id);

    if (!deleted) {
      return c.json({ error: 'Coupon not found' }, 404);
    }

    return c.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return c.json({ error: 'Failed to delete coupon' }, 500);
  }
});

export default couponRoutes;
