import "../resources/style/glance.css";
import { AiOutlinePushpin } from "react-icons/ai";
import { useState, useEffect } from "react";
export default function Glance({
  glance,
  filename,
  showFilesList,
  expandFileSwitcher,
  setExpandFileSwitcher,
}) {
  const [showGlance, setShowGlance] = useState(false);
  const [style, setStyle] = useState({});
  const boxShadow = {
    boxShadow: `rgba(0, 0, 0, 0.25) 0px 54px 55px,
    rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px,
    rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px`,
  };
  const [pinStyle, setPinStyle] = useState({});
  const glanceValues = {
    file: `${filename ? filename : "n/a"}`,
    "S/N": `${glance.serialNumber}`,
    host: `${glance.hostname}`,
    clock: `${glance.timeStamp}`,
  };
  const showGlanceList = (value) => {
    if (!showFilesList) {
      setShowGlance(value);
      setExpandFileSwitcher(false);
    }
  };
  useEffect(() => {
    if (expandFileSwitcher) {
      setStyle({ left: "-23.3%" });
      setPinStyle({ rotate: "0deg" });
      setShowGlance(false);
    } else if (!showFilesList) {
      if (showGlance) {
        setStyle({ left: "-0.3%", opacity: "1" });
        setPinStyle({ rotate: "-45deg" });
      } else {
        setStyle({ left: "-23.3%" });
        setPinStyle({ rotate: "0deg" });
      }
    } else {
      setStyle({ left: "-23.3%" });
    }
  }, [showGlance, showFilesList, expandFileSwitcher]);

  return (
    <>
      <div className="glanceWrapperHover" style={style}>
        <div
          className="glanceWrapper"
          style={expandFileSwitcher ? boxShadow : {}}
        >
          <div className="glanceLineItemWrapper">
            {Object.keys(glanceValues).map((key) => {
              return (
                <div key={key} className="glanceLineSection">
                  <p className="glanceLineTitles">{key}</p>
                  <p className="glanceLineItem">{glanceValues[key]}</p>
                </div>
              );
            })}

            <a
              className="links"
              href="https://pb.infra.corp.arista.io/"
              target="_blank"
            >
              [pastebin]
            </a>
          </div>
          <AiOutlinePushpin
            className="pinGlanceButton"
            onClick={() => showGlanceList(!showGlance)}
            style={pinStyle}
          />
        </div>
      </div>
    </>
  );
}
