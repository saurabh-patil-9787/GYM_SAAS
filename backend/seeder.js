const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const importData = async () => {
    try {
        await Admin.deleteMany(); // Clear existing admins to be safe, or just check

        const admin = new Admin({
            username: 'admin',
            password: 'Saurabh@123'
        });

        await admin.save();

        console.log('Admin Imported!');
        console.log('Username: admin');
        console.log('Password: Saurabh@123');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
