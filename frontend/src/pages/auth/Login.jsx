import React, { useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../utils/api';
import { AuthContext } from '../../context/AuthContextValue';
import styles from './Login.module.css'; // 1. Importar el módulo de CSS

// 2. Componente reutilizable para los campos del formulario
const FormField = ({ label, name, type = "text", value, onChange, placeholder, error, children }) => (
  <div className={styles.formField}>
    <label className={styles.formLabel}>{label}</label>
    <div className={styles.inputWrapper}>
      {children} {/* Para el ícono y el botón de mostrar/ocultar contraseña */}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`${styles.formControl} ${error ? styles.isInvalid : ''}`}
        required
      />
      {error && (
        <div className={styles.validationError}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}
    </div>
  </div>
);

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // 3. Funciones optimizadas con useCallback
  const validateForm = useCallback(() => {
    const errors = {};
    if (!credentials.username.trim()) {
      errors.username = 'El nombre de usuario es requerido';
    } else if (credentials.username.length < 3) {
      errors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }
    if (!credentials.password) {
      errors.password = 'La contraseña es requerida';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [credentials]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await AuthService.login(credentials.username, credentials.password);
      login(response.data, response.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }, [credentials, login, navigate, validateForm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const togglePasswordVisibility = useCallback(() => setShowPassword(prev => !prev), []);

  return (
    <div className={styles.formContainer}>
      {error && (
        <div className={styles.apiErrorMessage}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
        </div>
      )}

      {/* 4. JSX limpio usando el nuevo componente y las clases de CSS */}
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Nombre de usuario"
          name="username"
          value={credentials.username}
          onChange={handleChange}
          placeholder="Ingrese su nombre de usuario"
          error={validationErrors.username}
        >
          <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </FormField>

        <FormField
          label="Contraseña"
          name="password"
          type={showPassword ? "text" : "password"}
          value={credentials.password}
          onChange={handleChange}
          placeholder="Ingrese su contraseña"
          error={validationErrors.password}
        >
          <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><circle cx="12" cy="16" r="1"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <button type="button" className={styles.passwordToggle} onClick={togglePasswordVisibility}>
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </FormField>

        <div style={{ marginTop: '2rem' }}>
          <button type="submit" disabled={loading} className={styles.loginButton}>
            {loading ? (
              <div className={styles.loginButtonContent}>
                <div className={styles.spinner}></div>
                <span>Iniciando sesión...</span>
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;