// database.js
const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('chatterpad');

const userCollection = db.collection('users');
const userDataCollection = db.collection('userdata');
const chatCollection = db.collection('chatMessages');

(async function testConnection() {
  try {
    await db.command({ ping: 1 });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error(`DB connection error: ${err.message}`);
    process.exit(1);
  }
})();

function getUser(email) {
  return userCollection.findOne({ email });
}

function getUserByToken(token) {
  return userCollection.findOne({ token });
}

function addUser(user) {
  return userCollection.insertOne(user);
}

function updateUser(user) {
  return userCollection.updateOne({ email: user.email }, { $set: user });
}

function getUserData(email) {
  return userDataCollection.findOne({ email });
}

function updateUserData(email, data) {
  return userDataCollection.updateOne({ email }, { $set: data }, { upsert: true });
}

function getAllUserData() {
  return userDataCollection.find({ loggedIn: true }).toArray();
}

function updateGoldForAllLoggedInUsers(amount) {
  return userDataCollection.updateMany({ loggedIn: true }, { $inc: { gold: amount } });
}

async function getTopGoldUsers(limit) {
  return userDataCollection.find({}).sort({ gold: -1 }).limit(limit).toArray();
}

async function addChatMessage(message) {
  // Add a timestamp to the message
  const msgWithTimestamp = { ...message, timestamp: new Date() };
  return chatCollection.insertOne(msgWithTimestamp);
}

async function getAllChatMessages() {
  // Return all messages sorted from oldest to newest.
  return chatCollection.find({}).sort({ timestamp: 1 }).toArray();
}

module.exports = {
  getUser,
  getUserByToken,
  addUser,
  updateUser,
  getUserData,
  updateUserData,
  getAllUserData,
  updateGoldForAllLoggedInUsers,
  getTopGoldUsers,
  addChatMessage,
  getAllChatMessages
};
