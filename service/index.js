// index.js
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const axios = require('axios');
const path = require('path');
const DB = require('./database');
const { peerProxy } = require('./peerProxy'); // New: import the WebSocket module

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
    await DB.updateUserData(user.email, {
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

let globalChat = [];
apiRouter.get('/chat', (req, res) => {
  res.send(globalChat);
});

apiRouter.post('/chat', (req, res) => {
  globalChat.push(req.body);
  res.send(req.body);
});

// -------------------
// Weather Updates (simulate system events)
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
  if (forecast) globalChat.push({ from: weatherManUsername, text: forecast });
}, 180000);

// Global error handler.
app.use((err, req, res, next) => {
  res.status(500).send({ type: err.name, message: err.message });
});

// Serve index.html for any unknown routes.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -------------------
// Start HTTP Server and Attach WebSocket Server
const httpServer = app.listen(port, '0.0.0.0', () => {
  console.log(`Listening on port ${port}`);
});

// Attach the WebSocket server to the same HTTP server.
peerProxy(httpServer);
