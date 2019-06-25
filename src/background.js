var username;
var posts;
var categorizedPosts = {}
var categories;

function getSavedPostsFromFeed() {
  var user;

  posts = {}

  fetch('https://www.reddit.com/prefs/feeds')
    .then((res) => {
      return res.text();
    })
    .then((data) => {
      var from = data.search('user=') + 5;
      var to = data.search('">RSS');
      user = data.substring(from, to);
      // console.log(user);

      from = data.search('feed=') + 5;
      to = data.search('&amp;user=');
      var key = data.substring(from, to);
      // console.log(key);
      return key;
    })
    .then((key) => {
      $.getJSON('https://www.reddit.com/saved.json?feed=' + key, function(data) {
        // console.log(data);

        var content = data.data.children;

        for (var i = 0; i < content.length; i++) {
          var ir = content.length - 1 - i;
          // console.log(content[ir].data.title);
          posts[ir] = {}
          posts[ir].title = content[i].data.title;
          posts[ir].permalink = content[i].data.permalink;
          posts[ir].id = content[i].data.id;
        }

        localStorage.setItem('username', user);

        username = localStorage.getItem('username');
        // console.log("Username saved in mem: " + username);

        localStorage.setItem('posts' + username, JSON.stringify(posts));

        // console.log(JSON.parse(localStorage.getItem('posts' + username)));

        getFromMemory();

      }).catch((error) => {
        console.log("Error: not logged into reddit");
      });
    });
}

function getFromMemory() {
  if (localStorage.getItem('categorizedPosts' + username) != null) {
    categorizedPosts = JSON.parse(localStorage.getItem('categorizedPosts' + username));
  }

  if (localStorage.getItem('categories' + username) != null) {
    categories = JSON.parse(localStorage.getItem('categories' + username));
  } else {
    categories = ["Uncategorized"];
    localStorage.setItem('categories' + username, JSON.stringify(categories));
  }

  updateCategorized();
}

function updateCategorized() {

  //checks if there is any new saved posts that have not yet been categorized
  for (var i = 0; i < Object.keys(posts).length; i++) {
    var postFound = false;

    if (true) {

    }
    for (var j = 0; j < Object.keys(categorizedPosts).length; j++) {

      if (categorizedPosts[j] == undefined) {
        break;
      }
      if (categorizedPosts[j]['title'] == posts[i]['title']) {
          var postFound = true;
          break;
      } else {
        continue;
      }
    }

    if (!postFound) {
      var k = Object.keys(categorizedPosts).length;
      categorizedPosts[k] = posts[i];
      if (categorizedPosts[k].id == "627xf5") {
        categorizedPosts[k].category = 'Testkategori';
      } else {
        categorizedPosts[k].category = 'Uncategorized';
      }
    }
  }

  //checks if there is any previously saved and categorized posts, that have now been unsaved
  for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
    var postFound = false;

    for (var j = 0; j < Object.keys(posts).length; j++) {
      if (posts[j]['title'] == categorizedPosts[i]['title']) {
          var postFound = true;
          break;
      } else {
        continue;
      }
    }

    if (!postFound) { //if post is not found, meaning that they have been unsaved by the user
      categorizedPosts.splice(i, 1);
    }
  }

  localStorage.setItem('categorizedPosts' + username, JSON.stringify(categorizedPosts));

  localStorage.setItem('lastUpdated' + username, new Date());

}

getSavedPostsFromFeed();
