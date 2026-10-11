import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Portfolio from "./pages/Portfolio";
import Services from "./pages/Services";
import About from "./pages/About";
import Editor from "./pages/Editor";

function Site() {
  return (
    <>
      <Navbar />
      <Home />
      <Portfolio />
      <Services />
      <About />
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/editor" element={<Editor />} />
      <Route path="*" element={<Site />} />
    </Routes>
  );
}

export default App;
