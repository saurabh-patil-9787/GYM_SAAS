const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.message}`);
    
    // Default to 500 server error
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || 'Server Error';
    let errors = [];

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        statusCode = 404;
        message = 'Resource not found';
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value entered';
        errors = [Object.keys(err.keyValue).map(key => `${key} already exists`)];
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        errors = Object.values(err.errors).map(val => val.message);
    }

    res.status(statusCode).json({
        success: false,
        message,
        errors: errors.length > 0 ? errors : undefined,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = { errorHandler };
