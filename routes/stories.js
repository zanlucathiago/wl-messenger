const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/auth');
const User = require('../models/User');

const Story = require('../models/Story');

const { getCurrentUser } = require('../socket/users');

router.post('/:contactId', ensureAuth, async (req, res) => {
  try {
    const story = await Story.create({
      body: req.body.body,
      sender: req.user,
      receiver: req.params.contactId,
    });

    await story.save();
    const usr = getCurrentUser(req.params.contactId);

    res.locals.io
      .to(getCurrentUser(req.params.contactId))
      .emit('message', req.user._id);

    res.redirect(`/stories/edit/${req.params.contactId}`);
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

router.get('/', ensureAuth, async (req, res) => {
  try {
    const stories = await Story.find({ status: 'public' })
      .populate('user')
      .sort({ createdAt: 'desc' })
      .lean();

    res.render('stories/index', {
      stories,
    });
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

router.get('/:id', ensureAuth, async (req, res) => {
  try {
    let story = await Story.findById(req.params.id).populate('user').lean();

    if (!story) {
      return res.render('error/404');
    }

    if (story.user._id != req.user.id && story.status == 'private') {
      res.render('error/404');
    } else {
      res.render('stories/show', {
        story,
      });
    }
  } catch (err) {
    console.error(err);
    res.render('error/404');
  }
});

router.get('/edit/:id', ensureAuth, async (req, res) => {
  try {
    const contact = await User.findById(req.params.id).lean();

    const stories = await Story.find({
      $or: [
        { sender: req.user._id, receiver: req.params.id },
        { receiver: req.user._id, sender: req.params.id },
      ],
    })
      .sort('createdAt')
      .lean();

    res.render('stories/edit', {
      contact,
      stories,
    });
  } catch (err) {
    console.error(err);
    return res.render('error/500');
  }
});

router.put('/:id', ensureAuth, async (req, res) => {
  try {
    let story = await Story.findById(req.params.id).lean();

    if (!story) {
      return res.render('error/404');
    }

    if (story.user != req.user.id) {
      res.redirect('/stories');
    } else {
      story = await Story.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,
        runValidators: true,
      });

      res.redirect('/dashboard');
    }
  } catch (err) {
    console.error(err);
    return res.render('error/500');
  }
});

router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    let story = await Story.findById(req.params.id).lean();

    if (!story) {
      return res.render('error/404');
    }

    if (story.user != req.user.id) {
      res.redirect('/stories');
    } else {
      await Story.remove({ _id: req.params.id });
      res.redirect('/dashboard');
    }
  } catch (err) {
    console.error(err);
    return res.render('error/500');
  }
});

router.get('/user/:userId', ensureAuth, async (req, res) => {
  try {
    const stories = await Story.find({
      user: req.params.userId,
      status: 'public',
    })
      .populate('user')
      .lean();

    res.render('stories/index', {
      stories,
    });
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});

module.exports = router;
