'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const upload = require('../lib/upload');

const authController = require('../controllers/admin/authController');
const dashboardController = require('../controllers/admin/dashboardController');
const enquiriesController = require('../controllers/admin/rental/enquiriesController');
const bookingsController = require('../controllers/admin/rental/bookingsController');
const productsController = require('../controllers/admin/rental/productsController');
const quotesController = require('../controllers/admin/rental/quotesController');
const invoicesController = require('../controllers/admin/rental/invoicesController');
const deliveryZonesController = require('../controllers/admin/rental/deliveryZonesController');
const settingsController = require('../controllers/admin/rental/settingsController');
const usersController = require('../controllers/admin/usersController');

const manager = ['SUPER_ADMIN', 'MANAGER'];
const superAdmin = ['SUPER_ADMIN'];

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// â”€â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/login', authController.showLogin);
router.post('/login', loginLimiter, authController.processLogin);
router.post('/logout', requireAuth, authController.logout);
router.get('/account/password', requireAuth, authController.showChangePassword);
router.post('/account/password', requireAuth, authController.changePassword);

// â”€â”€â”€ Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/', requireAuth, requireRole(manager), (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard', requireAuth, requireRole(manager), dashboardController.show);

// â”€â”€â”€ Enquiries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/rental/enquiries', requireAuth, requireRole(manager), enquiriesController.list);
router.get('/rental/enquiries/create', requireAuth, requireRole(manager), enquiriesController.showCreate);
router.post('/rental/enquiries/create', requireAuth, requireRole(manager), enquiriesController.create);
router.get('/rental/enquiries/:id', requireAuth, requireRole(manager), enquiriesController.detail);
router.get('/rental/enquiries/:id/edit', requireAuth, requireRole(manager), enquiriesController.showEdit);
router.post('/rental/enquiries/:id/edit', requireAuth, requireRole(manager), enquiriesController.update);
router.post('/rental/enquiries/:id/status', requireAuth, requireRole(manager), enquiriesController.updateStatus);
router.post('/rental/enquiries/:id/archive', requireAuth, requireRole(manager), enquiriesController.archive);

// â”€â”€â”€ Bookings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/rental/bookings', requireAuth, requireRole(manager), bookingsController.list);
router.get('/rental/bookings/create', requireAuth, requireRole(manager), bookingsController.showCreate);
router.post('/rental/bookings/create', requireAuth, requireRole(manager), bookingsController.create);
router.get('/rental/bookings/:id', requireAuth, requireRole(manager), bookingsController.detail);
router.get('/rental/bookings/:id/edit', requireAuth, requireRole(manager), bookingsController.showEdit);
router.post('/rental/bookings/:id/edit', requireAuth, requireRole(manager), bookingsController.update);
router.post('/rental/bookings/:id/status', requireAuth, requireRole(manager), bookingsController.updateStatus);
router.post('/rental/bookings/:id/cancel', requireAuth, requireRole(manager), bookingsController.cancel);
router.post('/rental/bookings/:id/delivery/calculate', requireAuth, requireRole(manager), bookingsController.calculateDelivery);

// â”€â”€â”€ Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/rental/products', requireAuth, requireRole(manager), productsController.list);
router.get('/rental/products/create', requireAuth, requireRole(manager), productsController.showCreate);
router.post('/rental/products/create', requireAuth, requireRole(manager), productsController.create);
router.get('/rental/products/:id', requireAuth, requireRole(manager), productsController.detail);
router.get('/rental/products/:id/edit', requireAuth, requireRole(manager), productsController.showEdit);
router.post('/rental/products/:id/edit', requireAuth, requireRole(manager), productsController.update);
router.post('/rental/products/:id/deactivate', requireAuth, requireRole(manager), productsController.deactivate);
router.post('/rental/products/:id/images/upload', requireAuth, requireRole(manager), upload.single('file'), productsController.uploadImage);
router.post('/rental/products/:id/images/:imageId/delete', requireAuth, requireRole(manager), productsController.deleteImage);
router.post('/rental/products/:id/images/:imageId/primary', requireAuth, requireRole(manager), productsController.setPrimaryImage);

// â”€â”€â”€ Quotes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/rental/quotes/create', requireAuth, requireRole(manager), quotesController.showCreate);
router.post('/rental/quotes/create', requireAuth, requireRole(manager), quotesController.create);
router.get('/rental/quotes/:id', requireAuth, requireRole(manager), quotesController.detail);
router.post('/rental/quotes/:id/send', requireAuth, requireRole(manager), quotesController.send);
router.post('/rental/quotes/:id/status', requireAuth, requireRole(manager), quotesController.updateStatus);

// â”€â”€â”€ Invoices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/rental/invoices/create', requireAuth, requireRole(manager), invoicesController.showCreate);
router.post('/rental/invoices/create', requireAuth, requireRole(manager), invoicesController.create);
router.get('/rental/invoices/:id', requireAuth, requireRole(manager), invoicesController.detail);
router.post('/rental/invoices/:id/send', requireAuth, requireRole(manager), invoicesController.send);
router.post('/rental/invoices/:id/status', requireAuth, requireRole(manager), invoicesController.updateStatus);

// â”€â”€â”€ Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/settings', requireAuth, requireRole(manager), settingsController.show);
router.post('/settings/company', requireAuth, requireRole(manager), settingsController.updateCompany);
router.post('/settings/company/logo', requireAuth, requireRole(manager), upload.single('file'), settingsController.uploadLogo);
router.post('/settings/email-templates/:id', requireAuth, requireRole(manager), settingsController.updateEmailTemplate);

// â”€â”€â”€ Delivery Zones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/rental/delivery-zones', requireAuth, requireRole(manager), deliveryZonesController.list);
router.get('/rental/delivery-zones/create', requireAuth, requireRole(manager), deliveryZonesController.showCreate);
router.post('/rental/delivery-zones/create', requireAuth, requireRole(manager), deliveryZonesController.create);
router.get('/rental/delivery-zones/:id/edit', requireAuth, requireRole(manager), deliveryZonesController.showEdit);
router.post('/rental/delivery-zones/:id/edit', requireAuth, requireRole(manager), deliveryZonesController.update);
router.post('/rental/delivery-zones/:id/deactivate', requireAuth, requireRole(manager), deliveryZonesController.deactivate);

// â”€â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/users', requireAuth, requireRole(manager), usersController.list);
router.get('/users/create', requireAuth, requireRole(manager), usersController.showCreate);
router.post('/users/create', requireAuth, requireRole(manager), usersController.create);
router.get('/users/:id/edit', requireAuth, requireRole(manager), usersController.showEdit);
router.post('/users/:id/edit', requireAuth, requireRole(manager), usersController.update);
router.post('/users/:id/deactivate', requireAuth, requireRole(manager), usersController.deactivate);

// ─── API ──────────────────────────────────────────────────────────────────────

router.post('/api/delivery/calculate', requireAuth, requireRole(manager), bookingsController.calculateDelivery);

module.exports = router;


