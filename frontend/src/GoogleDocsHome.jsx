// GoogleDocsHome.jsx
// NOTE: This is a starter of the redesigned version.
// Because the original component is extremely large, this file
// contains the redesigned layout skeleton and styling hooks.
// Replace your existing component with this structure and expand
// the mock data as needed.

import "./GoogleDocsHome.css";
import { Search, Plus, Grid3x3, List } from "lucide-react";

export default function GoogleDocsHome() {
  return (
    <div className="docs-app">
      <header className="docs-header">
        <div className="docs-logo">
          <span>Docs</span>
        </div>

        <div className="search-box">
          <Search size={20}/>
          <input placeholder="Search documents"/>
        </div>

        <div className="avatar">Y</div>
      </header>

      <div className="docs-body">
        <aside className="sidebar">
          <button className="new-btn">
            <Plus size={18}/> New
          </button>

          <nav>
            <button className="active">Recent</button>
            <button>Starred</button>
            <button>Shared with me</button>
            <button>Trash</button>
          </nav>
        </aside>

        <main className="content">
          <section className="templates">
            <h2>Start a new document</h2>

            <div className="template-row">
              <div className="template blank">+</div>
              <div className="template"></div>
              <div className="template"></div>
              <div className="template"></div>
              <div className="template"></div>
            </div>
          </section>

          <div className="toolbar">
            <span>Last opened by me</span>

            <div className="toggle">
              <button><Grid3x3 size={16}/></button>
              <button><List size={16}/></button>
            </div>
          </div>

          <section className="cards">
            {Array.from({length:8}).map((_,i)=>(
              <div className="card" key={i}>
                <div className="preview">
                  <div className="page">
                    <div className="strip"></div>
                    <div className="line w1"></div>
                    <div className="line w2"></div>
                    <div className="line w3"></div>
                    <div className="line w4"></div>
                  </div>
                </div>

                <div className="meta">
                  <h4>Document {i+1}</h4>
                  <span>Yesterday</span>
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
