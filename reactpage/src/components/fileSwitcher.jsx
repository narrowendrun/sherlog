import {
  AiOutlineHistory,
  AiOutlinePushpin,
  AiOutlineExpandAlt,
  AiOutlineShrink,
} from "react-icons/ai";
import "../resources/style/fileSwitcher.css";
import { useEffect, useState } from "react";
import FullscreenFileSwitcher from "./fullscreenFileSwitcher";
import CollapsedFileSwitcher from "./collapsedFileSwitcher";

export default function FileSwitcher({
  savedFiles,
  showFilesList,
  showFileSwitcher,
  setShowFileSwitcher,
  showHistory,
  setShowHistory,
  currentInstance,
  setCurrentInstance,
  fileMotherTree,
  expandFileSwitcher,
  setExpandFileSwitcher,
  setShowCaseSearch,
  setShowUpload,
  setCategory,
}) {
  const [style, setStyle] = useState({});
  const [pinStyle, setPinStyle] = useState({});
  const [searchValue, setSearchValue] = useState("");

  const showFileSwitcherList = (value) => {
    if (!showFilesList) {
      setShowFileSwitcher(value);
    }
  };
  useEffect(() => {
    if (!showFilesList) {
      if (showFileSwitcher) {
        setStyle((prevStyle) => {
          return { ...prevStyle, left: "2%", opacity: "1", zIndex: "5" };
        });
        setPinStyle({ rotate: "-45deg" });
      } else {
        setStyle((prevStyle) => {
          return { ...prevStyle, left: "-30%", opacity: "0.5" };
        });
        setPinStyle({ rotate: "0deg" });
      }
    } else {
      setStyle((prevStyle) => {
        return { ...prevStyle, left: "-30%", opacity: "0.5" };
      });
    }
  }, [showFileSwitcher, showFilesList]);

  useEffect(() => {
    if (expandFileSwitcher) {
      setStyle((prevStyle) => {
        return { ...prevStyle, height: "83%", top: "1%" };
      });
    } else {
      setStyle((prevStyle) => {
        return { ...prevStyle, height: "58%", top: "25.5%" };
      });
    }
  }, [expandFileSwitcher]);

  const switchToHistory = () => {
    setShowHistory(true);
    setShowFileSwitcher(false);
  };

  return (
    <div className="fileSwitcherWrapperHover" style={style}>
      <div className="fileSwitcherWrapper">
        <AiOutlineHistory
          id="historyButtonForFileSwitcher"
          className="menuSwitch"
          onClick={() => switchToHistory()}
        />
        {!expandFileSwitcher ? (
          <AiOutlineExpandAlt
            className="menuSwitch"
            onClick={() => setExpandFileSwitcher(true)}
          />
        ) : (
          <AiOutlineShrink
            className="menuSwitch"
            onClick={() => setExpandFileSwitcher(false)}
          />
        )}
        <AiOutlinePushpin
          className="pinButton"
          onClick={() => showFileSwitcherList(!showFileSwitcher)}
          style={pinStyle}
        />
        <div className="fileSwitcher">
          <center>
            <input
              type="text"
              id="searchWithinFilesList"
              className="fileSwitchTitle"
              placeholder="files list"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              autoComplete="off"
            />
          </center>
          {!expandFileSwitcher ? (
            <CollapsedFileSwitcher
              fileMotherTree={fileMotherTree}
              currentInstance={currentInstance}
              setCurrentInstance={setCurrentInstance}
              setShowCaseSearch={setShowCaseSearch}
              setShowUpload={setShowUpload}
              setCategory={setCategory}
            />
          ) : (
            <FullscreenFileSwitcher
              fileMotherTree={fileMotherTree}
              currentInstance={currentInstance}
              setCurrentInstance={setCurrentInstance}
              setShowCaseSearch={setShowCaseSearch}
              setShowUpload={setShowUpload}
              setCategory={setCategory}
            />
          )}
        </div>
        <center>
          <p id="filesLength">{savedFiles.length} file(s) loaded</p>
        </center>
      </div>
    </div>
  );
}
