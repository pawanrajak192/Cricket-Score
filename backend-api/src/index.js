import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import 'express-async-errors'; 
import authRoutes from './routes/auth.routes.js';
import matchesRoutes from './routes/matches.routes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' })); 

process.env.JWT_SECRET = 'my_super_secret_cricket_key_2026';
process.env.JWT_EXPIRES_IN = '30d';

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchesRoutes);

app.use((err, req, res, next) => {
  console.error('🔥 Server Error Captured:', err);
  res.status(500).json({ error: err.message || 'Server error.' });
});

const port = 4000;
app.listen(port, () => console.log(`Cricket Scorecard API listening on :${port}`));
