import React, { useContext, useCallback } from 'react';
import { Outlet, Link, useNavigate, NavLink } from 'react-router-dom';
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContextValue';
import styles from './MainLayout.module.css';
import AuthenticatedNavLink from './AuthenticatedNavLink';

const currentYear = new Date().getFullYear();

const MainLayout = () => {
  const { user, logout, isAdmin, isSectorAdmin, isDoctor } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  return (
    <div className={`d-flex flex-column min-vh-100 ${styles.body}`}>
      <Navbar bg="primary" variant="dark" expand="lg" className={styles.mainNavbar}>
        <Container>
          <Navbar.Brand as={Link} to="/dashboard">
            <i className="bi bi-hospital"></i>
            <span> Sistema de Agendamiento</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {/* --- ENLACES PRINCIPALES --- */}
              <AuthenticatedNavLink to="/dashboard" icon="bi-speedometer2">Dashboard</AuthenticatedNavLink>
              <AuthenticatedNavLink to="/appointments" icon="bi-calendar2-week">Citas</AuthenticatedNavLink>
              
              {(isAdmin || isSectorAdmin) && (
                <AuthenticatedNavLink to="/tickets" icon="bi-ticket-detailed">Tickets</AuthenticatedNavLink>
              )}

              {/* --- DROPDOWN DE GESTIÓN CLÍNICA --- */}
              {(isAdmin || isSectorAdmin) && (
                <NavDropdown title={<><i className="bi bi-heart-pulse"></i> Gestión Clínica</>} id="clinic-dropdown">
                  {isAdmin && <NavDropdown.Item as={NavLink} to="/doctors"><i className="bi bi-person-badge"></i> Doctores</NavDropdown.Item>}
                  <NavDropdown.Item as={NavLink} to="/patients"><i className="bi bi-people"></i> Pacientes</NavDropdown.Item>
                  {isAdmin && <NavDropdown.Item as={NavLink} to="/servicios"><i className="bi bi-card-checklist"></i> Servicios</NavDropdown.Item>}
                </NavDropdown>
              )}
              
              {/* --- DROPDOWN DE ADMINISTRACIÓN (AJUSTADO) --- */}
              {isAdmin && (
                <NavDropdown title={<><i className="bi bi-sliders"></i> Administración</>} id="admin-dropdown">
                  <NavDropdown.Item as={NavLink} to="/admin/users"><i className="bi bi-person-lines-fill"></i> Usuarios</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={NavLink} to="/admin/sectors"><i className="bi bi-diagram-3"></i> Sectores</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/admin/specialties"><i className="bi bi-award"></i> Especialidades</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={NavLink} to="/seguros" end><i className="bi bi-shield-check"></i> Seguros</NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>

            {/* --- MENÚ DE USUARIO (DERECHA) --- */}
            <Nav>
              {user ? (
                <NavDropdown title={<><i className="bi bi-person-circle"></i> {user.fullName || 'Usuario'}</>} id="user-dropdown" align="end">
                  <NavDropdown.Item disabled>
                    {user.role === 'admin' && <><i className="bi bi-shield-lock"></i> Administrador</>}
                    {user.role === 'sector_admin' && <><i className="bi bi-diagram-3"></i> Admin de Sector</>}
                    {user.role === 'doctor' && <><i className="bi bi-person-badge"></i> Doctor</>}
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