import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { AuthService } from '../../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }
    
    try {
      // Enviar datos para registro
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: 'sector_admin' // Por defecto, se registra como admin de sector
      };
      
      await AuthService.register(userData);
      setSuccess(true);
      
      // Redireccionar al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Error al registrar usuario. Inténtelo nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <h4 className="text-center mb-4">Registro de Usuario</h4>
      
      {error && (
        <Alert variant="danger">{error}</Alert>
      )}
      
      {success && (
        <Alert variant="success">
          Usuario registrado exitosamente. Redirigiendo al inicio de sesión...
        </Alert>
      )}
      
      {!success && (
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre completo</Form.Label>
            <Form.Control
              type="text"
              name="fullName"
              placeholder="Ingrese su nombre completo"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Nombre de usuario</Form.Label>
            <Form.Control
              type="text"
              name="username"
              placeholder="Ingrese un nombre de usuario"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Correo electrónico</Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="Ingrese su correo electrónico"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              name="password"
              placeholder="Ingrese una contraseña"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-4">
            <Form.Label>Confirmar contraseña</Form.Label>
            <Form.Control
              type="password"
              name="confirmPassword"
              placeholder="Confirme su contraseña"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Button 
            variant="primary" 
            type="submit" 
            className="w-100"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </Button>
          
          <div className="text-center mt-3">
            <Link to="/login">¿Ya tienes una cuenta? Inicia sesión</Link>
          </div>
        </Form>
      )}
    </>
  );
};

export default Register;
