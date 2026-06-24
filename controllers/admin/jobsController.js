'use strict';

const prisma = require('../../lib/prisma');

const VALID_STATUSES = ['ENQUIRY', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

// ─── List ─────────────────────────────────────────────────────────────────────

async function list(req, res, next) {
  const activeStatus = VALID_STATUSES.includes(req.query.status) ? req.query.status : null;

  try {
    const [statusCounts, jobs] = await Promise.all([
      prisma.job.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.job.findMany({
        where: activeStatus ? { status: activeStatus } : {},
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          delivery: true,
          pricing: true,
          invoice: true,
        },
      }),
    ]);

    const counts = {};
    statusCounts.forEach(s => { counts[s.status] = s._count._all; });

    return res.render('admin/jobs/list.njk', {
      title:        'Jobs',
      currentPage:  'jobs',
      activeStatus,
      jobs,
      counts,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Detail ───────────────────────────────────────────────────────────────────

async function detail(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return next({ status: 404 });

  try {
    const [job, prevJob, nextJob, deliveryZones] = await Promise.all([
      prisma.job.findUnique({
        where: { id },
        include: {
          customer: true,
          delivery: true,
          pricing: { include: { deliveryZone: true } },
          items:   { include: { product: true } },
          quote:   true,
          invoice: true,
        },
      }),
      prisma.job.findFirst({
        where: { id: { lt: id } },
        orderBy: { id: 'desc' },
        select: { id: true },
      }),
      prisma.job.findFirst({
        where: { id: { gt: id } },
        orderBy: { id: 'asc' },
        select: { id: true },
      }),
      prisma.deliveryZone.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);

    if (!job) return next({ status: 404, message: 'Job not found' });

    return res.render('admin/jobs/detail.njk', {
      title:        `Job #${id} — ${job.customer.name}`,
      currentPage:  'jobs',
      job,
      prevJob,
      nextJob,
      deliveryZones,
    });
  } catch (err) {
    next(err);
  }
}

// ─── New ──────────────────────────────────────────────────────────────────────

async function newJob(req, res, next) {
  try {
    const deliveryZones = await prisma.deliveryZone.findMany({
      where:   { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    return res.render('admin/jobs/new.njk', {
      title:       'New Job',
      currentPage: 'jobs',
      deliveryZones,
      job: {
        source:   'MANAGER_CREATED',
        status:   'ENQUIRY',
        jobStart:  null,
        jobEnd:    null,
        notes:     null,
        customer:  { name: '', email: '', phone: '' },
        delivery:  null,
        pricing:   null,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Create ───────────────────────────────────────────────────────────────────

async function create(req, res, next) {
  const {
    customerName, customerEmail, customerPhone,
    jobStart, jobEnd, source, notes,
    outboundMethod, returnMethod,
    venueName, venueAddress, venueEircode, venueCounty,
    outboundAt, returnAt, deliveryNotes,
    rentalCost, deliveryCost, deliveryZoneId,
  } = req.body;

  try {
    const customer = await prisma.customer.create({
      data: {
        name:  customerName,
        email: customerEmail,
        phone: customerPhone || null,
      },
    });

    const job = await prisma.job.create({
      data: {
        customerId:  customer.id,
        source:      source || 'MANAGER_CREATED',
        status:      'ENQUIRY',
        jobStart:    jobStart ? new Date(jobStart) : null,
        jobEnd:      jobEnd   ? new Date(jobEnd)   : null,
        notes:       notes    || null,
        createdById: req.session.user?.id || 1,
      },
    });

    const ops = [];

    if (outboundMethod || returnMethod || venueName) {
      ops.push(prisma.delivery.create({
        data: {
          jobId:         job.id,
          outboundMethod: outboundMethod || 'STAFF',
          returnMethod:   returnMethod   || 'STAFF',
          venueName:     venueName     || null,
          venueAddress:  venueAddress  || null,
          venueEircode:  venueEircode  || null,
          venueCounty:   venueCounty   || null,
          outboundAt:    outboundAt    ? new Date(outboundAt) : null,
          returnAt:      returnAt      ? new Date(returnAt)   : null,
          notes:         deliveryNotes || null,
        },
      }));
    }

    const rental   = parseFloat(rentalCost)   || 0;
    const delivery = parseFloat(deliveryCost) || 0;

    if (rental || delivery || deliveryZoneId) {
      ops.push(prisma.pricing.create({
        data: {
          jobId:          job.id,
          rentalCost:     rental,
          deliveryCost:   delivery,
          totalCost:      rental + delivery,
          deliveryZoneId: deliveryZoneId ? parseInt(deliveryZoneId, 10) : null,
        },
      }));
    }

    if (ops.length) await prisma.$transaction(ops);

    return res.redirect(`/admin/jobs/${job.id}`);
  } catch (err) {
    next(err);
  }
}

// ─── Save Details ─────────────────────────────────────────────────────────────

async function saveDetails(req, res, next) {
  const id = parseInt(req.params.id, 10);
  const { customerName, customerEmail, customerPhone, jobStart, jobEnd, source, notes } = req.body;

  try {
    const job = await prisma.job.findUnique({ where: { id }, select: { customerId: true } });
    if (!job) return next({ status: 404 });

    await prisma.$transaction([
      prisma.customer.update({
        where: { id: job.customerId },
        data: {
          name:  customerName,
          email: customerEmail,
          phone: customerPhone || null,
        },
      }),
      prisma.job.update({
        where: { id },
        data: {
          source,
          jobStart: jobStart ? new Date(jobStart) : null,
          jobEnd:   jobEnd   ? new Date(jobEnd)   : null,
          notes:    notes    || null,
        },
      }),
    ]);

    return res.redirect(`/admin/jobs/${id}`);
  } catch (err) {
    next(err);
  }
}

// ─── Save Delivery ────────────────────────────────────────────────────────────

async function saveDelivery(req, res, next) {
  const id = parseInt(req.params.id, 10);
  const {
    outboundMethod, returnMethod,
    venueName, venueAddress, venueEircode, venueCounty,
    outboundAt, returnAt, deliveryNotes,
  } = req.body;

  const data = {
    outboundMethod,
    returnMethod,
    venueName:    venueName    || null,
    venueAddress: venueAddress || null,
    venueEircode: venueEircode || null,
    venueCounty:  venueCounty  || null,
    outboundAt:   outboundAt   ? new Date(outboundAt) : null,
    returnAt:     returnAt     ? new Date(returnAt)   : null,
    notes:        deliveryNotes || null,
  };

  try {
    await prisma.delivery.upsert({
      where:  { jobId: id },
      create: { jobId: id, ...data },
      update: data,
    });

    return res.redirect(`/admin/jobs/${id}`);
  } catch (err) {
    next(err);
  }
}

// ─── Save Pricing ─────────────────────────────────────────────────────────────

async function savePricing(req, res, next) {
  const id = parseInt(req.params.id, 10);
  const { rentalCost, deliveryCost, deliveryZoneId } = req.body;

  const rental   = parseFloat(rentalCost)   || 0;
  const delivery = parseFloat(deliveryCost) || 0;

  const data = {
    rentalCost:     rental,
    deliveryCost:   delivery,
    totalCost:      rental + delivery,
    deliveryZoneId: deliveryZoneId ? parseInt(deliveryZoneId, 10) : null,
  };

  try {
    await prisma.pricing.upsert({
      where:  { jobId: id },
      create: { jobId: id, ...data },
      update: data,
    });

    return res.redirect(`/admin/jobs/${id}`);
  } catch (err) {
    next(err);
  }
}

// ─── Save Calculator ──────────────────────────────────────────────────────────

async function saveCalculator(req, res, next) {
  const id = parseInt(req.params.id, 10);
  const {
    venueName, venueCounty, venueAddress, venueEircode,
    lat, lng, distanceKm, durationMins,
    mapsUrl, suggestedPrice, calculatorResult,
    deliveryCost, deliveryZoneId,
  } = req.body;

  const deliveryData = {
    venueName:        venueName        || null,
    venueCounty:      venueCounty      || null,
    venueAddress:     venueAddress     || null,
    venueEircode:     venueEircode     || null,
    lat:              lat              ? parseFloat(lat)              : null,
    lng:              lng              ? parseFloat(lng)              : null,
    distanceKm:       distanceKm       ? parseFloat(distanceKm)       : null,
    durationMins:     durationMins     ? parseInt(durationMins, 10)   : null,
    mapsUrl:          mapsUrl          || null,
    suggestedPrice:   suggestedPrice   ? parseFloat(suggestedPrice)   : null,
    calculatorResult: calculatorResult || null,
  };

  const delivery = parseFloat(deliveryCost) || 0;
  const zoneId   = deliveryZoneId ? parseInt(deliveryZoneId, 10) : null;

  try {
    const pricing = await prisma.$transaction(async tx => {
      await tx.delivery.upsert({
        where:  { jobId: id },
        create: { jobId: id, outboundMethod: 'STAFF', returnMethod: 'STAFF', ...deliveryData },
        update: deliveryData,
      });

      const existing = await tx.pricing.findUnique({ where: { jobId: id } });
      const rental   = existing ? parseFloat(existing.rentalCost) : 0;
      const total    = rental + delivery;

      return tx.pricing.upsert({
        where:  { jobId: id },
        create: { jobId: id, rentalCost: rental, deliveryCost: delivery, totalCost: total, deliveryZoneId: zoneId },
        update: { deliveryCost: delivery, totalCost: total, deliveryZoneId: zoneId },
      });
    });

    return res.json({
      ok:           true,
      deliveryCost: parseFloat(pricing.deliveryCost),
      totalCost:    parseFloat(pricing.totalCost),
    });
  } catch (err) {
    next(err);
  }
}

// ─── Save Status ──────────────────────────────────────────────────────────────

async function saveStatus(req, res, next) {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return next({ status: 400, message: 'Invalid status' });
  }

  try {
    await prisma.job.update({ where: { id }, data: { status } });
    return res.redirect(`/admin/jobs/${id}`);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, detail, newJob, create, saveDetails, saveDelivery, savePricing, saveStatus, saveCalculator };
