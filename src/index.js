import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "./App.css";
import Header from "./NicaraguaHeader4.png";
import Title from "./components/Title";
import Body from "./components/Body";

ReactDOM.render(
  <React.StrictMode>
    <img src={Header} className="nicaHeader" alt="Nicarauga News" />
    <Title />
    <Body />
  </React.StrictMode>,
  document.getElementById("root")
);
