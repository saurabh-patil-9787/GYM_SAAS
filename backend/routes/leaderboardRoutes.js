const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { protectMember } = require('../middleware/authMiddleware');

// All leaderboard routes require member authentication
router.use(protectMember);

// GET /api/v1/leaderboard
router.get('/', leaderboardController.getLeaderboard);

// GET /api/v1/leaderboard/surrounding
router.get('/surrounding', leaderboardController.getSurroundingLeaderboard);

// GET /api/v1/leaderboard/me  (Gamification Profile + Daily Missions + Badges)
router.get('/me', leaderboardController.getGamificationProfile);

// GET /api/v1/leaderboard/pr  (PR Leaderboard — top 1RM holders)
router.get('/pr', leaderboardController.getPRLeaderboard);

// GET /api/v1/leaderboard/pr/me  (My PR rank in the gym)
router.get('/pr/me', leaderboardController.getMyPRRank);

// POST /api/v1/leaderboard/missions/claim
router.post('/missions/claim', leaderboardController.claimDailyMissionReward);

// POST /api/v1/leaderboard/missions/complete-task
router.post('/missions/complete-task', leaderboardController.completeTask);

module.exports = router;
