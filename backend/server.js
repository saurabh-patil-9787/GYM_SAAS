const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

dotenv.config();

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing from environment variables");
}

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("EMAIL_USER or EMAIL_PASS missing from environment variables. Password reset emails will fail.");
}

// AUDIT FIX 10: Start cleanup cron jobs after DB is connected
const { startCleanupJobs } = require('./utils/cleanupJobs');
const { startRenewalCronJobs } = require('./utils/renewalCronJobs');
const initHabitCronJobs = require('./utils/habitCronJobs');
const initGamificationCronJobs = require('./utils/gamificationCronJobs');
const seedGamification = require('./utils/seedGamification');
const { initializeFCM } = require('./services/fcmService');
const RefreshToken = require('./models/RefreshToken');

// Initialize FCM (gracefully skips if Firebase credentials not configured)
initializeFCM();

connectDB()
    .then(async () => {
        startCleanupJobs(RefreshToken);
        startRenewalCronJobs();
        initHabitCronJobs();
        initGamificationCronJobs();
        await seedGamification(); // Seed XP rules and level progression (idempotent)
    })
    .catch(err => {
        // DB connection failed — log clearly but DON'T crash the server process.
        // Express keeps running; API calls that touch DB will return 500 until Atlas is reachable.
        console.error('[DB] ❌ MongoDB connection failed:', err.message);
        console.warn('[DB] ⚠️  Check your MongoDB Atlas IP Allowlist — add your current IP and restart the server.');
    });

const app = express();

// Security & Performance Middleware
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                frameSrc: [
                    "'self'",
                    "https://www.youtube.com",
                    "https://www.youtube-nocookie.com"
                ],
                scriptSrc: [
                    "'self'",
                    "https://www.youtube.com"
                ],
                imgSrc: [
                    "'self'",
                    "data:",
                    "https://img.youtube.com",
                    "https://i.ytimg.com"
                ]
            }
        },
        crossOriginResourcePolicy: { policy: "cross-origin" }
    })
);
app.use(compression());
// AUDIT FIX 13: Use combined format in production for standard log fields
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// AUDIT FIX 6 (revised): Manual sanitize — compatible with Express 5 / read-only req.query
app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        mongoSanitize.sanitize(req.body, { replaceWith: '_' });
    }
    if (req.params && typeof req.params === 'object') {
        mongoSanitize.sanitize(req.params, { replaceWith: '_' });
    }
    // req.query is intentionally skipped — it is a non-writable getter in Express 5.
    // Query param safety is handled by express-validator on all routes.
    next();
});


app.use(cookieParser());

// Routes Placeholder
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/gym', require('./routes/gymRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/gym-owner', require('./routes/gymOwnerRoutes'));
app.use('/api/subscription', require('./routes/subscriptionRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/plans', require('./routes/planRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api', require('./routes/memberAuthRoutes'));
app.use('/api/v1/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/fitness-videos', require('./routes/fitnessVideoRoutes'));

// Health check — used by uptime monitoring tools (no auth required)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Global Error Handler
const { errorHandler } = require('./middleware/errorMiddleware');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// AUDIT FIX 3: Global unhandled rejection/exception handlers — placed BEFORE app.listen() so startup crashes are also caught
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    process.exit(1);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
