import React, { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC7_vRqpXo_S0sNnRXeqR-vKvnT_X20tmc",
  authDomain: "hellocafe-c7b2d.firebaseapp.com",
  databaseURL: "https://console.firebase.google.com/u/0/project/hellocafe-c7b2d/database/hellocafe-c7b2d-default-rtdb/data/~2F",
  projectId: "hellocafe-c7b2d",
  storageBucket: "hellocafe-c7b2d.appspot.com",
  messagingSenderId: "531545421963",
  appId: "1:531545421963:web:1419be80d8814efe47bc8e",
  measurementId: "G-N3W168ZN2B"
};




// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const App = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Fetch all conversations
  useEffect(() => {
    const q = query(collection(db, "Conversations"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setConversations(data);
    });
    return () => unsubscribe();
  }, []);

  // Fetch messages for the selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

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
  }, [selectedConversation]);

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
