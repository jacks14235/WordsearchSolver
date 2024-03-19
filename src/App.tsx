import './App.css';
import { WordsearchSolver } from './components/read-and-solve';
import { testTST } from './logic/solver';

function App() {
  return (
    <div className="App">
      <button onClick={() => testTST()} style={{backgroundColor: 'white'}}>Test TST</button>
      <WordsearchSolver />
    </div>
  );
}

export default App;
