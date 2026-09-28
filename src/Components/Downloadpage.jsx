import "../css/Downloadpage.css";
import InteraScieLogo from "../assets/InteraScie.png";
import { FaAndroid, FaWindows } from "react-icons/fa";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import DownloadGuide from "./DownloadGuide";

function Downloadpage() {
    const navigate = useNavigate();
    const [guidePlatform, setGuidePlatform] = useState(null);
    const androidGuideLinkRef = useRef(null);
    const windowsGuideLinkRef = useRef(null);

    function CloseGuide() {
        setGuidePlatform(null);
        if (guidePlatform === "android") {
            androidGuideLinkRef.current?.focus();
        } else {
            windowsGuideLinkRef.current?.focus();
        }
    }

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
                        <div className="downloadoption">
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
                            <a
                                className="downloadguide-link"
                                href="#android-download-guide"
                                ref={androidGuideLinkRef}
                                onClick={(event) => {
                                    event.preventDefault();
                                    setGuidePlatform("android");
                                }}
                            >
                                How to Download in Android?
                            </a>
                        </div>
                        <div className="downloadoption">
                            <a
                                className="downloadbutton"
                                href="https://github.com/YandereShi/InteraScieDownloads/releases/download/1.0.0/InteraScie.zip"
                                download="InteraScie.zip"
                                title="Download InteraScie for Windows"
                            >
                                <FaWindows className="downloadbuttonicon" />
                                <span className="downloadbuttonlabel">
                                    <span>Download For</span>
                                    <span>WINDOWS</span>
                                </span>
                            </a>
                            <a
                                className="downloadguide-link"
                                href="#windows-download-guide"
                                ref={windowsGuideLinkRef}
                                onClick={(event) => {
                                    event.preventDefault();
                                    setGuidePlatform("windows");
                                }}
                            >
                                How to Download in Windows?
                            </a>
                        </div>
                    </div>
                </div>
                <div className="downloadright"></div>
            </section>
            {guidePlatform && <DownloadGuide platform={guidePlatform} onClose={CloseGuide} />}
        </main>
    );
}

export default Downloadpage;
