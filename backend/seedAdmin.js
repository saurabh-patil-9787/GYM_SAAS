const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const adminExists = await Admin.findOne({ username: 'admin' });

        if (adminExists) {
            console.log('Admin already exists');
            // Update email if missing
            if (!adminExists.email) {
                adminExists.email = 'admin@gymsaas.com';
                await adminExists.save();
                console.log('Admin email updated');
            }
        } else {
            const admin = await Admin.create({
                username: 'admin',
                password: 'Saurabh@123',
                email: 'admin@gymsaas.com'
            });
            console.log('Admin created:', admin.username);
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedAdmin();
