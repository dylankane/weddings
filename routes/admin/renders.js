'use strict';

const express = require('express');
const router  = express.Router();

const { dashboard } = require('../../controllers/admin/dashboardController');

// TODO: add requireAuth, requireRole(['SUPER_ADMIN', 'MANAGER']) once login is built

router.get('/', dashboard);

module.exports = router;
