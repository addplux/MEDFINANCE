const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Patient Portal Endpoints (No JWT required)
router.get('/patient-balance/:patientNumber', publicController.getPatientBalance);
router.post('/initiate-payment', publicController.initiatePayment);

// Payment Gateway Webhook (Authenticated by Gateway Signature)
router.post('/webhooks/payment', express.raw({ type: 'application/json' }), publicController.handlePaymentWebhook);

module.exports = router;
