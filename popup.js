// Local storages:
// clientID           : the user's client ID
// clientSecret       : the user's client secret
// username           : the user's reddit username
// password           : the user's reddit password
// posts              : all user's saved posts
// categorizedPosts   : all user's saved posts categorized by themselves
// categories         : the user's custom categories

var creds;
var sw;
var posts = {}
var categorizedPosts = {}
var categories;
var lastClickedCategory = "All posts";
var inputVisible = false;

// console.log(JSON.parse(localStorage.getItem('posts')));
// console.log(JSON.parse(localStorage.getItem('categorizedPosts')));

if (localStorage.getItem('posts') != null) {
  posts = JSON.parse(localStorage.getItem('posts'));
}

if (localStorage.getItem('categorizedPosts') != null) {
  categorizedPosts = JSON.parse(localStorage.getItem('categorizedPosts'));
}

chrome.storage.local.get(['categories'],function(result) {
          categories = result.categories;
          console.log(categories);
        });


console.log(posts);
console.log(categorizedPosts);

fetch('creds.json')
  .then(response => response.text())
  .then(function(text) {
    creds = JSON.parse(text);
    setupSnoowrap();
    sync();
    initView();
  });

function setupSnoowrap() {
  var clientID = localStorage.getItem('clientID');
  var clientSecret = localStorage.getItem('clientSecret');
  var username = localStorage.getItem('username');
  var password = localStorage.getItem('password');

  console.log(clientID);
  console.log(clientSecret);
  console.log(username);
  console.log(password);

  if ((clientID == null || clientSecret == null || username == null || password == null)
      || (clientID == "" || clientSecret == "" || username == "" || password == "") ) {
    openErrorMenu();
  } else {
    //https://github.com/not-an-aardvark/snoowrap
    sw = new snoowrap({
      userAgent: creds['userAgent'],
      clientId: clientID,
      clientSecret: clientSecret,
      username: username,
      password: password
    });
  }
}

document.getElementById("sync").addEventListener("click", sync);
document.getElementById("settings").addEventListener("click", openSettings);
document.getElementById("addFolder").addEventListener("click", addFolder);
document.getElementById("linkToSettings").addEventListener("click", openSettings);

function sync() {
  posts = {}
  sw.getMe().getSavedContent().then(function(content) {
    console.log(content);
    for (var i = 0; i < content.length; i++) {
      //(var i = content.length-1; i >= 0; i--)
      //adds every fetched saved post to posts.
      //traverses from bottom up, but saves first elements last. That is because,
      //the most recent saved post is the first element in the JSON, and we want it to be last
      //so we easier can push most recent post to the end of the lists
      var ir = content.length - 1 - i;
      posts[ir] = {}
      posts[ir].title = content[i]['title'];
      posts[ir].permalink = content[i]['permalink'];
      posts[ir].id = content[i]['id'];
    }

    localStorage.setItem('posts', JSON.stringify(posts));

    console.log(JSON.parse(localStorage.getItem('posts')));

    updateCategorized();
  });
}

function updateCategorized() {
  tempJSON = {}

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

    if (postFound) {
      tempJSON[i] = categorizedPosts[i];
    }

    // if (!postFound) { //if post is not found, meaning that they have been unsaved by the user
    //   categorizedPosts.splice(i, 1);
    // }
  }

  categorizedPosts = tempJSON;


  //checks if there is any new saved posts that have not yet been categorized
  for (var i = 0; i < Object.keys(posts).length; i++) {
    var postFound = false;

    for (var j = 0; j < Object.keys(categorizedPosts).length; j++) {
      if (categorizedPosts[j] == undefined) {
        break;
      }
      if (categorizedPosts[j]['title'] == posts[i]['title']) {
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

  localStorage.setItem('categorizedPosts', JSON.stringify(categorizedPosts));
  console.log(JSON.parse(localStorage.getItem('categorizedPosts')));

  localStorage.setItem('lastUpdated', new Date());

  initView();
}

//sets up the view with categories buttons and default post category (all)
//should only be called at the start of the session or when adding/deleting a category
function initView() {
  var folders = document.getElementById('folders');

  folders.innerHTML = '<div class="folder" id="all">All posts</div>';

  for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
    if (!categories.includes(categorizedPosts[i].category)) {
      // categories.push(categorizedPosts[i].category);
      categorizedPosts[i].category = "Uncategorized";
    }
  }

  for (var i = 0; i < categories.length; i++) {
    var s = categories[i];

    folders.innerHTML = folders.innerHTML + '<div class="folder" id="' + s + '">' + s + '</div>';
  }

  for (var i = 0; i < categories.length; i++) {
    var s = categories[i];

    document.getElementById(s).addEventListener("click", function() {
      updateView(this.id);
    });
  }


  document.getElementById("all").addEventListener("click", function() {
    updateView("All posts");
  });

  updateView("All posts");

}

function updateView(category) {
  console.log(category);
  lastClickedCategory = category;

  document.getElementById('categoryTitle').innerHTML = category;

  var deleteCategoryButton = document.getElementById('deleteCategory');
  if (category == "All posts" || category == "Uncategorized") {
    deleteCategoryButton.style.visibility = "hidden";
  } else {
    deleteCategoryButton.style.visibility = "visible";
    deleteCategoryButton.onclick = function() {
      deleteCategory(category);
    }
  }

  postContainer = document.getElementById('postContainer');
  postContainer.innerHTML = "";

  if (category == "All posts") {
    //adds posts to DOM
    for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
      var title = categorizedPosts[i].title.replace(/"/g, "'");
      var id = categorizedPosts[i].id;
      var permalink = categorizedPosts[i].permalink;
      postContainer.innerHTML = postContainer.innerHTML + '<div class="row editPost"><i title="Edit category" class="fas fa-pen" id="' + id + 'button"></i><div class="post" id="' + id + '" data-link="' + permalink + '">' + title + '</div></div>';
    }

    //adds onclick listeners to posts
    for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
      var s = categorizedPosts[i].id;
      document.getElementById(categorizedPosts[i].id).addEventListener("click", function() {
        var href = "http://reddit.com" + this.dataset.link;
        chrome.tabs.create({active: true, url: href});
      });
    }

    //adds onclick listeners to editpost-buttons
    for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
      document.getElementById(categorizedPosts[i].id + "button").addEventListener("click", function() {
        editPostCategory(this.id.replace("button", ""));
      });
    }

  } else {

    //adds posts to DOM
    for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
      if (categorizedPosts[i].category == category) {
        var title = categorizedPosts[i].title.replace(/"/g, "'");
        var id = categorizedPosts[i].id;
        var permalink = categorizedPosts[i].permalink;
        postContainer.innerHTML = postContainer.innerHTML + '<div class="row editPost"><i title="Edit category" class="fas fa-pen" id="' + id + 'button"></i><div class="post" id="' + id + '" data-link="' + permalink + '">' + title + '</div></div>';
      }
    }

    //adds onclick listeners to posts
    for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
      if (categorizedPosts[i].category == category) {
        document.getElementById(categorizedPosts[i].id).addEventListener("click", function() {
          var href = "http://reddit.com" + this.dataset.link;
          chrome.tabs.create({active: true, url: href});
        });
      }
    }

    //adds onclick listeners to editpost-buttons
    for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
      if (categorizedPosts[i].category == category) {
        document.getElementById(categorizedPosts[i].id + "button").addEventListener("click", function() {
          editPostCategory(this.id.replace("button", ""));
        });

      }
    }

  }

  d = new Date(localStorage.getItem('lastUpdated'));
  var minutes = d.getMinutes();
  var hours = d.getHours();
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (hours < 10) {
    hours = "0" + hours;
  }
  document.getElementById('lastUpdated').innerHTML = d.getDate() + "/" + (d.getMonth() + 1) + " - " + hours + ":" + minutes;

}




function deleteCategory(category) {
  //deletes category from categories array
  for (var i = 0; i < categories.length; i++) {
    if (categories[i] == category) {
      categories.splice(i, 1);
    }
  }

  //moves all posts from the deleted category to "Uncategorized"
  for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
    if (categorizedPosts[i].category == category) {
      categorizedPosts[i].category = "Uncategorized";
    }
  }

  initView();
}

function editPostCategory(id) {
  var foldersMovePostMenu = document.getElementById('foldersMovePostMenu');

  foldersMovePostMenu.innerHTML = "";

  for (var i = 0; i < categories.length; i++) {
    var s = categories[i];
    foldersMovePostMenu.innerHTML = foldersMovePostMenu.innerHTML + '<div class="folder" id="' + s + 'move">' + s + '</div>';
  }

  for (var i = 0; i < categories.length; i++) {
    var s = categories[i];
    document.getElementById(s + "move").addEventListener("click", function() {
      movePost(id, this.id.replace("move", ""));
    });
  }

  document.getElementById('closeMovePostMenu').addEventListener("click", function() {
    document.getElementById('movePostMenu').style.opacity = 0;
    document.getElementById('movePostMenu').style.visibility = "hidden";
  });

  document.getElementById('movePostMenu').style.visibility = "visible";
  document.getElementById('movePostMenu').style.opacity = 1;

}

function movePost(id, category) {
  for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
    if (categorizedPosts[i].id == id) {
      categorizedPosts[i].category = category;
    }
  }

  updateView(lastClickedCategory);

  console.log("before:");
  console.log(JSON.parse(localStorage.getItem('categorizedPosts')));
  localStorage.setItem('categorizedPosts', JSON.stringify(categorizedPosts));
  console.log("after:");
  console.log(JSON.parse(localStorage.getItem('categorizedPosts')));

  document.getElementById('movePostMenu').style.opacity = 0;
  document.getElementById('movePostMenu').style.visibility = "hidden";

}

function addFolder() {
  if (!inputVisible) {
    input.style.opacity = 1;
    input.style.width = "260px";
    setTimeout(function () {
      input.focus();
      inputVisible = true;
    }, 500);
  } else {
    if (input.value.length == 0) {
      return;
    }
    categories.push(input.value);
    chrome.storage.local.set({categories: categories}, function() {
            console.log('categories is set to ' + categories);
          });
    initView();
    input.style.width = "0px";
    setTimeout(function () {
      input.style.opacity = 0;
      input.value = "";
      inputVisible = false;
    }, 500);
  }
}

input = document.getElementById('input');

$("input").focusout(function(){
  if (inputVisible) {
    input.style.width = "0px";
    setTimeout(function () {
      input.style.opacity = 0;
      inputVisible = false;
    }, 500);
  }
});

input.addEventListener("keyup",  function(event) {
  // Number 13 is the "Enter" key on the keyboard
  if (event.keyCode === 13) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    document.getElementById("addFolder").click();
  }
});

function openSettings() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
}

function openErrorMenu() {
  document.getElementById('errorMenu').style.visibility = "visible";
  document.getElementById('errorMenu').style.opacity = 1;
}
