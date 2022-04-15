import React, { useEffect, useState } from "react";
import { Button, message } from "antd";
import {
  getUsers,
  countNewMessages,
  findChatMessages,
  findChatMessage,
} from "../util/ApiUtil";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  loggedInUser,
  chatActiveContact,
  chatMessages,
} from "../atom/globalState";
import ScrollToBottom from "react-scroll-to-bottom";
import "./Chat.css";

var stompClient = null;
const Chat = (props) => {
  const currentUser = useRecoilValue(loggedInUser);
  const [text, setText] = useState("");
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useRecoilState(chatActiveContact);
  const [messages, setMessages] = useRecoilState(chatMessages);

  useEffect(() => {
    if (localStorage.getItem("accessToken") === null) {
      props.history.push("/login");
    }
    connect();
    loadContacts();
  }, []);

  useEffect(() => {
    if (activeContact === undefined) return;
    findChatMessages(activeContact.userId, currentUser.userId).then((msgs) =>
      setMessages(msgs)
    );
    loadContacts();
  }, [activeContact]);

  const connect = () => {
    const Stomp = require("stompjs");
    var SockJS = require("sockjs-client");
    SockJS = new SockJS("http://192.168.1.78:8080/ws?access_token=" + localStorage.getItem("accessToken"));
    stompClient = Stomp.over(SockJS);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    console.log("connected");
    console.log(currentUser);
    stompClient.subscribe(
      "/user/" + currentUser.userId + "/queue/messages",
      onMessageReceived
    );
  };

  const onError = (err) => {
    console.log(err);
  };

  const onMessageReceived = (msg) => {
    const notification = JSON.parse(msg.body);
    const active = JSON.parse(sessionStorage.getItem("recoil-persist")).chatActiveContact;
    if (active.userId === notification.senderId) {
      findChatMessage(notification.id).then((message) => {
        const newMessages = JSON.parse(sessionStorage.getItem("recoil-persist"))
          .chatMessages;
        newMessages.push(message);
        setMessages(newMessages);
      });
    } else {
      message.info("Received a new message from " + notification.senderName);
    }
    loadContacts();
  };
  

  const sendMessage = (msg) => {
    if (msg.trim() !== "") {
      const message = {
        senderId: currentUser.userId,
        recipientId: activeContact.userId,
        content: msg
      };
      stompClient.send("/app/chat", {}, JSON.stringify(message));

      const newMessages = [...messages];
      newMessages.push(message);
      setMessages(newMessages);
    }
  };

  const loadContacts = () => {
    const promise = getUsers().then((users) =>
      users.map((contact) =>
        countNewMessages(contact.userId, currentUser.userId).then((count) => {
          contact.newMessages = count;
          return contact;
        })
      )
    );

    promise.then((promises) =>
      Promise.all(promises).then((users) => {
        setContacts(users);
        if (activeContact === undefined && users.length > 0) {
          setActiveContact(users[0]);
        }
      })
    );
  };

  return (
    <div id="frame">
      <div id="sidepanel">
        <div id="profile">
          <div class="wrap">
            <img
              id="profile-img"
              src={currentUser.pictureUrl}
              class="online"
              alt=""
            />
            <p>{currentUser.email}</p>
            <div id="status-options">
              <ul>
                <li id="status-online" class="active">
                  <span class="status-circle"></span> <p>Online</p>
                </li>
                <li id="status-away">
                  <span class="status-circle"></span> <p>Away</p>
                </li>
                <li id="status-busy">
                  <span class="status-circle"></span> <p>Busy</p>
                </li>
                <li id="status-offline">
                  <span class="status-circle"></span> <p>Offline</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div id="search" />
        <div id="contacts">
          <ul>
            {contacts.map((contact) => (
              <li
                onClick={() => setActiveContact(contact)}
                class={
                  activeContact && contact.userId === activeContact.userId
                    ? "contact active"
                    : "contact"
                }
              >
                <div class="wrap">
                  <span class="contact-status online"></span>
                  <img id={contact.userId} src={contact.pictureUrl} alt="" />
                  <div class="meta">
                    <p class="name">{contact.email}</p>
                    {contact.newMessages !== undefined &&
                      contact.newMessages > 0 && (
                        <p class="preview">
                          {contact.newMessages} new messages
                        </p>
                      )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div id="bottom-bar">
          <button id="addcontact">
            <i class="fa fa-user fa-fw" aria-hidden="true"></i>{" "}
            <span>Profile</span>
          </button>
          <button id="settings">
            <i class="fa fa-cog fa-fw" aria-hidden="true"></i>{" "}
            <span>Settings</span>
          </button>
        </div>
      </div>
      <div class="content">
        <div class="contact-profile">
          <img src={activeContact && activeContact.pictureUrl} alt="" />
          <p>{activeContact && activeContact.email}</p>
        </div>
        <ScrollToBottom className="messages">
          <ul>
            {messages.map((msg) => (
              <li class={msg.senderId === currentUser.userId ? "sent" : "replies"}>
                {msg.senderId !== currentUser.userId && (
                  <img src={activeContact.pictureUrl} alt="" />
                )}
                <p>{msg.content}</p>
              </li>
            ))}
          </ul>
        </ScrollToBottom>
        <div class="message-input">
          <div class="wrap">
            <input
              name="user_input"
              size="large"
              placeholder="Write your message..."
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyPress={(event) => {
                if (event.key === "Enter") {
                  sendMessage(text);
                  setText("");
                }
              }}
            />

            <Button
              icon={<i class="fa fa-paper-plane" aria-hidden="true"></i>}
              onClick={() => {
                sendMessage(text);
                setText("");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
