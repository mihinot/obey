import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRouter from './routes/auth';
import starsRouter from './routes/stars';
import eventsRouter from './routes/events';
import planningRouter from './routes/planning';
import meRouter from './routes/me';
import departmentsRouter from './routes/departments';
import adminRouter from './routes/admin';

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
  : ['http://localhost:5173'];
app.use(cors({ origin: allowedOrigins }));
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

// Serve React SPA in production
const webDist = path.join(__dirname, '../../web/dist');
app.use(express.static(webDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(webDist, 'index.html'));
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});

export default app;
