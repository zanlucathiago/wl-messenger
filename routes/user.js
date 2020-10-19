const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/auth');
const User = require('../models/User');

router.post('/:contactId', ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.contacts = [...user.contacts, req.params.contactId];
    await user.save();
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

module.exports = router;
