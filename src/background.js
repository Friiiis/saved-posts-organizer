var clientID = localStorage.getItem('clientID');
var clientSecret = localStorage.getItem('clientSecret');
var username = localStorage.getItem('username');
var password = localStorage.getItem('password');


var posts = {}
categorizedPosts = {}
if (localStorage.getItem('categorizedPosts' + username) != null) {
  categorizedPosts = JSON.parse(localStorage.getItem('categorizedPosts' + username));
}

var categories;
if (localStorage.getItem('categories' + username) != null) {
  categories = JSON.parse(localStorage.getItem('categories' + username));
} else {
  categories = ["Uncategorized"];
  localStorage.setItem('categories' + username, JSON.stringify(categories));
}
console.log(categories);


// var categoriesUsername = 'categories' + username;
// chrome.storage.local.get(['categoriesUsername'],function(result) {
//           console.log(result.categoriesUsername);
//           categories = result.categoriesUsername;
//
//           // first time loading the app, there will be no categories, so we add "Uncategorized"
//           if (categories == null || categories == undefined) {
//             var categories = ["Uncategorized"];
//             chrome.storage.local.set({categoriesUsername: categories}, function() {
//                     console.log('categories is set to ' + categories);
//                   });
//           }
//         });

//https://github.com/not-an-aardvark/snoowrap
sw = new snoowrap({
  userAgent: 'saved posts organizer by /u/friiiiiis',
  clientId: clientID,
  clientSecret: clientSecret,
  username: username,
  password: password
});

sw.getMe().getSavedContent().then(function(content) {
  for (var i = 0; i < content.length; i++) {
    var ir = content.length - 1 - i;
    posts[ir] = {}
    posts[ir].title = content[i]['title'];
    posts[ir].permalink = content[i]['permalink'];
    posts[ir].id = content[i]['id'];
  }

  localStorage.setItem('posts' + username, JSON.stringify(posts));

  updateCategorized();
});

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
