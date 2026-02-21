const express = require('express');
const router = express.Router();
const utilisationController = require('../controllers/utilisationController');

router.get('/report', utilisationController.getUtilisationReport);

module.exports = router;
