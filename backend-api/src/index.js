import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import 'express-async-errors'; 
import authRoutes from './routes/auth.routes.js';
import matchesRoutes from './routes/matches.routes.js';

const app = express();

// यह हर जगह से फ्रंटएंड रिक्वेस्ट को बिना किसी रुकावट के एलाउ करेगा
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' })); 

process.env.JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

// वर्सेल के लिए बेस रूट (ताकि 404 न आए और पता चले सर्वर चालू है)
app.get('/', (req, res) => {
  res.json({ message: "Cricket Score API is running successfully!" });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// मुख्य एपीआई रूट्स
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchesRoutes);

// फ्रंटएंड अगर बिना /api के सीधे रिक्वेस्ट भेजे तो उसके लिए हैंडलबार्स
app.use('/auth', authRoutes);
app.use('/matches', matchesRoutes);

app.use((err, req, res, next) => {
  console.error('🔥 Server Error Captured:', err);
  res.status(500).json({ error: err.message || 'Server error.' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Cricket Scorecard API listening on :${port}`));

// वर्सेल सर्वरलेस फंक्शन के लिए इसे एक्सपोर्ट करना बेहद ज़रूरी है
export default app;
