import Header from "./NicaraguaHeader4.png";
import Title from "./components/Title";
import Body from "./components/Body";

function App() {
  return (
    <div className="App">
      <img src={Header} className="nicaHeader" alt="Nicaragua News" />
      <Title />
      <Body />
    </div>
  );
}

export default App;
