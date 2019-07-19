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
var currentPage = 0;

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
  if (event.keyCode === 13) {
    event.preventDefault();
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
      var usernameBefore = username;
      updateDataFromMemory()
        .then(() => {
          // checks if the user has changed. If it has, then initView is called
          // if it hasn't when updateView is called
          var usernameAfter = username;
          if (usernameBefore == usernameAfter) {
            updateView(lastClickedCategory);
          } else {
            initView(lastClickedCategory);
          }
        });
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

  console.log(categorizedPosts);

  var cleanUsername = DOMPurify.sanitize(username);
  $("#username").append(cleanUsername);

  var folders = $("#folders");
  folders.empty();

  var allPostsFolder = $("<div>");
  allPostsFolder.addClass("folder");
  allPostsFolder.attr("id","all");
  allPostsFolder.text("All posts");

  folders.append(allPostsFolder);

  for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
    if (categorizedPosts[i] == undefined) {
      continue;
    }
    if (!categories.includes(categorizedPosts[i].category)) {
      categorizedPosts[i].category = "Uncategorized";
    }
  }

  for (var i = 0; i < categories.length; i++) {
    var s = categories[i];

    var categoryFolder = $("<div>");
    categoryFolder.addClass("folder");
    categoryFolder.attr("id",s);
    categoryFolder.text(s);

    folders.append(categoryFolder);

    document.getElementById(s).addEventListener("click", function() {
      currentPage = 0;
      updateView(this.id);
    });
  }

  document.getElementById("all").addEventListener("click", function() {
    currentPage = 0;
    updateView("All posts");
  });

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

  $("#username").empty();
  $("#categoryTitle").empty();

  var cleanUsername = DOMPurify.sanitize(username);
  var cleanCategory = DOMPurify.sanitize(category);

  $("#username").append(cleanUsername);
  $("#categoryTitle").append(cleanCategory);

  var deleteCategoryButton = document.getElementById('deleteCategory');
  if (category == "All posts" || category == "Uncategorized") {
    deleteCategoryButton.style.opacity = 0;
    deleteCategoryButton.style.visibility = "hidden";
  } else {
    deleteCategoryButton.style.opacity = 1;
    deleteCategoryButton.style.visibility = "visible";
    deleteCategoryButton.onclick = function() {
      deleteCategory(category);
    }
  }

  var numberOfPages = getNumberOfPages(category);

  // adds pagination buttons
  var prevPageButton = document.getElementById('prevPage');
  var nextPageButton = document.getElementById('nextPage');
  if (numberOfPages == 1) {
    prevPageButton.style.opacity = 0;
    nextPageButton.style.opacity = 0;
    prevPageButton.style.visibility = "hidden";
    nextPageButton.style.visibility = "hidden";
  } else {
    if (currentPage == 0) {
      prevPageButton.style.opacity = 0;
      nextPageButton.style.opacity = 1;
      prevPageButton.style.visibility = "hidden";
      nextPageButton.style.visibility = "visible";
    } else if (currentPage == numberOfPages - 1) {
      prevPageButton.style.opacity = 1;
      nextPageButton.style.opacity = 0;
      prevPageButton.style.visibility = "visible";
      nextPageButton.style.visibility = "hidden";
    } else if (currentPage == numberOfPages) {
      prevPageButton.style.opacity = 1;
      nextPageButton.style.opacity = 0;
      prevPageButton.style.visibility = "visible";
      nextPageButton.style.visibility = "hidden";
    } else {
      prevPageButton.style.opacity = 1;
      nextPageButton.style.opacity = 1;
      prevPageButton.style.visibility = "visible";
      nextPageButton.style.visibility = "visible";
    }
  }

  prevPageButton.onclick = function() {
    previousPage();
  }
  nextPageButton.onclick = function() {
    nextPage(numberOfPages);
  }


  var postContainer = $("#postContainer");
  postContainer.empty();

  // console.log(categorizedPosts);

  var counter = 0;
  //adds posts to DOM
  for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
    if (categorizedPosts[i] == undefined || categorizedPosts[i].title == undefined) {
      continue;
    }
    if (category == "All posts" || category == categorizedPosts[i].category) {
      if (currentPage * 50 <= counter && counter < (currentPage * 50) + 50) {
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

        var row = $("<div>");
        row.addClass("row");
        row.addClass("editPost");

        var icon = $("<i>");
        icon.addClass("fas");
        icon.addClass("fa-folder-open");
        icon.attr("id", id + "button");

        var post = $("<div>");
        post.addClass("post");
        post.attr("id", id);
        post.attr("data-link", permalink);
        post.text(title + type);

        row.append(icon);
        row.append(post);

        postContainer.append(row);

        //adds onclick listeners to post
        document.getElementById(categorizedPosts[i].id).addEventListener("click", function() {
          var href = this.dataset.link;
          chrome.tabs.create({active: true, url: href});
        });

        //adds onclick listeners to editpost-button
        document.getElementById(categorizedPosts[i].id + "button").addEventListener("click", function() {
          editPostCategory(this.id.replace("button", ""));
        });
      }

      counter++;

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

  var lastUpdated = $("#lastUpdated");
  lastUpdated.empty();
  lastUpdated.text(d.getDate() + "/" + (d.getMonth() + 1) + " - " + hours + ":" + minutes);

  if (!isFetching) {
    document.getElementById('sync').classList.remove("spin");
  }

}

// returns the number of pages that is needed for showing a given category.
// 50 posts is shown on each page.
function getNumberOfPages(category) {
  var amountOnPage = 50;

  if (category == "All posts") {
    return Math.ceil(Object.keys(categorizedPosts).length / amountOnPage);
  } else {
    var counter = 0;
    for (var i = 0; i < Object.keys(categorizedPosts).length; i++) {
      if (categorizedPosts[i] == undefined || categorizedPosts[i].title == undefined) {
        continue;
      }
      if (category == categorizedPosts[i].category) {
        counter++;
      }
    }
    return Math.ceil(counter / amountOnPage);
  }
}

function previousPage() {
  if (!(0 == currentPage)) {
    currentPage--;
    updateView(lastClickedCategory);
  }
}

function nextPage(numberOfPages) {
  if (!(numberOfPages - 1 == currentPage)) {
    if (numberOfPages - 1 > currentPage) {
      currentPage++;
      updateView(lastClickedCategory);
    }
  }
}

function deleteCategory(category) {
  var deletedCategory = $("#deletedCategory");
  deletedCategory.empty();
  deletedCategory.text(category);
  document.getElementById('confirmDeletion').style.opacity = 1;
  document.getElementById('confirmDeletion').style.visibility = "visible";
  document.getElementById("deny").addEventListener("click", function() {
    document.getElementById('confirmDeletion').style.opacity = 0;
    document.getElementById('confirmDeletion').style.visibility = "hidden";
  });
  document.getElementById("confirm").addEventListener("click", function() {
    document.getElementById('confirmDeletion').style.opacity = 0;
    document.getElementById('confirmDeletion').style.visibility = "hidden";
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
  var foldersMovePostMenu = $("#foldersMovePostMenu");
  foldersMovePostMenu.empty();

  for (var i = 0; i < categories.length; i++) {
    var s = categories[i];
    var folder = $("<div>");
    folder.addClass("folder");
    folder.attr("id", s + "move");
    folder.text(s);
    foldersMovePostMenu.append(folder);
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

  localStorage.setItem('categorizedPosts' + username, JSON.stringify(categorizedPosts));

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
  var errorMessage = $("#errorMessage");
  errorMessage.empty();
  errorMessage.text(message);
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
