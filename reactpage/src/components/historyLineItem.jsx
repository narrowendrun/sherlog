import { useEffect, useState } from "react";
import { FaRegCircle } from "react-icons/fa6";
import { FaCheckCircle } from "react-icons/fa";
import { AiOutlineDelete } from "react-icons/ai";
export default function HistoryLineItem({
  history,
  showSelectItems,
  scrollToElement,
  eraseOutput,
  item,
  setSelectedItems,
  showCaseSearch,
  setShowCaseSearch,
}) {
  const selectThis = () => {
    //console.log(item)
    setSelectedItems((prevItems) => {
      if (!selectItem) {
        return [...prevItems, item];
      } else {
        return prevItems.filter((elem) => elem !== item);
      }
    });
  };
  const [selectItem, setSelectItem] = useState(false);
  const checkCircle = () => {
    // let disable = false;
    // if (history?.[item]?.command === `<multiple outputs dumped for pb>`) {
    //   disable = true;
    // }
    if (selectItem) {
      return (
        <FaCheckCircle
          className="deleteHistoryItem"
          onClick={() => {
            setSelectItem(!selectItem);
            selectThis();
          }}
        />
      );
    } else {
      return (
        <FaRegCircle
          className="deleteHistoryItem"
          onClick={() => {
            setSelectItem(!selectItem);
            selectThis();
          }}
        />
      );
    }
  };

  return (
    <>
      <div className="commandHistoryLineItem">
        <p
          className=""
          onClick={() => {
            if (showCaseSearch) {
              setShowCaseSearch(false);
            }
            scrollToElement(history[item].ref);
          }}
        >
          {history?.[item]?.command}
        </p>
        {!showSelectItems ? (
          <AiOutlineDelete
            className="deleteHistoryItem"
            onClick={() => eraseOutput(history[item].id)}
          />
        ) : (
          checkCircle()
        )}
      </div>
    </>
  );
}
