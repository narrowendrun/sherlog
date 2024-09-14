import { useEffect, useRef, useState } from "react";
import {
  AiOutlineExpand,
  AiOutlineCompress,
  AiOutlineFileAdd,
  AiOutlineDelete,
  AiOutlineCopy,
} from "react-icons/ai";

export default function OutputEntry({
  setCommandHistory,
  data,
  caseNumber,
  serialNumber,
  fileName,
}) {
  const [commentsStyle, setCommentsStyle] = useState({});
  const [outputBlockStyle, setOutputBlockStyle] = useState({});
  const [outputStyle, setOutputStyle] = useState({});
  const [buttonContainerStyle, setButtonContainerStyle] = useState({});
  const outputBlockRef = useRef(null);
  const [addState, setAddState] = useState(() => {
    if (data.note == "") {
      return false;
    } else {
      return true;
    }
  });
  const [fullscreen, setFullscreen] = useState(false);
  const [prevFullscreen, setPrevFullscreen] = useState(null);
  const [note, setNote] = useState(data.note);
  const buttonStyle = {
    color: "var(--primary-dark)",
    fontSize: "1.5em",
    cursor: "pointer",
    margin: "auto",
  };
  function eraseOutput(id) {
    console.log(caseNumber, serialNumber, fileName);
    setOutputBlockStyle({ opacity: "0", filter: "blur(25px)" });
    setCommandHistory((prevHistory) => {
      let newOutputArray = { ...prevHistory };
      delete newOutputArray[caseNumber].devices[serialNumber][fileName][id];
      return newOutputArray;
    });
  }
  const addNote = (id, value) => {
    console.log(id);

    setNote(value);
    setCommandHistory((prevHistory) => {
      let newHistory = { ...prevHistory };
      newHistory[caseNumber].devices[serialNumber][fileName][id].note = value;
      return newHistory;
    });
  };
  useEffect(() => {
    if (fullscreen && !addState) {
      setOutputStyle({ width: `95%` });
      setButtonContainerStyle({
        left: `calc(
          95% + calc((100% - 95%) / 2) - calc(var(--width) * 0.2)
        )`,
      });
      setCommentsStyle({ top: "0%", right: "2.5%" });
    } else if (!fullscreen && !addState) {
      setOutputStyle((prev) => {
        const newStyle = { ...prev };
        delete newStyle.transform;
        delete newStyle.width;
        return newStyle;
      });
      setButtonContainerStyle({
        left: `calc(
        var(--width) + calc((100% - var(--width)) / 2) - calc(var(--width) * 0.2)
      )`,
      });
      setCommentsStyle({ top: "-2.5%", right: "17.5%" });
    } else if (!fullscreen && addState) {
      setOutputStyle({ transform: "translateX(-35%)" });
      setButtonContainerStyle({
        left: `calc(
        var(--width) + calc((100% - var(--width)) / 2) - calc(var(--width) * 0.2) - calc(var(--width) * 0.35)
      )`,
      });
      setCommentsStyle({
        transform: "translateX(20%) translateY(10%)",
        opacity: "1",
      });
    } else if (fullscreen && addState) {
      if (!prevFullscreen) {
        setAddState(false);
      } else {
        setAddState(true);
      }
    }
  }, [addState, fullscreen]);
  useEffect(() => {
    setCommandHistory((prevHistory) => ({
      ...prevHistory,
      [caseNumber]: {
        ...prevHistory[caseNumber],
        devices: {
          ...prevHistory[caseNumber].devices,
          [serialNumber]: {
            ...prevHistory[caseNumber].devices[serialNumber],
            [fileName]: {
              ...prevHistory[caseNumber].devices[serialNumber][fileName],
              [data.id]: {
                ...prevHistory[caseNumber].devices[serialNumber][fileName][
                  data.id
                ],
                ref: outputBlockRef,
              },
            },
          },
        },
      },
    }));
  }, [outputBlockRef]);
  const copyOutput = () => {
    let copyText = ``;
    if (data.note !== "") {
      copyText += `\n${data.note}\n\n`;
    }
    copyText += `${data.output}`;
    if (copyText.endsWith("\n")) {
      copyText += `-_-_-_-_-_-_- this output was taken from sherlog for ' ${data.banner} '_-_-_-_-_-_-_\n\n\n`;
    } else {
      copyText += `\n-_-_-_-_-_-_- this output was taken from sherlog for ' ${data.banner} ' _-_-_-_-_-_-_\n\n\n`;
    }
    navigator.clipboard.writeText(copyText);
  };

  return (
    <>
      <div
        className="outputBlock"
        style={outputBlockStyle}
        ref={outputBlockRef}
      >
        <div className="commentContainer" style={commentsStyle}>
          <textarea
            className="form-control"
            placeholder="quick notes"
            value={note}
            onChange={(e) => addNote(data.id, e.target.value)}
          ></textarea>
        </div>
        <div className="buttonContainer" style={buttonContainerStyle}>
          {fullscreen ? (
            <AiOutlineCompress
              className="outputButtons"
              style={buttonStyle}
              onClick={() => {
                setFullscreen((prev) => {
                  setPrevFullscreen(prev);
                  return !prev;
                });
              }}
            />
          ) : (
            <AiOutlineExpand
              className="outputButtons"
              style={buttonStyle}
              onClick={() => {
                setFullscreen((prev) => {
                  setPrevFullscreen(prev);
                  return !prev;
                });
              }}
            />
          )}

          <AiOutlineFileAdd
            className="outputButtons"
            style={buttonStyle}
            onClick={() => {
              setAddState(!addState);
            }}
          />
          <AiOutlineDelete
            className="outputButtons"
            style={buttonStyle}
            onClick={() => eraseOutput(data.id)}
          />
          <AiOutlineCopy className="copyOutput" onClick={() => copyOutput()} />
        </div>
        <div className="timeContainer" style={outputStyle}>
          <p>
            {data.time} ---- {data.banner}
          </p>
        </div>
        <div className="output" style={outputStyle}>
          <p>{data.output}</p>
        </div>
      </div>
    </>
  );
}
