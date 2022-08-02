import React from 'react';
import logo from './logo.svg';
import './App.css';
import { WordsearchSolver } from './components/read-and-solve';
import { Sparkles } from './components/sparkles';

function App() {
  return (
    <div className="App">
      {/* <div className='w-96 h-96'>
        <Sparkles />
      </div> */}
      <WordsearchSolver />
    </div>
  );
}

export default App;
