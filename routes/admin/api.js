'use strict';

const express = require('express');
const router = express.Router();

const { requireAuth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleCheck');

const bookingsController = require('../../controllers/admin/rental/bookingsController');

const manager = ['SUPER_ADMIN', 'MANAGER'];

// ─── Delivery ─────────────────────────────────────────────────────────────────

router.post('/api/delivery/calculate', requireAuth, requireRole(manager), bookingsController.calculateDelivery);

module.exports = router;
