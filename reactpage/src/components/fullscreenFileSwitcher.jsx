import { useState } from "react";
import "../resources/style/fullscreenFileSwitcher.css";
import {
  AiOutlineFolder,
  AiOutlineDatabase,
  AiOutlineFileZip,
} from "react-icons/ai";

export default function FullscreenFileSwitcher({
  fileMotherTree,
  currentInstance,
  setCurrentInstance,
  setShowCaseSearch,
  setShowUpload,
  setCategory,
}) {
  function truncateMiddle(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }
    const half = Math.floor(maxLength / 3);
    return `${text.slice(0, half)}...${text.slice(text.length - half)}`;
  }

  const [expandedCases, setExpandedCases] = useState({});
  const [expandedSubfolders, setExpandedSubfolders] = useState({});
  const [expandedSerials, setExpandedSerials] = useState({});

  const toggleCase = (caseNumber) => {
    setExpandedCases((prevState) => ({
      ...prevState,
      [caseNumber]: !prevState[caseNumber],
    }));
  };

  const toggleSerial = (caseNumber, serialNumber) => {
    setExpandedSerials((prevState) => ({
      ...prevState,
      [caseNumber]: {
        ...prevState[caseNumber],
        [serialNumber]: !prevState[caseNumber]?.[serialNumber],
      },
    }));
  };
  const toggleSubfolder = (subfolder) => {
    setExpandedSubfolders((prev) => ({
      ...prev,
      [subfolder]: !prev[subfolder],
    }));
  };

  return (
    <div className="fullscreenFileSwitcher">
      {Object.keys(fileMotherTree.cases).map((caseNumber) => {
        const isCaseExpanded = expandedCases[caseNumber];
        const parentStyle =
          caseNumber === `${currentInstance.caseNumber}`
            ? {
                color: "blue",
              }
            : {};

        return (
          <div className="caseNumberContainer_FFS" key={caseNumber}>
            <div
              className="caseNumber_FFS"
              onClick={() => toggleCase(caseNumber)}
            >
              <AiOutlineFolder className="fullscreenFSB" />
              <p style={parentStyle}>
                {caseNumber}
                {` (${
                  Object.keys(fileMotherTree.cases[caseNumber].devices).length
                })`}
              </p>
            </div>
            {isCaseExpanded && (
              <div className="caseDetails_FFS">
                {Object.keys(fileMotherTree.cases[caseNumber].devices).map(
                  (serialNumber) => {
                    const isSerialExpanded =
                      expandedSerials[caseNumber]?.[serialNumber];
                    const serialStyle =
                      serialNumber === `${currentInstance.serialNumber}`
                        ? {
                            color: "blue",
                          }
                        : {};
                    return (
                      <div
                        className="serialNumberContainer_FFS"
                        key={serialNumber}
                      >
                        <div
                          className="serialNumber_FFS"
                          onClick={() => toggleSerial(caseNumber, serialNumber)}
                        >
                          <AiOutlineDatabase className="fullscreenFSB" />
                          <p style={serialStyle}>
                            {serialNumber}
                            {` (${
                              Object.keys(
                                fileMotherTree.cases[caseNumber].devices[
                                  serialNumber
                                ].files
                              ).length
                            })`}
                          </p>
                        </div>
                        {isSerialExpanded && (
                          <div className="fileContainer_FFS">
                            {Object.keys(
                              fileMotherTree.cases[caseNumber].devices[
                                serialNumber
                              ].files
                            ).map((file) => {
                              const style =
                                file === `${currentInstance.fileName}`
                                  ? {
                                      // background: "var(--primary-dark)",
                                      color: "blue",
                                      // borderColor: "rgb(216, 216, 236)",
                                    }
                                  : {};
                              return (
                                <div key={file} className="filename_FFS">
                                  <AiOutlineFileZip className="fullscreenFSB" />
                                  <p
                                    title={file}
                                    style={style}
                                    onClick={() => {
                                      setCategory("cases");
                                      setShowCaseSearch(false);
                                      setShowUpload(false);
                                      setCurrentInstance({
                                        caseNumber: caseNumber,
                                        serialNumber: serialNumber,
                                        fileName: file,
                                      });
                                    }}
                                  >
                                    {truncateMiddle(file, 40)}{" "}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        );
      })}
      {Object.keys(fileMotherTree.uploads).map((subfolder) => {
        const isSubfolderExpanded = expandedSubfolders[subfolder];
        const subfolderStyle =
          subfolder === `${currentInstance.caseNumber}`
            ? { color: "blue" }
            : {};

        return (
          <div className="caseNumberContainer_FFS" key={subfolder}>
            <div
              className="caseNumber_FFS"
              onClick={() => toggleSubfolder(subfolder)}
            >
              <AiOutlineFolder className="fullscreenFSB" />
              <p style={subfolderStyle}>
                {subfolder}
                {` (${
                  Object.keys(fileMotherTree.uploads[subfolder].files).length
                })`}
              </p>
            </div>
            {isSubfolderExpanded && (
              <div className="subfolderDetails_FFS">
                {Object.keys(fileMotherTree.uploads[subfolder].files).map(
                  (file) => {
                    const style =
                      file === `${currentInstance.fileName}`
                        ? {
                            color: "blue",
                          }
                        : {};
                    return (
                      <div key={file} className="filename_FFS">
                        <AiOutlineFileZip className="fullscreenFSB" />
                        <p
                          title={file}
                          style={style}
                          onClick={() => {
                            setCategory("uploads");
                            setShowCaseSearch(false);
                            setShowUpload(false);
                            setCurrentInstance({
                              caseNumber: `${subfolder}`,
                              serialNumber: `${fileMotherTree.uploads[subfolder].files[file].resources.glance.serialNumber}`,
                              fileName: file,
                            });
                          }}
                        >
                          {truncateMiddle(file, 40)}{" "}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
