import React from 'react';
import { Navigate } from 'react-router-dom';
import { useNDK } from '../hooks/useNDK';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { publicKey } = useNDK();

  if (!publicKey) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;