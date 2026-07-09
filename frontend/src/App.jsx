import { useState } from "react";
import App_1 from "./Login";
import GoogleDocsHome from "./GoogleDocsHome";
import OpenFile from "./OpenFile";

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem("token") ? "home" : "login";
  });
  const [activeDocument, setActiveDocument] = useState(null);

  const openNewDocument = () => {
    setActiveDocument(null);
    setCurrentPage("editor");
  };

  const openExistingDocument = (document) => {
    setActiveDocument(document);
    setCurrentPage("editor");
  };

  return (
    <>
      {currentPage === "login" && (
        <App_1 onLogin={() => setCurrentPage("home")} />
      )}

      {currentPage === "home" && (
        <GoogleDocsHome
          onNewDocument={openNewDocument}
          onOpenDocument={openExistingDocument}
          onLogout={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("email");
            setActiveDocument(null);
            setCurrentPage("login");
          }}
        />
      )}

      {currentPage === "editor" && (
        <OpenFile
          document={activeDocument}
          onBack={() => setCurrentPage("home")}
        />
      )}
    </>
  );
}
