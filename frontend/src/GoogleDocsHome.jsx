import "./GoogleDocsHome.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Grid3x3,
  List,
  LogOut,
  MoreVertical,
  Plus,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react";

const API_BASE = "http://localhost:8080/api/document";

function formatDocumentDate(value) {
  if (!value) return "No date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getPlainDocumentText(content = "") {
  return content
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function createPreviewText(content = "") {
  return getPlainDocumentText(content) || "Blank document";
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

export default function GoogleDocsHome({
  onNewDocument,
  onOpenDocument,
  onLogout,
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeView, setActiveView] = useState("recent");
  const [openDocumentMenu, setOpenDocumentMenu] = useState(null);
  const accountEmail = localStorage.getItem("email") || "Not signed in";
  const accountInitial = accountEmail.charAt(0).toUpperCase();
  const accountMenuRef = useRef(null);
  const documentMenuRef = useRef(null);

  const loadDocuments = async (view = activeView) => {
    const ownerEmail = localStorage.getItem("email") || "";
    const endpoint =
      view === "shared"
        ? `${API_BASE}/sharedWith?email=${encodeURIComponent(ownerEmail)}`
        : `${API_BASE}/recent`;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(endpoint, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        onLogout();
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load documents.");
      }

      const data = await response.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load your documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDocuments(activeView);
  }, [activeView]);

  useEffect(() => {
    const closeMenus = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }

      if (!documentMenuRef.current?.contains(event.target)) {
        setOpenDocumentMenu(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
        setOpenDocumentMenu(null);
      }
    };

    document.addEventListener("mousedown", closeMenus);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", closeMenus);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return documents;

    return documents.filter((document) => {
      const searchableText = [
        document.title || "Untitled Document",
        getPlainDocumentText(document.content),
        document.ownerEmail || "",
        formatDocumentDate(document.updatedAt),
        formatDocumentDate(document.createdAt),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [documents, query]);

  const hasSearchQuery = query.trim().length > 0;

  const shareDocument = async (document) => {
    const title = document.title || "Untitled Document";
    const email = askShareEmail(title);
    if (!email) return;

    try {
      const canEdit = window.confirm(
    "Press OK to give Edit permission.\n\nPress Cancel for View-only."
);

const response = await fetch(
    `${API_BASE}/share`,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
            documentId: document.id,
            email,
            canRead: true,
            canEdit,
        }),
    }
);

      if (!response.ok) {
        throw new Error("Unable to share document.");
      }

      setOpenDocumentMenu(null);
      window.alert(`"${title}" shared with ${email}.`);
    } catch (err) {
      console.error(err);
      window.alert("Unable to share document.");
    }
  };

  const openDocument = async (document) => {
    try {
      const response = await fetch(`${API_BASE}/openDocument/${document.id}`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        onLogout();
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to open document.");
      }

      const openedDocument = await response.json();
      onOpenDocument(openedDocument);
    } catch (err) {
      console.error(err);
      window.alert("Unable to open document.");
    }
  };

  const deleteDocument = async (documentId) => {
    const confirmed = window.confirm("Delete this document?");
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE}/deleteDoc/${documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });

      if (!response.ok) {
        throw new Error("Unable to delete document.");
      }

      setDocuments((currentDocuments) =>
        currentDocuments.filter((document) => document.id !== documentId),
      );
      setOpenDocumentMenu(null);
    } catch (err) {
      console.error(err);
      window.alert("Unable to delete document.");
    }
  };

  return (
    <div className="docs-app">
      <header className="docs-header">
        <div className="docs-logo">
          <span>Docs</span>
        </div>

        <div className="search-box">
          <Search size={20} />
          <input
            placeholder="Search documents"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {hasSearchQuery && (
            <button
              type="button"
              className="clear-search"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="account" ref={accountMenuRef}>
          <button
            type="button"
            className="avatar"
            aria-label="Open account menu"
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            onClick={() => setAccountMenuOpen((open) => !open)}
          >
            {accountInitial}
          </button>

          {accountMenuOpen && (
            <div className="account-dropdown" role="menu">
              <div className="account-details">
                <strong>{accountEmail}</strong>
              </div>
              <button type="button" role="menuitem" onClick={onLogout}>
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="docs-body">
        <aside className="sidebar">
          <button className="new-btn" onClick={onNewDocument}>
            <Plus size={18} /> New
          </button>

          <nav>
            <button
              type="button"
              className={activeView === "recent" ? "active" : ""}
              onClick={() => setActiveView("recent")}
            >
              Recent
            </button>
            <button
              type="button"
              className={activeView === "shared" ? "active" : ""}
              onClick={() => setActiveView("shared")}
            >
              Shared with me
            </button>
          </nav>
        </aside>

        <main className="content">
          {activeView === "recent" && (
            <section className="templates">
              <h2>Start a new document</h2>

              <div className="template-row">
              <button
                type="button"
                className="template blank"
                aria-label="Create a blank document"
                onClick={onNewDocument}
              >
                +
              </button>
              <div className="template"></div>
              <div className="template"></div>
              <div className="template"></div>
              <div className="template"></div>
              </div>
            </section>
          )}

          <div className="toolbar">
            <span>{activeView === "shared" ? "Shared with me" : "Last opened by me"}</span>

            <div className="toggle">
              <button type="button" aria-label="Grid view">
                <Grid3x3 size={16} />
              </button>
              <button type="button" aria-label="List view">
                <List size={16} />
              </button>
            </div>
          </div>

          {loading && <p className="docs-state">Loading documents...</p>}
          {error && !loading && <p className="docs-state error">{error}</p>}
          {!loading && !error && filteredDocuments.length === 0 && (
            <div className="empty-docs">
              <FileText size={34} />
              <h3>{hasSearchQuery ? "No matching documents" : "No documents found"}</h3>
              <p>
                {hasSearchQuery
                  ? `No results for "${query.trim()}".`
                  : activeView === "shared"
                    ? "Documents shared with you will appear here."
                    : "Create a new document to see it here."}
              </p>
            </div>
          )}

          {!loading && !error && filteredDocuments.length > 0 && (
            <section className="cards">
              {filteredDocuments.map((document) => {
                const canManageDocument = document.ownerEmail === accountEmail;

                return (
                <div
                  className="card"
                  key={document.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDocument(document)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") openDocument(document);
                  }}
                >
                  <div className="preview">
                    <div className="page">
                      <div className="strip"></div>
                      <p className="preview-text">
                        {createPreviewText(document.content)}
                      </p>
                    </div>
                  </div>

                  <div className="meta">
                    <div className="meta-copy">
                      <h4>{document.title || "Untitled Document"}</h4>
                      <span>{formatDocumentDate(document.updatedAt)}</span>
                    </div>

                    <div
                      className="document-actions"
                      ref={openDocumentMenu === document.id ? documentMenuRef : null}
                    >
                      <button
                        type="button"
                        className="document-menu-btn"
                        aria-label={`Open options for ${document.title || "Untitled Document"}`}
                        aria-haspopup="menu"
                        aria-expanded={openDocumentMenu === document.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenDocumentMenu((current) =>
                            current === document.id ? null : document.id,
                          );
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openDocumentMenu === document.id && (
                        <div className="document-menu" role="menu">
                          {canManageDocument && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={(event) => {
                                event.stopPropagation();
                                shareDocument(document);
                              }}
                            >
                              <Share2 size={16} />
                              Share
                            </button>
                          )}
                          {canManageDocument && (
                            <button
                              type="button"
                              role="menuitem"
                              className="danger"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteDocument(document.id);
                              }}
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          )}
                          {!canManageDocument && (
                            <span className="document-menu-note">Shared document</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
