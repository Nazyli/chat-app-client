import { browserHistory } from 'react-router';
const CHAT_SERVICE = "http://192.168.1.78:8080";


const request = (options) => {
  const headers = new Headers();

  if (options.setContentType !== false) {
    headers.append("Content-Type", "application/json");
  }

  if (localStorage.getItem("accessToken")) {
    headers.append(
      "Authorization",
      "Bearer " + localStorage.getItem("accessToken")
    );
  }

  const defaults = { headers: headers };
  options = Object.assign({}, defaults, options);

  return fetch(options.url, options).then((response) =>
    response.json().then((json) => {
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
        }
        return Promise.reject(json);
      }
      return json;
    })
  );
};

export function login(loginRequest) {
  return request({
    url: CHAT_SERVICE + "/auth/signin",
    method: "POST",
    body: JSON.stringify(loginRequest),
  });
}


export function signup(signupRequest) {
  return request({
    url: CHAT_SERVICE + "/auth/signup",
    method: "POST",
    body: JSON.stringify(signupRequest),
  });
}

export function getCurrentUser() {
  if (!localStorage.getItem("accessToken")) {
    return Promise.reject("No access token set.");
  }

  return request({
    url: CHAT_SERVICE + "/rest/users/me",
    method: "GET",
  });
}

export function findAllConversation() {
  if (!localStorage.getItem("accessToken")) {
    return Promise.reject("No access token set.");
  }

  return request({
    url: CHAT_SERVICE + "/rest/users/findAllConversation",
    method: "GET",
  });
}

export function countNewMessages(senderId, recipientId) {
  if (!localStorage.getItem("accessToken")) {
    return Promise.reject("No access token set.");
  }

  return request({
    url: CHAT_SERVICE + "/rest/messages/count?senderId=" + senderId + "&recipientId=" + recipientId,
    method: "GET",
  });
}

export function findAllChatMessages(senderId, recipientId) {
  if (!localStorage.getItem("accessToken")) {
    return Promise.reject("No access token set.");
  }

  return request({
    url: CHAT_SERVICE + "/rest/messages/findAll?senderId=" + senderId + "&recipientId=" + recipientId,
    method: "GET",
  });
}

export function findChatMessageById(id) {
  if (!localStorage.getItem("accessToken")) {
    return Promise.reject("No access token set.");
  }

  return request({
    url: CHAT_SERVICE + "/rest/messages/findById" + id,
    method: "GET",
  });
}
