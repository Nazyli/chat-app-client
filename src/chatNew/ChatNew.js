import React, { useCallback, useEffect, useState } from "react";
import { message } from "antd";

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
import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  Sidebar,
  Conversation,
  Avatar,
  ConversationHeader,
  AddUserButton,
  ArrowButton,
  MessageSeparator,
} from "@chatscope/chat-ui-kit-react";
import ConversationList from "@chatscope/chat-ui-kit-react/dist/cjs/ConversationList";

var stompClient = null;
const ChatNew = (props) => {
  const currentUser = useRecoilValue(loggedInUser);
  const [text, setText] = useState("");
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useRecoilState(chatActiveContact);
  const [messages, setMessages] = useRecoilState(chatMessages);

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarStyle, setSidebarStyle] = useState({});
  const [chatContainerStyle, setChatContainerStyle] = useState({});
  const [conversationContentStyle, setConversationContentStyle] = useState({});
  const [conversationAvatarStyle, setConversationAvatarStyle] = useState({});

  const handleBackClick = () => setSidebarVisible(!sidebarVisible);

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
      users.map((contact) => countNewMessages(contact.userId, currentUser.userId).then((count) => {
        contact.totalNewMessages = count;
        return contact;
      })
      )
    );

    promise.then((promises) => Promise.all(promises).then((users) => {
      setContacts(users);
      if (activeContact === undefined && users.length > 0) {
        setActiveContact(users[0]);
      }
    })
    );
  };

  const handleConversationClick = useCallback(() => {
    if (sidebarVisible) {
      setSidebarVisible(false);
    }
  }, [sidebarVisible, setSidebarVisible]);
  useEffect(() => {
    if (sidebarVisible) {
      setSidebarStyle({
        display: "flex",
        flexBasis: "auto",
        width: "100%",
        maxWidth: "100%"
      });
      setConversationContentStyle({
        display: "flex"
      });
      setConversationAvatarStyle({
        marginRight: "1em"
      });
      setChatContainerStyle({
        display: "none"
      });
    } else {
      setSidebarStyle({});
      setConversationContentStyle({});
      setConversationAvatarStyle({});
      setChatContainerStyle({});
    }
  }, [sidebarVisible, setSidebarVisible, setConversationContentStyle, setConversationAvatarStyle, setSidebarStyle, setChatContainerStyle]);

  const logout = () => {
    localStorage.removeItem("accessToken");
    props.history.push("/login");
  };

  return <div style={{
    height: "600px",
    position: "relative"
  }}>
    <MainContainer responsive>
      <Sidebar position="left" scrollable={false} style={sidebarStyle}>
        <ConversationHeader>
          <ConversationHeader />
          <Avatar src={currentUser.pictureUrl} name="Emily" />
          <ConversationHeader.Content userName={currentUser.email} info="Active 10 mins ago" />
          <ConversationHeader.Actions>
            <AddUserButton />
            <ArrowButton direction="right" onClick={logout}/>
            {/* <InfoButton title="Show info" /> */}
          </ConversationHeader.Actions>
        </ConversationHeader>
        <ConversationList>

          {contacts.map((contact) => (
            <Conversation onClick={() => { setActiveContact(contact); handleConversationClick() }} lastActivityTime="43 min" active={activeContact && contact.userId === activeContact.userId ? true : false}>
              <Avatar src={contact.pictureUrl} name={contact.email} status="available" style={conversationAvatarStyle} />
              <Conversation.Content name={contact.email} info=
                {contact.totalNewMessages !== undefined && contact.totalNewMessages > 0 ?
                  contact.totalNewMessages + " new messages "
                  : "Yes i can do it for you"} style={conversationContentStyle} />

            </Conversation>
          ))}
        </ConversationList>
      </Sidebar>
      <ChatContainer style={chatContainerStyle}>
        <ConversationHeader>
          <ConversationHeader.Back onClick={handleBackClick} />
          <Avatar src={activeContact && activeContact.pictureUrl} name={activeContact && activeContact.email} />
          <ConversationHeader.Content userName={activeContact && activeContact.email} info="Active 10 mins ago" />
        </ConversationHeader>
        <MessageList>
          <MessageSeparator content="thursday, 15 July 2021" />

          {messages.map((msg) => (
            <Message model={{
              message: msg.content,
              direction: msg.senderId === currentUser.userId ? "outgoing" : "incoming",
              position: "single"
            }}>
              {msg.senderId !== currentUser.userId && (
                <Avatar src={activeContact.pictureUrl} name={msg.senderId} />
              )}
            </Message>
          ))}

        </MessageList>
        <MessageInput
          value={text}
          onChange={(event) => (
            setText(event)
          )
          }
          onKeyPress={(event) => {
            if (event.key === "Enter") {
              sendMessage(text);
              setText("");
            }
          }}
          onClick={() => {
            sendMessage(text);
            setText("");
          }}
          placeholder="Type message here" attachButton={false} />
      </ChatContainer>
    </MainContainer>
  </div>;
}

export default ChatNew;
