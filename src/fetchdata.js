var posts = {};
var username;
var categorizedPosts = {}
var categories;

export function fetchSavedPosts() {
  return new Promise(function (resolve, reject){
    fetchFeedSourceCode()
      .then(getUsernameAndKey)
      .then(getJSONFeed)
      .then(getDataFromPreviousSync)
      .then(updateCategorizedPosts)
      .then(() => {resolve("Succesfully fetched posts from user " + username)})
      .catch((error) => {
        reject(error);
      });
  });
}

function fetchFeedSourceCode() {
  return new Promise(function (resolve, reject){
    fetch('https://www.reddit.com/prefs/feeds')
      .then((res) => {
        resolve(res.text());
      })
      .catch((error) => {
        //error on this stage, will be connection errors
        console.log(error);
        reject("Couldn't connect to reddit.");
      });
  });
}

function getUsernameAndKey(source) {
  return new Promise(function (resolve, reject){
    var from = source.search('user=') + 5;
    var to = source.search('">RSS');
    username = source.substring(from, to);
    // console.log(username);

    from = source.search('feed=') + 5;
    to = source.search('&amp;user=');
    var key = source.substring(from, to);
    // console.log(key);
    resolve(key);
  });
}

function getJSONFeed(key) {
  return new Promise(function (resolve, reject){
      posts = {}

      addDataToPosts(key)
        .then(() => {
          localStorage.setItem('username', username);

          localStorage.setItem('posts' + username, JSON.stringify(posts));

          console.log("posts fetched from reddit (not yet categorized):");
          console.log(JSON.parse(localStorage.getItem('posts' + username)));

          resolve();
        })
        .catch((error) => {
          reject(error);
        });
  });
}

function addDataToPosts(key, after) {
  return new Promise(function (resolve, reject){
    $.getJSON('https://www.reddit.com/saved.json?feed=' + key + "&after=" + after, function(data) {
      // console.log(data);

      var content = data.data.children;

      var j = Object.keys(posts).length;

      for (var i = 0; i < content.length; i++) {
        //adds every fetched saved post on the current page to posts.
        posts[j] = {}

        posts[j].permalink = content[i].data.permalink;
        posts[j].id = content[i].data.id;
        //tests if the saved element is a post (t3) or a comment (t1)
        //thanks to GitHub user 19smitgr for heads up on this issue
        if (content[i].kind == 't3') { //t3 == post
          posts[j].title = content[i].data.title;
          posts[j].type = "t3";
          posts[j].typeText = "";
        } else if (content[i].kind == 't1') { //t1 == comment
          posts[j].title = content[i].data.link_title;
          posts[j].type = "t1";
          posts[j].typeText = " (comment)";
        } else {
          // if it is niether a post or a comment, we skip this element
          continue;
        }

        if (posts[j].permalink.startsWith("/r/")) {
          posts[j].permalink = "https://www.reddit.com" + posts[j].permalink;
        }

        j++;

      }

      // checks if there is more data to be pulled. If there is, we call the function recursively
      if (data.data.after != null) {
        addDataToPosts(key, data.data.after)
          .then((afterData) => {
            resolve(data + afterData);
          })
          .catch((error) => {
            console.log(error);
            reject("Couldn't get saved posts. Not logged into reddit.");
          });
      } else {
        resolve(data);
      }

    }).catch((error) => {
      // error on this stage, will be caused by wrong api-key,
      // which means that the user is not logged in to reddit
      console.log(error);
      reject("Couldn't get saved posts. Not logged into reddit.");
    });
  });
}

function getDataFromPreviousSync() {
  return new Promise(function (resolve, reject){
    if (localStorage.getItem('categorizedPosts' + username) != null) {
      categorizedPosts = JSON.parse(localStorage.getItem('categorizedPosts' + username));
    }

    if (localStorage.getItem('categories' + username) != null) {
      categories = JSON.parse(localStorage.getItem('categories' + username));
    } else {
      categories = ["Uncategorized"];
      localStorage.setItem('categories' + username, JSON.stringify(categories));
    }
    resolve();
  });
}

function updateCategorizedPosts() {
  return new Promise(function (resolve, reject){
    var tempJSON = {}

    //checks if there is any previously saved and categorized posts, that have now been unsaved
    for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
      var postFound = false;

      for (var j = 0; j < Object.keys(posts).length; j++) {
        if (categorizedPosts[i] == undefined) {
          break;
        }
        if (posts[j]['id'] == categorizedPosts[i]['id']) {

          if (categorizedPosts[i].permalink.startsWith("/r/")) {
            categorizedPosts[i].permalink = "https://www.reddit.com" + categorizedPosts[i].permalink;
          }

          var postFound = true;
          break;
        } else {
          continue;
        }
      }

      if (postFound) { //adds all matching posts to a temporary array, that will be assigned to categorizedPosts
        tempJSON[Object.keys(tempJSON).length] = categorizedPosts[i];
      }

    }

    categorizedPosts = tempJSON;

    //checks if there is any new saved posts that have not yet been categorized
    for (var i = 0; i < Object.keys(posts).length; i++) {
      var postFound = false;

      for (var j = 0; j < Object.keys(categorizedPosts).length; j++) {

        if (categorizedPosts[j] == undefined) {
          continue;
        }

        if (categorizedPosts[j]['id'] == posts[i]['id']) {
          postFound = true;
          break;
        } else {
          continue;
        }
      }

      if (!postFound) {
        var k = Object.keys(categorizedPosts).length;
        categorizedPosts[k] = posts[i];
        categorizedPosts[k].category = 'Uncategorized';
      }

    }

    localStorage.setItem('categorizedPosts' + username, JSON.stringify(categorizedPosts));

    console.log("categorized posts:");
    console.log(JSON.parse(localStorage.getItem('categorizedPosts' + username)));

    localStorage.setItem('lastUpdated' + username, new Date());

    resolve(categorizedPosts);
  });
}
