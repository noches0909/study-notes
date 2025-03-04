import logo from "./logo.svg"
import "./App.css"
import classes from "./App.module.css"
import HelloWorld from "./compoents/HelloWorld"
import Demo from "./compoents/Demo"

function App() {
  return (
    <div className="App">
      <header>
        <HelloWorld></HelloWorld>
        <Demo></Demo>
      </header>
    </div>
  )
}

export default App
