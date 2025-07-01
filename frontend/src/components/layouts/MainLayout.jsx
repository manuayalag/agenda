import React, { useContext, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContextValue';
import styles from './MainLayout.module.css';
import AuthenticatedNavLink from './AuthenticatedNavLink'; // 1. Importar el nuevo componente

const currentYear = new Date().getFullYear();

const MainLayout = () => {
  const { user, isAuthenticated, logout, isAdmin, isSectorAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const isAdminSectionActive = location.pathname.startsWith('/admin');

  return (
    <div className={`d-flex flex-column min-vh-100 ${styles.body}`}>
      <Navbar bg="primary" variant="dark" expand="lg" className={styles.mainNavbar}>
        <Container>
          <Navbar.Brand as={Link} to="/">
            <i className="bi bi-hospital"></i>
            Sistema de Agendamiento Clínico
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {/* 2. Usar el nuevo componente para simplificar el código */}
              <AuthenticatedNavLink to="/dashboard" icon="bi-speedometer2">Dashboard</AuthenticatedNavLink>
              <AuthenticatedNavLink to="/appointments" icon="bi-calendar2-week">Citas</AuthenticatedNavLink>
              <AuthenticatedNavLink to="/tickets" icon="bi-ticket-detailed">Tickets</AuthenticatedNavLink>
              
              {/* --- NUEVOS ACCESOS --- */}
              <NavLink
                to="/servicios"
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-1 ${isActive ? "active" : ""}`
                }
              >
                <i className="bi bi-gear"></i> Servicios
              </NavLink>
              <NavLink
                to="/seguros"
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-1 ${isActive ? "active" : ""}`
                }
              >
                <i className="bi bi-shield-check"></i> Seguros
              </NavLink>
              <NavLink
                to="/seguros/coberturas"
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-1 ${isActive ? "active" : ""}`
                }
              >
                <i className="bi bi-list-check"></i> Coberturas
              </NavLink>
              {/* --- FIN NUEVOS ACCESOS --- */}
              
              {isSectorAdmin && (
                <>
                  <AuthenticatedNavLink to="/doctors" icon="bi-person-badge">Doctores</AuthenticatedNavLink>
                  <AuthenticatedNavLink to="/patients" icon="bi-people">Pacientes</AuthenticatedNavLink>
                </>
              )}
              
              {isAdmin && (
                <NavDropdown title={<><i className="bi bi-gear"></i>Administración</>} id="admin-dropdown" active={isAdminSectionActive}>
                  <NavDropdown.Item as={Link} to="/admin/users"><i className="bi bi-person-lines-fill"></i> Usuarios</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/sectors"><i className="bi bi-diagram-3"></i> Sectores</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/specialties"><i className="bi bi-award"></i> Especialidades</NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
            <Nav>
              {isAuthenticated ? (
                <NavDropdown title={<><i className="bi bi-person-circle"></i> {user?.fullName || 'Usuario'}</>} id="user-dropdown" align="end">
                  <NavDropdown.Item disabled>
                    {user?.role === 'admin' && <><i className="bi bi-shield-lock"></i>Administrador</>}
                    {user?.role === 'sector_admin' && <><i className="bi bi-diagram-3"></i>Admin de Sector</>}
                    {user?.role === 'doctor' && <><i className="bi bi-person-badge"></i>Doctor</>}
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}><i className="bi bi-box-arrow-right"></i> Cerrar Sesión</NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Nav.Link as={Link} to="/login"><i className="bi bi-box-arrow-in-right"></i> Iniciar Sesión</Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      <Container className="flex-grow-1">
        <div className={styles.mainContentCard}>
          <Outlet />
        </div>
      </Container>
      
      <footer className={styles.mainFooter}>
        <Container>
          <div className="text-center text-muted">
            <small>
              <i className="bi bi-hospital"></i> Sistema de Agendamiento Clínico &copy; {currentYear}
            </small>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default MainLayout;