import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});

export default app;
