import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Form,
  Button,
  Row,
  Col,
  Alert,
  Spinner,
} from "react-bootstrap";
import api from "../../utils/api";
import styles from "./Patients.module.css";
import SeguroService from "../../services/SeguroService";

const PatientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [patient, setPatient] = useState({
    fullName: "",
    documentId: "",
    dateOfBirth: "",
    gender: "F",
    phone: "",
    email: "",
    address: "",
    insurance: "",
    insuranceNumber: "",
    allergies: "",
    medicalHistory: "",
    active: true,
    id_seguro: "",
  });

  const [seguros, setSeguros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    SeguroService.getAll().then((res) => setSeguros(res.data));
  }, []);

  useEffect(() => {
    if (isEditMode) {
      api
        .get(`/patients/${id}`)
        .then((res) => {
          const patientData = res.data;
          // Formatear fecha para el input type="date"
          patientData.dateOfBirth = patientData.dateOfBirth
            ? new Date(patientData.dateOfBirth).toISOString().split("T")[0]
            : "";
          setPatient(patientData);
        })
        .catch((err) => {
          setError("Error al cargar los datos del paciente.");
          console.error(err);
        })
        .finally(() => setPageLoading(false));
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPatient((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validar fecha de nacimiento
    if (!patient.dateOfBirth) {
      setError("La fecha de nacimiento es obligatoria.");
      setLoading(false);
      return;
    }

    const patientData = {
      ...patient,
      dateOfBirth: new Date(patient.dateOfBirth),
    };

    try {
      if (isEditMode) {
        await api.put(`/patients/${id}`, patientData);
      } else {
        await api.post("/patients", patientData);
      }
      setSuccess("Paciente guardado correctamente.");
      setTimeout(() => navigate("/patients"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar el paciente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "80vh" }}
      >
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card className={styles.patientCard}>
        <Card.Header className={styles.cardHeader}>
          <h2>{isEditMode ? "Editar Paciente" : "Nuevo Paciente"}</h2>
        </Card.Header>
        <Card.Body className="p-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className={styles.formLabel}>
                    Nombre Completo
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={patient.fullName}
                    onChange={handleChange}
                    required
                    className={styles.formControl}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className={styles.formLabel}>
                    Nº de Documento
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="documentId"
                    value={patient.documentId}
                    onChange={handleChange}
                    required
                    className={styles.formControl}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className={styles.formLabel}>
                    Fecha de Nacimiento
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="dateOfBirth"
                    value={patient.dateOfBirth}
                    onChange={handleChange}
                    required
                    className={styles.formControl}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className={styles.formLabel}>Género</Form.Label>
                  <Form.Select
                    name="gender"
                    value={patient.gender}
                    onChange={handleChange}
                    className={styles.formSelect}
                    required
                  >
                    <option value="F">Femenino</option>
                    <option value="M">Masculino</option>
                    <option value="O">Otro</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className={styles.formLabel}>Teléfono</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={patient.phone}
                    onChange={handleChange}
                    required
                    className={styles.formControl}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className={styles.formLabel}>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={patient.email}
                    onChange={handleChange}
                    className={styles.formControl}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className={styles.formLabel}>Dirección</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={patient.address}
                onChange={handleChange}
                className={styles.formControl}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Seguro Médico</Form.Label>
                  <Form.Select
                    name="id_seguro"
                    value={patient.id_seguro || ""}
                    onChange={(e) =>
                      setPatient({ ...patient, id_seguro: e.target.value })
                    }
                  >
                    <option value="">Sin seguro</option>
                    {seguros.map((seguro) => (
                      <option key={seguro.id_seguro} value={seguro.id_seguro}>
                        {seguro.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className={styles.formLabel}>
                    Nº de Póliza
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="insuranceNumber"
                    value={patient.insuranceNumber}
                    onChange={handleChange}
                    className={styles.formControl}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className={styles.formLabel}>
                Alergias Conocidas
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="allergies"
                value={patient.allergies}
                onChange={handleChange}
                className={styles.formControl}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className={styles.formLabel}>
                Historial Médico Relevante
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="medicalHistory"
                value={patient.medicalHistory}
                onChange={handleChange}
                className={styles.formControl}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Check
                type="switch"
                label="Paciente Activo"
                name="active"
                checked={patient.active}
                onChange={handleChange}
              />
            </Form.Group>

            {patient.seguro && (
              <Alert variant="info" className="mt-2">
                Seguro actual: <b>{patient.seguro.nombre}</b>
              </Alert>
            )}

            <div className={styles.buttonGroup}>
              <Button
                variant="light"
                onClick={() => navigate("/patients")}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className={styles.primaryButton}
                disabled={loading}
              >
                {loading ? (
                  <Spinner as="span" animation="border" size="sm" />
                ) : (
                  "Guardar Paciente"
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PatientForm;
