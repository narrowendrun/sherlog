import { useEffect, useState } from "react";
import FileUpload from "./components/fileUpload";
import CaseSearch from "./components/caseSearch";
import sherlogLogo from "./images/sherlog.png";
import React from "react";
import FileTree from "./components/fileTree";
import Instance from "./instance";
import { AiOutlineSearch, AiOutlineSetting } from "react-icons/ai";

function App() {
  const [commandHistory, setCommandHistory] = useState({});
  const [savedFiles, setSavedFiles] = useState([]);
  const [filePickerTree, setFilePickerTree] = useState({});
  const [showFilesList, setShowFilesList] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showCaseSearch, setShowCaseSearch] = useState(true);
  const [theme, setTheme] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fileMotherTree, setFileMotherTree] = useState({
    cases: {},
    uploads: {},
  });
  const [category, setCategory] = useState("cases");
  const [currentInstance, setCurrentInstance] = useState({
    caseNumber: null,
    serialNumber: null,
    fileName: null,
  });

  const deepSeaMode = () => {
    if (theme) {
      document.querySelector("body").setAttribute("data-theme", "terminal");
    } else {
      document.querySelector("body").setAttribute("data-theme", "deep-sea");
    }
    setTheme(+!theme);
  };

  // useEffect(() => {
  //   if (Object.keys(filePickerTree).length > 0) {
  //     setShowFilesList(true);
  //     document.title = `sherlog - SR${caseNumber}`;
  //   } else {
  //     setShowFilesList(false);
  //   }
  // }, [filePickerTree]);
  function findCaseAndSerialNumber(filename) {
    console.log("file :", file);
    let result = {
      caseNumber: "none",
      serialNumber: null,
      fileName: null,
    };
    // Loop through each caseNumber
    Object.keys(fileMotherTree.cases).forEach((caseNumber) => {
      Object.keys(fileMotherTree.cases[caseNumber].devices).forEach(
        (serialNumber) => {
          if (
            fileMotherTree.cases[caseNumber].devices[
              serialNumber
            ].files.hasOwnProperty(filename)
          ) {
            result = {
              caseNumber: caseNumber,
              serialNumber: serialNumber,
              fileName: filename,
            };
          }
        }
      );
    });
    return result;
  }

  useEffect(() => {
    let fileArray = [];

    Object.keys(fileMotherTree.cases).forEach((caseNumber) => {
      Object.keys(fileMotherTree.cases[caseNumber].devices).forEach(
        (serialNumber) => {
          fileArray = fileArray.concat(
            Object.keys(
              fileMotherTree.cases[caseNumber].devices[serialNumber].files
            )
          );
        }
      );
    });

    // Create a Set to remove duplicates
    const uniqueFiles = Array.from(
      new Set([...fileArray, ...(savedFiles || [])])
    );

    setSavedFiles(uniqueFiles);
  }, [fileMotherTree]);

  return (
    <>
      <h2 className="indicator">*running locally*</h2>
      <AiOutlineSearch
        className="caseSearchButton"
        onClick={() => {
          setShowCaseSearch(true);
          setShowUpload(false);
        }}
      />
      <AiOutlineSetting className="settingsButton" />
      <div className="logo">
        <img src={sherlogLogo} alt="sherlog_logo" />
        <p>sherlog</p>
      </div>

      {/* <button onClick={deepSeaMode}>click</button> */}

      {(showUpload || showCaseSearch) && (
        <FileUpload
          setShowUpload={setShowUpload}
          setShowCaseSearch={setShowCaseSearch}
          setFileMotherTree={setFileMotherTree}
          setSavedFiles={setSavedFiles}
          setCurrentInstance={setCurrentInstance}
          setCategory={setCategory}
        />
      )}

      {/* {showCaseSearch && (
        <div className="fileSelection">
          <CaseSearch
            showFilesList={showFilesList}
            setShowFilesList={setShowFilesList}
            loading={loading}
            setLoading={setLoading}
            setShowUpload={setShowUpload}
            setShowCaseSearch={setShowCaseSearch}
            setFilePickerTree={setFilePickerTree}
            setCurrentInstance={setCurrentInstance}
          />

          <FileTree
            fileTree={filePickerTree}
            setFileTree={setFilePickerTree}
            showFilesList={showFilesList}
            setShowFilesList={setShowFilesList}
            setLoading={setLoading}
            setSavedFiles={setSavedFiles}
            savedFiles={savedFiles}
            setFileMotherTree={setFileMotherTree}
            caseNumber={currentInstance.caseNumber}
            showCaseSearch={showCaseSearch}
            setCurrentInstance={setCurrentInstance}
            setCategory={setCategory}
          />
        </div>
      )} */}

      {/* <FullscreenFileSwitcher fileMotherTree={fileMotherTree} /> */}

      <Instance
        showCaseSearch={showCaseSearch}
        setShowCaseSearch={setShowCaseSearch}
        showUpload={showUpload}
        setShowUpload={setShowUpload}
        showFilesList={showFilesList}
        setShowFilesList={setShowFilesList}
        commandHistory={commandHistory}
        setCommandHistory={setCommandHistory}
        savedFiles={savedFiles}
        fileMotherTree={fileMotherTree}
        setFileMotherTree={setFileMotherTree}
        currentInstance={currentInstance}
        setCurrentInstance={setCurrentInstance}
        category={category}
        setCategory={setCategory}
      />
    </>
  );
}

export default App;
