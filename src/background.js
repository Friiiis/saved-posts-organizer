import { fetchSavedPosts } from '/fetchdata.js'

fetchSavedPosts()
  .then((message) => {
    console.log(message);
  })
  .catch((error) => {
    console.log(error);
  });
