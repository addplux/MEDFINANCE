const express = require('express');
const router = express.Router();
const { getVitals, createVitals } = require('../controllers/vitalsController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/visit/:visitId', getVitals);
router.post('/', createVitals);

module.exports = router;
