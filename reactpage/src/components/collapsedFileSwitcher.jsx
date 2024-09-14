export default function CollapsedFileSwitcher({
  fileMotherTree,
  currentInstance,
  setCurrentInstance,
  setShowCaseSearch,
  setShowUpload,
  setCategory,
}) {
  return (
    <>
      <div className="fileSwitcherSubWrapper">
        <div className="fileSwitcherLineItemWrapper">
          {Object.keys(fileMotherTree.cases).map((caseNumber) => {
            return (
              <div className="caseNumberContainer_CFS" key={caseNumber}>
                <div className="caseNumber_CFS">
                  <center>
                    <p style={{ opacity: "0.5" }}>
                      - - - - - {caseNumber} - - - - -
                    </p>
                  </center>
                </div>
                {Object.keys(fileMotherTree.cases[caseNumber].devices).map(
                  (serialNumber) => {
                    return (
                      <div
                        className="serialNumberContainer_CFS"
                        key={serialNumber}
                      >
                        <div className="serialNumber_CFS"></div>
                        <div className="fileContainer_CFS">
                          {Object.keys(
                            fileMotherTree.cases[caseNumber].devices[
                              serialNumber
                            ].files
                          ).map((file) => {
                            const style =
                              file === `${currentInstance.fileName}`
                                ? {
                                    background: "var(--primary-dark)",
                                    color: "rgb(216, 216, 236)",
                                    borderColor: "rgb(216, 216, 236)",
                                  }
                                : {};
                            return (
                              <div key={file} className="filename_CFS">
                                <p
                                  className="fileSwitcherLineItem"
                                  key={file}
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
                                  {file}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            );
          })}
        </div>
        <div className="fileSwitcherLineItemWrapper">
          {Object.keys(fileMotherTree.uploads).map((subfolder) => {
            return (
              <div className="caseNumberContainer_CFS" key={subfolder}>
                <div className="caseNumber_CFS">
                  <center>
                    <p style={{ opacity: "0.5" }}>
                      - - - upload/{subfolder} - - -
                    </p>
                  </center>
                </div>
                {Object.keys(fileMotherTree.uploads[subfolder].files).map(
                  (file) => {
                    const style =
                      file === `${currentInstance.fileName}`
                        ? {
                            background: "var(--primary-dark)",
                            color: "rgb(216, 216, 236)",
                            borderColor: "rgb(216, 216, 236)",
                          }
                        : {};
                    return (
                      <div key={file} className="filename_CFS">
                        <p
                          className="fileSwitcherLineItem"
                          key={file}
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
                          {file}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
