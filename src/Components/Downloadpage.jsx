import "../css/Downloadpage.css";
import InteraScieLogo from "../assets/InteraScie.png";
import { FaAndroid, FaWindows } from "react-icons/fa";
import { useNavigate } from "react-router";

function Downloadpage() {
    const navigate = useNavigate();

    return (
        <main className="downloadbackground">
            <section className="downloadpanel">
                <button 
                        className="backtologin"
                        onClick={() => navigate("/")}
                     >
                        <span className="backarrow">←</span> Back
                </button>
                <div className="downloadleft">
                    <h1 className="downloadheading">
                        About
                        <img className="downloadlogo" src={InteraScieLogo} alt="InteraScie" />
                    </h1>
                    <h2 className="downloadtitle">
                        Play, Explore, and
                        <br />
                        Master Science.
                    </h2>
                    <div className="downloaddescription">
                        <p>
                            InteraScie is an interactive 3D science learning platform designed to
                            enhance the understanding of Grade 7 students through immersive and
                            engaging gameplay. By integrating educational content with game-based
                            mechanics, the system transforms traditional science lessons into
                            meaningful and interactive learning experiences.
                        </p>
                        <p>
                            The platform allows students to explore scientific concepts within a
                            virtual environment, encouraging active participation and deeper
                            comprehension.
                        </p>
                    </div>
                    <div className="downloadbuttons">
                        <a
                            className="downloadbutton"
                            href="https://github.com/YandereShi/InteraScieDownloads/releases/download/1.0.0/Game.apk"
                            download="Game.apk"
                            title="Download InteraScie for Android"
                        >
                            <FaAndroid className="downloadbuttonicon" />
                            <span className="downloadbuttonlabel">
                                <span>Download For</span>
                                <span>ANDROID</span>
                            </span>
                        </a>
                        <button
                            className="downloadbutton"
                            type="button"
                            title="Windows download is not available yet"
                            disabled
                        >
                            <FaWindows className="downloadbuttonicon" />
                            <span className="downloadbuttonlabel">
                                <span>Download For</span>
                                <span>WINDOWS</span>
                            </span>
                        </button>
                    </div>
                </div>
                <div className="downloadright"></div>
            </section>
        </main>
    );
}

export default Downloadpage;
