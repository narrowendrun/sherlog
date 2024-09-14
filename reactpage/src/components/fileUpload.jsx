import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { BarLoader } from "react-spinners";
import { AiOutlineCloseSquare } from "react-icons/ai";
import "../resources/style/fileUpload.css";

export default function FileUpload({
  setShowUpload,
  setShowCaseSearch,
  setFileMotherTree,
  setSavedFiles,
  setCurrentInstance,
  setCategory,
}) {
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const style = {
    position: "absolute",
    width: "100%",
    height: "100%",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "2.5%",
    backgroundColor: "rgb(216, 216, 236)",
    color: "var(--primary-dark)",
    outline: "none",
    transition: "var(--transition-main)",
    cursor: "pointer",
    zIndex: "0",
    opacity: "1",
  };
  const getTime = () => {
    const currentDateTime = new Date();
    const year = currentDateTime.getUTCFullYear();
    const month = String(currentDateTime.getUTCMonth() + 1).padStart(2, "0");
    const day = String(currentDateTime.getUTCDate()).padStart(2, "0");
    const hours = String(currentDateTime.getUTCHours()).padStart(2, "0");
    const minutes = String(currentDateTime.getUTCMinutes()).padStart(2, "0");
    const seconds = String(currentDateTime.getUTCSeconds()).padStart(2, "0");
    const formattedDateTime = `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
    return formattedDateTime;
  };
  async function getResources(filepath, subFolder, filename) {
    try {
      // Set loading to true before making the fetch call
      setLoading2(true);

      const response = await fetch("/sherlog/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filepath: `${filepath}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setFileMotherTree((prevMotherTree) => {
        let newMotherTree = { ...prevMotherTree };
        if (!newMotherTree.uploads[subFolder]) {
          newMotherTree.uploads[subFolder] = {};
        }
        if (!newMotherTree.uploads[subFolder].files) {
          newMotherTree.uploads[subFolder].files = {};
        }
        if (!newMotherTree.uploads[subFolder].files[filename]) {
          newMotherTree.uploads[subFolder].files[filename] = {};
        }
        newMotherTree.uploads[subFolder].files[filename] = {
          resources: {
            dictionary: data.dictionary,
            allCommands: data.allCommands,
            glance: data.glance,
          },
        };
        return newMotherTree;
      });
      setCurrentInstance({
        caseNumber: subFolder,
        serialNumber: data.glance.serialNumber,
        fileName: filename,
      });
      setSavedFiles((prev) => (prev ? [...prev, filename] : [filename]));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      // Set loading to false after the fetch is complete
      setLoading2(false);
    }
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    const validFiles = acceptedFiles.filter(
      (file) =>
        file.name.endsWith(".log") ||
        file.name.endsWith(".gz") ||
        !file.name.includes(".")
    );

    setLoading(true);

    if (validFiles.length > 0) {
      try {
        const formData = new FormData();
        const subFolder = getTime();

        validFiles.forEach((file) => {
          formData.append("files", file);
          formData.append("subfolder", subFolder);
        });

        const response = await fetch("/sherlog/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          // Using Promise.all to ensure all getResources calls are complete before setting loading to false
          await Promise.all(
            validFiles.map((file) =>
              getResources(
                `upload/${subFolder}/${file.name}`,
                subFolder,
                `${file.name}`
              )
            )
          );

          console.log("File uploaded successfully");
          setSuccess(true);
          setError(false);
        } else {
          console.error("Upload failed:", response.statusText);
        }
      } catch (error) {
        console.error("Upload failed:", error.message);
      } finally {
        // Set loading to false after all operations are complete
        setLoading(false);
        setCategory("uploads");
      }
    } else {
      console.error("No valid .log or .gz files found.");
      setError(true);
      setLoading(false); // Ensure loading is set to false even if files are invalid
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  const closeUpload = () => {
    setShowUpload(false);
    setShowCaseSearch(true);
  };

  return (
    <div className="uploadWrapper">
      <AiOutlineCloseSquare
        className="closeUploadButton"
        onClick={() => closeUpload()}
      />
      <div id="dropZone" {...getRootProps({ style })}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the log files here...</p>
        ) : (
          <p>Drag & drop your log files here, or click to select files</p>
        )}
        {(loading || loading2) && (
          <BarLoader
            color={"rgba(2, 0, 36, 1)"}
            size={500}
            aria-label="Loading Bar"
            data-testid="barLoader"
          />
        )}
        {success && `uploaded successfully`}
        {error && `oops! only .log and .gz files are allowed`}
      </div>
    </div>
  );
}
