import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Download,
  Italic,
  List,
  ListOrdered,
  LogOut,
  Minus,
  Printer,
  Redo2,
  Save,
  Share2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import "./OpenFile.css";

const MENU_ITEMS = [
  "File",
  "Edit",
  "View",
  "Insert",
  "Format",
  "Tools",
  "Help",
];

function getTextLengthFromHtml(html) {
  return new DOMParser().parseFromString(html || "", "text/html").body.innerText
    .length;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function askShareEmail(documentTitle) {
  const email = window.prompt(`Share "${documentTitle}" with email:`);
  if (email == null) return null;

  const trimmedEmail = email.trim();
  if (!isValidEmail(trimmedEmail)) {
    window.alert("Please enter a valid email address.");
    return null;
  }

  return trimmedEmail;
}

function saveSelection(containerEl) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!containerEl.contains(range.commonAncestorContainer)) return null;
  const preSelectionRange = range.cloneRange();
  preSelectionRange.selectNodeContents(containerEl);
  preSelectionRange.setEnd(range.startContainer, range.startOffset);
  const start = preSelectionRange.toString().length;
  return {
    start: start,
    end: start + range.toString().length,
  };
}

function restoreSelection(containerEl, savedSel) {
  if (!savedSel) return;
  let charIndex = 0;
  const range = document.createRange();
  range.setStart(containerEl, 0);
  range.collapse(true);
  const nodeStack = [containerEl];
  let node,
    foundStart = false,
    stop = false;

  while (!stop && (node = nodeStack.pop())) {
    if (node.nodeType === 3) {
      const nextCharIndex = charIndex + node.length;
      if (
        !foundStart &&
        savedSel.start >= charIndex &&
        savedSel.start <= nextCharIndex
      ) {
        range.setStart(node, savedSel.start - charIndex);
        foundStart = true;
      }
      if (
        foundStart &&
        savedSel.end >= charIndex &&
        savedSel.end <= nextCharIndex
      ) {
        range.setEnd(node, savedSel.end - charIndex);
        stop = true;
      }
      charIndex = nextCharIndex;
    } else {
      let i = node.childNodes.length;
      while (i--) {
        nodeStack.push(node.childNodes[i]);
      }
    }
  }

  const sel = window.getSelection();
  if (sel) {
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

export default function OpenFile({ document: initialDocument, onBack }) {
  async function saveDocument() {
    if (!canEditDocument) {
      window.alert("You only have view permission for this document.");
      return null;
    }

    if (!editorRef.current) return null;

    console.log("Document ID:", documentId);
    const body = {
      id: documentId,
      title,
      content: editorRef.current.innerHTML,
      ownerEmail,
    };

    let url;
    let method;

    if (documentId == null) {
      url = "http://localhost:8080/api/document/saveDoc";
      method = "POST";
    } else {
      url = "http://localhost:8080/api/document/updateDoc";
      method = "PUT";
    }

    const response = await fetch(url, {
      method,

      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },

      body: JSON.stringify(body),
    });

    if (!response.ok) {
      alert("Unable to save document.");
      return;
    }

    const data = await response.json();

    setDocumentId(data.id);
    setOwnerEmail(data.ownerEmail ?? ownerEmail);
    setSharedWith(data.sharedWith ?? sharedWith);
    setStatus("Saved");

    return data.id;
  }

  const save = async () => {
    await saveDocument();
  };

  const shareDocument = async () => {
    if (!canShareDocument) {
      window.alert("Only the owner can share this document.");
      return;
    }

    let id = documentId;

    if (!id) {
      id = await saveDocument();
      if (!id) return;
    }

    const documentTitle = title || "Untitled Document";

    const email = askShareEmail(documentTitle);
    if (!email) return;

    const canEdit = window.confirm(
      "Press OK to give Edit permission.\n\nPress Cancel to give View-only permission.",
    );

    try {
      const response = await fetch("http://localhost:8080/api/document/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          documentId: id,
          email,
          canRead: true,
          canEdit,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to share document.");
      }

      window.alert(`"${documentTitle}" shared with ${email}.`);
    } catch (err) {
      console.error(err);
      window.alert("Unable to share document.");
    }
  };

  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [documentId, setDocumentId] = useState(initialDocument?.id ?? null);
  const [lockedBy, setLockedBy] = useState(null);
  const unlockTimer = useRef(null);
  const [title, setTitle] = useState(
    initialDocument?.title ?? "Untitled Document",
  );
  const [content, setContent] = useState(initialDocument?.content ?? "");
  const [ownerEmail, setOwnerEmail] = useState(
    initialDocument?.ownerEmail ?? localStorage.getItem("email") ?? "",
  );
  const [sharedWith, setSharedWith] = useState(
    initialDocument?.sharedWith ?? [],
  );

  const [activeMenu, setActiveMenu] = useState(null);
  const [viewers, setViewers] = useState([]);
  const stompClient = useRef(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(true);
  const [status, setStatus] = useState("Saved");
  const accountEmail = localStorage.getItem("email") || "Not signed in";
  const normalizedAccountEmail = accountEmail.toLowerCase();
  const accountInitial = accountEmail.charAt(0).toUpperCase();
  const matchingPermission = sharedWith.find(
    (permission) => permission.email?.toLowerCase() === normalizedAccountEmail,
  );
  const isOwner = ownerEmail?.toLowerCase() === normalizedAccountEmail;
  const hasPermission =
    !documentId || isOwner || matchingPermission?.canedit === true;

  const canEditDocument =
    hasPermission && (lockedBy === null || lockedBy.email === accountEmail);
  const canShareDocument = !documentId || isOwner;
  const [characters, setCharacters] = useState(() =>
    getTextLengthFromHtml(initialDocument?.content ?? ""),
  );

  useEffect(() => {
    if (status !== "Saving...") return;
    const timeoutId = setTimeout(() => {
      save();
    }, 1000);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, title, status]);

  useEffect(() => {
    const closePopovers = () => {
      setActiveMenu(null);
      setAccountOpen(false);
    };
    window.addEventListener("click", closePopovers);
    return () => window.removeEventListener("click", closePopovers);
  }, []);
  useEffect(() => {
    if (!documentId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),

      onConnect: () => {
        // Presence updates
        client.subscribe("/topic/presence", (message) => {
          setViewers(JSON.parse(message.body));
        });

        // Document updates
        client.subscribe(`/topic/document/${documentId}`, (message) => {
          const update = JSON.parse(message.body);

          // Ignore our own updates
          if (update.email === accountEmail) {
            return;
          }

          if (editorRef.current) {
            const savedSel = saveSelection(editorRef.current);
            // eslint-disable-next-line react-hooks/immutability
            editorRef.current.innerHTML = update.content;
            if (savedSel) {
              restoreSelection(editorRef.current, savedSel);
            }
          }

          setContent(update.content);
        });

        client.subscribe("/topic/lock", (message) => {
          const lock = JSON.parse(message.body);

          if (lock.documentId !== documentId) return;

          if (lock.email == null) {
            setLockedBy(null);
          } else {
            setLockedBy(lock);
          }
        });

        // Tell server we joined
        client.publish({
          destination: "/app/presence/join",
          body: JSON.stringify({
            email: accountEmail,
            documentId,
          }),
        });
      },
    });

    client.activate();
    stompClient.current = client;

    return () => {
      if (client.connected) {
        client.publish({
          destination: "/app/presence/leave",
          body: JSON.stringify({
            email: accountEmail,
            documentId,
          }),
        });
      }

      client.deactivate();
    };
  }, [documentId]);

  useEffect(() => {
    const nextContent = initialDocument?.content ?? "";

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDocumentId(initialDocument?.id ?? null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(initialDocument?.title ?? "Untitled Document");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContent(nextContent);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOwnerEmail(
      initialDocument?.ownerEmail ?? localStorage.getItem("email") ?? "",
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSharedWith(initialDocument?.sharedWith ?? []);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCharacters(getTextLengthFromHtml(nextContent));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(initialDocument ? "Saved" : "New document");

    if (editorRef.current) {
      // eslint-disable-next-line react-hooks/immutability
      editorRef.current.innerHTML = nextContent;
    }
  }, [initialDocument]);

  const updateDocument = () => {
    if (!canEditDocument || !editorRef.current) return;

    setContent(editorRef.current.innerHTML);

    setCharacters(editorRef.current.innerText.length);

    setStatus("Saving...");
  };

  const command = (name, value = null) => {
    if (!canEditDocument) return;

    editorRef.current?.focus();
    document.execCommand(name, false, value);
    updateDocument();
    setActiveMenu(null);
  };

  const newDocument = () => {
    const hasText = editorRef.current?.innerText.trim();
    if (hasText && !window.confirm("Clear this document and start a new one?"))
      return;
    // eslint-disable-next-line react-hooks/immutability
    if (editorRef.current) editorRef.current.innerHTML = "";
    setTitle("Untitled Document");
    setDocumentId(null);
    setOwnerEmail(localStorage.getItem("email") ?? "");
    setSharedWith([]);
    setContent("");
    setCharacters(0);
    setStatus("New document");

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
    if (!canEditDocument) return;

    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? "");
      const html =
        file.type === "text/html"
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
    setActiveMenu((current) => (current === menu ? null : menu));
  };

  const renderMenu = () => {
    if (activeMenu === "File") {
      return (
        <>
          <button onClick={newDocument}>
            New <kbd>Ctrl+N</kbd>
          </button>
          <button onClick={() => fileInputRef.current?.click()}>
            Open… <kbd>Ctrl+O</kbd>
          </button>
          <button
            onClick={async () => {
              await save();

              setActiveMenu(null);
            }}
          >
            <Save size={16} />
            Save <kbd>Ctrl+S</kbd>
          </button>
          <i />
          <button onClick={download}>
            <Download size={16} />
            Download
          </button>
          <button onClick={() => window.print()}>
            <Printer size={16} />
            Print <kbd>Ctrl+P</kbd>
          </button>
        </>
      );
    }
    if (activeMenu === "Edit") {
      return (
        <>
          <button onClick={() => command("undo")}>
            <Undo2 size={16} />
            Undo <kbd>Ctrl+Z</kbd>
          </button>
          <button onClick={() => command("redo")}>
            <Redo2 size={16} />
            Redo <kbd>Ctrl+Y</kbd>
          </button>
          <i />
          <button onClick={() => command("selectAll")}>
            Select all <kbd>Ctrl+A</kbd>
          </button>
        </>
      );
    }
    if (activeMenu === "View") {
      return (
        <>
          <button
            onClick={() => document.documentElement.requestFullscreen?.()}
          >
            Full screen
          </button>
          <button onClick={() => command("selectAll")}>
            Show document area
          </button>
        </>
      );
    }
    if (activeMenu === "Insert") {
      return (
        <>
          <button
            onClick={() =>
              command("insertText", new Date().toLocaleDateString())
            }
          >
            Date
          </button>
          <button onClick={() => command("insertHorizontalRule")}>
            <Minus size={16} />
            Horizontal line
          </button>
          <button onClick={() => command("insertUnorderedList")}>
            <List size={16} />
            Bulleted list
          </button>
          <button onClick={() => command("insertOrderedList")}>
            <ListOrdered size={16} />
            Numbered list
          </button>
        </>
      );
    }
    if (activeMenu === "Format") {
      return (
        <>
          <button disabled={!canEditDocument} onClick={() => command("bold")}>
            <Bold size={16} />
            Bold <kbd>Ctrl+B</kbd>
          </button>

          <button disabled={!canEditDocument} onClick={() => command("italic")}>
            <Italic size={16} />
            Italic <kbd>Ctrl+I</kbd>
          </button>

          <button
            disabled={!canEditDocument}
            onClick={() => command("underline")}
          >
            <Underline size={16} />
            Underline <kbd>Ctrl+U</kbd>
          </button>

          <button
            disabled={!canEditDocument}
            onClick={() => command("strikeThrough")}
          >
            <Strikethrough size={16} />
            Strikethrough
          </button>

          <i />

          <button
            disabled={!canEditDocument}
            onClick={() => command("removeFormat")}
          >
            Clear formatting
          </button>
        </>
      );
    }
    if (activeMenu === "Tools") {
      return (
        <>
          <button onClick={() => command("selectAll")}>
            Word count: {characters} characters
          </button>
          <button onClick={() => window.alert("Spelling check complete.")}>
            Spelling and grammar
          </button>
        </>
      );
    }
    return (
      <>
        <button
          onClick={() =>
            window.alert(
              "Type in the page, select text, then use the toolbar to format it.",
            )
          }
        >
          Editor help
        </button>
        <button onClick={() => window.alert("Interactive Docs Editor")}>
          About
        </button>
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
          <button
            type="button"
            className="logo"
            aria-label="Back to documents home"
            title="Docs home"
            onClick={onBack}
          >
            D
          </button>
          <div>
            <input
              className="title"
              aria-label="Document title"
              value={title}
              disabled={!canEditDocument}
              onChange={(event) => {
                setTitle(event.target.value);
                setStatus("Saving...");
              }}
              onBlur={() => setStatus(canEditDocument ? "Saved" : "View only")}
            />
            <nav className="menus">
              {MENU_ITEMS.map((menu) => (
                <div className="menu-wrap" key={menu}>
                  <button onClick={(event) => toggleMenu(menu, event)}>
                    {menu}
                  </button>
                  {activeMenu === menu && (
                    <div
                      className="dropdown"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {renderMenu()}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        <div className="right">
          <span className="save-status">
            {canEditDocument ? status : "View only"}
          </span>
          <button
            className="share"
            onClick={shareDocument}
            disabled={!canShareDocument}
          >
            <Share2 size={16} />
            Share
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
            {accountInitial}
          </button>
          {accountOpen && (
            <div
              className="account-menu"
              onClick={(event) => event.stopPropagation()}
            >
              <strong>{accountEmail}</strong>
              <button onClick={() => setSignedIn(false)}>
                <LogOut size={17} />
                Sign out
              </button>
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
        <button title="Undo" onClick={() => command("undo")}>
          <Undo2 size={18} />
        </button>
        <button title="Redo" onClick={() => command("redo")}>
          <Redo2 size={18} />
        </button>
        <button title="Print" onClick={() => window.print()}>
          <Printer size={18} />
        </button>
        <div className="sep" />
        <label>
          <select
            aria-label="Paragraph style"
            defaultValue="p"
            onChange={(event) => command("formatBlock", event.target.value)}
          >
            <option value="p">Normal text</option>
            <option value="h1">Title</option>
            <option value="h2">Heading 1</option>
            <option value="h3">Heading 2</option>
          </select>
          <ChevronDown size={14} />
        </label>
        <label>
          <select
            aria-label="Font"
            defaultValue="Arial"
            onChange={(event) => command("fontName", event.target.value)}
          >
            <option>Arial</option>
            <option>Georgia</option>
            <option>Verdana</option>
            <option>Courier New</option>
          </select>
          <ChevronDown size={14} />
        </label>
        <label className="size-select">
          <select
            aria-label="Font size"
            defaultValue="3"
            onChange={(event) => command("fontSize", event.target.value)}
          >
            <option value="2">10</option>
            <option value="3">12</option>
            <option value="4">14</option>
            <option value="5">18</option>
            <option value="6">24</option>
            <option value="7">36</option>
          </select>
        </label>
        <div className="sep" />
        <button title="Bold" onClick={() => command("bold")}>
          <Bold size={18} />
        </button>
        <button title="Italic" onClick={() => command("italic")}>
          <Italic size={18} />
        </button>
        <button title="Underline" onClick={() => command("underline")}>
          <Underline size={18} />
        </button>
        <button title="Strikethrough" onClick={() => command("strikeThrough")}>
          <Strikethrough size={18} />
        </button>
        <label className="color" title="Text color">
          A
          <input
            type="color"
            onChange={(event) => command("foreColor", event.target.value)}
          />
        </label>
        <div className="sep" />
        <button title="Align left" onClick={() => command("justifyLeft")}>
          <AlignLeft size={18} />
        </button>
        <button title="Align center" onClick={() => command("justifyCenter")}>
          <AlignCenter size={18} />
        </button>
        <button title="Align right" onClick={() => command("justifyRight")}>
          <AlignRight size={18} />
        </button>
        <button
          title="Bulleted list"
          onClick={() => command("insertUnorderedList")}
        >
          <List size={18} />
        </button>
        <button
          title="Numbered list"
          onClick={() => command("insertOrderedList")}
        >
          <ListOrdered size={18} />
        </button>
      </div>

      <div className="workspace">
        <main className="editor-area">
          <div className="viewer-bar">
            {lockedBy && (
              <div className="lock-banner">
                🔒 {lockedBy.email} is editing...
              </div>
            )}
            {viewers.map((viewer) => (
              <span key={viewer.email}>👤 {viewer.email}</span>
            ))}
          </div>
          <div className="ruler" />
          <div
            ref={editorRef}
            className="paper"
            contentEditable={canEditDocument}
            suppressContentEditableWarning
            data-placeholder="Start typing your document…"
            onInput={() => {
              if (!lockedBy || lockedBy.email !== accountEmail) {
                stompClient.current.publish({
                  destination: "/app/lock",
                  body: JSON.stringify({
                    documentId,
                    email: accountEmail,
                  }),
                });
              }
              if (!canEditDocument) return;

              setStatus("Saving...");
              updateDocument();
              clearTimeout(unlockTimer.current);

              unlockTimer.current = setTimeout(() => {
                stompClient.current.publish({
                  destination: "/app/unlock",
                  body: JSON.stringify({
                    documentId,
                    email: accountEmail,
                  }),
                });
              }, 2000);

              if (stompClient.current?.connected) {
                stompClient.current.publish({
                  destination: "/app/document/update",
                  body: JSON.stringify({
                    documentId,
                    email: accountEmail,
                    content: editorRef.current.innerHTML,
                  }),
                });
              }
            }}
            onKeyDown={(event) => {
              if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "s"
              ) {
                event.preventDefault();
                if (canEditDocument) save();
              }
            }}
          />
        </main>
      </div>

      <footer>
        <span>{canEditDocument ? status : "View only"}</span>
        <span>{characters} characters</span>
      </footer>

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
