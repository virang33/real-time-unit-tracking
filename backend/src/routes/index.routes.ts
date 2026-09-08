import { Router } from 'express';
import authRouter from './auth.routes';
import liveDataRouter from './live-data.routes';
import adminRouter from './admin.routes'; // dev‑only admin routes

const indexRouter = Router();

indexRouter.use('/auth', authRouter);
indexRouter.use('/live-data', liveDataRouter);
// Development‑only admin endpoint – only active when not in production
if (process.env.NODE_ENV !== 'production') {
  indexRouter.use('/admin', adminRouter);
}
export default indexRouter;