const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');

const app = express();
const port = process.argv.length > 2 ? process.argv[2] : 3000;

app.use(express.json());
app.use(cookieParser());

let users = [];
let scores = [];
const authCookieName = 'authToken'; // Define the cookie name

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
  return user;
}

async function findUser(field, value) {
  if (!value) return null;
  return users.find((u) => u[field] === value);
}

function setAuthCookie(res, authToken) {
  res.cookie(authCookieName, authToken, {
    secure: false, // Set to true in production (HTTPS)
    httpOnly: true,
    sameSite: 'strict',
  });
}

function updateScores(newScore) {
  let found = false;
  for (const [i, prevScore] of scores.entries()) {
    if (newScore.score > prevScore.score) {
      scores.splice(i, 0, newScore);
      found = true;
      break;
    }
  }

  if (!found) {
    scores.push(newScore);
  }

  if (scores.length > 10) {
    scores.length = 10;
  }

  return scores;
}

// Middleware
const verifyAuth = async (req, res, next) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user) {
    next();
  } else {
    res.status(401).send({ msg: 'Unauthorized' });
  }
};

// Endpoints
apiRouter.post('/auth/create', async (req, res) => {
  if (await findUser('email', req.body.email)) {
    res.status(409).send({ msg: 'Existing user' });
  } else {
    const user = await createUser(req.body.email, req.body.password);
    setAuthCookie(res, user.token);
    res.send({ email: user.email });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  const user = await findUser('email', req.body.email);
  if (user) {
    if (await bcrypt.compare(req.body.password, user.password)) {
      user.token = uuid.v4();
      setAuthCookie(res, user.token);
      res.send({ email: user.email });
      return;
    }
  }
  res.status(401).send({ msg: 'Unauthorized' });
});

apiRouter.delete('/auth/logout', async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user) {
    delete user.token;
  }
  res.clearCookie(authCookieName);
  res.status(204).end();
});

apiRouter.get('/scores', verifyAuth, (_req, res) => {
  res.send({ scores: scores });
});

apiRouter.post('/score', verifyAuth, (req, res) => {
  scores = updateScores(req.body);
  res.send(scores);
});

// Error Handling
app.use(function (err, req, res, next) {
  res.status(500).send({ type: err.name, message: err.message });
});

// Static Files (Place your frontend's build output in a "public" folder)
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});