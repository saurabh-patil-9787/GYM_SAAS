const cloudinary = require('./utils/cloudinary');

cloudinary.api.ping()
    .then(result => {
        console.log("Cloudinary connection successful:", result);
    })
    .catch(err => {
        console.error("Cloudinary connection failed:", err);
    });
