import { useState } from "react";
import { Link } from "react-router";
import { FaArrowRight, FaChartBar, FaClipboardList, FaGamepad } from "react-icons/fa";
import TeacherPolicyPopup from "./Teacher/TeacherPolicyPopup";
import logo from "../assets/InteraScie.png";
import gameLogo from "../assets/interalogo.png";
import aboutImage from "../assets/gamescreen.png";
import chemistryImage from "../assets/Chem.png";
import biologyImage from "../assets/bio.png";
import physicsImage from "../assets/phys.png";
import earthImage from "../assets/earth.png";
import gameOne from "../assets/Game1.png";
import gameTwo from "../assets/Game2.png";
import gameThree from "../assets/Game3.png";
import "../css/LandingPage.css";

const branches = [
  { name: "Chemistry", description: "Matter and its changes", image: chemistryImage },
  { name: "Biology", description: "Life and living systems", image: biologyImage },
  { name: "Physics", description: "Motion, forces, and energy", image: physicsImage },
  { name: "Earth Science", description: "Our planet and its processes", image: earthImage },
];

const features = [
  { title: "Interactive Levels", description: "Explore science concepts through engaging game activities.", Icon: FaGamepad },
  { title: "Lesson Assessments", description: "Check understanding with assessments after each lesson.", Icon: FaClipboardList },
  { title: "Progress Monitoring", description: "Help teachers follow student progress and assessment results.", Icon: FaChartBar },
];

function ScrollToSection(event) {
  event.preventDefault();
  const section = document.getElementById(event.currentTarget.hash.slice(1));
  section?.scrollIntoView();
  section?.focus({ preventScroll: true });
}

function LandingPage() {
  const [policy, SetPolicy] = useState(null);

  return (
    <div className="landingpage" id="landing-top">
      <a className="landingskip" href="#landing-content" onClick={ScrollToSection}>Skip to content</a>
      <header className="landingheader">
        <div className="landingwrap landingnav">
          <a className="landingbrand" href="#landing-top" aria-label="InteraScie home" onClick={ScrollToSection}>
            <img src={logo} alt="InteraScie" width="1896" height="221" />
          </a>
          <nav className="landingnavlinks" aria-label="Main navigation">
            <a href="#landing-about" onClick={ScrollToSection}>About</a>
            <a href="#landing-branches" onClick={ScrollToSection}>Science Branches</a>
            <a href="#landing-features" onClick={ScrollToSection}>Features</a>
          </nav>
          <Link className="landingbutton landinglogin" to="/login">Log In</Link>
        </div>
      </header>

      <main id="landing-content" tabIndex={-1}>
        <section className="landingwrap landinghero" aria-labelledby="landing-title">
          <div className="landingherocopy">
            <p className="landingeyebrow">Learn · Play · Discover</p>
            <h1 id="landing-title">Explore Science <span>Through Play</span></h1>
            <p className="landingintro">Discover science through interactive lessons, challenges, and assessments.</p>
            <Link className="landingbutton" to="/login">Get Started <FaArrowRight aria-hidden="true" /></Link>
          </div>
          <figure className="landingheroimage">
            <img src={gameLogo} alt="InteraScie science game logo" width="1080" height="1080" fetchPriority="high" />
            <figcaption>A world of science waiting to be explored.</figcaption>
          </figure>
        </section>

        <section className="landingsection landingabout" id="landing-about" aria-labelledby="landing-about-title">
          <div className="landingwrap landingaboutgrid">
            <img className="landingaboutimage" src={aboutImage} alt="InteraScie game home screen" width="1102" height="621" loading="lazy" decoding="async" />
            <div>
              <p className="landingeyebrow">About InteraScie</p>
              <h2 id="landing-about-title">Make science an adventure</h2>
              <p className="landingdescription">InteraScie brings Grade 7 science learning into an interactive game. Students explore lessons and test their understanding while teachers monitor progress and assessment results.</p>
            </div>
          </div>
        </section>

        <section className="landingsection landingbranches" id="landing-branches" aria-labelledby="landing-branches-title">
          <div className="landingwrap">
            <div className="landingsectionheading">
              <p className="landingeyebrow">Explore the sciences</p>
              <h2 id="landing-branches-title">Four branches. A world to discover.</h2>
              <p>Explore the concepts behind the world around you.</p>
            </div>
            <div className="landingbranchgrid">
              {branches.map((branch) => (
                <article className="landingbranchcard" key={branch.name}>
                  <img src={branch.image} alt={`${branch.name} in InteraScie`} width="1100" height="617" loading="lazy" decoding="async" />
                  <div className="landingbranchcopy">
                    <h3>{branch.name}</h3>
                    <p>{branch.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landingsection landingfeatures" id="landing-features" aria-labelledby="landing-features-title">
          <div className="landingwrap">
            <div className="landingsectionheading">
              <p className="landingeyebrow">For students and teachers</p>
              <h2 id="landing-features-title">Built for learning and teaching</h2>
            </div>
            <div className="landingfeaturegrid">
              {features.map(({ title, description, Icon }) => (
                <article className="landingfeaturecard" key={title}>
                  <Icon aria-hidden="true" />
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landingsection landinggameplay" aria-labelledby="landing-gameplay-title">
          <div className="landingwrap">
            <p className="landingeyebrow">Take a look</p>
            <h2 id="landing-gameplay-title">Inside the game</h2>
            <div className="landinggamegrid">
              {[gameOne, gameTwo, gameThree].map((image, index) => (
                <img key={image} src={image} alt={`InteraScie gameplay preview ${index + 1}`} width="1100" height="617" loading="lazy" decoding="async" />
              ))}
            </div>
            <div className="landingcta">
              <div>
                <h2>Ready to explore InteraScie?</h2>
                <p>Continue to access your account or find the game downloads.</p>
              </div>
              <Link className="landingbutton landingbuttonwhite" to="/login">Get Started <FaArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landingfooter">
        <div className="landingwrap landingfooterinner">
          <div className="landingfooterbrand">
            <a className="landingbrand" href="#landing-top" aria-label="Back to top" onClick={ScrollToSection}>
              <img src={logo} alt="InteraScie" width="1896" height="221" loading="lazy" />
            </a>
            <p>Science learning through play.</p>
          </div>
          <div className="landingfooterlinks">
            <button type="button" aria-haspopup="dialog" onClick={() => SetPolicy("privacy")}>Privacy Policy</button>
            <button type="button" aria-haspopup="dialog" onClick={() => SetPolicy("terms")}>Terms and Conditions</button>
          </div>
        </div>
      </footer>
      {policy && <TeacherPolicyPopup policy={policy} onClose={() => SetPolicy(null)} />}
    </div>
  );
}

export default LandingPage;
