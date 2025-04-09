// index.js
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const axios = require('axios');
const path = require('path');
const DB = require('./database');
const { peerProxy } = require('./peerProxy'); // WebSocket module

const app = express();
const port = process.argv[2] || 4000;
const authCookieName = 'authToken';
const weatherApiKey = 'fd27f7c81722bf5997bc6fa6ca24327d';
const city = 'Provo,US';
const weatherManUsername = 'Weather Man';

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

const apiRouter = express.Router();
app.use('/api', apiRouter);

// Helper for setting the auth cookie.
function setAuthCookie(res, token) {
  res.cookie(authCookieName, token, { secure: true, httpOnly: true, sameSite: 'strict' });
}

// Middleware to verify that the user is logged in.
async function verifyAuth(req, res, next) {
  const user = await DB.getUserByToken(req.cookies[authCookieName]);
  if (user) next();
  else res.status(401).send({ msg: 'Unauthorized' });
}

// -------------------
// Authentication Endpoints
apiRouter.post('/auth/create', async (req, res) => {
  if (await DB.getUser(req.body.email)) {
    res.status(409).send({ msg: 'Existing user' });
  } else {
    const password = await bcrypt.hash(req.body.password, 10);
    const user = { email: req.body.email, password, token: uuid.v4() };
    await DB.addUser(user);
    // Ensure userData includes the email so that we have the username
    await DB.updateUserData(user.email, {
      email: user.email,
      gold: 0,
      color: 'hsl(0, 100%, 50%)',
      chat: [],
      position: { x: 750, y: 500 },
      loggedIn: true,
    });
    setAuthCookie(res, user.token);
    res.send({ email: user.email });
  }
});

apiRouter.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await DB.getTopGoldUsers(5);
    res.send(topUsers);
  } catch (err) {
    res.status(500).send({ error: 'Failed to load leaderboard.' });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  const user = await DB.getUser(req.body.email);
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    user.token = uuid.v4();
    await DB.updateUser(user);
    await DB.updateUserData(user.email, { loggedIn: true });
    setAuthCookie(res, user.token);
    res.send({ email: user.email });
  } else {
    res.status(401).send({ msg: 'Unauthorized' });
  }
});

apiRouter.delete('/auth/logout', async (req, res) => {
  const user = await DB.getUserByToken(req.cookies[authCookieName]);
  if (user) {
    delete user.token;
    await DB.updateUser(user);
    await DB.updateUserData(user.email, { loggedIn: false });
  }
  res.clearCookie(authCookieName);
  res.status(204).end();
});

// -------------------
// User Data Endpoints
apiRouter.get('/user/data', verifyAuth, async (req, res) => {
  const user = await DB.getUserByToken(req.cookies[authCookieName]);
  const data = await DB.getUserData(user.email);
  res.send(data);
});

apiRouter.post('/user/data', verifyAuth, async (req, res) => {
  const user = await DB.getUserByToken(req.cookies[authCookieName]);
  const current = await DB.getUserData(user.email) || {};
  const merged = { ...current, ...req.body };
  await DB.updateUserData(user.email, merged);
  res.send(merged);
});

// -------------------
// Room & Chat Endpoints
apiRouter.get('/room/players', async (req, res) => {
  const all = await DB.getAllUserData();
  res.send(all);
});

apiRouter.get('/chat', async (req, res) => {
  try {
    const chats = await DB.getAllChatMessages();
    res.send(chats);
  } catch (err) {
    res.status(500).send({ error: 'Failed to load chat messages.' });
  }
});

apiRouter.post('/chat', async (req, res) => {
  try {
    const result = await DB.addChatMessage(req.body);
    // Depending on your MongoDB driver version, adjust to return the inserted document.
    res.send(result.ops ? result.ops[0] : req.body);
  } catch (err) {
    res.status(500).send({ error: 'Failed to persist chat message.' });
  }
});

async function fetchWeatherForecast() {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${weatherApiKey}&units=metric`;
    const res = await axios.get(url);
    const d = res.data;
    return `Forecast for ${d.name}: ${d.weather[0].description} with a temperature of ${d.main.temp}°C.`;
  } catch (err) {
    return null;
  }
}

setInterval(async () => {
  await DB.updateGoldForAllLoggedInUsers(10);
}, 5000);

setInterval(async () => {
  const forecast = await fetchWeatherForecast();
  if (forecast) {
    // Optional: you could store system messages into the chat collection if desired.
  }
}, 180000);

app.use((err, req, res, next) => {
  res.status(500).send({ type: err.name, message: err.message });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const httpServer = app.listen(port, '0.0.0.0', () => {
  console.log(`Listening on port ${port}`);
});

peerProxy(httpServer);
