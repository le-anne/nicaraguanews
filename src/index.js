import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "./App.css";
import Title from "./components/Title";
import Body from "./components/Body";


ReactDOM.render(
  <React.StrictMode>
    <Title />
    <Body />
  </React.StrictMode>,
  document.getElementById("root")
);
