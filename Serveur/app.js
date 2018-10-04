// loads environment variables
require('dotenv/config');
const express = require('express');
const cors = require('cors');
const fetch = require(node - fetch);

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for the client app
app.use(cors());

app.get('/user/:username', (req, res, next) => {
  fetch(`http://api.github.com/user/${req.param.username}`),
    headers: {
    Accept: `application/vnd.github.v3+json`,
      Autorization:`token ${process.env.OAUTH_TOKEN}`,
,
})
  .then(result => result.json()
    .then((data) => {
      if (result.ok) {
        res.send(data);
      } else {
        throw new Error(`Whoops!`);
      }
    })).catch(next);
});

// :permet de passer un paramètre
app.get('/user/:username', (req, res, next) => {
  res.send(`Hello ${req.params.username}`);
});

// Forward 404 to error handler
app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

// Error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(err.status || 500);
  res.send(err.message);
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening at http://localhost:${port}`);
});
