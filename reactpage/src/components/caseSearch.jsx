import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import "../resources/style/caseSearch.css";
export default function CaseSearch({
  showFilesList,
  setShowFilesList,
  loading,
  setLoading,
  setShowUpload,
  setShowCaseSearch,
  setFilePickerTree,
  setCurrentInstance,
}) {
  const [caseNumber, setCaseNumber] = useState("");
  const [style, setStyle] = useState({});
  const [style2, setStyle2] = useState({});
  const loaderStyle = {
    position: "absolute",
    width: "80%",
    height: "10%",
    bottom: "10%",
    left: "10%",
    borderRadius: "10px",
    zIndex: 5,
    color: "rgba(2, 0, 36, 1)",
    backgroundColor: "transparent",
  };

  const removeNonNumeric = (input) => {
    return input.replace(/\D/g, "");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (caseNumber.trim() == "upload") {
        setShowUpload(true);
        setShowCaseSearch(false);
        // setFileTree({});
        // setCurrentFile("");
      } else {
        let newNum = removeNonNumeric(caseNumber);
        if (newNum.trim() !== "") {
          setLoading(true);
          getFiles(newNum);
          setCurrentInstance((prev) => {
            return { ...prev, caseNumber: caseNumber };
          });
        }
      }
    }
  };
  const getFiles = (caseNumber) => {
    var myHeaders = new Headers();
    myHeaders.append("User-Agent", "narendran");
    myHeaders.append("Content-Type", "application/json");
    var raw = JSON.stringify({
      caseNumber: caseNumber,
    });
    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };
    fetch("/sherlog/case", requestOptions)
      .then((response) => response.text())

      .then((result) => {
        setFilePickerTree(JSON.parse(result));
        setLoading(false);
        setShowFilesList(true);
      })
      .catch((error) => {
        console.log("error", error);
        setLoading(false);
      });
  };
  useEffect(() => {
    setStyle(() => {
      return {
        top: `${showFilesList ? `7%` : `35%`}`,
        left: `${showFilesList ? `20%` : `35%`}`,
        width: `${showFilesList ? `60%` : `30%`}`,
      };
    });
    setStyle2(() => {
      return {
        padding: `${showFilesList ? `1% 0% 1% 1%` : `5%`}`,
      };
    });
  }, [showFilesList]);
  return (
    <>
      <div className="caseNumberContainer" style={style}>
        <div className="">
          <input
            type="text"
            className="form-control"
            id="caseNumber"
            autoComplete="off"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            onKeyDown={handleKeyPress}
            style={style2}
          />
          {showFilesList ? (
            <AiOutlineEyeInvisible
              className="caseCloseButton"
              onClick={() =>
                setShowFilesList((curr) => {
                  return !curr;
                })
              }
            />
          ) : (
            <AiOutlineEye
              className="caseCloseButton"
              onClick={() =>
                setShowFilesList((curr) => {
                  return !curr;
                })
              }
            />
          )}
        </div>

        {loading ? (
          <BarLoader
            size={100}
            aria-label="Loading Bar"
            data-testid="barLoader"
            cssOverride={loaderStyle}
          />
        ) : (
          ""
        )}
      </div>
    </>
  );
}
