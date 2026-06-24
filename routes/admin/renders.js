'use strict';

const express = require('express');
const router  = express.Router();

const { dashboard }                                                          = require('../../controllers/admin/dashboardController');
const { list, detail, newJob, create, saveDetails, saveDelivery, savePricing, saveStatus, saveCalculator } = require('../../controllers/admin/jobsController');
const { list: productList, newProduct, editProduct, create: createProduct, update: updateProduct, toggleActive, toggleCustomisable, toggleOptionActive, deleteProduct } = require('../../controllers/admin/productsController');
const { show: settingsShow, saveIdentity, saveContact, saveSeo, saveLocation, saveSignOff, saveTemplate, saveProfile, savePassword, saveZone, deleteZone } = require('../../controllers/admin/settingsController');
const productUpload = require('../../middleware/productUpload');

// TODO: add requireAuth, requireRole(['SUPER_ADMIN', 'MANAGER']) once login is built

router.get('/', dashboard);

// ─── Jobs ──────────────────────────────────────────────────────────────────────
router.get('/jobs',                 list);
router.get('/jobs/new',             newJob);
router.get('/jobs/:id',             detail);
router.post('/jobs',                create);
router.post('/jobs/:id/details',     saveDetails);
router.post('/jobs/:id/delivery',    saveDelivery);
router.post('/jobs/:id/pricing',     savePricing);
router.post('/jobs/:id/status',      saveStatus);
router.post('/jobs/:id/calculator',  saveCalculator);

// ─── Products ──────────────────────────────────────────────────────────────────
router.get('/products',             productList);
router.get('/products/new',         newProduct);
router.get('/products/:id/edit',    editProduct);
router.post('/products',            productUpload, createProduct);
router.post('/products/:id',        productUpload, updateProduct);
router.post('/products/:id/toggle-active',        toggleActive);
router.post('/products/:id/toggle-customisable', toggleCustomisable);
router.post('/products/:id/options/:optionId/toggle-active', toggleOptionActive);
router.post('/products/:id/delete',        deleteProduct);

// ─── Settings ─────────────────────────────────────────────────────────────────
router.get('/settings',                          settingsShow);
router.post('/settings/company/identity',        saveIdentity);
router.post('/settings/company/contact',         saveContact);
router.post('/settings/company/seo',             saveSeo);
router.post('/settings/company/location',        saveLocation);
router.post('/settings/company/sign-off',        saveSignOff);
router.post('/settings/templates/:id',           saveTemplate);
router.post('/settings/zones',                   saveZone);
router.post('/settings/zones/:id',               saveZone);
router.post('/settings/zones/:id/delete',        deleteZone);
router.post('/settings/profile',                 saveProfile);
router.post('/settings/password',                savePassword);

module.exports = router;
