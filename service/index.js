const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');

const app = express();
const port = process.argv.length > 2 ? process.argv[2] : 3000;

app.use(express.json());
app.use(cookieParser());

let users = [];
let userData = {}; 
let globalChat = [];

const authCookieName = 'authToken';

let apiRouter = express.Router();
app.use(`/api`, apiRouter);

// Helper Functions
async function createUser(email, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    email: email,
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
    secure: false, // Set to true in production (HTTPS)
    httpOnly: true,
    sameSite: 'strict',
  });
  console.log("Set auth cookie:", authToken);
}

// Middleware
const verifyAuth = async (req, res, next) => {
  console.log("verifyAuth: cookies =", req.cookies);
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user) {
    console.log("verifyAuth: authenticated user", user.email);
    next();
  } else {
    console.log("verifyAuth: unauthorized");
    res.status(401).send({ msg: 'Unauthorized' });
  }
};

// --- Global Chat Endpoints ---
apiRouter.get('/chat', (req, res) => {
  console.log("GET /api/chat called");
  res.send(globalChat);
});

apiRouter.post('/chat', (req, res) => {
  const message = req.body; // Expecting { from: ..., text: ... }
  console.log("POST /api/chat received message:", message);
  globalChat.push(message);
  res.send(message);
});

// --- Auth Endpoints ---
apiRouter.post('/auth/create', async (req, res) => {
  console.log("POST /api/auth/create called with body:", req.body);
  if (await findUser('email', req.body.email)) {
    console.log("User already exists:", req.body.email);
    res.status(409).send({ msg: 'Existing user' });
  } else {
    const user = await createUser(req.body.email, req.body.password);
    setAuthCookie(res, user.token);
    // Initialize default data for new user.
    userData[user.email] = { 
      gold: 0, 
      color: 'hsl(0, 100%, 50%)', 
      chat: [],
      position: { x: 750, y: 500 }  // default starting position
    };
    console.log("Initialized userData for", user.email, ":", userData[user.email]);
    res.send({ email: user.email });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  console.log("POST /api/auth/login called with body:", req.body);
  const user = await findUser('email', req.body.email);
  if (user) {
    if (await bcrypt.compare(req.body.password, user.password)) {
      user.token = uuid.v4();
      setAuthCookie(res, user.token);
      console.log("Login successful for:", user.email);
      if (!userData[user.email]) {
        userData[user.email] = { gold: 0, color: 'hsl(0, 100%, 50%)', chat: [], position: { x: 750, y: 500 } };
        console.log("Initialized userData on login for", user.email);
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
  if (user) {
    delete user.token;
    console.log("Logged out user:", user.email);
  }
  res.clearCookie(authCookieName);
  res.status(204).end();
});

// --- User Data Endpoints ---
apiRouter.get('/user/data', verifyAuth, (req, res) => {
  console.log("GET /api/user/data called");
  const user = findUser('token', req.cookies[authCookieName]);
  if (user) {
    if (!userData[user.email]) {
      userData[user.email] = { gold: 0, color: 'hsl(0, 100%, 50%)', chat: [], position: { x: 750, y: 500 } };
      console.log("Initialized missing userData for", user.email);
    }
    console.log("Returning userData for", user.email, ":", userData[user.email]);
    res.send(userData[user.email]);
  } else {
    res.status(404).send({ msg: 'User data not found' });
  }
});

apiRouter.post('/user/data', verifyAuth, (req, res) => {
  console.log("POST /api/user/data called with body:", req.body);
  const user = findUser('token', req.cookies[authCookieName]);
  if (user && userData[user.email]) {
    userData[user.email] = req.body; // Update user data
    console.log("Updated userData for", user.email, "to:", userData[user.email]);
    res.send(userData[user.email]);
  } else {
    res.status(404).send({ msg: 'User data not found' });
  }
});

// --- New: Global Room Players Endpoint ---
// Returns an array of all players' data (their email and associated data).
apiRouter.get('/room/players', (req, res) => {
  console.log("GET /api/room/players called");
  const players = Object.keys(userData).map(email => ({
    email,
    ...userData[email]
  }));
  console.log("Returning players:", players);
  res.send(players);
});

// Error Handling
app.use(function (err, req, res, next) {
  console.error("Error middleware caught error:", err);
  res.status(500).send({ type: err.name, message: err.message });
});

// Static Files
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
