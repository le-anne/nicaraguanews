import React from "react";
import { getArticles } from "../API/News";

export default function Body() {
  const [data, setData] = React.useState([]);
  React.useEffect(() => {
    getArticles().then(setData);
  }, []);



  return (
    <div>
      {data.map((article) => {
        return (
          <div className="card">
            <div className="card-body">
              {"\n"}
              <a href={article.url} className="card-text">
                {" "}
                {"\n"}
                {article.title}{" "}
              </a>
              {"\n"}
              <p className="card-text">
                Source: {article.source} {"\n"}
                {"\n"}
                {"\n"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
