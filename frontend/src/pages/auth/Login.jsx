import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../utils/api';
import { AuthContext } from '../../context/AuthContextValue';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    if (!username.trim()) {
      errors.username = 'El nombre de usuario es requerido';
    } else if (username.length < 3) {
      errors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }
    if (!password) {
      errors.password = 'La contraseña es requerida';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await AuthService.login(username, password);
      login(response.data, response.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Error al iniciar sesión. Verifique sus credenciales.'
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <style>{`
        .form-control-custom {
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem 0.75rem 3rem;
          transition: all 0.3s ease;
          width: 100%;
          box-sizing: border-box;
          font-size: 0.97rem;
        }
        .form-control-custom:focus {
          border-color: #41BFB3;
          box-shadow: 0 0 0 3px rgba(65, 191, 179, 0.1);
          outline: none;
        }
        .form-control-custom.is-invalid {
          border-color: #ef4444;
          background-color: #fef2f2;
        }
        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          width: 20px;
          height: 20px;
        }
        .password-toggle {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
        }
        .password-toggle:hover {
          color: #6b7280;
        }
        .btn-login {
          background: linear-gradient(135deg, #2A8C82 0%, #41BFB3 100%);
          border: none;
          border-radius: 0.75rem;
          color: white;
          font-weight: 600;
          padding: 1rem;
          width: 100%;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(42, 140, 130, 0.3);
        }
        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(42, 140, 130, 0.4);
          color: white;
        }
        .btn-login:disabled {
          background: #6b7280;
          box-shadow: none;
          transform: none;
        }
        .error-message {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        .validation-error {
          color: #dc2626;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ padding: '2rem' }}>
        {error && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#275950'
              }}
            >
              Nombre de usuario
            </label>
            <div style={{ position: 'relative' }}>
              <svg
                className="input-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                type="text"
                placeholder="Ingrese su nombre de usuario"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (validationErrors.username) {
                    setValidationErrors(prev => ({ ...prev, username: '' }));
                  }
                }}
                className={`form-control-custom ${validationErrors.username ? 'is-invalid' : ''}`}
                required
              />
              {validationErrors.username && (
                <div className="validation-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {validationErrors.username}
                </div>
              )}
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '2rem' }}>
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#275950'
              }}
            >
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <svg
                className="input-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="16" r="1"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) {
                    setValidationErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
                className={`form-control-custom ${validationErrors.password ? 'is-invalid' : ''}`}
                style={{ paddingRight: '3rem' }}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
              {validationErrors.password && (
                <div className="validation-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {validationErrors.password}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-login"
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <div className="spinner"></div>
                <span>Iniciando sesión...</span>
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </>
  );
};

export default Login;