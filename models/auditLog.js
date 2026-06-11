'use strict';

const prisma = require('../lib/prisma');

async function createAuditLog({ userId, action, entityType, entityId, metadata = null }) {
  return prisma.auditLog.create({
    data: { userId, action, entityType, entityId, metadata },
  });
}

module.exports = { createAuditLog };
