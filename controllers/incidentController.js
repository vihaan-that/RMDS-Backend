const Incident = require('../models/incident');

// Get incidents based on timeframe
exports.getIncidents = async (req, res, next) => {
    try {
        const { startTime, endTime } = req.query;
        
        if (!startTime || !endTime) {
            return res.status(400).json({
                success: false,
                error: 'Please provide startTime and endTime'
            });
        }

        // Find incidents that overlap with the given timeframe
        const incidents = await Incident.find({
            $or: [
                // Incidents that start within the timeframe
                {
                    startDate: {
                        $gte: new Date(startTime),
                        $lte: new Date(endTime)
                    }
                },
                // Incidents that end within the timeframe
                {
                    endDate: {
                        $gte: new Date(startTime),
                        $lte: new Date(endTime)
                    }
                },
                // Incidents that span the entire timeframe
                {
                    startDate: { $lte: new Date(startTime) },
                    endDate: { $gte: new Date(endTime) }
                }
            ]
        }).sort({ startDate: -1 });

        res.status(200).json({
            success: true,
            data: incidents
        });
    } catch (error) {
        next(error);
    }
};
