const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

dotenv.config();

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing from environment variables");
}

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("EMAIL_USER or EMAIL_PASS missing from environment variables. Password reset emails will fail.");
}

connectDB();

const app = express();

// Security & Performance Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

app.use(express.json());
app.use(cookieParser());

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

// Routes Placeholder
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/gym', require('./routes/gymRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/gym-owner', require('./routes/gymOwnerRoutes'));
app.use('/api/subscription', require('./routes/subscriptionRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Global Error Handler
const { errorHandler } = require('./middleware/errorMiddleware');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
