import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const AuthenticatedNavLink = ({ to, icon, children }) => {
  const location = useLocation();
  
  // El link está activo si la ruta actual es exacta, o si es la raíz del dashboard.
  const isActive = location.pathname.startsWith(to) && to !== '/dashboard' || location.pathname === to;

  return (
    <Nav.Link 
      as={Link} 
      to={to}
      active={isActive}
    >
      <i className={`bi ${icon}`}></i>
      {children}
    </Nav.Link>
  );
};

export default AuthenticatedNavLink;