import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDatabase } from './config/db.js';
import { setStorageMode } from './services/storage.js';
import casesRouter from './routes/cases.js';
import { errorHandler, notFound } from './middleware/errors.js';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://ai-mystery-room-web-ef3h.onrender.com',
  ...(process.env.CLIENT_URL || '').split(',').map((origin) => origin.trim().replace(/\/+$/, '')).filter(Boolean)
]);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  }
}));
app.use(express.json({limit:'2mb'}));
app.use('/uploads',express.static(path.resolve(__dirname,'../uploads')));
app.get('/api/health',(req,res)=>res.json({ok:true,service:'ai-mystery-room-api',aiConfigured:Boolean(process.env.GEMINI_API_KEY),audioConfigured:Boolean(process.env.ELEVENLABS_API_KEY&&process.env.ELEVENLABS_VOICE_ID)}));
app.use('/api/cases',casesRouter);
app.use(notFound);app.use(errorHandler);
const port=Number(process.env.PORT)||5000;
connectDatabase().then(connected=>{setStorageMode(connected);app.listen(port,()=>console.log(`🚀 AI Mystery Room API listening on http://localhost:${port}`));}).catch(err=>{console.error('MongoDB connection failed:',err.message);console.error('Fix MONGODB_URI or clear it to use temporary demo storage. Server was not started.');process.exit(1);});
