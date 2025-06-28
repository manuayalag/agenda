import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css'; // 1. Importar el módulo CSS

const AuthLayout = () => {
  return (
    // 2. Usar las clases del módulo CSS
    <div className={styles.loginContainer}> 
      <div className={styles.loginCard}>
        <div className={styles.authTitle}>
          <div className={styles.authSystemTitle}>
            Sistema de Agendamiento Clínico
          </div>
          <div className={styles.authIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="16" r="1"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          {/* 3. Reemplazar estilos en línea por clases */}
          <h4 className={styles.welcomeHeading}>
            Bienvenido
          </h4>
          <p className={styles.welcomeSubtitle}>
            Inicia sesión en tu cuenta
          </p>
        </div>
        <div className={styles.cardBody}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;