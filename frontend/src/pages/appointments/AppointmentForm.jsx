import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import 'bootstrap-icons/font/bootstrap-icons.css';
import Select from 'react-select';
import { AppointmentService, DoctorService, PatientService, SpecialtyService } from "../../utils/api";
import PrestadorServicioService from "../../services/PrestadorServicioService";
import './Appointments.css';
import './AppointmentForm.css';

const initialState = {
    formData: { prestadorId: "", servicioId: "", patientId: "", date: "", startTime: "", endTime: "", status: "scheduled", reason: "", notes: "", specialtyId: "" },
    lists: { specialties: [], doctors: [], patients: [], services: [], dynamicSlots: [] },
    monthlyAvailability: {},
    ui: { isEditing: false, formKey: Date.now(), activeCalendarDate: new Date() },
    status: { loading: { initial: true, services: false, slots: false }, error: null, submit: false },
};

function appointmentReducer(state, action) {
    switch (action.type) {
        case 'SET_INITIAL_DATA': return { ...state, lists: { ...state.lists, ...action.payload } };
        case 'SET_FIELD': {
            const { name, value } = action.payload;
            let newState = { ...state, formData: { ...state.formData, [name]: value } };
            
            if (['specialtyId', 'prestadorId', 'date', 'servicioId'].includes(name)) {
                newState.formData.startTime = '';
                newState.formData.endTime = '';
            }
            if (['specialtyId', 'prestadorId'].includes(name)) {
                newState.formData.servicioId = '';
                newState.lists.services = [];
            }
            if (name === 'prestadorId' && value) {
                const doctor = state.lists.doctors.find(d => d.id === parseInt(value));
                if (doctor && newState.formData.specialtyId !== doctor.specialtyId) {
                    newState.formData.specialtyId = doctor.specialtyId;
                }
            }
            return newState;
        }
        case 'SET_LIST': return { ...state, lists: { ...state.lists, [action.payload.key]: action.payload.data } };
        case 'SET_MONTHLY_AVAILABILITY': return { ...state, monthlyAvailability: action.payload };
        case 'SET_ACTIVE_CALENDAR_DATE': return { ...state, ui: { ...state.ui, activeCalendarDate: action.payload } };
        case 'SET_UI_STATE': return { ...state, ui: { ...state.ui, ...action.payload } };
        case 'SET_LOADING': return { ...state, status: { ...state.status, loading: { ...state.status.loading, ...action.payload } } };
        case 'SET_SUBMIT_STATUS': return { ...state, status: {...state.status, submit: action.payload }};
        case 'SET_ERROR': return { ...state, status: { ...state.status, error: action.payload }};
        case 'RESET': return { ...initialState, ui: { ...initialState.ui, formKey: Date.now() }, lists: state.lists };
        default: return state;
    }
}

function useAppointmentForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(appointmentReducer, initialState);
    const { formData, lists, ui, status, monthlyAvailability } = state;

    useEffect(() => {
        dispatch({ type: 'SET_UI_STATE', payload: { isEditing: !!id } });
        const fetchCoreData = async () => {
            dispatch({ type: 'SET_LOADING', payload: { initial: true } });
            try {
                // --- CORRECCIÓN APLICADA AQUÍ ---
                const [patientsRes, doctorsRes, specialtiesRes] = await Promise.all([
                    PatientService.getAll({ params: { size: 10000 } }), // Pedimos todos los pacientes
                    DoctorService.getAll(),
                    SpecialtyService.getAll({ params: { size: 1000 } }) // Pedimos todas las especialidades
                ]);
                
                dispatch({ type: 'SET_INITIAL_DATA', payload: { 
                    patients: patientsRes.data.items || [], 
                    doctors: doctorsRes.data, 
                    specialties: specialtiesRes.data.items || [] 
                }});
                // --- FIN DE LA CORRECCIÓN ---

                if (id) {
                    const appointment = await AppointmentService.getById(id).then(res => res.data);
                    const initialFormData = {
                        patientId: appointment.patientId,
                        specialtyId: appointment.prestador.specialtyId,
                        prestadorId: appointment.prestadorId,
                        servicioId: appointment.servicioId,
                        date: new Date(appointment.date).toISOString().split('T')[0],
                        startTime: appointment.startTime,
                        reason: appointment.reason,
                        notes: appointment.notes,
                        status: appointment.status,
                    };
                    for (const [key, value] of Object.entries(initialFormData)) {
                        dispatch({ type: 'SET_FIELD', payload: { name: key, value } });
                    }
                }
            } catch (err) { 
                console.error("Error al cargar datos iniciales:", err);
                dispatch({ type: 'SET_ERROR', payload: 'Error al cargar datos iniciales.' });
            } finally { 
                dispatch({ type: 'SET_LOADING', payload: { initial: false } }); 
            }
        }
        fetchCoreData();
    }, [id]);

    useEffect(() => {
        if (formData.prestadorId) {
            dispatch({ type: 'SET_LOADING', payload: { services: true } });
            PrestadorServicioService.getServicios(formData.prestadorId)
                .then(res => dispatch({ type: 'SET_LIST', payload: { key: 'services', data: res.data } }))
                .finally(() => dispatch({ type: 'SET_LOADING', payload: { services: false } }));
        }
    }, [formData.prestadorId]);

    const filteredDoctors = useMemo(() => {
        if (!formData.specialtyId) return lists.doctors;
        return lists.doctors.filter(d => d.specialtyId === parseInt(formData.specialtyId));
    }, [formData.specialtyId, lists.doctors]);

    useEffect(() => {
        if (formData.prestadorId) {
            const year = ui.activeCalendarDate.getFullYear();
            const month = ui.activeCalendarDate.getMonth() + 1;
            DoctorService.getMonthlyAvailability(formData.prestadorId, year, month)
                .then(res => dispatch({ type: 'SET_MONTHLY_AVAILABILITY', payload: res.data }));
        }
    }, [formData.prestadorId, ui.activeCalendarDate]);

    useEffect(() => {
        const calculateSlots = async () => {
            if (!formData.date || !formData.prestadorId || !formData.servicioId) {
                dispatch({ type: 'SET_LIST', payload: { key: 'dynamicSlots', data: [] } }); return;
            }
            dispatch({ type: 'SET_LOADING', payload: { slots: true } });
            try {
                const service = lists.services.find(s => s.id === formData.servicioId);
                const res = await DoctorService.getDailyAvailability(formData.prestadorId, formData.date);
                const { workBlocks = [], existingAppointments = [] } = res.data;
                const serviceDuration = service?.tiempo;
                if (!serviceDuration) { dispatch({ type: 'SET_LIST', payload: { key: 'dynamicSlots', data: [] } }); return; }

                const timeToMinutes = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
                const minutesToTime = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
                const appointmentIntervals = existingAppointments
                    .filter(app => !(ui.isEditing && app.id === parseInt(id)))
                    .map(app => ({ start: timeToMinutes(app.startTime), end: timeToMinutes(app.endTime) }));

                const finalSlots = workBlocks.flatMap(block => {
                    const slots = [];
                    let currentTime = timeToMinutes(block.startTime);
                    const blockEnd = timeToMinutes(block.endTime);
                    while (currentTime + serviceDuration <= blockEnd) {
                        const slotEnd = currentTime + serviceDuration;
                        if (!appointmentIntervals.some(app => currentTime < app.end && slotEnd > app.start)) {
                            slots.push({ start: minutesToTime(currentTime) });
                        }
                        currentTime += serviceDuration;
                    }
                    return slots;
                });
                dispatch({ type: 'SET_LIST', payload: { key: 'dynamicSlots', data: finalSlots } });
            } finally {
                dispatch({ type: 'SET_LOADING', payload: { slots: false } });
            }
        };
        calculateSlots();
    }, [formData.date, formData.prestadorId, formData.servicioId, lists.services, ui.isEditing, id]);
    
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        dispatch({ type: 'SET_SUBMIT_STATUS', payload: true });
        try {
            const service = lists.services.find(s => s.id === formData.servicioId);
            const [h, m] = formData.startTime.split(':').map(Number);
            const endTimeMinutes = h * 60 + m + service.tiempo;
            const endTime = `${String(Math.floor(endTimeMinutes / 60)).padStart(2, '0')}:${String(endTimeMinutes % 60).padStart(2, '0')}`;
            const payload = { ...formData, endTime };
            
            const action = id ? AppointmentService.update(id, payload) : AppointmentService.create(payload);
            await action;
            navigate('/appointments', { state: { success: `Cita ${id ? 'actualizada' : 'creada'} con éxito.` } });
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: 'Error al guardar la cita.' });
        } finally {
            dispatch({ type: 'SET_SUBMIT_STATUS', payload: false });
        }
    }, [formData, id, lists.services, navigate]);

    return { state, handlers: { dispatch, handleSubmit, navigate }, filteredDoctors };
}

const AppointmentForm = () => {
    const { state, handlers, filteredDoctors } = useAppointmentForm();
    const { formData, lists, ui, status, monthlyAvailability } = state;
  
    const renderSelector = (props) => (
        <Form.Group className="mb-3">
            <Form.Label>{props.label}</Form.Label>
            <Select
                classNamePrefix="custom-select" className="custom-select-container"
                options={props.options}
                value={props.options.find(o => o.value === props.value) || null}
                onChange={opt => handlers.dispatch({ type: 'SET_FIELD', payload: { name: props.name, value: opt ? opt.value : '' } })}
                isLoading={props.isLoading} isDisabled={props.isDisabled}
                isClearable isSearchable required={props.required} placeholder={props.placeholder}
            />
        </Form.Group>
    );

    const tileClassName = useCallback(({ date, view }) => {
        if (view !== 'month' || !formData.prestadorId || !formData.servicioId) return null;
        const dateStr = date.toISOString().split('T')[0];
        const dayStatus = monthlyAvailability[dateStr];
        if (dayStatus === 'FULL' || dayStatus === 'NON_WORKING') return 'day-unavailable';
        if (dayStatus === 'AVAILABLE') {
            if (formData.date === dateStr && !status.loading.slots && lists.dynamicSlots.length === 0) return 'day-unavailable';
            return 'day-available';
        }
        return null;
    }, [monthlyAvailability, lists.dynamicSlots.length, formData.date, formData.prestadorId, formData.servicioId, status.loading.slots]);

    if (status.loading.initial) {
        return <Container className="text-center py-5"><Spinner animation="border" /></Container>;
    }

    return (
        <Container className="py-4">
            <Card className="appointments-card">
                <Card.Header className="appointments-card-header"><h4 className="mb-0">{ui.isEditing ? "Editar Cita" : "Agendar Nueva Cita"}</h4></Card.Header>
                <Card.Body className="p-4">
                    <Form key={ui.formKey} onSubmit={handlers.handleSubmit} noValidate>
                        {status.error && <Alert variant="danger" onClose={() => handlers.dispatch({ type: 'SET_ERROR', payload: null })} dismissible>{status.error}</Alert>}
                        <Row>
                            <Col lg={4} className="mb-4 mb-lg-0 pe-lg-4 border-end-lg">
                                <h5 className="mb-3 fw-bold">1. Selección Principal</h5>
                                {renderSelector({ label: "Paciente", name: "patientId", options: lists.patients.map(p => ({ value: p.id, label: `${p.fullName} (${p.documentId})`})), value: formData.patientId, required: true, placeholder: "Buscar paciente..." })}
                                {renderSelector({ label: "Especialidad", name: "specialtyId", options: lists.specialties.map(s => ({ value: s.id, label: s.name })), value: formData.specialtyId, placeholder: "Filtrar por especialidad..." })}
                                {renderSelector({ label: "Doctor", name: "prestadorId", options: filteredDoctors.map(d => ({ value: d.id, label: d.user?.fullName })), value: formData.prestadorId, required: true, placeholder: "Seleccionar doctor..." })}
                                <fieldset disabled={!formData.prestadorId}>
                                    {renderSelector({ label: "Servicio", name: "servicioId", options: lists.services.map(s => ({ value: s.id, label: `${s.nombre_servicio} (${s.tiempo} min)`})), value: formData.servicioId, isLoading: status.loading.services, required: true, placeholder: "Seleccionar servicio..." })}
                                </fieldset>
                            </Col>
                            <Col lg={8} className="ps-lg-4">
                                <fieldset disabled={!formData.servicioId}>
                                    <h5 className="mb-3 fw-bold">2. Fecha y Hora</h5>
                                    <Row>
                                        <Col xl={7} className="mb-3 mb-xl-0">
                                            <Form.Group className="mb-3"><Form.Label>Fecha</Form.Label>
                                                <Calendar 
                                                    className="availability-calendar" 
                                                    value={formData.date ? new Date(formData.date+"T12:00:00Z") : null} 
                                                    onChange={d => handlers.dispatch({ type: 'SET_FIELD', payload: { name: 'date', value: d.toISOString().split("T")[0] } })} 
                                                    minDate={new Date()} 
                                                    tileClassName={tileClassName} 
                                                    onActiveStartDateChange={({activeStartDate}) => handlers.dispatch({type: 'SET_ACTIVE_CALENDAR_DATE', payload: activeStartDate})} 
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xl={5}>
                                            <Form.Group><Form.Label>Hora</Form.Label>
                                                <div className="time-slot-grid-container">
                                                    {status.loading.slots ? <div className="text-center p-3"><Spinner size="sm" /></div> : (
                                                        <div className="d-flex flex-wrap gap-2">{lists.dynamicSlots.length > 0 ? lists.dynamicSlots.map((slot,i) => <Button key={i} variant={formData.startTime === slot.start ? 'primary' : 'outline-primary'} className="time-slot-button" onClick={() => handlers.dispatch({ type: 'SET_FIELD', payload: { name: 'startTime', value: slot.start } })}>{slot.start}</Button>) : <Alert variant="light" className="p-2 w-100 text-center small">{!formData.date ? "Seleccione una fecha" : "No hay horarios disponibles"}</Alert>}</div>
                                                    )}
                                                </div>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </fieldset>
                            </Col>
                        </Row>
                        <hr className="my-4"/>
                        <Form.Group>
                            <Form.Label>Motivo/Notas (opcional)</Form.Label>
                            <Form.Control as="textarea" name="reason" value={formData.reason || ''} onChange={(e) => handlers.dispatch({ type: 'SET_FIELD', payload: { name: e.target.name, value: e.target.value } })} rows={2} />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="secondary" onClick={() => handlers.navigate("/appointments")}>Cancelar</Button>
                            <Button type="submit" className="btn-confirm" disabled={status.submit || !formData.startTime}>{status.submit ? 'Guardando...' : (ui.isEditing ? 'Actualizar Cita' : 'Crear Cita')}</Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AppointmentForm;