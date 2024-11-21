import React, { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const App = () => {
  const [user, setUser] = useState(null); // Track logged-in user
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Handle login
  const login = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
    } catch (error) {
      console.error("Login failed:", error.message);
    }
  };

  // Handle logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setConversations([]);
    setMessages([]);
  };

  // Fetch conversations after login
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "Conversations"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setConversations(data);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch messages for the selected conversation
  useEffect(() => {
    if (!selectedConversation || !user) return;

    const q = query(
      collection(db, `Conversations/${selectedConversation.id}/Messages`),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(data);
    });
    return () => unsubscribe();
  }, [selectedConversation, user]);

  // Send a new message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageData = {
      senderId: "support",
      text: newMessage.trim(),
      timestamp: new Date(),
    };

    try {
      await addDoc(
        collection(db, `Conversations/${selectedConversation.id}/Messages`),
        messageData
      );
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }, [newMessage, selectedConversation]);

  // Render login form if not logged in
  if (!user) {
    return (
      <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        <button onClick={login} style={{ padding: "10px 20px" }}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar for conversations */}
      <div
        style={{
          width: "30%",
          borderRight: "1px solid #ddd",
          overflowY: "auto",
          padding: "10px",
        }}
      >
        <h2>Conversations</h2>
        <button onClick={logout} style={{ marginBottom: "10px" }}>
          Logout
        </button>
        <ul>
          {conversations.map((convo) => (
            <li
              key={convo.id}
              style={{
                padding: "10px",
                cursor: "pointer",
                backgroundColor:
                  selectedConversation?.id === convo.id ? "#f0f0f0" : "#fff",
              }}
              onClick={() => setSelectedConversation(convo)}
            >
              {convo.id}
            </li>
          ))}
        </ul>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {selectedConversation ? (
          <>
            <h2>Chat with {selectedConversation.id}</h2>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "10px",
                background: "#fafafa",
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    textAlign: msg.senderId === "support" ? "right" : "left",
                    margin: "10px 0",
                  }}
                >
                  <p
                    style={{
                      display: "inline-block",
                      padding: "10px",
                      borderRadius: "10px",
                      background:
                        msg.senderId === "support" ? "#cce5ff" : "#e2e2e2",
                    }}
                  >
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", padding: "10px", background: "#fff" }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  marginRight: "10px",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                }}
              />
              <button onClick={sendMessage} style={{ padding: "10px 20px" }}>
                Send
              </button>
            </div>
          </>
        ) : (
          <h2>Select a conversation to view messages</h2>
        )}
      </div>
    </div>
  );
};

export default App;
