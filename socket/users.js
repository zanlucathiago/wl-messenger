let users = [];

// Join user to chat
function userJoin(user, id) {
  // const user = { id, username, room };

  // users.push(user);
  // if (!users.find())
  users = [...users, { user, id }];
  // users[user] = id;
  // return user;
}

// Get current user
function getCurrentUser(user) {
  const found = users.find((u) => u.user === user);
  return found && found.id;
  // return users.find((user) => user.id === id);
}

// User leaves chat
function userLeave(id) {
  users = users.filter((u) => u.id !== id);
  // users[user] = null;
  // const index = users.findIndex((user) => user.id === id);

  // if (index !== -1) {
  //   return users.splice(index, 1)[0];
  // }
}

// Get room users
function getRoomUsers(room) {
  return users.filter((user) => user.room === room);
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
};
