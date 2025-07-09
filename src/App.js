import Navbar from "./components/navbar/Navbar";
import Profile from "./components/profile/Profile";
import About from "./components/about/About";
import Experience from "./components/experience/Experience";
import MyWork from "./components/mywork/MyWork";
import Contact from "./components/contact/Contact";

function App() {
  return (
    <div className="container">
      <Navbar />
      <Profile />
      <About />
      <Experience />
      {/* <MyWork /> */}
      <Contact />
    </div>
  );
}

export default App;
