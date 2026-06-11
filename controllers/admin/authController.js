'use strict';

const bcrypt = require('bcrypt');
const prisma = require('../../lib/prisma');

async function showLogin(req, res) {
  if (req.session.user) return res.redirect('/admin/dashboard');
  res.render('admin/auth/login.njk', { title: 'Sign In', error: null });
}

async function processLogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('admin/auth/login.njk', {
      title: 'Sign In',
      error: 'Email and password are required.',
      email,
    });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  if (!user || !user.isActive) {
    return res.render('admin/auth/login.njk', {
      title: 'Sign In',
      error: 'Invalid email or password.',
      email,
    });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.render('admin/auth/login.njk', {
      title: 'Sign In',
      error: 'Invalid email or password.',
      email,
    });
  }

  req.session.user = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };

  const returnTo = req.session.returnTo || '/admin/dashboard';
  delete req.session.returnTo;
  return res.redirect(returnTo);
}

async function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
}

async function showChangePassword(req, res) {
  res.render('admin/auth/account-password.njk', {
    title: 'Change Password',
    error: null,
    success: null,
  });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.session.user.id;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.render('admin/auth/account-password.njk', {
      title: 'Change Password',
      error: 'All fields are required.',
      success: null,
    });
  }

  if (newPassword !== confirmPassword) {
    return res.render('admin/auth/account-password.njk', {
      title: 'Change Password',
      error: 'New passwords do not match.',
      success: null,
    });
  }

  if (newPassword.length < 10) {
    return res.render('admin/auth/account-password.njk', {
      title: 'Change Password',
      error: 'New password must be at least 10 characters.',
      success: null,
    });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!passwordMatch) {
    return res.render('admin/auth/account-password.njk', {
      title: 'Change Password',
      error: 'Current password is incorrect.',
      success: null,
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return res.render('admin/auth/account-password.njk', {
    title: 'Change Password',
    error: null,
    success: 'Password updated successfully.',
  });
}

module.exports = { showLogin, processLogin, logout, showChangePassword, changePassword };

