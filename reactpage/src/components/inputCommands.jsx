import { v4 as uuidv4 } from "uuid";
import { useEffect, useState, useRef, useCallback } from "react";
import { PulseLoader } from "react-spinners";
import {
  bestMatch,
  autoComplete,
  getPossibleCommands,
  searchStrings,
} from "../resources/script/inputHandler";
import "../resources/style/inputCommands.css";

export default function InputCommands({
  setShowCaseSearch,
  setShowUpload,
  setShowFilesList,
  setCommandHistory,
  commandLoading,
  setCommandLoading,
  allCommands,
  commandDictionary,
  caseNumber,
  serialNumber,
  fileName,
  glance,
  category,
}) {
  const [currentCommand, setCurrentCommand] = useState("");
  const [prevCommand, setPrevCommand] = useState("no file selected");
  const [disableInput, setDisableInput] = useState(true);
  const inputRef = useRef(null);
  const [possibleCommands, setPossibleCommands] = useState([]);

  const [inputContainerStyle, setInputContainerStyle] = useState({});
  const [style, setStyle] = useState({});
  const [promptPressType, setPromptPressType] = useState("");

  const putCursorAtEnd = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.selectionStart = inputRef.current.selectionEnd =
        currentCommand.length;
    }
  };
  const istheCommand = (compareWith) => {
    return (
      JSON.stringify(
        currentCommand
          .trim()
          .split(" ")
          .filter((char) => char !== "")
      ) === JSON.stringify(compareWith.trim().split(" "))
    );
  };
  const getOutput = useCallback(
    (command, filepath, banner) => {
      setCommandLoading(true);
      fetch("/sherlog/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: `${
            category == "cases"
              ? filepath.join("/")
              : `upload/${filepath[0]}/${filepath[2]}`
          }`,
          command: command,
          banner: banner,
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
          let payload = {
            id: id,
            banner: banner,
            command: command,
            output: data.message,
            time: new Date().toISOString(),
            note: "",
          };
          setCommandHistory((prevHistory) => ({
            ...prevHistory,
            [filepath[0]]: {
              ...(prevHistory[filepath[0]] || {}),
              devices: {
                ...(prevHistory[filepath[0]]?.devices || {}),
                [filepath[1]]: {
                  ...(prevHistory[filepath[0]]?.devices?.[filepath[1]] || {}),
                  [filepath[2]]: {
                    ...(prevHistory[filepath[0]]?.devices?.[filepath[1]]?.[
                      filepath[2]
                    ] || {}),
                    [id]: payload,
                  },
                },
              },
            },
          }));
        })
        .catch((error) => {
          console.error("Error:", error);
          // Optional: Set an error message in state and display it to the user
        })
        .finally(() => {
          setCommandLoading(false);
        });
      setCurrentCommand("");
    },
    [setCommandHistory, category]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Tab") {
        putCursorAtEnd();
        e.preventDefault();
        if (currentCommand === "") {
          setCurrentCommand(prevCommand);
          setPrevCommand("");
        } else {
          setCurrentCommand((prevCommand) => {
            let autoCompletedCommand = autoComplete(
              prevCommand,
              commandDictionary
            );
            if (autoCompletedCommand) {
              setPossibleCommands([]);
              return autoCompletedCommand;
            }
            return currentCommand;
          });
        }
      } else if (e.key === "?") {
        setPromptPressType("?");
        setPossibleCommands([]);
        putCursorAtEnd();
        setPossibleCommands(() => {
          return getPossibleCommands(currentCommand, commandDictionary);
        });
      } else if (e.shiftKey && e.key === "Enter") {
        setPromptPressType("shift");
        setPossibleCommands([]);
        const matchingCommands = searchStrings(allCommands, currentCommand);
        setPossibleCommands(matchingCommands);
      } else if (e.key === "Enter") {
        setShowCaseSearch((prev) => {
          if (prev) return !prev;
          return false;
        });
        setShowUpload((prev) => {
          if (prev) return !prev;
          return false;
        });
        setShowFilesList((prev) => {
          if (prev) return !prev;
          return false;
        });
        if (istheCommand("clear")) {
          // setPrevCommand(currentCommand);
          // setCurrentCommand("");
        } else if (istheCommand("clear all")) {
          // setCommandHistory({});
          // setPrevCommand(currentCommand);
          // setCurrentCommand("");
        } else if (istheCommand("get back")) {
          // if (Object.keys(commandHistory).length) {
          //   setPrevCommand(currentCommand);
          //   setCurrentCommand("");
          // } else {
          //   setStyle({ backgroundColor: "rgb(166,165,25)" });
          // }
        } else {
          let filepath = [caseNumber, serialNumber, fileName];
          let bestMatchOutput = bestMatch(currentCommand, commandDictionary);
          if (bestMatchOutput) {
            setStyle({});
            setPossibleCommands([]);
            getOutput(bestMatchOutput, filepath, currentCommand);
            setPrevCommand(currentCommand);
            setCurrentCommand("");
          } else {
            setStyle({ backgroundColor: "rgb(166,165,25)" });
          }
        }
      } else if (e.key === "Backspace") {
        setStyle({});
        setPossibleCommands([]);
      }
    },
    [commandDictionary, currentCommand, prevCommand, getOutput]
  );

  const handlePromptPress = useCallback(
    (cmd) => {
      if (promptPressType == "?") {
        if (cmd !== "<cr>") {
          setCurrentCommand((prevCommand) => {
            let parsedCommand = prevCommand.trim().split(" ");
            parsedCommand.pop();
            return `${parsedCommand.join(" ")} ${cmd}`;
          });
        } else {
          setCurrentCommand((prev) => {
            let newCommand = prev.replace(/\?/g, "");
            return newCommand;
          });
          handleKeyDown({ key: "Enter" });
        }
      } else if (promptPressType == "shift") {
        setCurrentCommand(cmd);
      }
      putCursorAtEnd();
      setPossibleCommands([]);
    },
    [handleKeyDown, promptPressType]
  );

  useEffect(() => {
    if (glance.serialNumber && glance.hostname && glance.timeStamp) {
      setDisableInput(false);
      setPrevCommand("show version");
    } else {
      setDisableInput(true);
      setPrevCommand("no file selected");
    }
  }, [glance]);

  useEffect(() => {
    if (possibleCommands.length === 0) {
      setInputContainerStyle({ height: "17.5%" });
    } else if (possibleCommands.length < 3) {
      setInputContainerStyle({ height: "25%" });
    } else if (possibleCommands.length < 4) {
      setInputContainerStyle({ height: "28.5%" });
    } else if (possibleCommands.length < 5) {
      setInputContainerStyle({ height: "35%" });
    } else if (possibleCommands.length >= 5 && possibleCommands.length < 10) {
      setInputContainerStyle({ height: "40%" });
    } else if (possibleCommands.length >= 10) {
      setInputContainerStyle({ height: "45%" });
    }
  }, [possibleCommands]);

  return (
    <>
      <div id="inputContainer" style={inputContainerStyle}>
        {commandLoading && (
          <PulseLoader
            color={"rgba(2, 0, 36, 1)"}
            loading={commandLoading}
            size={5}
            aria-label="commandLoading Pulse"
            data-testid="pulseLoader"
          />
        )}
        <div className="scroller">
          {possibleCommands &&
            possibleCommands.map((cmd) => (
              <p key={cmd} onClick={() => handlePromptPress(cmd)}>
                {cmd}
              </p>
            ))}
          <br />
          <br />
        </div>
      </div>

      <input
        id="command"
        type="text"
        className="form-control"
        placeholder={prevCommand}
        value={currentCommand}
        ref={inputRef}
        onChange={(e) => setCurrentCommand(e.target.value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        disabled={disableInput}
        style={style}
      />
    </>
  );
}
