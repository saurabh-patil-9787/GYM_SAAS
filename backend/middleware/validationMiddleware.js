const { validationResult, body, param } = require('express-validator');

// Middleware to execute the validation chain and return mapped errors
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
        });
    }
    next();
};

// --- Validation schemas ---

const registerValidator = [
    body('ownerName').notEmpty().withMessage('Owner name is required.').isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters.'),
    body('mobile').notEmpty().withMessage('Mobile number is required.').matches(/^[0-9]{10}$/).withMessage('Mobile number must be exactly 10 digits.'),
    body('email').notEmpty().withMessage('Email is required.').isEmail().withMessage('Must be a valid email address.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
];

const loginValidator = [
    body('mobile').notEmpty().withMessage('Mobile number is required.').matches(/^[0-9]{10}$/).withMessage('Mobile number must be exactly 10 digits.'),
    body('password').notEmpty().withMessage('Password is required.'),
];

const forgotPasswordValidator = [
    body('email').notEmpty().withMessage('Email is required.').isEmail().withMessage('Must be a valid email address.').normalizeEmail(),
];

const resetPasswordValidator = [
    param('resetToken').notEmpty().withMessage('Reset token is required.'),
    body('password').notEmpty().withMessage('Password is required.').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
];

const updateEmailValidator = [
    body('email').notEmpty().withMessage('Email is required.').isEmail().withMessage('Must be a valid email address.').normalizeEmail(),
];

const memberValidator = [
    body('name').notEmpty().withMessage('Name is required.').isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters.'),
    body('mobile').notEmpty().withMessage('Mobile number is required.').matches(/^[0-9]{10}$/).withMessage('Mobile number must be exactly 10 digits.'),
    body('planDuration').notEmpty().withMessage('Plan duration is required.').isNumeric().withMessage('Plan duration must be a number.'),
    body('totalFee').notEmpty().withMessage('Total fee is required.').isNumeric().withMessage('Total fee must be a number.'),
    body('paidFee').optional().isNumeric().withMessage('Paid fee must be a number.'),
];

const updateMemberValidator = [
    body('name').notEmpty().withMessage('Name is required.').isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters.'),
    body('mobile').notEmpty().withMessage('Mobile number is required.').matches(/^[0-9]{10}$/).withMessage('Mobile number must be exactly 10 digits.'),
];

module.exports = {
    validateRequest,
    registerValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    updateEmailValidator,
    memberValidator,
    updateMemberValidator
};
