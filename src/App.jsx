import React from 'react';
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { Spin } from 'antd';
import 'antd/dist/antd.css';

import queries from './serverQueries';
import {
  ArticleDraft,
  PrivateRoute,
  CommonRoute,
  AuthRoute,
  TopicRoute,
  SubsectionRoute,
  SearchRoute,
  ArticlesRoute,
  ChatRoute,
} from './routes';
import Context from './components/Context';
import Header from './components/layouts/Header';
import Profile from './components/Profile';
import ChatAuth from './components/Chat/ChatAuth';
import PrivateChat from './components/Chat/PrivateChat';
import AdminPanel from './components/AdminPanel';
import ProfileAnotherUser from './components/Profile/ProfileAnotherUser';
import { BASE_URL } from './constants';
import AuthorizationStatusEmitter from './EventEmitter/EventEmmiter';

const url = BASE_URL;

class App extends React.Component {
  constructor(props) {
    super(props);
    let initialState = { user: {}, isLogin: false };
    if (localStorage.getItem('user')) {
      const user = JSON.parse(localStorage.getItem('user') || {});
      initialState = {
        user,
        isLogin: true,
        isJoinChat: false,
        countMessages: 0,
        stompClient: null,
      };
    }
    this.state = { ...initialState };
  }

  componentDidMount = async () => {
    const { isLogin } = this.state;
    if (isLogin) {
      await this.connect();
    }
    this.сonnect();

    AuthorizationStatusEmitter.subscribe(isAuthorized => {
      if (!isAuthorized) {
        localStorage.clear();
        this.setState({
          isLogin: false,
        });
        this.disconnect();
      }
    });
  };

  connect = async () => {
    const currentUser = await queries.getCurrentUser();
    if (currentUser.username) {
      const socket = await new SockJS(`${url}ws`, null, {});
      this.stompClient = await Stomp.over(socket);
      this.stompClient.connect({}, this.onConnected, () => {});
      const waitConnection = () => {
        const timeoutID = setTimeout(() => {
          if (this.stompClient.ws.readyState === 1) {
            this.setState({ stompClient: this.stompClient });
            clearTimeout(timeoutID);
          } else {
            waitConnection();
          }
        }, 200);
      };
      waitConnection();
    }
  };

  changeJoinChat = isJoin => {
    this.setState({ isJoinChat: isJoin, countMessages: 0 });
  };

  сonnect = () => {
    this.setState({ connect: true });
  };

  onConnected = async () => {
    await this.stompClient.subscribe(`/channel/public`, this.onCheckMessage, {});
  };

  disconnect = () => {
    const { stompClient } = this.state;
    if (stompClient) {
      this.stompClient.unsubscribe(`/channel/public`);
      this.stompClient.disconnect();
    }
  };

  onCheckMessage = payload => {
    const message = JSON.parse(payload.body);
    if (message.id) {
      this.setState(state => ({
        countMessages: state.isJoinChat ? 0 : state.countMessages + 1,
      }));
    }
  };

  changeLoginState = () => {
    this.setState(({ isLogin }) => ({
      isLogin: !isLogin,
    }));
  };

  changeUserState = data => {
    this.setState({ user: { ...data } });
  };

  logOut = async () => {
    localStorage.removeItem('user');
    queries.logOut();
    this.disconnect();
    this.setState({ isLogin: false, user: {} });
  };

  render() {
    const {
      isLogin,
      user: { role },
      user,
      countMessages,
      stompClient,
      connect,
    } = this.state;
    return (
      <Context.Provider
        value={{
          changeUserState: this.changeUserState,
          changeLoginState: this.changeLoginState,
          logOut: this.logOut,
          ...this.state,
        }}
      >
        <Header countMessages={countMessages} />
        <CommonRoute />
        <AuthRoute isLogin={isLogin} connect={this.connect} />
        <PrivateRoute isAllowed={isLogin} path="/profile" component={Profile} />
        <PrivateRoute
          isAllowed={isLogin}
          exact
          path="/anotheruser/:id"
          component={ProfileAnotherUser}
        />
        <PrivateRoute
          isAllowed={isLogin && role === 'ROLE_ADMIN'}
          path="/admin-panel"
          component={AdminPanel}
        />
        <TopicRoute isLogin={isLogin} role={role} />
        <SubsectionRoute />
        <SearchRoute />
        <ArticleDraft />
        <ArticlesRoute isLogin={isLogin} role={role} />
        {/* TODO delete eslint disable */}
        {/* eslint-disable-next-line no-undef */}
        {connect ? (
          <ChatRoute
            path="/"
            isLogin={isLogin}
            changeJoinChat={this.changeJoinChat}
            stompClient={stompClient}
            user={user}
            component={ChatAuth}
          />
        ) : (
          <Spin />
        )}
        <ChatRoute
          exact
          path="/private/:id"
          isLogin={isLogin}
          user={user}
          component={PrivateChat}
        />
      </Context.Provider>
    );
  }
}

export default App;
