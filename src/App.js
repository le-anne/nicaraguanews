// https://nicaraguanews.herokuapp.com/

fetch("https://nicaragua-news-en-english.p.rapidapi.com/news", {
  method: "GET",
  headers: {
    "x-rapidapi-host": "nicaragua-news-en-english.p.rapidapi.com",
    "x-rapidapi-key": "ba24453ed6mshf63b94eccba3171p1c4965jsnf3c1b12fbe39",
  },
})
  .then((response) => response.json())
  .then((response) => {
    console.log(response);
  })
  .catch((err) => {
    console.error(err);
  });
