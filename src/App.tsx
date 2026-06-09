import { SinkOrRichGame } from './games/sink-or-rich/SinkOrRichGame';
import './App.css';

function App() {
  return (
    <div className="App" style={{ background: '#111', minHeight: '100vh', margin: 0, padding: 0 }}>
      <SinkOrRichGame />
    </div>
  );
}

export default App;
