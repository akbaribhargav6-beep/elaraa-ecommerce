import { Router } from 'express';
import { authRouter } from './auth.routes';
import { categoryRouter } from './category.routes';
import { productRouter } from './product.routes';
import { cartRouter } from './cart.routes';
import { orderRouter } from './order.routes';
import { wishlistRouter } from './wishlist.routes';
import { addressRouter } from './address.routes';
import { newsletterRouter } from './newsletter.routes';
import { contactRouter } from './contact.routes';
import { couponRouter } from './coupon.routes';
import { stockNotificationRouter } from './stockNotification.routes';
import { adminRouter } from './admin/index';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/cart', cartRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/wishlist', wishlistRouter);
apiRouter.use('/addresses', addressRouter);
apiRouter.use('/newsletter', newsletterRouter);
apiRouter.use('/contact', contactRouter);
apiRouter.use('/coupons', couponRouter);
apiRouter.use('/stock-notifications', stockNotificationRouter);
apiRouter.use('/admin', adminRouter);
