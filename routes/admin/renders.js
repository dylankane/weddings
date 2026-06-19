'use strict';

const express = require('express');
const router  = express.Router();

const { dashboard }                                                          = require('../../controllers/admin/dashboardController');
const { list, detail, newJob, create, saveDetails, saveDelivery, savePricing, saveStatus } = require('../../controllers/admin/jobsController');
const { list: productList, newProduct, editProduct, create: createProduct, update: updateProduct, toggleActive, deleteProduct } = require('../../controllers/admin/productsController');
const productUpload = require('../../middleware/productUpload');

// TODO: add requireAuth, requireRole(['SUPER_ADMIN', 'MANAGER']) once login is built

router.get('/', dashboard);

// ─── Jobs ──────────────────────────────────────────────────────────────────────
router.get('/jobs',                 list);
router.get('/jobs/new',             newJob);
router.get('/jobs/:id',             detail);
router.post('/jobs',                create);
router.post('/jobs/:id/details',    saveDetails);
router.post('/jobs/:id/delivery',   saveDelivery);
router.post('/jobs/:id/pricing',    savePricing);
router.post('/jobs/:id/status',     saveStatus);

// ─── Products ──────────────────────────────────────────────────────────────────
router.get('/products',             productList);
router.get('/products/new',         newProduct);
router.get('/products/:id/edit',    editProduct);
router.post('/products',            productUpload, createProduct);
router.post('/products/:id',        productUpload, updateProduct);
router.post('/products/:id/toggle-active', toggleActive);
router.post('/products/:id/delete',        deleteProduct);

module.exports = router;
