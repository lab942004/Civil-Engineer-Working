import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import routes from './routes';
import adminRoutes from './routes/adminRoutes';
import uploadRoutes from './routes/uploadRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = config.port;

// Security Middleware
app.use(helmet());
const allowedOrigins = config.allowedOrigins;
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'Civil Engineering Assistant API',
    version: '1.0.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1', routes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1', uploadRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  🏗️  Civil Engineering Assistant`);
  console.log(`========================================`);
  console.log(`  📡 Server:    http://localhost:${PORT}`);
  console.log(`  🔧 Health:    http://localhost:${PORT}/api/v1/health`);
  console.log(`  🌐 Frontend:  ${config.frontendUrl}`);
  console.log(`  📦 Database:  PostgreSQL via Prisma`);
  console.log(`  🔐 Auth:      JWT + Refresh Tokens`);
  console.log(`  ☁️  Storage:   Cloudinary`);
  console.log(`  🚀 Version:   1.0.0`);
  console.log(`  📅 Started:   ${new Date().toISOString()}`);
  console.log(`========================================\n`);
});

export default app;