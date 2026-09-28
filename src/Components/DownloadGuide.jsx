import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import And1 from "../assets/tutorial/and1.jpg";
import And2 from "../assets/tutorial/and2.jpg";
import And3 from "../assets/tutorial/and3.jpg";
import And4 from "../assets/tutorial/and4.jpg";
import Pc1 from "../assets/tutorial/pc1.png";
import Pc2 from "../assets/tutorial/pc2.png";
import Pc3 from "../assets/tutorial/pc3.png";
import Pc4 from "../assets/tutorial/pc4.png";
import Pc5 from "../assets/tutorial/pc5.png";
import Pc6 from "../assets/tutorial/pc6.png";
import Pc7 from "../assets/tutorial/pc7.png";

const guides = {
    android: {
        title: "How to Download on Android",
        steps: [
            { content: <>Click the <strong>Download For Android</strong> button.</> },
            { image: And1, alt: "Android download button highlighted on the download page" },
            { content: <>Wait for the file to download, then tap it when it finishes.</> },
            { image: And2, alt: "Android browser showing that the APK is downloading" },
            { image: And3, alt: "Android notification showing that Game.apk finished downloading" },
            { content: <>When the installation message appears, tap <strong>Install</strong>.</> },
            { image: And4, alt: "Android installation prompt with the Install button highlighted" },
            { content: <>After installation finishes, you can find InteraScie in your apps.</> },
        ],
    },
    windows: {
        title: "How to Download on Windows",
        steps: [
            { content: <>Click the <strong>Download For Windows</strong> button.</> },
            { image: Pc1, alt: "Windows download button highlighted on the download page" },
            { content: <>Choose where to save the ZIP file, then click <strong>Save</strong>.</> },
            { image: Pc2, alt: "Windows save dialog with the Save button highlighted" },
            { image: Pc3, alt: "Browser download history showing InteraScie.zip is done" },
            { content: <>After downloading, find the ZIP file, <strong>right-click</strong> it, and choose <strong>Extract All</strong>.</> },
            { image: Pc4, alt: "Windows ZIP file menu with Extract All highlighted" },
            { content: <>When the extraction window opens, click <strong>Extract</strong>.</> },
            { image: Pc5, alt: "Windows extraction window with the Extract button highlighted" },
            { content: <>After extracting, <strong>double-click</strong> the new folder.</> },
            { image: Pc6, alt: "New InteraScie folder shown in File Explorer" },
            { content: <>Inside the folder, <strong>right-click</strong> the <strong>InteraScie</strong> application, choose <strong>Send to</strong>, then <strong>click</strong> <strong>Desktop (create shortcut)</strong>.</> },
            { image: Pc7, alt: "InteraScie application menu showing Send to Desktop create shortcut" },
            { content: <>You can now find and play InteraScie from your desktop shortcut.</> },
        ],
    },
};

function DownloadGuide({ platform, onClose }) {
    const closeButtonRef = useRef(null);
    const guide = guides[platform];

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeButtonRef.current?.focus();

        function HandleKeyDown(event) {
            if (event.key === "Escape") {
                onClose();
            }

            if (event.key === "Tab") {
                event.preventDefault();
                closeButtonRef.current?.focus();
            }
        }

        document.addEventListener("keydown", HandleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", HandleKeyDown);
        };
    }, [onClose]);

    return createPortal(
        <div className="downloadguide-overlay" onClick={onClose}>
            <section
                className="downloadguide-popup"
                id={`${platform}-download-guide`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="downloadguide-title"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="downloadguide-header">
                    <h2 id="downloadguide-title">{guide.title}</h2>
                    <button
                        className="downloadguide-close"
                        type="button"
                        onClick={onClose}
                        ref={closeButtonRef}
                        aria-label={`Close ${platform} download guide`}
                    >
                        &times;
                    </button>
                </header>
                <div className="downloadguide-content">
                    <ol className="downloadguide-steps">
                        {guide.steps.map((step, index) => (
                            <li key={index} className={step.image ? "downloadguide-image-step" : undefined}>
                                {step.image
                                    ? <img src={step.image} alt={step.alt} loading="lazy" />
                                    : step.content}
                            </li>
                        ))}
                    </ol>
                </div>
            </section>
        </div>,
        document.body
    );
}

export default DownloadGuide;
