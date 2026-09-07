import { Router } from 'express';
import authRouter from './auth.routes';
import liveDataRouter from './live-data.routes';

const indexRouter = Router();

indexRouter.use('/auth', authRouter);
indexRouter.use('/live-data', liveDataRouter);
export default indexRouter;