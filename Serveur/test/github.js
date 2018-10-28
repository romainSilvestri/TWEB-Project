require('dotenv').config();
const { expect } = require('chai');
const Github = require("../src/Github")
const client = new Github({ token: process.env.OAUTH_TOKEN})

describe('Testing the serveur response', () => {

  it('it should return a user', () => {
    client.user('octocat')
    .then(result => expect(result.login).to.eql('octocat'))
  });

  it('it should return the repo', () => {
    client.repos('octocat', 100, 0)
    .then(result => expect(result).to.not.eql(null))
  });

  it('it should return the first 100 contributors', () => {
    client.contributors('torvalds', 'linux')
    .then(result => expect(result.length).to.eql(100))
  });

  it('it should return the last 100 commits of the repos', () => {
    client.commits('torvalds', 100, 'linux', 0)
    .then(result => expect(result.length).to.eql(100))
  });

  it('it should return the first 100 repos of the user', () => {
    client.repos('linux-china', 100, 0)
    .then(result => expect(result.length).to.eql(100))
  });

  it('it should only return the first 30 repos of the user', () => {
    client.repos('linux-china', 30, 0)
    .then(result => expect(result.length).to.eql(30))
  });
  
})
