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
          //adds every fetched saved post to posts.
          //traverses from bottom up, but saves first elements last. That is because,
          //the most recent saved post is the first element in the JSON, and we want it to be last
          //so we easier can push most recent post to the end of the lists
          var ir = content.length - 1 - i;
          // console.log(content[ir].data.title);
          posts[ir] = {}

          //tests if the saved element is a post (t3) or a comment (t1)
          //thanks to 19smitgr for heads up on this issue
          if (content[i].kind == 't3') { //t3 == post
            posts[ir].title = content[i].data.title;
            posts[ir].permalink = content[i].data.permalink;
            posts[ir].id = content[i].data.id;
            posts[ir].type = "t3";
          } else if (content[i].kind == 't1') { //t1 == comment
            posts[ir].title = content[i].data.link_title;
            posts[ir].permalink = content[i].data.permalink;
            posts[ir].id = content[i].data.id;
            posts[ir].type = "t1";
          } else {
            //if it is niether a post or a comment, we skip this element
            continue;
          }

          if (posts[ir].permalink.startsWith("/r/")) {
            posts[ir].permalink = "https://www.reddit.com" + posts[ir].permalink;
          }

        }

        localStorage.setItem('username', user);

        username = localStorage.getItem('username');

        localStorage.setItem('posts' + username, JSON.stringify(posts));

        // console.log(JSON.parse(localStorage.getItem('posts' + username)));

        getFromMemory();

      }).catch((error) => {
        openErrorMenu("Couldn't get saved posts. Not logged into reddit.")
      });
    });
}


function getFromMemory() {
  if (localStorage.getItem('posts' + username) != null) {
    posts = JSON.parse(localStorage.getItem('posts' + username));
  }

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
  tempJSON = {}

  //checks if there is any previously saved and categorized posts, that have now been unsaved
  for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
    var postFound = false;

    for (var j = 0; j < Object.keys(posts).length; j++) {
      if (posts[j]['id'] == categorizedPosts[i]['id']) {

        if (posts[j].type == "t3") {
          categorizedPosts[i].type = "";
        } else if (posts[j].type == "t1") {
          categorizedPosts[i].type = " (comment)";
        }

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
      tempJSON[i] = categorizedPosts[i];
    }

  }

  categorizedPosts = tempJSON;


  //checks if there is any new saved posts that have not yet been categorized
  for (var i = 0; i < Object.keys(posts).length; i++) {
    var postFound = false;

    for (var j = 0; j < Object.keys(categorizedPosts).length; j++) {
      if (categorizedPosts[j] == undefined) {
        break;
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
      if (posts[i].type == "t3") {
        categorizedPosts[k].type = "";
      } else if (posts[i].type == "t1") {
        categorizedPosts[k].type = " (comment)";
      }
      categorizedPosts[k].category = 'Uncategorized';
    }


  }

  localStorage.setItem('categorizedPosts' + username, JSON.stringify(categorizedPosts));
  // console.log(JSON.parse(localStorage.getItem('categorizedPosts' + username)));

  localStorage.setItem('lastUpdated' + username, new Date());

}

getSavedPostsFromFeed();
