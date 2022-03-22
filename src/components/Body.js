import React from "react";
import { getArticles } from "../API/News";

export default function Body() {
  const [data, setData] = React.useState([]);
  React.useEffect(() => {
    getArticles().then(setData);
  });

  return (
    <div>
      {data.map((article) => {
        return (
          <div>
            <a href={article.url}> {article.title} </a>
            {"\n"}
            Source: {article.source} {"\n"}
            {"\n"}
            {"\n"}
          </div>
        );
      })}
    </div>
  );
}
