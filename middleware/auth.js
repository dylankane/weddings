'use strict';

// Redirect unauthenticated requests to the login page.
// Saves the attempted URL so the user is returned there after login.
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  return res.redirect('/admin/login');
}

module.exports = { requireAuth };
