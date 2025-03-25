const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
require('dotenv').config();
console.log(process.env.OPENWEATHER_API_KEY); 

const app = express();
const port = process.argv.length > 2 ? process.argv[2] : 4000;

app.use(express.json());
app.use(cookieParser());
const axios = require('axios');

const weatherApiKey = process.env.OPENWEATHER_API_KEY || 'e4dff81e964fadc0bff6842957203b73'; 
const city = 'Provo,US';

const weatherManUsername = 'Weather Man';


let users = [];
let userData = {}; 
let globalChat = [];

const authCookieName = 'authToken';
app.use(express.static('public'));


let apiRouter = express.Router();
app.use('/api', apiRouter);

// Helper Functions
async function createUser(email, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    email,
    password: passwordHash,
    token: uuid.v4(),
  };
  users.push(user);
  console.log("Created user:", email);
  return user;
}

async function findUser(field, value) {
  if (!value) return null;
  const found = users.find((u) => u[field] === value);
  console.log(`findUser(${field}, ${value}):`, found);
  return found;
}

function setAuthCookie(res, authToken) {
  res.cookie(authCookieName, authToken, {
    secure: false, 
    httpOnly: true,
    sameSite: 'strict',
  });
  console.log("Set auth cookie:", authToken);
}

const verifyAuth = async (req, res, next) => {
  console.log("verifyAuth: cookies =", req.cookies);
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user && user.email) {
    console.log("verifyAuth: authenticated user", user.email);
    next();
  } else {
    console.log("verifyAuth: unauthorized");
    res.status(401).send({ msg: 'Unauthorized' });
  }
};

apiRouter.get('/chat', (req, res) => {
  console.log("GET /api/chat called");
  res.send(globalChat);
});

apiRouter.post('/chat', (req, res) => {
  const message = req.body; 
  console.log("POST /api/chat received message:", message);
  globalChat.push(message);
  res.send(message);
});

// --- Authentication Endpoints ---
apiRouter.post('/auth/create', async (req, res) => {
  console.log("POST /api/auth/create called with body:", req.body);
  if (await findUser('email', req.body.email)) {
    console.log("User already exists:", req.body.email);
    res.status(409).send({ msg: 'Existing user' });
  } else {
    const user = await createUser(req.body.email, req.body.password);
    setAuthCookie(res, user.token);
    userData[user.email] = { 
      gold: 0, 
      color: 'hsl(0, 100%, 50%)', 
      chat: [],
      position: { x: 750, y: 500 },
      loggedIn: true
    };
    console.log("Initialized userData for", user.email, ":", userData[user.email]);
    res.send({ email: user.email });
  }
});

async function fetchWeatherForecast() {
  if (!weatherApiKey || weatherApiKey === 'YOUR_DEFAULT_API_KEY') {
    console.error('Missing or invalid OpenWeather API key.');
    return null;
  }

  try {
    //console.log("Fetching weather..."); // Debugging log
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${weatherApiKey}&units=metric`;
    const response = await axios.get(url);
    const data = response.data;
    //console.log("Weather API response:", data); // Log the full response
    return `Forecast for ${data.name}: ${data.weather[0].description} with a temperature of ${data.main.temp}°C.`;
  } catch (err) {
    console.error('Error fetching weather forecast:', err.response ? err.response.data : err.message);
    return null;
  }
}


apiRouter.post('/auth/login', async (req, res) => {
  console.log("POST /api/auth/login called with body:", req.body);
  const user = await findUser('email', req.body.email);
  if (user) {
    if (await bcrypt.compare(req.body.password, user.password)) {
      user.token = uuid.v4();
      setAuthCookie(res, user.token);
      console.log("Login successful for:", user.email);
      
      if (!userData[user.email]) {
        userData[user.email] = { 
          gold: 0, 
          color: 'hsl(0, 100%, 50%)', 
          chat: [],
          position: { x: 750, y: 500 },
          loggedIn: true
        };
        console.log("Initialized userData on login for", user.email);
      } else {
        userData[user.email].loggedIn = true;
        console.log("Using existing userData for", user.email);
      }
      
      res.send({ email: user.email });
      return;
    }
  }
  console.log("Login failed for:", req.body.email);
  res.status(401).send({ msg: 'Unauthorized' });
});

apiRouter.delete('/auth/logout', async (req, res) => {
  console.log("DELETE /api/auth/logout called");
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user && user.email) {
    delete user.token;
    if (userData[user.email]) {
      userData[user.email].loggedIn = false;
    }
    console.log("Logged out user:", user.email);
  }
  res.clearCookie(authCookieName);
  res.status(204).end();
});

apiRouter.get('/user/data', verifyAuth, async (req, res) => {
  console.log("GET /api/user/data called");
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user && user.email) {
    console.log("Current userData keys:", Object.keys(userData));
    console.log("Looking up userData for email:", user.email);
    if (!userData[user.email]) {
      console.log("User data not found for", user.email);
      res.status(404).send({ msg: 'User data not found' });
      return;
    }
    console.log("Returning userData for", user.email, ":", userData[user.email]);
    res.send(userData[user.email]);
  } else {
    res.status(404).send({ msg: 'User data not found' });
  }
});
  
apiRouter.post('/user/data', verifyAuth, async (req, res) => {
  console.log("POST /api/user/data called with body:", req.body);
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user && user.email) {
    const currentData = userData[user.email] || {};
    const newData = { ...currentData };

    if (req.body.hasOwnProperty('color')) {
      newData.color = req.body.color;
    }
    if (req.body.hasOwnProperty('gold')) {
      newData.gold = req.body.gold;
    }
    if (req.body.hasOwnProperty('chat')) {
      newData.chat = req.body.chat;
    }
    if (req.body.hasOwnProperty('position')) {
      newData.position = req.body.position;
    }

    userData[user.email] = newData;
    console.log("Updated userData for", user.email, "to:", newData);
    res.send(newData);
  } else {
    res.status(404).send({ msg: 'User data not found' });
  }
});
  
apiRouter.get('/room/players', (req, res) => {
  console.log("GET /api/room/players called");
  const players = Object.keys(userData).map(email => ({
    email,
    ...userData[email]
  }));
  console.log("Returning players:", players);
  res.send(players);
});

setInterval(() => {
  for (const email in userData) {
    if (userData.hasOwnProperty(email) && userData[email].loggedIn) {
      userData[email].gold += 10; 
      console.log(`Updated gold for ${email}: ${userData[email].gold}`);
    }
  }
}, 5000);

setInterval(async () => {
    const messageText = await fetchWeatherForecast();
    if (messageText) {
      const chatMessage = { from: weatherManUsername, text: messageText };
      globalChat.push(chatMessage);
      console.log('Weather forecast message added to chat:', chatMessage);
    }
  }, 18000);
  
app.use(function (err, req, res, next) {
  console.error("Error middleware caught error:", err);
  res.status(500).send({ type: err.name, message: err.message });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
