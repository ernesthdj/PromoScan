/**
 * Router principal — Monte tous les sous-routers sur /api/v1/.
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import shoppingListsRoutes from './shopping-lists.routes';
import productsRoutes from './products.routes';
import promotionsRoutes from './promotions.routes';
import suggestionsRoutes from './suggestions.routes';
import routesRoutes from './routes.routes';
import scanJobsRoutes from './scan-jobs.routes';
import geoRoutes from './geo.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/shopping-lists', shoppingListsRoutes);
router.use('/products', productsRoutes);
router.use('/promotions', promotionsRoutes);
router.use('/suggestions', suggestionsRoutes);
router.use('/routes', routesRoutes);
router.use('/admin/scan-jobs', scanJobsRoutes);
router.use('/geo', geoRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() }, error: null });
});

export default router;
