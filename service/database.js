const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const dbName = 'chatterpad';

let db, userCollection, userDataCollection;

async function connectToDb() {
  try {
    await client.connect();
    db = client.db(dbName);
    userCollection = db.collection('users');
    userDataCollection = db.collection('userdata');
    console.log(`Connected to MongoDB: ${config.hostname}`);
  } catch (err) {
    console.error(`DB connection error: ${err.message}`);
    process.exit(1);
  }
}

// USER FUNCTIONS
async function getUser(email) {
  return userCollection.findOne({ email });
}

async function getUserByToken(token) {
  return userCollection.findOne({ token });
}

async function addUser(user) {
  await userCollection.insertOne(user);
}

async function updateUser(user) {
  await userCollection.updateOne({ email: user.email }, { $set: user });
}

// USERDATA FUNCTIONS
async function getUserData(email) {
  return userDataCollection.findOne({ email });
}

async function updateUserData(email, data) {
  await userDataCollection.updateOne(
    { email },
    { $set: data },
    { upsert: true }
  );
}

async function getAllUserData() {
  return await userDataCollection.find({}).toArray();
}

async function updateGoldForAllLoggedInUsers(amount) {
  await userDataCollection.updateMany(
    { loggedIn: true },
    { $inc: { gold: amount } }
  );
}

module.exports = {
  connectToDb,
  getUser,
  getUserByToken,
  addUser,
  updateUser,
  getUserData,
  updateUserData,
  getAllUserData,
  updateGoldForAllLoggedInUsers,
};
