const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const axios = require('axios');
const config = require('./config'); 
const DB = require('./database');
const path = require('path');

const app = express();
const port = process.argv.length > 2 ? process.argv[2] : 4000;
const authCookieName = 'authToken';
const city = 'Provo,US';
const weatherManUsername = 'Weather Man';

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

const apiRouter = express.Router();
app.use('/api', apiRouter);

function setAuthCookie(res, authToken) {
  res.cookie(authCookieName, authToken, {
    secure: false,
    httpOnly: true,
    sameSite: 'strict',
  });
}

const verifyAuth = async (req, res, next) => {
  const user = await DB.getUserByToken(req.cookies[authCookieName]);
  if (user && user.email) {
    next();
  } else {
    res.status(401).send({ msg: 'Unauthorized' });
  }
};

// --- AUTH ---
apiRouter.post('/auth/create', async (req, res) => {
  if (await DB.getUser(req.body.email)) {
    res.status(409).send({ msg: 'Existing user' });
  } else {
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = {
      email: req.body.email,
      password: passwordHash,
      token: uuid.v4(),
    };
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

// --- USER DATA ---
apiRouter.get('/user/data', verifyAuth, async (req, res) => {
  const user = await DB.getUserByToken(req.cookies[authCookieName]);
  const data = await DB.getUserData(user.email);
  res.send(data);
});

apiRouter.post('/user/data', verifyAuth, async (req, res) => {
  const user = await DB.getUserByToken(req.cookies[authCookieName]);
  const currentData = await DB.getUserData(user.email) || {};
  const newData = { ...currentData, ...req.body };
  await DB.updateUserData(user.email, newData);
  res.send(newData);
});

apiRouter.get('/room/players', async (req, res) => {
  const all = await DB.getAllUserData();
  res.send(all);
});

// --- CHAT ---
let globalChat = [];

apiRouter.get('/chat', (req, res) => {
  res.send(globalChat);
});

apiRouter.post('/chat', (req, res) => {
  const message = req.body;
  globalChat.push(message);
  res.send(message);
});

// --- WEATHER ---
async function fetchWeatherForecast() {
  if (!config.weatherApiKey) return null;
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${config.weatherApiKey}&units=metric`;
    const response = await axios.get(url);
    const data = response.data;
    return `Forecast for ${data.name}: ${data.weather[0].description} with a temperature of ${data.main.temp}°C.`;
  } catch (err) {
    console.error('Weather fetch error:', err.message);
    return null;
  }
}

setInterval(async () => {
  await DB.updateGoldForAllLoggedInUsers(10);
}, 5000);

setInterval(async () => {
  const forecast = await fetchWeatherForecast();
  if (forecast) {
    const chatMessage = { from: weatherManUsername, text: forecast };
    globalChat.push(chatMessage);
  }
}, 1800000);

// --- Error Handling ---
app.use(function (err, req, res, next) {
  console.error("Error:", err);
  res.status(500).send({ type: err.name, message: err.message });
});

const httpService = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

