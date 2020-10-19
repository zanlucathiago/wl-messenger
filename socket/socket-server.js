// const path = require('path');
const http = require('http');
// const express = require('express');
const socketio = require('socket.io');
const User = require('../models/User');
const Story = require('../models/Story');
// const User = require('../models/User');
// const formatMessage = require('./utils/messages');
// const {
//   userJoin,
//   getCurrentUser,
//   userLeave,
//   getRoomUsers
// } = require('./utils/users');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require('./users');

module.exports = {
  createServer: (app) => {
    // const app = express();
    const server = http.createServer(app);
    const io = socketio(server);

    // Set static folder
    // app.use(express.static(path.join(__dirname, 'public')));

    // const botName = 'ChatCord Bot';

    // Run when client connects
    io.on('connection', (socket) => {
      socket.on('joinRoom', async ({ user }) => {
        // console.log('user');
        // console.log(user);
        userJoin(user, socket.id);

        // const userModel =

        const userModel = await User.findById(user).populate('contacts');
        // .contacts;

        userModel.contacts.forEach((contact) => {
          // console.log(contact._id.toString());
          socket.join(contact._id.toString());
        });

        socket.broadcast
          .to(user)
          .emit('notify', `${userModel.name} acabou de entrar.`);
        // socket.to
      });

      const createMessage = async (userId, contactId) => {
        return await Story.find({
          $or: [
            { sender: userId, receiver: contactId },
            { receiver: userId, sender: contactId },
          ],
        })
          .sort('createdAt')
          .lean();
      };

      socket.on('openDialog', async ({ contactId, userId }) => {
        const stories = await createMessage(userId, contactId);
        socket.emit('renderMessages', { messages: stories, contactId });
      });

      socket.on('addContact', async ({ contactId, userId }) => {
        const user = await User.findById(userId);
        // req.body.user = req.user.id;
        user.contacts = [...user.contacts, contactId];
        // await Story.create(req.body);
        await user.save();

        const other = await User.findById(contactId);
        // req.body.user = req.user.id;
        other.contacts = [...other.contacts, userId];
        // await Story.create(req.body);
        await other.save();

        socket.emit('refreshDashboard');
        io.to(getCurrentUser(contactId)).emit(
          'notify',
          `${user.name} acabou de te adicionar aos amigos! Atualize a tela`
        );
      });

      socket.on('sendMessage', async ({ contactId, userId, message }) => {
        const story = await Story.create({
          body: message,
          sender: userId,
          receiver: contactId,
        });

        await story.save();
        const receiver = await User.findById(userId);

        io.to(getCurrentUser(contactId)).emit('newMessage', {
          fullMessage: story,
          alert: `${receiver.name} enviou: ${story.body}`,
        });
      });

      socket.on('fetchContacts', async ({ userId }) => {
        const user = await User.findById(userId).populate('contacts').lean();
        const users = await User.find({
          _id: { $nin: [...user.contacts.map((c) => c._id), userId] },
        }).lean();
        socket.emit('renderContacts', { users });
      });

      // Runs when client disconnects
      socket.on('disconnect', () => {
        userLeave(socket.id);
        //   // const user = userLeave(socket.id);
        //   // if (user) {
        //   //   io.to(user.room).emit(
        //   //     'message',
        //   //     formatMessage(botName, `${user.username} has left the chat`)
        //   //   );
        //   //   // Send users and room info
        //   //   io.to(user.room).emit('roomUsers', {
        //   //     room: user.room,
        //   //     users: getRoomUsers(user.room),
        //   //   });
        //   // }
      });
    });

    return { server, io };
  },
};

// const PORT = process.env.PORT || 3000;

// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
