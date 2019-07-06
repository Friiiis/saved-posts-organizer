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
    $.getJSON('https://www.reddit.com/saved.json?feed=' + key, function(data) {
      // console.log(data);

      var content = data.data.children;

      for (var i = 0; i < content.length; i++) {
        //adds every fetched saved post to posts.
        //traverses from bottom up, but saves first elements last. That is because,
        //the most recent saved post is the first element in the JSON, and we want it to be last
        //so we easier can push most recent post to the end of the lists
        var ir = content.length - 1 - i;
        // console.log(content[ir].data.title);
        posts[ir] = {}

        posts[ir].permalink = content[i].data.permalink;
        posts[ir].id = content[i].data.id;
        //tests if the saved element is a post (t3) or a comment (t1)
        //thanks to GitHub user 19smitgr for heads up on this issue
        if (content[i].kind == 't3') { //t3 == post
          posts[ir].title = content[i].data.title;
          posts[ir].type = "t3";
          posts[ir].typeText = "";
        } else if (content[i].kind == 't1') { //t1 == comment
          posts[ir].title = content[i].data.link_title;
          posts[ir].type = "t1";
          posts[ir].typeText = " (comment)";
        } else {
          //if it is niether a post or a comment, we skip this element
          continue;
        }

        if (posts[ir].permalink.startsWith("/r/")) {
          posts[ir].permalink = "https://www.reddit.com" + posts[ir].permalink;
        }

      }

      localStorage.setItem('username', username);

      localStorage.setItem('posts' + username, JSON.stringify(posts));

      console.log("posts fetched from reddit (not yet categorized):");
      console.log(JSON.parse(localStorage.getItem('posts' + username)));

      resolve(data);

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

    console.log("categorizedPosts:");
    console.log(JSON.parse(localStorage.getItem('categorizedPosts' + username)));

    localStorage.setItem('lastUpdated' + username, new Date());

    resolve(categorizedPosts);
  });
}
