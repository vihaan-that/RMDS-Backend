const validateRequest = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property], {
            abortEarly: false,  // Return all errors, not just the first one
            stripUnknown: true, // Remove unknown properties
            convert: true       // Try to convert values to the correct type
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                errors
            });
        }

        next();
    };
};

module.exports = validateRequest;
