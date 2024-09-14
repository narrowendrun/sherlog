import { useState } from "react";
import History from "./components/history";
import Glance from "./components/glance";
import InputCommands from "./components/inputCommands";
import Outputs from "./components/outputs";
import FileSwitcher from "./components/fileSwitcher";
export default function Instance({
  showCaseSearch,
  setShowCaseSearch,
  showUpload,
  setShowUpload,
  showFilesList,
  setShowFilesList,
  commandHistory,
  setCommandHistory,
  savedFiles,
  fileMotherTree,
  currentInstance,
  setCurrentInstance,
  category,
  setCategory,
}) {
  const [commandLoading, setCommandLoading] = useState(false);
  const [showFileSwitcher, setShowFileSwitcher] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandFileSwitcher, setExpandFileSwitcher] = useState(false);

  return (
    <>
      <InputCommands
        commandDictionary={
          category == "cases"
            ? fileMotherTree?.cases?.[currentInstance?.caseNumber]?.devices?.[
                currentInstance?.serialNumber
              ]?.files?.[currentInstance?.fileName]?.resources?.dictionary ?? {}
            : fileMotherTree?.uploads?.[currentInstance?.caseNumber]?.files?.[
                currentInstance?.fileName
              ]?.resources?.dictionary ?? {}
        }
        allCommands={
          category == "cases"
            ? fileMotherTree?.cases?.[currentInstance?.caseNumber]?.devices?.[
                currentInstance?.serialNumber
              ]?.files?.[currentInstance?.fileName]?.resources?.allCommands ??
              {}
            : fileMotherTree?.uploads?.[currentInstance?.caseNumber]?.files?.[
                currentInstance?.fileName
              ]?.resources?.allCommands ?? {}
        }
        setShowCaseSearch={setShowCaseSearch}
        setShowUpload={setShowUpload}
        setShowFilesList={setShowFilesList}
        commandHistory={commandHistory}
        setCommandHistory={setCommandHistory}
        commandLoading={commandLoading}
        setCommandLoading={setCommandLoading}
        caseNumber={currentInstance.caseNumber}
        serialNumber={currentInstance.serialNumber}
        fileName={currentInstance.fileName}
        glance={
          category == "cases"
            ? fileMotherTree?.cases?.[currentInstance?.caseNumber]?.devices?.[
                currentInstance?.serialNumber
              ]?.files?.[currentInstance?.fileName]?.resources?.glance ?? {}
            : fileMotherTree?.uploads?.[currentInstance?.caseNumber]?.files?.[
                currentInstance?.fileName
              ]?.resources?.glance ?? {}
        }
        category={category}
      />
      <FileSwitcher
        savedFiles={savedFiles}
        showFilesList={showFilesList}
        commandHistory={commandHistory}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        showFileSwitcher={showFileSwitcher}
        setShowFileSwitcher={setShowFileSwitcher}
        currentInstance={currentInstance}
        setCurrentInstance={setCurrentInstance}
        fileMotherTree={fileMotherTree}
        expandFileSwitcher={expandFileSwitcher}
        setExpandFileSwitcher={setExpandFileSwitcher}
        setShowCaseSearch={setShowCaseSearch}
        setCategory={setCategory}
        setShowUpload={setShowUpload}
      />
      <History
        commandHistory={
          commandHistory?.[currentInstance?.caseNumber]?.devices?.[
            currentInstance?.serialNumber
          ]?.[currentInstance?.fileName] ?? {}
        }
        setCommandHistory={setCommandHistory}
        showFilesList={showFilesList}
        caseNumber={currentInstance.caseNumber}
        serialNumber={currentInstance.serialNumber}
        fileName={currentInstance.fileName}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        showFileSwitcher={showFileSwitcher}
        setShowFileSwitcher={setShowFileSwitcher}
        setCommandLoading={setCommandLoading}
        showCaseSearch={showCaseSearch}
        setShowCaseSearch={setShowCaseSearch}
      />
      <Glance
        glance={
          category == "cases"
            ? fileMotherTree?.cases?.[currentInstance?.caseNumber]?.devices?.[
                currentInstance?.serialNumber
              ]?.files?.[currentInstance?.fileName]?.resources?.glance ?? {}
            : fileMotherTree?.uploads?.[currentInstance?.caseNumber]?.files?.[
                currentInstance?.fileName
              ]?.resources?.glance ?? {}
        }
        filename={currentInstance.fileName}
        showFilesList={showFilesList}
        expandFileSwitcher={expandFileSwitcher}
        setExpandFileSwitcher={setExpandFileSwitcher}
      />
      <Outputs
        commandHistory={
          commandHistory?.[currentInstance?.caseNumber]?.devices?.[
            currentInstance?.serialNumber
          ]?.[currentInstance?.fileName] ?? {}
        }
        setCommandHistory={setCommandHistory}
        showFileSwitcher={showFileSwitcher}
        showHistory={showHistory}
        caseNumber={currentInstance.caseNumber}
        serialNumber={currentInstance.serialNumber}
        fileName={currentInstance.fileName}
        showCaseSearch={showCaseSearch}
        showUpload={showUpload}
      />
    </>
  );
}
