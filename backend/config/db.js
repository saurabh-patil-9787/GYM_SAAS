const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Connection pool: allow up to 20 concurrent DB operations
            // Default is 5 — insufficient at 100+ concurrent users
            maxPoolSize: 20,
            minPoolSize: 2,
            // Fail fast on connection issues (default is 30s which hangs the app)
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Security reminder — verify MongoDB Atlas IP Allowlist is not open (0.0.0.0/0)
        // In production, restrict to your backend server's IP only
        // Atlas Dashboard → Network Access → IP Access List
        if (process.env.NODE_ENV === 'production') {
            console.log('[DB] ⚠️  Reminder: Ensure MongoDB Atlas IP Allowlist is restricted to your server IP only (not 0.0.0.0/0)');
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
