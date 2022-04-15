import React, { useEffect } from "react";
import { Card, Avatar } from "antd";
import { useRecoilState } from "recoil";
import { loggedInUser } from "../atom/globalState";
import { LogoutOutlined, WechatOutlined } from "@ant-design/icons";
import { getCurrentUser } from "../util/ApiUtil";
import "./Profile.css";

const { Meta } = Card;

const Profile = (props) => {
  const [currentUser, setLoggedInUser] = useRecoilState(loggedInUser);
  useEffect(() => {
    if (localStorage.getItem("accessToken") === null) {
      props.history.push("/login");
    }
    loadCurrentUser();
  }, []);

  const loadCurrentUser = () => {
    getCurrentUser()
      .then((response) => {
        setLoggedInUser(response);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    props.history.push("/login");
  };

  const tochat = () => {
    props.history.push("/chatNew");
  };


  return (
    <div className="profile-container">
      <Card
        style={{ width: 500 }}
        actions={[
      <WechatOutlined key="chatroom" onClick={tochat} />,
      <LogoutOutlined key="logout" onClick={logout} />,
        ]}
      >
        <Meta
          avatar={<Avatar src={currentUser.pictureUrl} className="user-avatar-circle" />}
          title={currentUser.userName}
          description={currentUser.email}
        />
      </Card>
    </div>
  );
};

export default Profile;
