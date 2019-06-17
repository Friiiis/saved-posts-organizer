var username = document.getElementById("username");
var password = document.getElementById("password");
var clientID = document.getElementById("clientID");
var clientSecret = document.getElementById("clientSecret");
var saveButton = document.getElementById("saveButton");

document.getElementById("githubLink").href = "https://github.com/Friiiis/saved-posts-organizer";

username.value = localStorage.getItem('username');
password.value = localStorage.getItem('password');
clientID.value = localStorage.getItem('clientID');
clientSecret.value = localStorage.getItem('clientSecret');

username.addEventListener('input', inputchecker);
password.addEventListener('input', inputchecker);
clientID.addEventListener('input', inputchecker);
clientSecret.addEventListener('input', inputchecker);

document.getElementById("saveButton").addEventListener("click", save);

function save() {
  localStorage.setItem('username', username.value);
  localStorage.setItem('password', password.value);
  localStorage.setItem('clientID', clientID.value);
  localStorage.setItem('clientSecret', clientSecret.value);
  window.close();
}

function inputchecker() {
  if (username.value.length > 0 &&
      password.value.length > 0 &&
      clientID.value.length > 0 &&
      clientSecret.value.length > 0
      ) {
    saveButton.disabled = false;
  } else {
    saveButton.disabled = true;
  }
}

inputchecker();
