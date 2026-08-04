const express = require('express');
const milestoneController = require('../controllers/milestone.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.patch('/:id', milestoneController.updateMilestone);

module.exports = router;
