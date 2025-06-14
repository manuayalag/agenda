import React, { useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar, Nav, NavDropdown, Button } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContextValue';

const MainLayout = () => {
  const { user, isAuthenticated, logout, isAdmin, isSectorAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="d-flex flex-column vh-100">
      <Navbar bg="primary" expand="lg" variant="dark" className="shadow">
        <Container>
          <Navbar.Brand as={Link} to="/dashboard">
            Sistema de Agendamiento Clínico
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link 
                as={Link} 
                to="/dashboard"
                active={location.pathname === '/dashboard'}
              >
                Dashboard
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/appointments"
                active={location.pathname.startsWith('/appointments')}
              >
                Citas
              </Nav.Link>
              
              {isSectorAdmin && (
                <>
                  <Nav.Link 
                    as={Link} 
                    to="/doctors"
                    active={location.pathname.startsWith('/doctors')}
                  >
                    Doctores
                  </Nav.Link>
                  
                  <Nav.Link 
                    as={Link} 
                    to="/patients"
                    active={location.pathname.startsWith('/patients')}
                  >
                    Pacientes
                  </Nav.Link>
                </>
              )}
                {isAdmin && (
                <NavDropdown 
                  title="Administración" 
                  id="admin-dropdown"
                  active={location.pathname.startsWith('/admin')}
                >
                  <NavDropdown.Item as={Link} to="/admin/users">
                    Usuarios
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/sectors">
                    Sectores
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/specialties">
                    Especialidades
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/sectors">
                    Sectores
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/specialties">
                    Especialidades
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
            
            <Nav>
              {isAuthenticated ? (
                <NavDropdown 
                  title={user?.fullName || 'Usuario'} 
                  id="user-dropdown"
                >
                  <NavDropdown.Item disabled>
                    {user?.role === 'admin' && 'Administrador'}
                    {user?.role === 'sector_admin' && 'Admin de Sector'}
                    {user?.role === 'doctor' && 'Doctor'}
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    Cerrar Sesión
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Nav.Link as={Link} to="/login">Iniciar Sesión</Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      <Container className="flex-grow-1 py-4">
        <Outlet />
      </Container>
      
      <footer className="bg-light py-3 border-top">
        <Container>
          <div className="text-center text-muted">
            <small>Sistema de Agendamiento Clínico &copy; {new Date().getFullYear()}</small>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default MainLayout;
