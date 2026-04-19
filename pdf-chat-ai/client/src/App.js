import React, { useState, useRef, useEffect } from 'react';
import { Upload, Folder, Clock, Star, Archive, HelpCircle, HardDrive, Bell, Settings, Plus, FileText, Search, MessageSquare, FileUp, Library } from "lucide-react";
import './index.css';

function App() {
  const [, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingMsg, setLoadingMsg] = useState(false);

  const endOfMessagesRef = useRef(null);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto upload upon selection
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          setUploaded(true);
          setMessages([{ role: "ai", text: `I've successfully analyzed "${selectedFile.name}". What would you like to know about it?` }]);
        } else {
          alert("Upload failed: " + data.error);
        }
      } catch (err) {
        alert("Error: " + err.message);
      }
      setUploading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const newMsgs = [...messages, { role: "user", text: question }];
    setMessages(newMsgs);
    setQuestion("");
    setLoadingMsg(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages([...newMsgs, { role: "ai", text: data.answer }]);
      } else {
        setMessages([...newMsgs, { role: "ai", text: "Error: " + data.error }]);
      }
    } catch (err) {
      setMessages([...newMsgs, { role: "ai", text: "Error: " + err.message }]);
    }
    setLoadingMsg(false);
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="app-wrapper">
      {/* Top Navbar */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="logo">PDF AI</div>
          <nav className="nav-links">
            <button className="active">Workspace</button>
            <button>Analysis</button>
            <button>History</button>
          </nav>
        </div>
        <div className="topbar-right">
          <button className="upgrade-btn">Upgrade Plan</button>
          <div className="icon-btn"><Bell size={20} /></div>
          <div className="icon-btn"><Settings size={20} /></div>
          <div className="avatar">
            <img src="https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff" alt="User avatar" />
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="main-layout">
        
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="library-header">
            <div className="library-icon-bg">
              <Library size={18} />
            </div>
            <div>
              <h3>LIBRARY</h3>
              <p>DOCUMENT MANAGEMENT</p>
            </div>
          </div>
          
          <label className={`upload-btn-sidebar ${uploading ? 'disabled' : ''}`} htmlFor="file-upload">
             <Upload size={18} /> {uploading ? 'Uploading...' : 'Upload PDF'}
          </label>
          <input type="file" accept="application/pdf" id="file-upload" hidden onChange={handleFileChange} disabled={uploading} />

          {/* MAIN menu */}
          <div className="menu-group">
            <h4>MAIN</h4>
            <ul>
              <li className="active"><Folder size={18}/> All Documents</li>
              <li><Clock size={18}/> Recent</li>
              <li><Star size={18}/> Starring</li>
              <li><Archive size={18}/> Archived</li>
            </ul>
          </div>

          {/* SYSTEM menu */}
          <div className="menu-group">
            <h4>SYSTEM</h4>
            <ul>
              <li><HelpCircle size={18}/> Help Center</li>
              <li><HardDrive size={18}/> Storage</li>
            </ul>
          </div>

          {/* Storage Bar */}
          <div className="storage-widget">
            <div className="storage-text">
              <span>Free Plan Storage</span>
              <span>85%</span>
            </div>
            <div className="storage-bar"><div className="storage-fill" style={{width: '85%'}}></div></div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="content">
          
          {/* Default View (Landing) */}
          {!uploaded && messages.length === 0 && (
            <div className="landing-view">
               <div className="hero-section">
                  <h1>The Intelligence<br/><span className="text-blue">Chat Pdf Ai.</span></h1>
                  <p>Analyze, summarize, and query your documents with our professional-grade AI assistant. Start a new conversation by uploading a file.</p>
               </div>
               
               <div className="action-cards">
                  <div className="card" onClick={() => document.getElementById('file-upload').click()}>
                     <div className="card-icon blue"><FileUp size={24}/></div>
                     <h3>Upload PDF</h3>
                     <p>Drop your document here to begin the analysis.</p>
                  </div>
                  <div className="card">
                     <div className="card-icon gray"><Search size={24}/></div>
                     <h3>Library Search</h3>
                     <p>Find a document from your existing collection.</p>
                  </div>
                  <div className="card">
                     <div className="card-icon cyan"><MessageSquare size={24}/></div>
                     <h3>Recent Chats</h3>
                     <p>Resume your most recent PDF interrogation.</p>
                  </div>
               </div>

               <div className="supported-files">
                  <span>SUPPORTED FILES</span>
                  <span className="badge">PDF</span>
                  <span className="badge">DOCX</span>
                  <span className="badge">TXT</span>
               </div>
            </div>
          )}

          {/* Chat View */}
          {(uploaded || messages.length > 0) && (
             <div className="chat-view">
               <div className="chat-history">
                 {messages.map((msg, idx) => (
                   <div key={idx} className={`message-wrapper ${msg.role}`}>
                     <div className="message-bubble">
                       {msg.text}
                     </div>
                   </div>
                 ))}
                 {loadingMsg && (
                   <div className="message-wrapper ai">
                     <div className="message-bubble loading">
                       <div className="dot"></div>
                       <div className="dot"></div>
                       <div className="dot"></div>
                     </div>
                   </div>
                 )}
                 <div ref={endOfMessagesRef} />
               </div>
             </div>
          )}

          {/* Chat Input Pill */}
          <div className="chat-input-wrapper">
             <form className="chat-input-pill" onSubmit={handleSend}>
                <FileText size={20} className="file-icon" />
                <input 
                  type="text" 
                  placeholder={uploading ? "Uploading document..." : (uploaded ? "Ask a question about your PDF..." : "Upload a PDF to start chatting...")}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={!uploaded || loadingMsg || uploading}
                />
                <button type="submit" className="add-btn" disabled={!uploaded || loadingMsg || !question.trim() || uploading}>
                   <Plus size={20} />
                </button>
             </form>
          </div>

        </main>
      </div>
    </div>
  );
}

export default App;
