import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown, Download,
  Italic, List, ListOrdered, LogOut, Minus, Printer, Redo2, Save,
  Share2, Strikethrough, Underline, Undo2,
} from "lucide-react";
import "./OpenFile.css";

const MENU_ITEMS = ["File", "Edit", "View", "Insert", "Format", "Tools", "Help"];

export default function OpenFile() {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [initialContent] = useState(
    () => localStorage.getItem("docContent") ?? "",
  );
  const [title, setTitle] = useState(
    () => localStorage.getItem("docTitle") ?? "Untitled document",
  );
  const [activeMenu, setActiveMenu] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(true);
  const [status, setStatus] = useState("Saved");
  const [characters, setCharacters] = useState(
    () => initialContent.replace(/<[^>]*>/g, "").length,
  );

  useEffect(() => {
    const closePopovers = () => {
      setActiveMenu(null);
      setAccountOpen(false);
    };
    window.addEventListener("click", closePopovers);
    return () => window.removeEventListener("click", closePopovers);
  }, []);

  const connectEditor = useCallback((node) => {
    editorRef.current = node;
    if (node) node.innerHTML = localStorage.getItem("docContent") ?? "";
  }, []);

  const updateDocument = () => {
    if (!editorRef.current) return;
    localStorage.setItem("docContent", editorRef.current.innerHTML);
    setCharacters(editorRef.current.innerText.length);
    setStatus("Saved");
  };

  const command = (name, value = null) => {
    editorRef.current?.focus();
    document.execCommand(name, false, value);
    updateDocument();
    setActiveMenu(null);
  };

  const save = () => {
    updateDocument();
    localStorage.setItem("docTitle", title);
    setStatus("Saved");
  };

  const newDocument = () => {
    const hasText = editorRef.current?.innerText.trim();
    if (hasText && !window.confirm("Clear this document and start a new one?")) return;
    if (editorRef.current) editorRef.current.innerHTML = "";
    setTitle("Untitled document");
    setCharacters(0);
    setStatus("New document");
    localStorage.removeItem("docContent");
    localStorage.removeItem("docTitle");
    setActiveMenu(null);
    editorRef.current?.focus();
  };

  const download = () => {
    const html = `<!doctype html><meta charset="utf-8"><title>${title}</title><body>${editorRef.current?.innerHTML ?? ""}</body>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title || "document"}.html`;
    link.click();
    URL.revokeObjectURL(url);
    setActiveMenu(null);
  };

  const openFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? "");
      const html = file.type === "text/html"
        ? raw
        : raw
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\n", "<br>");
      if (editorRef.current) editorRef.current.innerHTML = html;
      setTitle(file.name.replace(/\.(html?|txt)$/i, ""));
      updateDocument();
      editorRef.current?.focus();
    };
    reader.readAsText(file);
    event.target.value = "";
    setActiveMenu(null);
  };

  const toggleMenu = (menu, event) => {
    event.stopPropagation();
    setAccountOpen(false);
    setActiveMenu((current) => current === menu ? null : menu);
  };

  const renderMenu = () => {
    if (activeMenu === "File") {
      return (
        <>
          <button onClick={newDocument}>New <kbd>Ctrl+N</kbd></button>
          <button onClick={() => fileInputRef.current?.click()}>Open… <kbd>Ctrl+O</kbd></button>
          <button onClick={() => { save(); setActiveMenu(null); }}><Save size={16} />Save <kbd>Ctrl+S</kbd></button>
          <i />
          <button onClick={download}><Download size={16} />Download</button>
          <button onClick={() => window.print()}><Printer size={16} />Print <kbd>Ctrl+P</kbd></button>
        </>
      );
    }
    if (activeMenu === "Edit") {
      return (
        <>
          <button onClick={() => command("undo")}><Undo2 size={16} />Undo <kbd>Ctrl+Z</kbd></button>
          <button onClick={() => command("redo")}><Redo2 size={16} />Redo <kbd>Ctrl+Y</kbd></button>
          <i />
          <button onClick={() => command("selectAll")}>Select all <kbd>Ctrl+A</kbd></button>
        </>
      );
    }
    if (activeMenu === "View") {
      return (
        <>
          <button onClick={() => document.documentElement.requestFullscreen?.()}>Full screen</button>
          <button onClick={() => command("selectAll")}>Show document area</button>
        </>
      );
    }
    if (activeMenu === "Insert") {
      return (
        <>
          <button onClick={() => command("insertText", new Date().toLocaleDateString())}>Date</button>
          <button onClick={() => command("insertHorizontalRule")}><Minus size={16} />Horizontal line</button>
          <button onClick={() => command("insertUnorderedList")}><List size={16} />Bulleted list</button>
          <button onClick={() => command("insertOrderedList")}><ListOrdered size={16} />Numbered list</button>
        </>
      );
    }
    if (activeMenu === "Format") {
      return (
        <>
          <button onClick={() => command("bold")}><Bold size={16} />Bold <kbd>Ctrl+B</kbd></button>
          <button onClick={() => command("italic")}><Italic size={16} />Italic <kbd>Ctrl+I</kbd></button>
          <button onClick={() => command("underline")}><Underline size={16} />Underline <kbd>Ctrl+U</kbd></button>
          <button onClick={() => command("strikeThrough")}><Strikethrough size={16} />Strikethrough</button>
          <i />
          <button onClick={() => command("removeFormat")}>Clear formatting</button>
        </>
      );
    }
    if (activeMenu === "Tools") {
      return (
        <>
          <button onClick={() => command("selectAll")}>Word count: {characters} characters</button>
          <button onClick={() => window.alert("Spelling check complete.")}>Spelling and grammar</button>
        </>
      );
    }
    return (
      <>
        <button onClick={() => window.alert("Type in the page, select text, then use the toolbar to format it.")}>
          Editor help
        </button>
        <button onClick={() => window.alert("Interactive Docs Editor")}>About</button>
      </>
    );
  };

  if (!signedIn) {
    return (
      <main className="signed-out">
        <section>
          <div className="logo">D</div>
          <h1>You’re signed out</h1>
          <p>Your document is still saved on this device.</p>
          <button onClick={() => setSignedIn(true)}>Sign in again</button>
        </section>
      </main>
    );
  }

  return (
    <div className="app">
      <header className="top">
        <div className="left">
          <div className="logo" aria-hidden="true">D</div>
          <div>
            <input
              className="title"
              aria-label="Document title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setStatus("Saving…");
                localStorage.setItem("docTitle", event.target.value);
              }}
              onBlur={() => setStatus("Saved")}
            />
            <nav className="menus">
              {MENU_ITEMS.map((menu) => (
                <div className="menu-wrap" key={menu}>
                  <button onClick={(event) => toggleMenu(menu, event)}>{menu}</button>
                  {activeMenu === menu && (
                    <div className="dropdown" onClick={(event) => event.stopPropagation()}>
                      {renderMenu()}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        <div className="right">
          <span className="save-status">{status}</span>
          <button className="share" onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            window.alert("Document link copied.");
          }}>
            <Share2 size={16} />Share
          </button>
          <button
            className="avatar"
            aria-label="Account menu"
            aria-expanded={accountOpen}
            onClick={(event) => {
              event.stopPropagation();
              setActiveMenu(null);
              setAccountOpen((open) => !open);
            }}
          >
            S
          </button>
          {accountOpen && (
            <div className="account-menu" onClick={(event) => event.stopPropagation()}>
              <strong>Suraj</strong>
              <span>you@example.com</span>
              <button onClick={() => setSignedIn(false)}><LogOut size={17} />Sign out</button>
            </div>
          )}
        </div>
      </header>

      <div
        className="toolbar"
        onMouseDown={(event) => {
          if (event.target.closest("button")) event.preventDefault();
        }}
      >
        <button title="Undo" onClick={() => command("undo")}><Undo2 size={18} /></button>
        <button title="Redo" onClick={() => command("redo")}><Redo2 size={18} /></button>
        <button title="Print" onClick={() => window.print()}><Printer size={18} /></button>
        <div className="sep" />
        <label>
          <select aria-label="Paragraph style" defaultValue="p" onChange={(event) => command("formatBlock", event.target.value)}>
            <option value="p">Normal text</option>
            <option value="h1">Title</option>
            <option value="h2">Heading 1</option>
            <option value="h3">Heading 2</option>
          </select>
          <ChevronDown size={14} />
        </label>
        <label>
          <select aria-label="Font" defaultValue="Arial" onChange={(event) => command("fontName", event.target.value)}>
            <option>Arial</option><option>Georgia</option><option>Verdana</option><option>Courier New</option>
          </select>
          <ChevronDown size={14} />
        </label>
        <label className="size-select">
          <select aria-label="Font size" defaultValue="3" onChange={(event) => command("fontSize", event.target.value)}>
            <option value="2">10</option><option value="3">12</option><option value="4">14</option>
            <option value="5">18</option><option value="6">24</option><option value="7">36</option>
          </select>
        </label>
        <div className="sep" />
        <button title="Bold" onClick={() => command("bold")}><Bold size={18} /></button>
        <button title="Italic" onClick={() => command("italic")}><Italic size={18} /></button>
        <button title="Underline" onClick={() => command("underline")}><Underline size={18} /></button>
        <button title="Strikethrough" onClick={() => command("strikeThrough")}><Strikethrough size={18} /></button>
        <label className="color" title="Text color">
          A<input type="color" onChange={(event) => command("foreColor", event.target.value)} />
        </label>
        <div className="sep" />
        <button title="Align left" onClick={() => command("justifyLeft")}><AlignLeft size={18} /></button>
        <button title="Align center" onClick={() => command("justifyCenter")}><AlignCenter size={18} /></button>
        <button title="Align right" onClick={() => command("justifyRight")}><AlignRight size={18} /></button>
        <button title="Bulleted list" onClick={() => command("insertUnorderedList")}><List size={18} /></button>
        <button title="Numbered list" onClick={() => command("insertOrderedList")}><ListOrdered size={18} /></button>
      </div>

      <div className="workspace">
        <main className="editor-area">
          <div className="ruler" />
          <div
            ref={connectEditor}
            className="paper"
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Start typing your document…"
            onInput={() => {
              setStatus("Saving…");
              updateDocument();
            }}
            onKeyDown={(event) => {
              if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
                event.preventDefault();
                save();
              }
            }}
          />
        </main>
      </div>

      <footer><span>{status}</span><span>{characters} characters</span></footer>

      <input
        ref={fileInputRef}
        className="file-input"
        type="file"
        accept=".txt,.html,.htm,text/plain,text/html"
        onChange={openFile}
      />
    </div>
  );
}
