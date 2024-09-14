import { useState, useEffect, useRef } from "react";
import OutputEntry from "./outputEntry";
import "../resources/style/outputs.css";
export default function Outputs({
  commandHistory,
  setCommandHistory,
  showFileSwitcher,
  showHistory,
  caseNumber,
  serialNumber,
  fileName,
  showCaseSearch,
  showUpload,
}) {
  const scrollToBottomRef = useRef(null);
  const [outputWrapperStyle, setOutputWrapperStyle] = useState({});
  useEffect(() => {
    if (scrollToBottomRef.current) {
      scrollToBottomRef.current.scrollIntoView();
    }

    const outputs = document.querySelectorAll(".outputBlock");
    outputs.forEach((output) => {
      output.classList.add("outputVisible");
    });
  }, [commandHistory]);
  useEffect(() => {
    if (showHistory || showFileSwitcher) {
      setOutputWrapperStyle({ left: "23%", width: "77%" });
    } else {
      setOutputWrapperStyle({ left: "0%", width: "100%" });
    }
  }, [showHistory, showFileSwitcher]);

  if (!showCaseSearch && !showUpload) {
    return (
      <>
        <div id="logs" style={outputWrapperStyle}>
          {Object.keys(commandHistory).map((id) => {
            return (
              <div key={id}>
                <OutputEntry
                  setCommandHistory={setCommandHistory}
                  data={commandHistory[id]}
                  caseNumber={caseNumber}
                  serialNumber={serialNumber}
                  fileName={fileName}
                />
                <div ref={scrollToBottomRef}></div>
              </div>
            );
          })}
        </div>
      </>
    );
  }
}
