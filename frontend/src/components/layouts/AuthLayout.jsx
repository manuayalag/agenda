import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container, Row, Col, Card } from 'react-bootstrap';

const AuthLayout = () => {
  return (
    <Container fluid className="bg-light min-vh-100">
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col xs={12} sm={10} md={8} lg={6} xl={4}>
          <Card className="shadow-lg border-0">
            <Card.Header className="bg-primary text-white text-center py-3">
              <h4 className="mb-0">Sistema de Agendamiento Clínico</h4>
            </Card.Header>
            <Card.Body className="p-4">
              <Outlet />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AuthLayout;
