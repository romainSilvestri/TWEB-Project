// https://medium.freecodecamp.org/environment-settings-in-javascript-apps-c5f9744282b6
const baseUrl = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://heig-vd-ga-server.herokuapp.com';


const defaultSearch = 'octocat';
const searchForm = document.getElementById('search-form');
const search = document.getElementById('search');
const update = document.getElementById('update');
const pourcentageCommit = document.getElementById('pourcentageCommit');
const rankTitle = document.getElementById('rankTitle');
const descRank = document.getElementById('descRank');
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

function updateChart({ labels, data, backgroundColor, frequencies }) {
  const globalFrequency = data[0];

  let dataCharts = [];
  let i = 0;
  frequencies.forEach(element => {
    dataCharts.push({"label": element.language, "value":element.frequency, "color": backgroundColor[i]});
    i++;
  })

  const dataSource = {
    "chart": {
      "caption": "Commits/day depending on the language",
      "xaxisname": "language",
      "yaxisname": "frequency of commits",
      "numbersuffix": "",
      "theme": "fusion",
      "bgColor": "#F6FEFE"
    },
    "data": dataCharts
  };
  
  FusionCharts.ready(function() {
     var myChart = new FusionCharts({
        type: "column2d",
        renderAt: "commits frequency",
        width: "100%",
        height: "100%",
        dataFormat: "json",
        dataSource
     }).render();
  });

  getRank(globalFrequency)
  .then(value => {
    value[0] = Math.floor(value[0] * 100) / 100
    const dataSource = {
      "chart": {
        "caption": "Your rank",
        "lowerlimit": "0",
        "upperlimit": "100",
        "showvalue": "1",
        "numbersuffix": "%",
        "theme": "fusion",
        "showtooltip": "0",
        "bgColor": "#F6FEFE"
      },
      "colorrange": {
        "color": [
          {
            "minvalue": "0",
            "maxvalue": "25",
            "code": "#F2726F"
          },
          {
            "minvalue": "25",
            "maxvalue": "50",
            "code": "#FF8040"
          },
          {
            "minvalue": "50",
            "maxvalue": "75",
            "code": "#FFC533"
          },
          {
            "minvalue": "75",
            "maxvalue": "100",
            "code": "#62B58F"
          }
        ]
      },
      "dials": {
        "dial": [
          {
            "value": value[0]
          }
        ]
      }
    };
    
    FusionCharts.ready(function() {
       var myChart = new FusionCharts({
          type: "angulargauge",
          renderAt: "chart-container",
          width: "50%",
          height: "20%",
          dataFormat: "json",
          dataSource
       }).render();
    });
    pourcentageCommit.innerHTML = `You are committing more frequently than ${value[0]} % of the people that used this app`;
    let title = "Your rank : ";
    let description;
    if(value[0] === 0){
      title = title.concat("The useless")
      description = "Well, that not really good to be the last. Are you using git ? Are you even alive ? \
      You really need to commit more or other people won't work with you again."
    }
    else if(value[0] < 25){
      title = title.concat("Git Neophyte")      
      description = "You are way below average. You really need to understand what is github. Just keep trying and you may progress toward the top"
    }
    else if(value[0] < 50){
      title = title.concat("Git Junior Adept")
      description = "You are bellow average but it could be worst. You have just to commit more often when you work on project but it seems that you understand the principle of Github"
    }
    else if(value[0] < 75){
      title = title.concat("Git Royal administrator")
      description = "You are beyong average, that's GREAT. You know what you do and you work efficiently. Just keep going."
    }
    else if(value[0] < 100){
      title = title.concat("Git Master")
      description = "You are part of the top Github user. People that work with you doesn't have time to ask you if you have push, your team almost have a live view of your project. \
      Let's just hope that those stats are not boosted by some rush in projects..."
    }
    else{
      title = title.concat("The Almighty")
      description = "You are THE ONE. Nobody commit more than you, Congratulation !"
    }
    rankTitle.innerHTML = title;
    if(value[1] < 10){
      description = description.concat("<br/><br/>* You shouldn't take this result really seriously, less than 10 people are currently registered in the database.<br/>Tell your friends to use this app as well so the stats will be better !");
    }
    descRank.innerHTML = description;
})

}

function getRank(frequency){
  return getAllGlobalFrequenciesInDb()
  .then(result => {
    let rank = 0;
    if (result.length === 0){
      return [100, 1];
    }
    else{
      let frequencies = []
      result.forEach(element => {
        if(element.frequencies != null){
          frequencies.push(element.frequencies[0].frequency)
        }
      })
      frequencies.sort(function(a, b){return a - b});
      let index = 0
      while(frequencies[index] <= frequency && index < frequencies.length){
        index++;
      }
      rank = index * 100 / frequencies.length
      return [rank, frequencies.length];

    }

  })
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
  return getPageOfRepos(username, pageNumber)
      .then(result => {
        if (result.length === 0) {
          return resultArr;
        }
        else if (result.length < 100) {
          return resultArr.concat(result);
        }
        else {
          resultArr = resultArr.concat(result);
          return getAllRepos(username, resultArr, pageNumber + 1);
        }
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

function getPageOfContributors(username, repoName) {
  return fetch(`${baseUrl}/repos/${username}/${repoName}/stats/contributors?per_page=${100}`)
    .then(res => res.json())
}


function getNumberOfCommits(username, repoName) {
  return getPageOfContributors(username, repoName)
    .then(result => {
      if (result.length === 0) {
        return 0;
      }
      else {
        for (let i = 0; i < result.length; i++) {
          if (result[i].author) {
          if (result[i].author.login.toLowerCase() === username.toLowerCase()) {
            return (result[i].total);
          }
        }
      }
      return 0;
    }
      })
      .catch(err => console.log(err));
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
  return fetch(`${baseUrl}/add`, {
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
}

function searchUserInDb(username) {
  return fetch(`${baseUrl}/user`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        username: username
      })
    })
      .then(res => res.json())
      .catch(function (res) { console.log(res) })
}

function getAllGlobalFrequenciesInDb() {
  return fetch(`${baseUrl}/frequencies`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST'
    })
      .then(res => res.json())
      .catch(function (res) { console.log(res) })
}

function handleSearch(username, checkDB = true) {
  updatePlaceholder('Loading...');
  let isInDb = false;
  searchUserInDb(username.toLowerCase())
    .then(result => {
      if (result != null) {
        isInDb = true;
      }
      if (checkDB === true && isInDb === true) {
        Promise.all([
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
            updateChart({ labels, data, backgroundColor, frequencies});

          })
          .catch(err => {
            updatePlaceholder('Oups, an error occured. Sorry, this app sucks...', 'text-error');
            console.error('Cannot fetch data', err)
          })
      }
      else {
        Promise.all([
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
            addUserInDb(user.login.toLowerCase(), frequencies)
            .then(updateChart({ labels, data, backgroundColor, frequencies })
          
          );
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

