// loads environment variables
require('dotenv/config');
const express = require('express');
const cors = require('cors');
const Github = require('./src/Github');
const utils = require('./src/utils');

const app = express();
const port = process.env.PORT || 3000;
const client = new Github({ token: process.env.OAUTH_TOKEN });

// Enable CORS for the client app
app.use(cors());

app.get('/users/:username', (req, res, next) => { // eslint-disable-line no-unused-vars
  client.user(req.params.username)
    .then(user => res.send(user))
    .catch(next);
});

app.get('/users/:username/repos', (req, res, next) => { // eslint-disable-line no-unused-vars
  client.repos(req.params.username, req.query.per_page, req.query.page)
    .then(user => res.send(user))
    .catch(next);
});

app.get('/repos/:username/:repos/commits', (req, res, next) => { // eslint-disable-line no-unused-vars
  client.commits(req.params.username, req.query.per_page, req.params.repos, req.query.page)
    .then(user => res.send(user))
    .catch(next);
});

app.get('/languages/:username', (req, res, next) => { // eslint-disable-line no-unused-vars
  client.userLanguages(req.params.username)
    .then(utils.getReposLanguagesStats)
    .then(stats => res.send(stats))
    .catch(next);
});

app.get('/repos/:username/:repoName/stats/contributors', (req, res, next) => { // eslint-disable-line no-unused-vars
  client.contributors(req.params.username, req.params.repoName)
    .then(stats => {res.send(stats)})
    .catch(next);
});

// Forward 404 to error handler
app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

// Error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.log(req);
  console.error(err);
  res.status(err.status || 500);
  res.send(err.message);
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening at http://localhost:${port}`);
});
