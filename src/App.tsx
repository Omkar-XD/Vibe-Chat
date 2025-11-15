
import { BrowserRouter, Route, Routes } from "react-router-dom"
import "./App.css"
import Landing from "./components/Landing"
import Home from "./components/Home"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/landing" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
