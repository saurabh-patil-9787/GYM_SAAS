const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Gym = require('./models/Gym');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const checkDB = async () => {
    try {
        console.log('Checking Gym Indexes...');
        const indexes = await Gym.collection.indexes();
        console.log(indexes);

        console.log('Listing all Gyms...');
        const gyms = await Gym.find({});
        console.log(`Found ${gyms.length} gyms.`);
        gyms.forEach(g => console.log(`- ${g.gymName} (Owner: ${g.owner})`));

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkDB();
