// https://medium.freecodecamp.org/environment-settings-in-javascript-apps-c5f9744282b6
const baseUrl = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://heig-vd-ga-server.herokuapp.com';


const defaultSearch = 'octocat';
const searchForm = document.getElementById('search-form');
let chart = null;

function getUser(username) {
  return fetch(`${baseUrl}/users/${username}`)
    .then(res => res.json());
}

function getLanguages(username) {
  return fetch(`${baseUrl}/languages/${username}`)
    .then(res => res.json());
}

function getGithubColors() {
  return fetch('data/github-colors.json')
    .then(res => res.json());
}

function updateChart({ labels, data, backgroundColor }) {
  const chartLanguages = document.getElementById('chart-languages');
  const ctx = chartLanguages.getContext('2d');
  const options = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor,
      }],
    },
    options: {
      legend: {
        display: false
      },
      scales: {
        xAxes: [{
          ticks: {
            fontFamily: "'Roboto Mono'",
            fontSize: 12,
          },
          gridLines: {
            display: false,
          }
        }],
        yAxes: [{
          ticks: {
            fontFamily: "'Roboto Mono'",
          }
        }]
      },
    }
  }

  if (!chart) {
    chart = new Chart(ctx, options);
  } else {
    chart.data.labels = options.data.labels;
    chart.data.datasets = options.data.datasets;
    chart.update();
  }
}

function updateProfile(user) {
  const avatar = document.getElementById('user-avatar');
  const name = document.getElementById('user-name');
  const login = document.getElementById('user-login');
  avatar.src = user.avatar_url;
  avatar.alt = `avatar of ${user.name}`;
  name.innerHTML = user.name;
  login.innerHTML = user.login;
}

function updatePlaceholder(content, className = 'text-secondary') {
  const placeholder = document.getElementById('placeholder');
  placeholder.className = className;
  placeholder.innerHTML = content;
}

function getAllRepos(username) {
  return fetch(`${baseUrl}/users/${username}/repos`)
    .then(res => res.json());
}

function getAllCommits(username, repo) {
  return fetch(`${baseUrl}/users/${username}/${repo}/commits`)
    .then(res => res.json());
}

function fail() {
  console.log('fail');
}


function getFrequencyOfCommits(username) {
  frequencies = [];
  getAllRepos(username)
    .then(repos => {
      const promises = [];
      const repoName = [];

      for (let i = 0; i < repos.length; i++) {
        promises.push(getNumberOfCommits(username, repos[i].name));
        repoName.push(repos[i].name);
      }

      Promise.all(promises).then(data => {
        const promisesCommits = [];

        for (let i = 0, removedElem = 0; i < data.length; i++) {
          if(data[i] === 0 || data[i] === 1){
            repoName.splice(i-removedElem,1);
            removedElem++;
            continue;
          }
          promisesCommits.push([getFirstCommit(username, repoName[i-removedElem]), getLastCommit(username, repoName[i-removedElem], data[i]), data[i]]);
        }

        console.log(promisesCommits.map);
      Promise.all(promisesCommits.map(Promise.all, Promise)).then(Commits =>{
        console.log(Commits);
        for (let i = 0; i < Commits.length; i++){
          let d1 = new Date(Commits[i][0].commit.author.date);
          let d2 = new Date(Commits[i][1].commit.author.date);
          let d1_ms = d1.getTime();
          let d2_ms = d2.getTime();
          let frequency = Commits[i][2] * 86400000 / (d1_ms - d2_ms);
          frequencies.push(frequency);
          console.log(frequencies);
        }
        return frequencies;
      })
    });
    
  });
}

function getContributors(username, repoName) {
  console.log(`${baseUrl}/repos/${username}/${repoName}/stats/contributors?per_page=100`);
  return fetch(`${baseUrl}/repos/${username}/${repoName}/stats/contributors?per_page=100`)
    .then(res => res.json());
}

function getNumberOfCommits(username, repoName) {
  return new Promise(function (resolve, reject) {
    getContributors(username, repoName)
      .then(result => {
        for (let i = 0; i < result.length; i++) {
          if (result[i].author.login === username) {
            resolve(result[i].total);
          }
        }
        resolve(0);
      });
  });
}

function getCommitsPage(username, repoName, pageNumber) {
  return fetch(`${baseUrl}/repos/${username}/${repoName}/commits?page=${pageNumber}`)
    .then(res => res.json());
}

function getFirstCommit(username, repoName) {
  return new Promise(function (resolve, reject) {
    let result = getCommitsPage(username, repoName, 1)
      .then(result => {
        resolve(result[0]);
      });
  });
}

function getLastCommit(username, repoName, numberOfCommits) {
  return new Promise(function (resolve, reject) {
    let pageNumber = Math.floor(numberOfCommits / 30) + 1;
    let indexLastCommit = (numberOfCommits % 30) - 1;
    if (indexLastCommit < 0) {
      indexLastCommit = 30;
      pageNumber--;
    }
    fetch(`${baseUrl}/repos/${username}/${repoName}/commits?page=${pageNumber}`)
      .then(res => {
        res.json().then(result => {
         resolve(result[indexLastCommit]);
        });
      });
  });
}

function handleSearch(username) {
  updatePlaceholder('Loading...');
  return Promise.all([
    getUser(username),
    getLanguages(username),
    getFrequencyOfCommits(username),
    getGithubColors(),
  ])
    .then(([user, languages, frequency, colors]) => {
      updatePlaceholder('');

      const labels = Object.keys(languages);
      const data = labels.map(label => languages[label]);
      const backgroundColor = labels.map(label => {
        const color = colors[label] ? colors[label].color : null
        return color || '#000';
      })

      updateProfile(user);
      updateChart({ labels, data, backgroundColor });
    })
    .catch(err => {
      updatePlaceholder('Oups, an error occured. Sorry, this app sucks...', 'text-error');
      console.error('Cannot fetch data', err)
    })
}

searchForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const username = this.elements['username'].value;
  if (!username) {
    return;
  }
  handleSearch(username);
});

handleSearch(defaultSearch);

