import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, ListGroup, Button, Form, Spinner, Alert, InputGroup } from 'react-bootstrap';
import api from '../../utils/api';
import ServicioService from '../../services/ServicioService';
import PrestadorServicioService from '../../services/PrestadorServicioService';
import styles from './Doctors.module.css';

// Hook personalizado para "debouncing" (retrasar la ejecución de una función)
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

// Componente de lista sin cambios, ahora muestra un spinner si está cargando
const ServiceList = ({ services, onAction, actionIcon, actionVariant, emptyMessage, isLoading }) => (
    <ListGroup variant="flush" className={styles.serviceListGroup}>
        {isLoading && <div className="text-center p-5"><Spinner animation="border" size="sm" /></div>}
        {!isLoading && services.length === 0 && <ListGroup.Item className="text-center text-muted p-4">{emptyMessage}</ListGroup.Item>}
        {!isLoading && services.map(service => (
            <ListGroup.Item key={service.id} className="d-flex justify-content-between align-items-center">
                <div>
                    <strong>{service.nombre_servicio}</strong>
                    <small className="d-block text-muted">Precio: ${service.precio} | Duración: {service.tiempo} min</small>
                </div>
                <Button variant={actionVariant} size="sm" onClick={() => onAction(service)} title={actionVariant === 'primary' ? 'Asignar' : 'Quitar'}>
                    <i className={`bi ${actionIcon}`}></i>
                </Button>
            </ListGroup.Item>
        ))}
    </ListGroup>
);

const PrestadorServicios = () => {
    const { id: doctorId } = useParams();
    const navigate = useNavigate();

    const [doctor, setDoctor] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    
    // --- LÓGICA DE BÚSQUEDA Y ESTADO REFACTORIZADA ---
    
    // Lista completa de servicios asignados (generalmente no son miles por doctor)
    const [assignedServices, setAssignedServices] = useState([]);
    // Lista de servicios disponibles, cargada bajo demanda desde el backend
    const [availableServices, setAvailableServices] = useState([]);

    // Estados para la carga de cada lista
    const [isLoadingAssigned, setIsLoadingAssigned] = useState(true);
    const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);

    // Términos de búsqueda
    const [searchAssignedTerm, setSearchAssignedTerm] = useState('');
    const [searchAvailableTerm, setSearchAvailableTerm] = useState('');

    // Aplicamos un debounce de 500ms al término de búsqueda de "disponibles"
    const debouncedSearchAvailable = useDebounce(searchAvailableTerm, 500);

    // Carga inicial de datos (doctor y servicios ASIGNADOS)
    useEffect(() => {
        const loadInitialData = async () => {
            if (!doctorId) return;
            setPageLoading(true);
            try {
                const [doctorRes, assignedRes] = await Promise.all([
                    api.get(`/doctors/${doctorId}`),
                    PrestadorServicioService.getServicios(doctorId)
                ]);
                setDoctor({ ...doctorRes.data, fullName: doctorRes.data.user?.fullName });
                setAssignedServices(assignedRes.data);
            } catch (err) {
                setError('Error al cargar los datos iniciales.');
            } finally {
                setPageLoading(false);
                setIsLoadingAssigned(false);
            }
        };
        loadInitialData();
    }, [doctorId]);

    // EFECTO PARA BUSCAR SERVICIOS DISPONIBLES EN EL BACKEND
    // Se activa solo cuando el término de búsqueda "debounced" cambia.
    useEffect(() => {
        // No buscar si el término está vacío y no es la carga inicial
        if (!debouncedSearchAvailable) {
            setAvailableServices([]);
            return;
        }
        
        setIsLoadingAvailable(true);
        // Llamamos al servicio con paginación y el término de búsqueda
        ServicioService.getAll(1, 20, debouncedSearchAvailable)
            .then(res => {
                const assignedIds = new Set(assignedServices.map(s => s.id));
                // Filtramos los resultados para no mostrar los que ya están asignados
                const filteredResults = res.data.items.filter(item => !assignedIds.has(item.id));
                setAvailableServices(filteredResults);
            })
            .catch(() => setError("Error al buscar servicios disponibles."))
            .finally(() => setIsLoadingAvailable(false));

    }, [debouncedSearchAvailable, assignedServices]); // Depende de los servicios asignados para re-filtrar si cambian

    const handleAction = async (actionType, service) => {
        setIsLoadingAssigned(true); // Bloqueamos ambas listas para evitar inconsistencias
        setIsLoadingAvailable(true);
        setError('');
        try {
            if (actionType === 'add') {
                await PrestadorServicioService.addServicios(doctorId, [service.id]);
            } else {
                await PrestadorServicioService.removeServicio(doctorId, service.id);
            }
            // Recargamos solo la lista de asignados, que es la fuente de la verdad
            const assignedRes = await PrestadorServicioService.getServicios(doctorId);
            setAssignedServices(assignedRes.data);
        } catch (err) {
            setError(`Error al ${actionType === 'add' ? 'asignar' : 'eliminar'} el servicio.`);
        } finally {
            setIsLoadingAssigned(false);
            setIsLoadingAvailable(false);
        }
    };

    // La lista de asignados se filtra localmente (son pocos)
    const filteredAssignedServices = assignedServices.filter(s => 
        s.nombre_servicio.toLowerCase().includes(searchAssignedTerm.toLowerCase())
    );

    if (pageLoading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

    return (
        <Container className="py-4">
            <Card className={styles.doctorCard}>
                <Card.Header className={styles.cardHeader}>
                    <div>
                        <h3>Gestión de Servicios</h3>
                        <h5 className="text-muted mb-0">Prestador: {doctor?.fullName}</h5>
                    </div>
                    <Button variant="secondary" onClick={() => navigate(`/doctors/edit/${doctorId}`)}>
                        <i className="bi bi-arrow-left-circle me-2"></i>Volver al Perfil
                    </Button>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Row>
                        <Col md={6}>
                            <Card className={styles.serviceListCard}>
                                <Card.Header className={styles.serviceListHeader}>Servicios Disponibles</Card.Header>
                                <div className="p-2 border-bottom">
                                    <InputGroup>
                                        <Form.Control placeholder="Buscar para añadir..." value={searchAvailableTerm} onChange={e => setSearchAvailableTerm(e.target.value)} className={styles.filterInput} />
                                    </InputGroup>
                                </div>
                                <ServiceList 
                                    services={availableServices} 
                                    onAction={(service) => handleAction('add', service)} 
                                    actionIcon="bi-plus-lg" 
                                    actionVariant="outline-primary" 
                                    emptyMessage={debouncedSearchAvailable ? "No se encontraron servicios." : "Escriba para buscar servicios..."}
                                    isLoading={isLoadingAvailable} 
                                />
                            </Card>
                        </Col>
                        <Col md={6} className="mt-3 mt-md-0">
                             <Card className={styles.serviceListCard}>
                                <Card.Header className={styles.serviceListHeader}>Servicios Asignados ({filteredAssignedServices.length})</Card.Header>
                                 <div className="p-2 border-bottom">
                                    <InputGroup>
                                        <Form.Control placeholder="Filtrar asignados..." value={searchAssignedTerm} onChange={e => setSearchAssignedTerm(e.target.value)} className={styles.filterInput} />
                                    </InputGroup>
                                </div>
                                <ServiceList 
                                    services={filteredAssignedServices} 
                                    onAction={(service) => handleAction('remove', service)} 
                                    actionIcon="bi-trash-fill" 
                                    actionVariant="outline-danger" 
                                    emptyMessage="No hay servicios asignados."
                                    isLoading={isLoadingAssigned}
                                />
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default PrestadorServicios;