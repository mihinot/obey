import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import starsRouter from './routes/stars';
import eventsRouter from './routes/events';
import planningRouter from './routes/planning';
import meRouter from './routes/me';
import departmentsRouter from './routes/departments';
import adminRouter from './routes/admin';
import statsRouter from './routes/stats';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.use('/auth', authRouter);
app.use('/stars', starsRouter);
app.use('/events', eventsRouter);
app.use('/events', planningRouter);
app.use('/me', meRouter);
app.use('/departments', departmentsRouter);
app.use('/admin', adminRouter);
app.use('/stats', statsRouter);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});

export default app;
