'use strict';

const bcrypt = require('bcrypt');
const prisma = require('../../lib/prisma');
const { createAuditLog } = require('../../models/auditLog');

async function list(req, res) {
  const users = await prisma.user.findMany({
    orderBy: [{ isActive: 'desc' }, { displayName: 'asc' }],
  });

  res.render('admin/users/list.njk', {
    title: 'Users',
    users,
    section: 'settings',
  });
}

async function showCreate(req, res) {
  res.render('admin/users/create.njk', {
    title: 'New User',
    section: 'settings',
    errors: null,
  });
}

async function create(req, res) {
  const { displayName, email, role, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    return res.render('admin/users/create.njk', {
      title: 'New User',
      section: 'settings',
      errors: { email: 'A user with this email already exists.' },
      form: req.body,
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      displayName,
      email: email.toLowerCase().trim(),
      role,
      passwordHash,
    },
  });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: user.id,
    metadata: { role },
  });

  res.redirect('/admin/users');
}

async function showEdit(req, res) {
  const id = parseInt(req.params.id);
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) return res.status(404).render('errors/404.njk', { title: 'User Not Found' });

  res.render('admin/users/edit.njk', {
    title: `Edit — ${user.displayName}`,
    editUser: user,
    section: 'settings',
    errors: null,
  });
}

async function update(req, res) {
  const id = parseInt(req.params.id);
  const { displayName, email, role } = req.body;

  await prisma.user.update({
    where: { id },
    data: { displayName, email: email.toLowerCase().trim(), role },
  });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'USER_UPDATED',
    entityType: 'User',
    entityId: id,
  });

  res.redirect('/admin/users');
}

async function deactivate(req, res) {
  const id = parseInt(req.params.id);

  // Prevent self-deactivation
  if (id === req.session.user.id) {
    return res.redirect('/admin/users');
  }

  await prisma.user.update({ where: { id }, data: { isActive: false } });

  await createAuditLog({
    userId: req.session.user.id,
    action: 'USER_DEACTIVATED',
    entityType: 'User',
    entityId: id,
  });

  res.redirect('/admin/users');
}

module.exports = { list, showCreate, create, showEdit, update, deactivate };
