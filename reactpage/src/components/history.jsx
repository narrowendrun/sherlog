import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "../resources/style/history.css";
import {
  AiOutlinePushpin,
  AiFillFolderOpen,
  AiOutlineCopy,
  AiOutlineShareAlt,
} from "react-icons/ai";
import HistoryLineItem from "./historyLineItem";

export default function History({
  commandHistory,
  setCommandHistory,
  showFilesList,
  caseNumber,
  serialNumber,
  fileName,
  showHistory,
  setShowHistory,
  setShowFileSwitcher,
  setCommandLoading,
  showCaseSearch,
  setShowCaseSearch,
}) {
  const historyRef = useRef(null);
  const searchRef = useRef(null);
  const [style, setStyle] = useState({});
  const [pinStyle, setPinStyle] = useState({});
  const [searchValue, setSearchValue] = useState("");
  const [showSelectItems, setShowSelectItems] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [historyToDisplay, setHistoryToDisplay] = useState(commandHistory);

  function eraseOutput(id) {
    setCommandHistory((prevHistory) => {
      let newCommandHistory = { ...prevHistory };
      delete newCommandHistory[caseNumber].devices[serialNumber][fileName][id];
      return newCommandHistory;
    });
  }

  function searchStrings(input) {
    if (input.trim() === "") {
      setHistoryToDisplay(commandHistory);
    } else {
      const escapedInput = input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regexPattern = escapedInput
        .split(" ")
        .map((word) => `(?=.*${word})`)
        .join("");
      const regex = new RegExp(regexPattern, "i");

      setHistoryToDisplay(() => {
        let newHistory = {};
        Object.keys(commandHistory).forEach((id) => {
          if (regex.test(commandHistory[id].command)) {
            newHistory[id] = commandHistory[id];
          }
        });
        return newHistory;
      });
    }
  }

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [commandHistory]);

  const scrollToElement = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  useEffect(() => {
    if (!showFilesList) {
      if (showHistory) {
        setStyle({ left: "-6%", opacity: "1", zIndex: "6" });
        setPinStyle({ rotate: "-45deg" });
      } else {
        setStyle({ left: "-29%", opacity: "0.5", zIndex: "5" });
        setPinStyle({ rotate: "0deg" });
      }
    } else {
      setStyle({ left: "-29%", opacity: "0.5" });
    }
  }, [showHistory, showFilesList]);

  const showHistoryList = (value) => {
    if (!showFilesList) {
      setShowHistory(value);
    }
  };

  useEffect(() => {
    searchStrings(searchValue);
  }, [searchValue]);

  const switchToFiles = () => {
    setShowFileSwitcher(true);
    setShowHistory(false);
  };

  const dumpToPB = () => {
    let pasteBinCommand = ``;
    selectedItems.forEach((item) => {
      const output = commandHistory[item];
      if (output.note !== "") {
        pasteBinCommand += `\n${output.note}\n\n`;
      }

      pasteBinCommand += `${output.output}`;
      if (pasteBinCommand.endsWith("\n")) {
        pasteBinCommand += `-_-_-_-_-_-_- this output was taken from sherlog for ' ${output.banner} '_-_-_-_-_-_-_\n\n`;
      } else {
        pasteBinCommand += `\n-_-_-_-_-_-_- this output was taken from sherlog for ' ${output.banner} ' _-_-_-_-_-_-_\n\n\n`;
      }
    });
    return pasteBinCommand;
  };

  const copySelectedOutputs = () => {
    const copyText = dumpToPB();
    navigator.clipboard.writeText(copyText);
  };

  const getPbLink = () => {
    const pasteBinString = dumpToPB();
    setCommandLoading(true);
    fetch("/sherlog/pbdump", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filepath: `${caseNumber}/${serialNumber}/${fileName}`,
        string: pasteBinString,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        let id = uuidv4();
        let note = `pb dump for the commands:\n`;

        selectedItems.forEach((item) => {
          note += `${commandHistory[item].command}\n`;
        });

        let payload = {
          id: id,
          banner: "<multiple outputs dumped for pb>",
          command: "<multiple outputs dumped for pb>",
          output: data.message,
          time: new Date().toISOString(),
          note: note,
        };

        setCommandHistory((prevHistory) => {
          let newHistory = {
            ...prevHistory,
            [caseNumber]: {
              ...(prevHistory[caseNumber] || {}),
              devices: {
                ...(prevHistory[caseNumber]?.devices || {}),
                [serialNumber]: {
                  ...(prevHistory[caseNumber]?.devices[serialNumber] || {}),
                  [fileName]: {
                    ...(prevHistory[caseNumber]?.devices[serialNumber]?.[
                      fileName
                    ] || {}),
                    [id]: payload,
                  },
                },
              },
            },
          };
          return newHistory;
        });

        setCommandLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setCommandLoading(false);
      })
      .finally(() => {
        setCommandLoading(false);
      });
  };

  useEffect(() => {
    setSearchValue("");
    setHistoryToDisplay(commandHistory);
  }, [commandHistory]);

  return (
    <>
      <div className="commandHistoryWrapperHover" style={style}>
        <div className="commandHistoryWrapper">
          {!showSelectItems ? (
            <AiFillFolderOpen
              className="menuSwitch"
              onClick={() => switchToFiles()}
            />
          ) : (
            <AiOutlineCopy
              className="menuSwitch"
              onClick={() => copySelectedOutputs()}
            />
          )}
          <AiOutlinePushpin
            className="pinButton"
            onClick={() => showHistoryList(!showHistory)}
            style={pinStyle}
          />
          <div className="commandHistory" ref={historyRef}>
            <center>
              <input
                type="text"
                id="searchWithinHistory"
                className="historyTitle"
                placeholder="command history"
                value={searchValue}
                ref={searchRef}
                onChange={(e) => setSearchValue(e.target.value)}
                autoComplete="off"
              />
            </center>
            <br />
            <br />
            <div className="commandHistoryLineItemWrapper">
              {Object.keys(historyToDisplay).map((key) => (
                <HistoryLineItem
                  key={key}
                  history={commandHistory}
                  showSelectItems={showSelectItems}
                  scrollToElement={scrollToElement}
                  eraseOutput={eraseOutput}
                  item={key}
                  setSelectedItems={setSelectedItems}
                  showCaseSearch={showCaseSearch}
                  setShowCaseSearch={setShowCaseSearch}
                />
              ))}
            </div>

            <center>
              {!showSelectItems ? (
                <p id="historyLength">
                  {Object.keys(commandHistory).length} commands entered
                </p>
              ) : (
                <p
                  id="historyLength"
                  style={{
                    color: "var(--primary-dark)",
                    cursor: "pointer",
                    fontSize: "1.55em",
                    textAlign: "right",
                    padding: "0",
                    paddingRight: "25px",
                  }}
                  onClick={() => getPbLink()}
                >
                  <AiOutlineShareAlt />
                </p>
              )}
            </center>
            <p
              className="selectCommands"
              onClick={() => setShowSelectItems(!showSelectItems)}
            >
              {!showSelectItems ? `[select]` : `[< back]`}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
