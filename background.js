var posts = {}
categorizedPosts = JSON.parse(localStorage.getItem('categorizedPosts'));
console.log(categorizedPosts);

var categories;
chrome.storage.local.get(['categories'],function(result) {
          console.log('categories: ' + result.categories);
          categories = result.categories;
          // first time loading the app, there will be no categories, so we add "Uncategorized"
          if (categories == null) {
            var categories = ["Uncategorized"];
            chrome.storage.local.set({categories: categories}, function() {
                    console.log('categories is set to ' + categories);
                  });
          }
        });



//https://github.com/not-an-aardvark/snoowrap
sw = new snoowrap({
  userAgent: 'saved posts organizer by /u/friiiiiis',
  clientId: localStorage.getItem('clientID'),
  clientSecret: localStorage.getItem('clientSecret'),
  username: localStorage.getItem('username'),
  password: localStorage.getItem('password')
});

sw.getMe().getSavedContent().then(function(content) {
  for (var i = 0; i < content.length; i++) {
    var ir = content.length - 1 - i;
    posts[ir] = {}
    posts[ir].title = content[i]['title'];
    posts[ir].permalink = content[i]['permalink'];
    posts[ir].id = content[i]['id'];
  }

  localStorage.setItem('posts', JSON.stringify(posts));

  updateCategorized();
});

function updateCategorized() {
  //checks if there is any new saved posts that have not yet been categorized
  for (var i = 0; i < Object.keys(posts).length; i++) {
    var postFound = false;

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

  localStorage.setItem('categorizedPosts', JSON.stringify(categorizedPosts));

  localStorage.setItem('lastUpdated', new Date());
}
