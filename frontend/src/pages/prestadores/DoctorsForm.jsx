import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Row, Col, Alert, Spinner, Badge } from "react-bootstrap";
import Select from "react-select";
import api from "../../utils/api";
import { AuthContext } from "../../context/AuthContextValue";
import PrestadorSeguroService from "../../services/PrestadorSeguroService";
import SeguroService from "../../services/SeguroService";
import styles from "./Doctors.module.css";

const DoctorForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: authUser } = useContext(AuthContext);
    const isEditMode = !!id;

    const [doctor, setDoctor] = useState({ userId: "", specialtyId: "", sectorId: "", licenseNumber: "", active: true, notes: "" });
    const [doctorName, setDoctorName] = useState("");
    
    const [users, setUsers] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [availableSeguros, setAvailableSeguros] = useState([]);
    const [assignedSeguros, setAssignedSeguros] = useState([]);
    
    const [isSeguroLoading, setIsSeguroLoading] = useState(false);
    const [segurosToAssignOnCreate, setSegurosToAssignOnCreate] = useState(new Set());

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const fetchInitialData = async () => {
            setPageLoading(true);
            try {
                const [specialtiesRes, sectorsRes, usersRes, segurosRes] = await Promise.all([
                    api.get("/specialties?size=1000").then(res => res.data.items || []),
                    api.get("/sectors?size=1000").then(res => res.data.items || []),
                    api.get("/users?role=doctor&unassigned=true").then(res => res.data.items || []),
                    SeguroService.getAll().then(res => res.data.items || []),
                ]);

                setSpecialties(specialtiesRes);
                setSectors(sectorsRes);
                setUsers(usersRes);
                setAvailableSeguros(segurosRes);

                if (isEditMode) {
                    await fetchDoctorData(usersRes);
                }
            } catch (err) {
                setError("Error al cargar los datos iniciales.");
            } finally {
                setPageLoading(false);
            }
        };
        fetchInitialData();
    }, [id, isEditMode]);

    const fetchDoctorData = async (initialUsers) => {
        try {
            const [doctorRes, segurosPrestadorRes] = await Promise.all([
                api.get(`/doctors/${id}`),
                PrestadorSeguroService.getSegurosByPrestador(id),
            ]);
            setDoctor(doctorRes.data);
            setAssignedSeguros(segurosPrestadorRes.data);

            if (doctorRes.data.userId) {
                const userRes = await api.get(`/users/${doctorRes.data.userId}`);
                setDoctorName(userRes.data.fullName);
                if (!initialUsers.some((u) => u.id === userRes.data.id)) {
                    setUsers(prev => [userRes.data, ...prev]);
                }
            }
        } catch (err) {
            setError("Error al cargar los datos del doctor.");
        }
    };

    const handleSelectChange = (name, selectedOption) => {
        setDoctor(prev => ({ ...prev, [name]: selectedOption ? selectedOption.value : "" }));
    };

    const handleAddSeguro = (selectedOption) => {
        if (!selectedOption) return;
        
        if (isEditMode) {
            setIsSeguroLoading(true);
            PrestadorSeguroService.addSeguro(id, selectedOption.value)
                .then(() => PrestadorSeguroService.getSegurosByPrestador(id))
                .then(res => setAssignedSeguros(res.data))
                .catch(() => setError("Error al añadir el seguro."))
                .finally(() => setIsSeguroLoading(false));
        } else {
            setSegurosToAssignOnCreate(prev => new Set(prev).add(selectedOption.value));
        }
    };

    const handleRemoveSeguro = (id_seguro) => {
        if (isEditMode) {
            setIsSeguroLoading(true);
            PrestadorSeguroService.removeSeguro(id, id_seguro)
                .then(() => setAssignedSeguros(assignedSeguros.filter(s => s.id_seguro !== id_seguro)))
                .catch(() => setError("Error al quitar el seguro."))
                .finally(() => setIsSeguroLoading(false));
        } else {
            setSegurosToAssignOnCreate(prev => {
                const newSet = new Set(prev);
                newSet.delete(id_seguro);
                return newSet;
            });
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(""); setSuccess("");
        try {
            if (isEditMode) {
                await api.put(`/doctors/${id}`, doctor);
                setSuccess("Perfil de doctor actualizado correctamente.");
                setTimeout(() => navigate("/doctors"), 1500);
            } else {
                const newDoctorRes = await api.post("/doctors", doctor);
                const doctorId = newDoctorRes.data.id;
                if (segurosToAssignOnCreate.size > 0) {
                    await PrestadorSeguroService.addSeguros(doctorId, Array.from(segurosToAssignOnCreate));
                }
                setSuccess("Perfil creado. Ahora puede gestionar servicios.");
                setTimeout(() => navigate(`/doctors/edit/${doctorId}`), 1500);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error al guardar el perfil.");
            setLoading(false);
        }
    };

    if (pageLoading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

    const userOptions = users.map(u => ({ value: u.id, label: `${u.fullName} (${u.email})` }));
    const specialtyOptions = specialties.map(s => ({ value: s.id, label: s.name }));
    const sectorOptions = sectors.map(s => ({ value: s.id, label: s.name }));

    const assignedSeguroIds = isEditMode ? new Set(assignedSeguros.map(s => s.id_seguro)) : segurosToAssignOnCreate;
    const assignedSegurosList = availableSeguros.filter(s => assignedSeguroIds.has(s.id_seguro));
    const segurosOptions = availableSeguros
        .filter(s => !assignedSeguroIds.has(s.id_seguro))
        .map(s => ({ value: s.id_seguro, label: s.nombre }));

    return (
        <Container className="py-4">
            <Card className={styles.doctorCard}>
                <Card.Header className={styles.cardHeader}>
                    <h3>{isEditMode ? `Editar Perfil: ${doctorName}` : "Nuevo Perfil de Doctor"}</h3>
                </Card.Header>
                <Card.Body className="p-4">
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <h4 className={styles.formSectionTitle}>📄 Datos del Perfil</h4>
                        <Row>
                           <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className={styles.formLabel}>Usuario del Sistema</Form.Label>
                                    <Select options={userOptions} value={userOptions.find(o => o.value === doctor.userId) || null} onChange={opt => handleSelectChange("userId", opt)} placeholder="Seleccione un usuario..." isClearable isDisabled={isEditMode} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className={styles.formLabel}>Nº de Matrícula</Form.Label>
                                    <Form.Control type="text" name="licenseNumber" value={doctor.licenseNumber || ''} onChange={(e) => setDoctor({...doctor, licenseNumber: e.target.value})} required className={styles.formControl} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className={styles.formLabel}>Especialidad</Form.Label>
                                    <Select options={specialtyOptions} value={specialtyOptions.find(o => o.value === doctor.specialtyId) || null} onChange={opt => handleSelectChange("specialtyId", opt)} placeholder="Seleccione..." isClearable />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className={styles.formLabel}>Sector</Form.Label>
                                    <Select options={sectorOptions} value={sectorOptions.find(o => o.value === doctor.sectorId) || null} onChange={opt => handleSelectChange("sectorId", opt)} placeholder="Seleccione..." isDisabled={authUser?.role === "sector_admin"} isClearable />
                                </Form.Group>
                            </Col>
                        </Row>

                        <h4 className={styles.formSectionTitle}>🛡️ Seguros Médicos Asociados</h4>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className={styles.formLabel}>Añadir Seguro</Form.Label>
                                    <Select options={segurosOptions} onChange={handleAddSeguro} value={null} placeholder="Buscar y añadir seguro..." isLoading={isSeguroLoading} isDisabled={isSeguroLoading} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Label className={styles.formLabel}>Seguros Asignados</Form.Label>
                                <div className={styles.assignedItemsContainer}>
                                    {assignedSegurosList.length === 0 
                                        ? <span className="text-muted">Ninguno asignado.</span>
                                        : assignedSegurosList.map(s => (
                                            <Badge pill bg="success" key={s.id_seguro} className={styles.assignedItemBadge}>
                                                {s.nombre}
                                                <button type="button" className={styles.removeBadgeButton} onClick={() => handleRemoveSeguro(s.id_seguro)}>×</button>
                                            </Badge>
                                        ))
                                    }
                                </div>
                            </Col>
                        </Row>
                        
                        {isEditMode && (
                            <>
                                <h4 className={styles.formSectionTitle}>🩺 Servicios Prestados</h4>
                                <Button 
                                    className={styles.primaryButton}
                                    onClick={() => navigate(`/doctors/${id}/services`)}
                                >
                                  <i className="bi bi-gear-fill me-2"></i>Gestionar Servicios del Prestador
                                </Button>
                            </>
                        )}
                        
                        <Form.Group className="my-4"><Form.Check type="switch" label="Perfil Activo" name="active" checked={doctor.active} onChange={(e) => setDoctor({...doctor, active: e.target.checked})} /></Form.Group>

                        <div className={`${styles.buttonGroup} mt-4`}>
                            <Button variant="secondary" onClick={() => navigate("/doctors")} disabled={loading}>Cancelar</Button>
                            <Button type="submit" className={styles.primaryButton} disabled={loading}>{loading ? <Spinner as="span" size="sm" /> : "Guardar Perfil"}</Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default DoctorForm;