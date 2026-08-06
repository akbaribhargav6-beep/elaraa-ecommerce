import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';
import { adminDashboardRouter } from './dashboard.routes';
import { adminProductsRouter } from './products.routes';
import { adminCategoriesRouter } from './categories.routes';
import { adminInventoryRouter } from './inventory.routes';
import { adminOrdersRouter } from './orders.routes';
import { adminCustomersRouter } from './customers.routes';
import { adminReviewsRouter } from './reviews.routes';
import { adminCouponsRouter } from './coupons.routes';
import { adminDiscountsRouter } from './discounts.routes';
import { adminBannersRouter } from './banners.routes';
import { adminNewsletterRouter } from './newsletter.routes';
import { adminContactRouter } from './contact.routes';
import { adminSettingsRouter } from './settings.routes';

export const adminRouter = Router();

// Every admin route requires a valid access token AND the ADMIN role.
adminRouter.use(requireAuth, requireAdmin);

adminRouter.use('/dashboard', adminDashboardRouter);
adminRouter.use('/products', adminProductsRouter);
adminRouter.use('/categories', adminCategoriesRouter);
adminRouter.use('/inventory', adminInventoryRouter);
adminRouter.use('/orders', adminOrdersRouter);
adminRouter.use('/customers', adminCustomersRouter);
adminRouter.use('/reviews', adminReviewsRouter);
adminRouter.use('/coupons', adminCouponsRouter);
adminRouter.use('/discounts', adminDiscountsRouter);
adminRouter.use('/banners', adminBannersRouter);
adminRouter.use('/newsletter', adminNewsletterRouter);
adminRouter.use('/contact', adminContactRouter);
adminRouter.use('/settings', adminSettingsRouter);
