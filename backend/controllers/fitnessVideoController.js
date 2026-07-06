const FitnessVideo = require('../models/FitnessVideo');
const extractYoutubeId = (url) => {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&?/]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

// @desc    Get all active fitness videos (optionally filter by category)
// @route   GET /api/fitness-videos
// @access  Public (or Member)
exports.getVideos = async (req, res, next) => {
    try {
        const { category, all, muscleGroup } = req.query;
        let query = {};
        
        if (all !== 'true') {
            query.isActive = true;
        }
        
        if (category) {
            query.category = category;
        }

        if (muscleGroup) {
            query.muscleGroup = muscleGroup;
        }

        const videos = await FitnessVideo.find(query).sort({ createdAt: -1 });
        res.status(200).json(videos);
    } catch (err) {
        next(err);
    }
};

// @desc    Upload new fitness video
// @route   POST /api/fitness-videos
// @access  Private/Admin
exports.createVideo = async (req, res, next) => {
    try {
        const { title, description, category, muscleGroup, youtubeUrl } = req.body;
        
        if (!youtubeUrl) {
            return res.status(400).json({ message: 'Please provide a YouTube video URL' });
        }

        const youtubeVideoId = extractYoutubeId(youtubeUrl);
        if (!youtubeVideoId) {
            return res.status(400).json({ message: 'Invalid YouTube URL' });
        }

        const thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;

        const newVideo = await FitnessVideo.create({
            title,
            description,
            category,
            muscleGroup: category === 'muscle' ? muscleGroup : null,
            youtubeUrl,
            youtubeVideoId,
            thumbnailUrl,
            isActive: true
        });

        res.status(201).json(newVideo);
    } catch (err) {
        next(err);
    }
};

// @desc    Update fitness video details (title, description, isActive, etc)
// @route   PUT /api/fitness-videos/:id
// @access  Private/Admin
exports.updateVideo = async (req, res, next) => {
    try {
        const { title, description, category, muscleGroup, isActive } = req.body;
        
        let video = await FitnessVideo.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        video.title = title || video.title;
        video.description = description || video.description;
        video.category = category || video.category;
        
        if (muscleGroup !== undefined) {
            video.muscleGroup = video.category === 'muscle' ? muscleGroup : null;
        }
        
        if (isActive !== undefined) {
            video.isActive = isActive;
        }

        const updatedVideo = await video.save();
        res.status(200).json(updatedVideo);
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a fitness video
// @route   DELETE /api/fitness-videos/:id
// @access  Private/Admin
exports.deleteVideo = async (req, res, next) => {
    try {
        const video = await FitnessVideo.findById(req.params.id);
        
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // No Cloudinary logic anymore

        await video.deleteOne();
        res.status(200).json({ message: 'Video removed successfully' });
    } catch (err) {
        next(err);
    }
};

// @desc    Increment video views
// @route   PUT /api/fitness-videos/:id/view
// @access  Public (or Member)
exports.incrementView = async (req, res, next) => {
    try {
        const video = await FitnessVideo.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        );
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }
        res.status(200).json({ message: 'View incremented', views: video.views });
    } catch (err) {
        next(err);
    }
};
