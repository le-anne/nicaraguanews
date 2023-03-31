const options = {
  method: "GET",
  headers: {
    "X-RapidAPI-Host": "nicaragua-news-en-english.p.rapidapi.com",
    "X-RapidAPI-Key": "ba24453ed6mshf63b94eccba3171p1c4965jsnf3c1b12fbe39",
  },
};
/* 
fetch("https://nicaragua-news-en-english.p.rapidapi.com/news", options)
  .then((response) => response.json())
  .then((response) => console.log(response))
  .catch((err) => console.error(err));
*/

export async function getArticles() {
  try {
    const result = await fetch(
      "https://nicaragua-news-en-english.p.rapidapi.com/news",
      options
    );
    const json = await result.json();
    return json;
  } catch (error) {
    console.error(error);
  }
}
