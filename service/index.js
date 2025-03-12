const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');

const app = express();
const port = process.argv.length > 2 ? process.argv[2] : 3000;

app.use(express.json());
app.use(cookieParser());

let users = [];
let userData = {}; // Store user-specific data
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
        console.log("trying to create")
    } else {
        const user = await createUser(req.body.email, req.body.password);
        setAuthCookie(res, user.token);
        userData[user.email] = { gold: 0, colors: 'hsl(0, 100%, 50%)', chat: [] }; 
        res.send({ email: user.email });
    }
});

apiRouter.post('/auth/login', async (req, res) => {
    const user = await findUser('email', req.body.email);
    console.log("trying to login")
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


apiRouter.get('/user/data', verifyAuth, (req, res) => {
    const user = findUser('token', req.cookies[authCookieName]);
    if (user) {
      if (!userData[user.email]) {
        userData[user.email] = { gold: 0, colors: 'hsl(0, 100%, 50%)', chat: [] };
      }
      res.send(userData[user.email]);
    } else {
      res.status(404).send({ msg: 'User data not found' });
    }
  });
  

apiRouter.post('/user/data', verifyAuth, (req, res) => {
    const user = findUser('token', req.cookies[authCookieName]);
    if (user && userData[user.email]) {
        userData[user.email] = req.body; // Update user data
        res.send(userData[user.email]);
    } else {
        res.status(404).send({ msg: 'User data not found' });
    }
});

// Error Handling
app.use(function (err, req, res, next) {
    res.status(500).send({ type: err.name, message: err.message });
});

// Static Files
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});