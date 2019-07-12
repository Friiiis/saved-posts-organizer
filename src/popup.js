import { fetchSavedPosts } from '/fetchdata.js'

// Local storages:
// username           : the user's reddit username
// posts              : all user's saved posts
// categorizedPosts   : all user's saved posts categorized by themselves
// categories         : the user's custom categories

var username;
var posts = {}
var categorizedPosts = {}
var categories;
var lastClickedCategory = "All posts";

var inputVisible = false;
var isFetching = false;

document.getElementById("sync").addEventListener("click", getSavedPostsFromFeed);
document.getElementById("tryAgain").addEventListener("click", getSavedPostsFromFeed);
document.getElementById("addFolder").addEventListener("click", addFolder);

var input = document.getElementById('input');

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



// fetches the user's api key and username. The api key will be used
// to fetch the user's saved posts JSON feed. See fetchdata.js for
// the code that handles fetching.
function getSavedPostsFromFeed() {
  isFetching = true;
  document.getElementById('sync').classList.add("spin");
  closeErrorMenu();
  fetchSavedPosts()
    .then((message) => {
      console.log(message);
      isFetching = false;
      updateDataFromMemory()
        .then(() => { updateView(lastClickedCategory) });
    })
    .catch((error) => {
      console.log(error);
      openErrorMenu(error);
      isFetching = false;
    });
}

//sets up the view with categories buttons and default post category (all)
//should only be called at the start of the session or when adding/deleting a category
function initView(category) {
  if (Object.keys(categorizedPosts).length == 0) {
    return;
  }

  document.getElementById('username').innerHTML = username;

  var folders = document.getElementById('folders');

  folders.innerHTML = '<div class="folder" id="all">All posts</div>';

  for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
    if (!categories.includes(categorizedPosts[i].category)) {
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

  // updateView(lastClickedCategory);

  updateDataFromMemory()
    .then(() => updateView(category));

}

function updateDataFromMemory() {
  return new Promise(function (resolve, reject){
    username = localStorage.getItem('username');

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

    resolve();
  });
}

function updateView(category) {
  // console.log(category);
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

  var postContainer = document.getElementById('postContainer');
  postContainer.innerHTML = "";

  // console.log(categorizedPosts);

  //adds posts to DOM
  for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
    if (category == "All posts" || category == categorizedPosts[i].category) {
      if (categorizedPosts[i].title == undefined) {
        continue;
      }
      var title = categorizedPosts[i].title.replace(/"/g, "'");
      var id = categorizedPosts[i].id;
      var permalink = categorizedPosts[i].permalink;
      var type;
      // legacy code: the type text (if a link is a comment or a post) was stored
      // in "type" variable until 1.1.3. It is now stored in "typeText" variable
      if (categorizedPosts[i].typeText != undefined) {
        type = categorizedPosts[i].typeText;
      } else {
        type = categorizedPosts[i].type;
      }
      postContainer.innerHTML = postContainer.innerHTML + '<div class="row editPost"><i title="Move post" class="fas fa-folder-open" id="' + id + 'button"></i><div class="post" id="' + id + '" data-link="' + permalink + '">' + title + type + '</div></div>';
    }
  }

  //adds onclick listeners to posts
  for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
    if (category == "All posts" || category == categorizedPosts[i].category) {
      document.getElementById(categorizedPosts[i].id).addEventListener("click", function() {
        var href = this.dataset.link;
        chrome.tabs.create({active: true, url: href});
      });
    }
  }

  //adds onclick listeners to editpost-buttons
  for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
    if (category == "All posts" || category == categorizedPosts[i].category) {
      document.getElementById(categorizedPosts[i].id + "button").addEventListener("click", function() {
        editPostCategory(this.id.replace("button", ""));
      });
    }
  }


  var d = new Date(localStorage.getItem('lastUpdated' + username));
  var minutes = d.getMinutes();
  var hours = d.getHours();
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (hours < 10) {
    hours = "0" + hours;
  }
  document.getElementById('lastUpdated').innerHTML = d.getDate() + "/" + (d.getMonth() + 1) + " - " + hours + ":" + minutes;

  if (!isFetching) {
    document.getElementById('sync').classList.remove("spin");
  }

}


function deleteCategory(category) {
  document.getElementById('deletedCategory').innerHTML = category;
  document.getElementById('confirmDeletion').style.visibility = "visible";
  document.getElementById('confirmDeletion').style.opacity = 1;
  document.getElementById("deny").addEventListener("click", function() {
    document.getElementById('confirmDeletion').style.visibility = "hidden";
    document.getElementById('confirmDeletion').style.opacity = 0;
  });
  document.getElementById("confirm").addEventListener("click", function() {
    document.getElementById('confirmDeletion').style.visibility = "hidden";
    document.getElementById('confirmDeletion').style.opacity = 0;
    deletionConfirmed(category);
  });

}

function deletionConfirmed(category) {
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

  localStorage.setItem('categories' + username, JSON.stringify(categories));

  initView("All posts");
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

  // console.log("before:");
  // console.log(JSON.parse(localStorage.getItem('categorizedPosts' + username)));
  localStorage.setItem('categorizedPosts' + username, JSON.stringify(categorizedPosts));
  // console.log("after:");
  // console.log(JSON.parse(localStorage.getItem('categorizedPosts' + username)));

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
    if (!categories.includes(input.value)) {
      categories.push(input.value);
      localStorage.setItem('categories' + username, JSON.stringify(categories));
      // console.log(JSON.parse(localStorage.getItem('categories' + username)));
    }
    initView(lastClickedCategory);
    input.style.width = "0px";
    setTimeout(function () {
      input.style.opacity = 0;
      input.value = "";
      inputVisible = false;
    }, 500);
  }
}

function openErrorMenu(message) {
  document.getElementById('errorMessage').innerHTML = message;
  document.getElementById('errorMenu').style.visibility = "visible";
  document.getElementById('errorMenu').style.opacity = 1;
}

function closeErrorMenu() {
  document.getElementById('errorMenu').style.opacity = 0;
  document.getElementById('errorMenu').style.visibility = "hidden";
}

updateDataFromMemory()
  .then(() => { initView("All posts"); });

getSavedPostsFromFeed();
