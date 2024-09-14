import {
  AiOutlineDown,
  AiOutlineRight,
  AiOutlineBorder,
  AiOutlineCheckSquare,
} from "react-icons/ai";
import "../resources/style/fileTree.css";
import { useCallback, useEffect, useState } from "react";

export default function FileTree({
  fileTree,
  setFileTree,
  showFilesList,
  setShowFilesList,
  setLoading,
  savedFiles,
  setFileMotherTree,
  caseNumber,
  setCurrentInstance,
  setCategory,
}) {
  const [style, setStyle] = useState({});
  const [numberOfFilesSelected, setNumberOfFilesSelected] = useState(0);

  const updateParentCheckStatus = useCallback((tree) => {
    const newTree = { ...tree };

    Object.keys(newTree).forEach((device) => {
      const dates = newTree[device].dates;

      // Update dates check status based on files
      Object.keys(dates).forEach((date) => {
        const files = dates[date].files;
        const allFilesChecked = Object.values(files).every(
          (file) => file.isChecked
        );
        newTree[device].dates[date].isChecked = allFilesChecked;
      });

      // Update device check status based on dates
      const allDatesChecked = Object.values(dates).every(
        (date) => date.isChecked
      );
      newTree[device].isChecked = allDatesChecked;
    });

    return newTree;
  }, []);

  const toggleDeviceBranch = useCallback(
    (device) => {
      setFileTree((prevTree) => {
        const newTree = { ...prevTree };
        newTree[device].isCollapsed = !prevTree[device].isCollapsed;
        return newTree;
      });
    },
    [setFileTree]
  );

  const toggleDateBranch = useCallback(
    (device, date) => {
      setFileTree((prevTree) => {
        const newTree = {
          ...prevTree,
          [device]: {
            ...prevTree[device],
            dates: {
              ...prevTree[device].dates,
              [date]: {
                ...prevTree[device].dates[date],
                isCollapsed: !prevTree[device].dates[date].isCollapsed,
              },
            },
          },
        };
        return newTree;
      });
    },
    [setFileTree]
  );

  const handleDeviceCheck = useCallback(
    (device) => {
      setFileTree((prevTree) => {
        const newIsChecked = !prevTree[device].isChecked;
        const newTree = {
          ...prevTree,
          [device]: {
            ...prevTree[device],
            isChecked: newIsChecked,
            dates: Object.fromEntries(
              Object.entries(prevTree[device].dates).map(
                ([date, dateValue]) => [
                  date,
                  {
                    ...dateValue,
                    isChecked: newIsChecked,
                    files: Object.fromEntries(
                      Object.entries(dateValue.files).map(
                        ([file, fileValue]) => [
                          file,
                          { ...fileValue, isChecked: newIsChecked },
                        ]
                      )
                    ),
                  },
                ]
              )
            ),
          },
        };
        return updateParentCheckStatus(newTree);
      });
    },
    [setFileTree, updateParentCheckStatus]
  );

  const handleDateCheck = useCallback(
    (device, date) => {
      setFileTree((prevTree) => {
        const newIsChecked = !prevTree[device].dates[date].isChecked;
        const updatedFiles = Object.fromEntries(
          Object.entries(prevTree[device].dates[date].files).map(
            ([file, fileValue]) => [
              file,
              { ...fileValue, isChecked: newIsChecked },
            ]
          )
        );

        const newTree = {
          ...prevTree,
          [device]: {
            ...prevTree[device],
            dates: {
              ...prevTree[device].dates,
              [date]: {
                ...prevTree[device].dates[date],
                isChecked: newIsChecked,
                files: updatedFiles,
              },
            },
          },
        };
        return updateParentCheckStatus(newTree);
      });
    },
    [setFileTree, updateParentCheckStatus]
  );

  const handleFileCheck = useCallback(
    (device, date, file) => {
      setFileTree((prevTree) => {
        const newIsChecked =
          !prevTree[device].dates[date].files[file].isChecked;
        const newTree = {
          ...prevTree,
          [device]: {
            ...prevTree[device],
            dates: {
              ...prevTree[device].dates,
              [date]: {
                ...prevTree[device].dates[date],
                files: {
                  ...prevTree[device].dates[date].files,
                  [file]: {
                    ...prevTree[device].dates[date].files[file],
                    isChecked: newIsChecked,
                  },
                },
              },
            },
          },
        };
        return updateParentCheckStatus(newTree);
      });
    },
    [setFileTree, updateParentCheckStatus]
  );

  useEffect(() => {
    setStyle({
      top: showFilesList ? "12.5%" : "35%",
      left: showFilesList ? "10%" : "45%",
      height: showFilesList ? "65%" : "5%",
      width: showFilesList ? "80%" : "0%",
      zIndex: showFilesList ? "1" : "-10",
      opacity: showFilesList ? "1" : "0",
    });
  }, [showFilesList]);

  const getSelectedFiles = () => {
    let results = [];
    Object.keys(fileTree).forEach((device) => {
      const { dates } = fileTree[device];
      Object.keys(dates).forEach((date) => {
        const { files } = dates[date];
        Object.keys(files).forEach((file) => {
          if (files[file].isChecked) {
            const { serialNumber, fileTimestamp, name } = files[file];
            if (!savedFiles.includes(file)) {
              results.push({ serialNumber, fileTimestamp, name });
            }
          }
        });
      });
    });
    return results;
  };
  async function downloadFiles(case_number, files, sNos, snts) {
    const url = "/sherlog/download";
    const requestData = {
      caseNumber: case_number,
      files: files,
      sNos: sNos,
      snts: snts,
    };
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
      // Handle error as needed (e.g., show error message to user)
      return { error: error.message };
    }
  }
  async function getResources(case_number, serialNumber, filename) {
    try {
      const response = await fetch("/sherlog/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filepath: `${case_number}/${serialNumber}/${filename}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setFileMotherTree((prevMotherTree) => {
        let newMotherTree = { ...prevMotherTree };
        if (!newMotherTree.cases[case_number]) {
          newMotherTree.cases[case_number] = {};
        }
        if (!newMotherTree.cases[case_number].devices) {
          newMotherTree.cases[case_number].devices = {};
        }
        if (!newMotherTree.cases[case_number].devices[serialNumber]) {
          newMotherTree.cases[case_number].devices[serialNumber] = {};
        }
        if (!newMotherTree.cases[case_number].devices[serialNumber].files) {
          newMotherTree.cases[case_number].devices[serialNumber].files = {};
        }
        if (
          !newMotherTree.cases[case_number].devices[serialNumber].files[
            filename
          ]
        ) {
          newMotherTree.cases[case_number].devices[serialNumber].files[
            filename
          ] = {};
        }
        newMotherTree.cases[case_number].devices[serialNumber].files[filename] =
          {
            resources: {
              dictionary: data.dictionary,
              allCommands: data.allCommands,
              glance: data.glance,
            },
          };
        return newMotherTree;
      });

      // setResources((prevResources) => {
      //   let newResources = { ...prevResources };
      //   if (!newResources[case_number]) {
      //     newResources[case_number] = {};
      //   }
      //   if (!newResources[case_number][filename]) {
      //     newResources[case_number][filename] = {};
      //   }
      //   newResources[case_number][filename] = {
      //     dictionary: data.dictionary,
      //     allCommands: data.allCommands,
      //     glance: data.glance,
      //   };
      //   return newResources;
      // });
      setLoading(false);
    } catch (error) {
      // Handle errors during the fetch request
      console.error("Error:", error);
      setLoading(false);
    }
  }

  function Analyse() {
    let results = getSelectedFiles();
    let snts = [];
    let sNos = [];
    let files = [];
    for (let i = 0; i < results.length; i++) {
      let sn = results[i].serialNumber;
      let ts = results[i].fileTimestamp;
      snts.push(`{"serialNumber":"${sn}","fileTimestamp":"${ts}"}`);
      files.push(results[i].name);
      sNos.push(sn);
    }
    let sntsString = snts.join(",");
    if (files.length > 0) {
      setShowFilesList((prev) => !prev);
      setLoading(true);
      downloadFiles(caseNumber, files, sNos, sntsString)
        .then((response) => {
          console.log("downloaded successfully");
          for (let i = 0; i < files.length; i++) {
            getResources(caseNumber, sNos[i], files[i]);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
      setCategory("cases");
      setCurrentInstance((prev) => {
        return { ...prev, serialNumber: sNos[0], fileName: files[0] };
      });
    }
  }
  useEffect(() => {
    if (!Object.keys(fileTree).includes("errors")) {
      let fileCount = getSelectedFiles();
      setNumberOfFilesSelected(fileCount.length);
    } else {
      setNumberOfFilesSelected(0);
    }
  }, [fileTree]);

  if (Object.keys(fileTree).includes("errors")) {
    return (
      <>
        <div className="FileTreeWrapper" style={style}>
          <div className="FileTree">
            <center>
              <h5 style={{ color: "black" }}>{fileTree.errors}</h5>
            </center>
          </div>
        </div>
      </>
    );
  } else {
    return (
      <div className="FileTreeWrapper" style={style}>
        <div className="FileTree">
          {showFilesList &&
            Object.keys(fileTree).map((device) => (
              <div key={device} className="deviceContainer">
                {fileTree[device].isCollapsed ? (
                  <AiOutlineRight
                    className="treeButtons"
                    onClick={() => toggleDeviceBranch(device)}
                  />
                ) : (
                  <AiOutlineDown
                    className="treeButtons"
                    onClick={() => toggleDeviceBranch(device)}
                  />
                )}

                {fileTree[device].isChecked ? (
                  <AiOutlineCheckSquare
                    className="treeButtons"
                    onClick={() => handleDeviceCheck(device)}
                  />
                ) : (
                  <AiOutlineBorder
                    className="treeButtons"
                    onClick={() => handleDeviceCheck(device)}
                  />
                )}
                <span>
                  {device} ({Object.keys(fileTree[device].dates).length})
                </span>

                <div
                  className={
                    fileTree[device].isCollapsed ? "collapsed" : "expanded"
                  }
                >
                  {!fileTree[device].isCollapsed &&
                    Object.keys(fileTree[device].dates).map((date) => (
                      <div
                        key={date}
                        className={
                          fileTree[device].isCollapsed
                            ? "dateContainer"
                            : "dateContainer expanded"
                        }
                      >
                        {fileTree[device].dates[date].isCollapsed ? (
                          <AiOutlineRight
                            className="treeButtonsforDate"
                            onClick={() => toggleDateBranch(device, date)}
                          />
                        ) : (
                          <AiOutlineDown
                            className="treeButtonsforDate"
                            onClick={() => toggleDateBranch(device, date)}
                          />
                        )}
                        {fileTree[device].dates[date].isChecked ? (
                          <AiOutlineCheckSquare
                            className="treeButtonsforDate"
                            onClick={() => handleDateCheck(device, date)}
                          />
                        ) : (
                          <AiOutlineBorder
                            className="treeButtonsforDate"
                            onClick={() => handleDateCheck(device, date)}
                          />
                        )}
                        <span className="dateLabel">
                          {date} (
                          {
                            Object.keys(fileTree[device].dates[date].files)
                              .length
                          }
                          )
                        </span>

                        <div
                          className={
                            fileTree[device].dates[date].isCollapsed
                              ? "collapsed"
                              : "expanded"
                          }
                        >
                          {!fileTree[device].dates[date].isCollapsed &&
                            Object.keys(fileTree[device].dates[date].files).map(
                              (file) => (
                                <div
                                  key={file}
                                  className={
                                    fileTree[device].dates[date].files[file]
                                      .isChecked
                                      ? "fileNameLabel"
                                      : "fileNameLabel expanded"
                                  }
                                >
                                  {fileTree[device].dates[date].files[file]
                                    .isChecked ? (
                                    <AiOutlineCheckSquare
                                      className="treeButtons"
                                      onClick={() =>
                                        handleFileCheck(device, date, file)
                                      }
                                    />
                                  ) : (
                                    <AiOutlineBorder
                                      className="treeButtons"
                                      onClick={() =>
                                        handleFileCheck(device, date, file)
                                      }
                                    />
                                  )}
                                  <span>{file}</span>
                                </div>
                              )
                            )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
        {showFilesList ? (
          <button className="FileTreeButton" onClick={() => Analyse()}>
            {numberOfFilesSelected
              ? `Analyse ${numberOfFilesSelected} file(s)`
              : "no files selected"}
          </button>
        ) : null}
      </div>
    );
  }
}
