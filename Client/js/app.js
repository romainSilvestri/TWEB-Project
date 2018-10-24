// https://medium.freecodecamp.org/environment-settings-in-javascript-apps-c5f9744282b6
const baseUrl = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://heig-vd-ga-server.herokuapp.com';


const defaultSearch = 'octocat';
const searchForm = document.getElementById('search-form');
const search = document.getElementById('search');
const update = document.getElementById('update');
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
  const chartLanguages = document.getElementById('chart-frequencies');
  const ctx = chartLanguages.getContext('2d');
  ctx.responsive = true;
  ctx.maintainAspectRatio = false;
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
      title: {
        display: true,
        fontColor: 'black',
        fontSize: 30,
        text: 'Commits/day depending on the language'
      },
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

//TEST, get all the repos
function getAllRepos(username, resultArr, pageNumber = 1) {
  return new Promise(function (resolve, reject) {
    getPageOfRepos(username, pageNumber)
      .then(result => {
        if (result.length === 0) {
          resolve(resultArr);
        }
        else if (result.length < 100) {
          resolve(resultArr.concat(result));
        }
        else {
          resultArr = resultArr.concat(result);
          resolve(getAllRepos(username, resultArr, pageNumber + 1));
        }
      });
  });
}

function getPageOfRepos(username, pageNumber) {
  return fetch(`${baseUrl}/users/${username}/repos?page=${pageNumber}&per_page=${100}`)
    .then(res => res.json());
}

function getAllCommits(username, repo) {
  return fetch(`${baseUrl}/users/${username}/${repo}/commits`)
    .then(res => res.json());
}

/**
 * this function return an array of json containing a language and a frequencies of commits per day
 * @param {*} username 
 */
function getFrequencyOfCommits(username) {
  return new Promise(function (resolve, reject) {
    let frequencies = [];
    let reposJSON = [];
    getAllRepos(username, reposJSON)
      .then(repos => {
        const promises = [];
        const repoNameAndLanguage = [];

        for (let i = 0; i < repos.length; i++) {
          if (repos[i].language === null) {
            continue;
          }
          promises.push(getNumberOfCommits(username, repos[i].name));
          repoNameAndLanguage.push([repos[i].name, repos[i].language]);
        };

        Promise.all(promises).then(data => {
          const promisesCommits = [];

          for (let i = 0, removedElem = 0; i < data.length; i++) {
            if (data[i] === 0 || data[i] === 1) {
              repoNameAndLanguage.splice(i - removedElem, 1);
              removedElem++;
              continue;
            }
            promisesCommits.push([getFirstCommit(username, repoNameAndLanguage[i - removedElem][0]), getLastCommit(username, repoNameAndLanguage[i - removedElem][0], data[i]), data[i], repoNameAndLanguage[i - removedElem][1]]);
          }

          Promise.all(promisesCommits.map(Promise.all, Promise)).then(Commits => {
            //Commits is an object as following : [ [last_commit, first_commit, total_of_commits, language_of_the_repo], ...]
            Commits.forEach(element => {
              const ms_per_day = 24 * 60 * 60 * 1000;
              let d1 = new Date(element[0].commit.author.date);
              let d2 = new Date(element[1].commit.author.date);
              let d1_ms = d1.getTime();
              let d2_ms = d2.getTime();
              if ((d1_ms - d2_ms) >= ms_per_day) {
                let frequency = element[2] * ms_per_day / (d1_ms - d2_ms);
                frequencies.push([element[3], frequency]);
              }
            });
            let globalFrequency = 0;
            frequencies.forEach(element => {
              globalFrequency += element[1];
            });
            globalFrequency = globalFrequency / frequencies.length;
            frequencies = mergeArray(frequencies);
            for (let i = 0; i < frequencies.length; i++) {
              frequencies[i] = averageFrequency(frequencies[i]);
            }
            frequencies.unshift(["global", globalFrequency]);
            let keys = ["language", "frequency"];
            let objects = frequencies.map(array => {
              let object = {};
              keys.forEach((key, i) => object[key] = array[i]);
              return object;
            });
            resolve(objects);
          })
        });

      });
  });
}

//function that take array of array of two elements and merge array that have the same first element
function mergeArray(arr) {
  retArray = arr
  l = arr.length;
  for (let i = 0; i < l; i++) {
    for (let j = i + 1; j < l; j++) {
      if (retArray[i][0] === retArray[j][0]) {
        retArray[i].push(retArray[j][1]);
        retArray.splice(j, 1);
        j--;
        l--;
      }
    }
  }
  return retArray;
}

//function that return an array containing the first element and the mean of all other elements of the parameter.
function averageFrequency(arr) {
  retArray = [];
  retArray.push(arr[0]);
  sumFrequency = 0;
  for (let i = 1; i < arr.length; i++) {
    sumFrequency += arr[i];
  }
  retArray.push(sumFrequency / (arr.length - 1))
  return retArray;
}

function getCommitsOfContributors(username, repoName) {
  return Promise.all([getPageOfContributors(username, repoName)])
  .then(result => {
      result = result[0];
        if (result.length === 0) {
          return (0);
        }
        else {
          for (let i = 0; i < result.length; i++) {
            if (result[i].author.login.toLowerCase() === username.toLowerCase()) {
              return (result[i].total);
            }
          }
          return (0);
        }
      });
}

function getPageOfContributors(username, repoName) {
  return fetch(`${baseUrl}/repos/${username}/${repoName}/stats/contributors?per_page=${100}`)
    .then(res => { return res.json();});
}


function getNumberOfCommits(username, repoName) {
  return getCommitsOfContributors(username, repoName);
}

function getCommitsPage(username, repoName, pageNumber) {
  return fetch(`${baseUrl}/repos/${username}/${repoName}/commits?page=${pageNumber}&per_page=${100}`)
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
    let pageNumber = Math.floor(numberOfCommits / 100) + 1;
    let indexLastCommit = (numberOfCommits % 100) - 1;
    if (indexLastCommit < 0) {
      indexLastCommit = 100;
      pageNumber--;
    }
    fetch(`${baseUrl}/repos/${username}/${repoName}/commits?page=${pageNumber}&per_page=${100}`)
      .then(res => {
        res.json().then(result => {
          resolve(result[indexLastCommit]);
        });
      });
  });
}

function addUserInDb(username, freq) {
  return new Promise(function (resolve, reject) {
    fetch(`${baseUrl}/add`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        username: username,
        frequencies: freq
      })
    })
      .then(function (res) { console.log(res) })
      .catch(function (res) { console.log(res) })
  });
}

function searchUserInDb(username) {
  return new Promise(function (resolve, reject) {
    fetch(`${baseUrl}/user`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        username: username
      })
    })
      .then(res => res.json()
      .then(result => resolve(result)))
      .catch(function (res) { console.log(res) })
  });
}

function getAllGlobalFrequenciesInDb() {
  return new Promise(function (resolve, reject) {
    fetch(`${baseUrl}/frequencies`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST'
    })
      .then(res => res.json()
      .then(result => resolve(result)))
      .catch(function (res) { console.log(res) })
  });
}

function handleSearch(username, checkDB = true) {
  updatePlaceholder('Loading...');
  let isInDb = false;
  searchUserInDb(username.toLowerCase())
  .then(result => {
    if(result != null){
      isInDb = true;
    }
  if(checkDB === true && isInDb === true){
      return Promise.all([
        getUser(username),
        getGithubColors(),
      ])
        .then(([user, colors]) => {
          updatePlaceholder('');
          let frequencies = result.frequencies;
          let labels = [];
          let data = [];
          frequencies.forEach(element => { labels.push(element.language) });
          frequencies.forEach(element => { data.push(element.frequency) });
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
  else{
  return Promise.all([
    getUser(username),
    getFrequencyOfCommits(username),
    getGithubColors(),
  ])
    .then(([user, frequencies, colors]) => {
      updatePlaceholder('');

      let labels = [];
      let data = [];
      frequencies.forEach(element => { labels.push(element.language) });
      frequencies.forEach(element => { data.push(element.frequency) });
      const backgroundColor = labels.map(label => {
        const color = colors[label] ? colors[label].color : null
        return color || '#000';
      })

      updateProfile(user);
      updateChart({ labels, data, backgroundColor });
      addUserInDb(user.login.toLowerCase(), frequencies);

    })
    .catch(err => {
      updatePlaceholder('Oups, an error occured. Sorry, this app sucks...', 'text-error');
      console.error('Cannot fetch data', err)
    })
  }
  
})
.catch(err => console.log(err));
}

function setCheckDb(val) {
  searchForm.elements['checkDb'].value = val;
}

search.addEventListener('click', function (e) {
  e.preventDefault();
  const username = searchForm.elements['username'].value;
  if (!username) {
    return;
  }
  handleSearch(username, true);
});

update.addEventListener('click', function (e) {
  e.preventDefault();
  const username = searchForm.elements['username'].value;
  if (!username) {
    return;
  }
  handleSearch(username, false);
});

handleSearch(defaultSearch);

