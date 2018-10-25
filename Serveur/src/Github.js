const fetch = require('node-fetch');

class ResponseError extends Error {
  constructor(res, body) {
    super(`${res.status} error requesting ${res.url}: ${res.statusText}`);
    this.status = res.status;
    this.path = res.url;
    this.body = body;
  }
}

class Github {
  constructor({ token, baseUrl = 'https://api.github.com' } = {}) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  setToken(token) {
    this.token = token;
  }

  request(path, opts = {}) {
    const url = `${this.baseUrl}${path}`;
    const options = {
      ...opts,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${this.token}`,
      },
    };

    return fetch(url, options)
      .then(res => res.json()
        .then((data) => {
          if (!res.ok) {
            throw new ResponseError(res, data);
          }

          return data;
        }));
  }

  user(username) {
    return this.request(`/users/${username}`);
  }

  repos(username, per_page, pageNumber) {
    return this.request(`/users/${username}/repos?per_page=${per_page}&page=${pageNumber}`);
  }

  commits(username, per_page, repoName, page) {
    return this.request(`/repos/${username}/${repoName}/commits?per_page=${per_page}&page=${page}`);
  }

  //contributors doesn't support pagination, this will only return the first 100 contributors
  contributors(username, repoName) {
    return this.request(`/repos/${username}/${repoName}/stats/contributors?per_page=100`)
  }

  repoLanguages(repoName) {
    return this.request(`/repos/${repoName}/languages`);
  }

  userLanguages(username) {
    return this.repos(username)
      .then((repos) => {
        const getLanguages = repo => this.repoLanguages(repo.full_name);
        return Promise.all(repos.map(getLanguages));
      });
  }
}

module.exports = Github;
