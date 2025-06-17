import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import './App.css';
import { AuthContext } from './context/AuthContextValue';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';

// Admin Pages
import Users from './pages/admin/Users';
import UserForm from './pages/admin/UserForm';
import Sectors from './pages/admin/Sectors';
import SectorForm from './pages/admin/SectorForm';
import Specialties from './pages/admin/Specialties';
import SpecialtyForm from './pages/admin/SpecialtyForm';

// Doctors Pages
import Doctors from './pages/doctors/Doctors';
import DoctorForm from './pages/doctors/DoctorForm';
import DoctorSchedule from './pages/doctors/DoctorSchedule';

// Patients Pages
import Patients from './pages/patients/Patients';
import PatientForm from './pages/patients/PatientForm';

// Appointments Pages
import Appointments from './pages/appointments/Appointments';
import AppointmentForm from './pages/appointments/AppointmentForm';

// Tickets Pages
import Tickets from './pages/tickets/Tickets';

// Protect routes based on auth status and role
const PrivateRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/" element={<AuthLayout />}>
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>

      {/* App Routes */}
      <Route path="/" element={
        <PrivateRoute>
          <MainLayout />
        </PrivateRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />

        {/* Admin Routes */}
        <Route path="admin">
          <Route path="users" element={
            <PrivateRoute roles={['admin']}>
              <Users />
            </PrivateRoute>
          } />
          <Route path="users/add" element={
            <PrivateRoute roles={['admin']}>
              <UserForm />
            </PrivateRoute>
          } />
          <Route path="users/edit/:id" element={
            <PrivateRoute roles={['admin']}>
              <UserForm />
            </PrivateRoute>
          } />
          <Route path="sectors" element={
            <PrivateRoute roles={['admin']}>
              <Sectors />
            </PrivateRoute>
          } />
          <Route path="sectors/add" element={
            <PrivateRoute roles={['admin']}>
              <SectorForm />
            </PrivateRoute>
          } />
          <Route path="sectors/edit/:id" element={
            <PrivateRoute roles={['admin']}>
              <SectorForm />
            </PrivateRoute>
          } />
          <Route path="specialties" element={
            <PrivateRoute roles={['admin']}>
              <Specialties />
            </PrivateRoute>
          } />
          <Route path="specialties/add" element={
            <PrivateRoute roles={['admin']}>
              <SpecialtyForm />
            </PrivateRoute>
          } />
          <Route path="specialties/edit/:id" element={
            <PrivateRoute roles={['admin']}>
              <SpecialtyForm />
            </PrivateRoute>
          } />
        </Route>

        {/* Doctors Routes */}
        <Route path="doctors">
          <Route index element={
            <PrivateRoute roles={['admin', 'sector_admin']}>
              <Doctors />
            </PrivateRoute>
          } />
          <Route path="add" element={
            <PrivateRoute roles={['admin', 'sector_admin']}>
              <DoctorForm />
            </PrivateRoute>
          } />
          <Route path="edit/:id" element={
            <PrivateRoute roles={['admin', 'sector_admin']}>
              <DoctorForm />
            </PrivateRoute>
          } />
          <Route path=":id/schedule" element={
            <PrivateRoute roles={['admin', 'sector_admin']}>
              <DoctorSchedule />
            </PrivateRoute>
          } />
        </Route>

        {/* Patients Routes */}
        <Route path="patients">
          <Route index element={
            <PrivateRoute roles={['admin', 'sector_admin']}>
              <Patients />
            </PrivateRoute>
          } />
          <Route path="add" element={
            <PrivateRoute roles={['admin', 'sector_admin']}>
              <PatientForm />
            </PrivateRoute>
          } />
          <Route path="edit/:id" element={
            <PrivateRoute roles={['admin', 'sector_admin']}>
              <PatientForm />
            </PrivateRoute>
          } />
        </Route>

        {/* Appointments Routes */}
        <Route path="appointments">
          <Route index element={
            <PrivateRoute roles={['admin', 'sector_admin', 'doctor']}>
              <Appointments />
            </PrivateRoute>
          } />
          <Route path="add" element={
            <PrivateRoute roles={['admin', 'sector_admin']}>
              <AppointmentForm />
            </PrivateRoute>
          } />
          <Route path="edit/:id" element={
            <PrivateRoute roles={['admin', 'sector_admin']}>
              <AppointmentForm />
            </PrivateRoute>
          } />
        </Route>

        {/* Tickets Route */}
        <Route path="tickets" element={
          <PrivateRoute roles={['admin', 'sector_admin']}>
            <Tickets />
          </PrivateRoute>
        } />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
