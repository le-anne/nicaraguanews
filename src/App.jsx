import Title from "./components/Title";
import Body from "./components/Body";

function App() {
  return (
    <div className="site">
      <div className="site-atmosphere" aria-hidden="true" />
      <Title />
      <Body />
      <footer className="site-footer">
        <p>Aggregated English-language coverage of Nicaragua from independent and international outlets.</p>
      </footer>
    </div>
  );
}

export default App;
