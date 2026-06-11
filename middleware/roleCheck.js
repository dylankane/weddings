'use strict';

// Returns middleware that rejects users whose role is not in the allowed list.
// Usage: router.get('/path', requireRole(['SUPER_ADMIN', 'MANAGER']), handler)
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/admin/login');
    }
    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).render('errors/403.njk', { title: 'Access Denied' });
    }
    return next();
  };
}

module.exports = { requireRole };
