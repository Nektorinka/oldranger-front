import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router-dom';

const ChatRoute = ({ isLogin, user, path, changeJoinChat, stompClient, component: Component }) => (
  <Route path={path}>
    {isLogin ? (
      <Component user={user} changeJoinChat={changeJoinChat} stompClient={stompClient} />
    ) : (
      <Redirect to="/login" />
    )}
  </Route>
);

export default ChatRoute;

ChatRoute.propTypes = {
  user: PropTypes.shape({
    nickName: PropTypes.string,
  }),
  isLogin: PropTypes.bool.isRequired,
  path: PropTypes.string.isRequired,
  component: PropTypes.elementType.isRequired,
  stompClient: PropTypes.objectOf().isRequired,
  changeJoinChat: PropTypes.func.isRequired,
};

ChatRoute.defaultProps = {
  user: {},
};
