import React, { useReducer, useEffect, useCallback, useMemo, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import 'bootstrap-icons/font/bootstrap-icons.css';

// --- Dependencias de API (Asegúrate de que las rutas sean correctas en tu proyecto) ---
import { AuthContext } from "../../context/AuthContextValue";
import { AppointmentService, DoctorService, PatientService, SectorService } from "../../utils/api";
import PrestadorServicioService from "../../services/PrestadorServicioService";

// ===================================================================================
// 1. ESTILOS LOCALES
// ===================================================================================
const StyleProvider = React.memo(() => (
  <style>
    {`
      .appointments-card {
        background: #fff;
        border-radius: 1rem;
        border: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      }
      .appointments-card-header {
        background-color: #fff !important;
        border-bottom: 2px solid #f0f0f0 !important;
        padding: 1rem 1.5rem;
      }
      .appointments-card-header h4 {
        color: #275950;
        font-weight: 600;
      }
      .form-label {
        color: #2A8C82;
        font-weight: 500;
      }
      
      /* === ESTILOS DEL CALENDARIO DE DISPONIBILIDAD === */
      .availability-calendar {
        border: none;
        font-family: inherit;
      }
      .availability-calendar .react-calendar__tile {
        border-radius: 0.5rem;
        transition: all 0.2s ease-in-out;
      }
      /* VERDE: Día laborable con horarios disponibles */
      .availability-calendar .available-day {
        background-color: #e8f5e9;
        color: #2e7d32;
        font-weight: bold;
      }
      /* ROJO: Día laborable, con agenda agotada */
      .availability-calendar .full-day {
        background-color: #ffebee;
        color: #c62828;
      }
      /* GRIS: Día no laborable */
      .availability-calendar .non-working-day {
        background-color: #f5f5f5;
        color: #bdbdbd;
      }
      /* GRIS TACHADO: Días pasados (deshabilitados por react-calendar) */
      .availability-calendar .react-calendar__tile:disabled {
        background-color: #f5f5f5 !important;
        text-decoration: line-through;
        opacity: 0.6;
      }
      /* AZUL: Día seleccionado */
      .availability-calendar .react-calendar__tile--active:enabled {
        background: #275950 !important;
        color: white !important;
        text-decoration: none;
        transform: scale(1.1);
      }
      .availability-calendar .react-calendar__tile--active:enabled:hover {
        background: #1d403a !important;
      }
      .availability-calendar .react-calendar__tile:enabled:hover {
        background-color: #e0f7fa;
      }
      .availability-calendar .react-calendar__tile--now {
        border: 2px solid #275950;
      }

      /* === ESTILOS DE LOS BOTONES DE HORA === */
      .time-slot-button.selected {
        background-color: #275950 !important;
        border-color: #1d403a !important;
        color: white;
        transform: scale(1.05);
        transition: transform 0.1s ease-in-out;
        box-shadow: 0 2px 8px rgba(39, 89, 80, 0.2);
      }
    `}
  </style>
));

// ===================================================================================
// 2. GESTOR DE ESTADO (Reducer)
// ===================================================================================
const initialState = {
  formData: { prestadorId: "", servicioId: "", patientId: "", date: "", startTime: "", endTime: "", status: "scheduled", reason: "", notes: "", sectorId: "" },
  lists: { sectors: [], doctors: [], patients: [], services: [], dynamicSlots: [] },
  monthlyAvailability: {},
  ui: { selectedDoctor: null, selectedService: null, originalAppointment: null, isEditing: false, formKey: Date.now(), activeCalendarDate: new Date() },
  status: { loading: { initial: true, doctors: false, services: false, slots: false, monthly: false, submit: false }, error: null },
};

function appointmentReducer(state, action) {
  switch (action.type) {
    case 'SET_INITIAL_CONTEXT':
      return { ...state, ui: { ...state.ui, isEditing: action.payload.isEditing }, formData: { ...state.formData, sectorId: action.payload.userSectorId } };
    case 'SET_FIELD':
      return { ...state, formData: { ...state.formData, [action.payload.name]: action.payload.value } };
    case 'SET_LIST':
      return { ...state, lists: { ...state.lists, [action.payload.key]: action.payload.data } };
    case 'SET_MONTHLY_AVAILABILITY':
      return { ...state, monthlyAvailability: action.payload };
    case 'SET_ACTIVE_CALENDAR_DATE':
      return { ...state, ui: { ...state.ui, activeCalendarDate: action.payload } };
    case 'SET_UI_STATE':
      return { ...state, ui: { ...state.ui, [action.payload.key]: action.payload.value } };
    case 'SET_LOADING':
      return { ...state, status: { ...state.status, loading: { ...state.status.loading, [action.payload.key]: action.payload.value } } };
    case 'SET_ERROR':
      return { ...state, status: { ...state.status, error: action.payload, loading: { ...state.status.loading, submit: false } } };
    case 'LOAD_EXISTING_APPOINTMENT':
      return { ...state, formData: { ...state.formData, ...action.payload.formData }, ui: { ...state.ui, originalAppointment: action.payload.appointment, selectedDoctor: action.payload.doctor, selectedService: action.payload.service } };
    case 'RESET_DOCTOR_SELECTION':
      return { ...state, formData: { ...initialState.formData, sectorId: state.formData.sectorId, patientId: state.formData.patientId }, lists: { ...state.lists, doctors: state.lists.doctors, services: [], dynamicSlots: [] }, monthlyAvailability: {}, ui: { ...state.ui, selectedDoctor: null, selectedService: null } };
    case 'RESET_SERVICE_SELECTION':
        return { ...state, formData: { ...state.formData, servicioId: '', startTime: '', endTime: '' }, lists: { ...state.lists, dynamicSlots: [] }, ui: { ...state.ui, selectedService: null } };
    case 'RESET_TIME_SELECTION':
      return { ...state, formData: { ...state.formData, startTime: '', endTime: '' } };
    case 'SUBMIT_SUCCESS':
      return { ...initialState, lists: { ...initialState.lists, sectors: state.lists.sectors, patients: state.lists.patients }, ui: { ...initialState.ui, formKey: Date.now() } };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

// ===================================================================================
// 3. HOOK DE LÓGICA (El Cerebro)
// ===================================================================================
function useAppointmentForm(authContext) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { user, isAdmin } = authContext;

  const [state, dispatch] = useReducer(appointmentReducer, initialState);
  const { formData, lists, ui, status, monthlyAvailability } = state;

  useEffect(() => {
    dispatch({ type: 'SET_INITIAL_CONTEXT', payload: { isEditing, userSectorId: user.role === 'sector_admin' ? user.sectorId : '' } });
    const fetchCoreData = async () => {
        try {
            const [patientsRes, sectorsRes] = await Promise.all([ PatientService.getAll(), isAdmin ? SectorService.getAll() : Promise.resolve({ data: [] }) ]);
            dispatch({ type: 'SET_LIST', payload: { key: 'patients', data: patientsRes.data } });
            if (sectorsRes.data) dispatch({ type: 'SET_LIST', payload: { key: 'sectors', data: sectorsRes.data } });
            if (isEditing) {
                const appRes = await AppointmentService.getById(id);
                const appointment = appRes.data;
                const [docRes, servicesRes] = await Promise.all([
                    DoctorService.getById(appointment.prestadorId),
                    PrestadorServicioService.getServicios(appointment.prestadorId)
                ]);
                const doctor = docRes.data;
                const service = servicesRes.data.find(s => s.id === appointment.servicioId);
                dispatch({ type: 'LOAD_EXISTING_APPOINTMENT', payload: { appointment, doctor, service, formData: { ...appointment, date: new Date(appointment.date).toISOString().split('T')[0], sectorId: doctor.sectorId } } });
                dispatch({ type: 'SET_LIST', payload: { key: 'services', data: servicesRes.data } });
            }
        } catch (err) { dispatch({ type: 'SET_ERROR', payload: 'Error fatal al cargar datos.' });
        } finally { dispatch({ type: 'SET_LOADING', payload: { key: 'initial', value: false } }); }
    }
    fetchCoreData();
  }, [id, isEditing, isAdmin, user.role, user.sectorId]);
  
  useEffect(() => {
    if (formData.sectorId) {
      dispatch({ type: 'RESET_DOCTOR_SELECTION' });
      dispatch({ type: 'SET_LOADING', payload: { key: 'doctors', value: true } });
      DoctorService.getBySector(formData.sectorId)
        .then(res => dispatch({ type: 'SET_LIST', payload: { key: 'doctors', data: res.data } }))
        .catch(() => dispatch({ type: 'SET_ERROR', payload: 'Error al cargar doctores.' }))
        .finally(() => dispatch({ type: 'SET_LOADING', payload: { key: 'doctors', value: false } }));
    }
  }, [formData.sectorId]);

  useEffect(() => {
    if (formData.prestadorId) {
      const doctor = lists.doctors.find(d => d.id === parseInt(formData.prestadorId));
      dispatch({ type: 'SET_UI_STATE', payload: { key: 'selectedDoctor', value: doctor || null } });
      dispatch({ type: 'RESET_SERVICE_SELECTION' });
      dispatch({ type: 'SET_LOADING', payload: { key: 'services', value: true } });
      PrestadorServicioService.getServicios(formData.prestadorId)
        .then(res => dispatch({ type: 'SET_LIST', payload: { key: 'services', data: res.data } }))
        .catch(() => dispatch({ type: 'SET_ERROR', payload: 'Error al cargar servicios.' }))
        .finally(() => dispatch({ type: 'SET_LOADING', payload: { key: 'services', value: false } }));
    } else {
        dispatch({ type: 'SET_MONTHLY_AVAILABILITY', payload: {} });
    }
  }, [formData.prestadorId, lists.doctors]);

  useEffect(() => {
      if(ui.selectedDoctor) {
          dispatch({ type: 'SET_LOADING', payload: { key: 'monthly', value: true } });
          const year = ui.activeCalendarDate.getFullYear();
          const month = ui.activeCalendarDate.getMonth() + 1;
          DoctorService.getMonthlyAvailability(ui.selectedDoctor.id, year, month)
              .then(res => dispatch({ type: 'SET_MONTHLY_AVAILABILITY', payload: res.data }))
              .catch(() => dispatch({ type: 'SET_ERROR', payload: 'Error al cargar disponibilidad del mes.' }))
              .finally(() => dispatch({ type: 'SET_LOADING', payload: { key: 'monthly', value: false } }));
      }
  }, [ui.selectedDoctor, ui.activeCalendarDate]);

  useEffect(() => {
      if (formData.servicioId) {
          const service = lists.services.find(s => s.id === parseInt(formData.servicioId));
          dispatch({ type: 'SET_UI_STATE', payload: { key: 'selectedService', value: service || null } });
          dispatch({ type: 'RESET_TIME_SELECTION' });
      }
  }, [formData.servicioId, lists.services]);

  useEffect(() => {
    const calculateDynamicSlots = async () => {
        if (!formData.date || !ui.selectedDoctor || !ui.selectedService) {
            if (lists.dynamicSlots.length > 0) dispatch({ type: 'SET_LIST', payload: { key: 'dynamicSlots', data: [] } });
            return;
        }
        dispatch({ type: 'SET_LOADING', payload: { key: 'slots', value: true } });
        try {
            const availabilityResponse = await DoctorService.getDailyAvailability(ui.selectedDoctor.id, formData.date);
            const { workBlocks = [], existingAppointments = [] } = availabilityResponse.data;
            const serviceDuration = ui.selectedService.tiempo; 
            if (!workBlocks || workBlocks.length === 0) {
                dispatch({ type: 'SET_LIST', payload: { key: 'dynamicSlots', data: [] } });
                dispatch({ type: 'SET_LOADING', payload: { key: 'slots', value: false } });
                return;
            }
            const timeToMinutes = (time) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
            const minutesToTime = (mins) => `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
            const appointmentIntervals = existingAppointments
                .filter(app => !(isEditing && app.id === ui.originalAppointment?.id))
                .map(app => ({ start: timeToMinutes(app.startTime), end: timeToMinutes(app.endTime) }));
            const availableSlots = [];
            for (const block of workBlocks) {
                let currentSlotStart = timeToMinutes(block.startTime);
                const blockEnd = timeToMinutes(block.endTime);
                while (currentSlotStart + serviceDuration <= blockEnd) {
                    const currentSlotEnd = currentSlotStart + serviceDuration;
                    const isOverlapping = appointmentIntervals.some(app => currentSlotStart < app.end && currentSlotEnd > app.start);
                    if (!isOverlapping) {
                        availableSlots.push({ start: minutesToTime(currentSlotStart), end: minutesToTime(currentSlotEnd) });
                    }
                    currentSlotStart += 15; // Intervalo de chequeo de 15 minutos
                }
            }
            dispatch({ type: 'SET_LIST', payload: { key: 'dynamicSlots', data: availableSlots } });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Error al calcular horarios.' });
            dispatch({ type: 'SET_LIST', payload: { key: 'dynamicSlots', data: [] } });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { key: 'slots', value: false } });
        }
    };
    calculateDynamicSlots();
  }, [formData.date, ui.selectedDoctor, ui.selectedService, isEditing, ui.originalAppointment]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    dispatch({ type: 'SET_FIELD', payload: { name, value } });
    if (name === 'sectorId') dispatch({ type: 'RESET_DOCTOR_SELECTION' });
    if (name === 'prestadorId') dispatch({ type: 'RESET_SERVICE_SELECTION' });
    if (name === 'date' || name === 'servicioId') dispatch({ type: 'RESET_TIME_SELECTION' });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_LOADING', payload: { key: 'submit', value: true } });
    if (!formData.prestadorId || !formData.patientId || !formData.date || !formData.startTime || !formData.endTime) {
      dispatch({ type: 'SET_ERROR', payload: 'Por favor, complete todos los campos obligatorios.' });
      dispatch({ type: 'SET_LOADING', payload: { key: 'submit', value: false } });
      return;
    }
    try {
      const action = isEditing ? AppointmentService.update(id, formData) : AppointmentService.create(formData);
      await action;
      dispatch({ type: 'SUBMIT_SUCCESS' });
      navigate('/appointments', { state: { success: `Cita ${isEditing ? 'actualizada' : 'creada'} correctamente` } });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: `Error al guardar: ${err.response?.data?.message || err.message}` });
    }
  }, [formData, isEditing, id, navigate]);

  return { state, handlers: { handleChange, handleSubmit, navigate, dispatch }, isAdmin };
}

// ===================================================================================
// 4. SUB-COMPONENTES DE PRESENTACIÓN
// ===================================================================================
const SectorSelector = ({ v, oC, s, d }) => ( <Form.Group className="mb-3"><Form.Label>Sector</Form.Label><Form.Select name="sectorId" value={v} onChange={oC} disabled={d}><option value="">Seleccione un sector</option>{s.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</Form.Select></Form.Group> );
const DoctorSelector = ({ v, oC, d, dis, iL }) => ( <Form.Group className="mb-3"><Form.Label>Doctor</Form.Label><Form.Select name="prestadorId" value={v} onChange={oC} disabled={dis} required><option value="">{iL?'Cargando...':(dis?'Seleccione sector':'Seleccione doctor')}</option>{d.map(i => <option key={i.id} value={i.id}>{i.user?.fullName} - {i.specialty?.name}</option>)}</Form.Select></Form.Group> );
const PatientSelector = ({ v, oC, p }) => ( <Form.Group className="mb-3"><Form.Label>Paciente</Form.Label><Form.Select name="patientId" value={v} onChange={oC} required><option value="">Seleccione un paciente</option>{p.map(i => <option key={i.id} value={i.id}>{i.fullName} ({i.documentId})</option>)}</Form.Select></Form.Group> );
const ServiceSelector = ({ v, oC, s, dis, iL }) => ( <Form.Group className="mb-3"><Form.Label>Servicio</Form.Label><Form.Select name="servicioId" value={v} onChange={oC} disabled={dis} required><option value="">{iL?'Cargando...':'Seleccione un servicio'}</option>{s.map(i => <option key={i.id} value={i.id}>{i.nombre_servicio} ({i.tiempo} min)</option>)}</Form.Select></Form.Group> );
const TimeSlotGrid = ({ slots, selectedSlot, onSlotClick, isLoading, dateSelected, serviceSelected }) => ( <Form.Group className="mb-3"><Form.Label>Horarios Disponibles</Form.Label>{isLoading ? <div className="text-center p-4"><Spinner animation="border" size="sm"/></div> : (<div className="d-flex flex-wrap gap-2">{slots.length>0 ? (slots.map((slot,i)=>(<Button key={i} variant="outline-primary" className={`time-slot-button ${selectedSlot===slot.start?'selected':''}`} onClick={()=>onSlotClick(slot)}>{slot.start}</Button>))):(<Alert variant="secondary" className="p-2 w-100 text-center small">{!dateSelected?"Seleccione fecha":!serviceSelected?"Seleccione servicio":"No hay horarios disponibles"}</Alert>)}</div>)}</Form.Group> );

const AvailabilityCalendar = ({ date, onDateChange, monthlyAvailability, onActiveStartDateChange, isLoading }) => {
    const tileClassName = useCallback(({ date: tileDate, view }) => {
        if (view !== 'month') return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (tileDate < today) return null;
        
        const year = tileDate.getFullYear();
        const month = String(tileDate.getMonth() + 1).padStart(2, '0');
        const day = String(tileDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const status = monthlyAvailability[dateStr];
        switch(status) {
            case 'AVAILABLE': return 'available-day';
            case 'FULL': return 'full-day';
            case 'NOT_WORKING': return 'non-working-day';
            default: return null;
        }
    }, [monthlyAvailability]);
    
    return (<Form.Group className="mb-3"><Form.Label>Calendario de Disponibilidad {isLoading&&<Spinner animation="border" size="sm" className="ms-2"/>}</Form.Label><Calendar className="availability-calendar" value={date?new Date(date+"T12:00:00Z"):null} onChange={(d)=>onDateChange(d?d.toISOString().split("T")[0]:'')} minDate={new Date()} tileClassName={tileClassName} onActiveStartDateChange={({activeStartDate})=>onActiveStartDateChange(activeStartDate)} locale="es-ES"/></Form.Group>);
};

// ===================================================================================
// 5. COMPONENTE PRINCIPAL (La Vista)
// ===================================================================================
const AppointmentForm = () => {
  const authContext = useContext(AuthContext);
  const { state, handlers, isAdmin } = useAppointmentForm(authContext);
  const { formData, lists, ui, status, monthlyAvailability } = state;

  if (status.loading.initial) {
    return <Container className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2">Cargando...</p></Container>;
  }

  return (
    <>
      <StyleProvider />
      <Container className="py-4">
        <Card className="appointments-card">
          <Card.Header className="appointments-card-header d-flex justify-content-between align-items-center p-3">
            <h4 className="mb-0">
              <i className="bi bi-calendar2-plus-fill me-2" style={{color: "#275950"}}></i>
              {ui.isEditing ? "Editar Cita" : "Agendar Nueva Cita"}
            </h4>
          </Card.Header>
          <Card.Body className="p-4">
            <Form key={ui.formKey} onSubmit={handlers.handleSubmit} noValidate>
              {status.error && <Alert variant="danger" onClose={() => handlers.dispatch({type: 'SET_ERROR', payload: null})} dismissible>{status.error}</Alert>}
              
              <Row>
                <Col lg={4} className="mb-3 mb-lg-0 pe-lg-4 border-end-lg">
                  <h5 className="mb-3">1. Paciente y Profesional</h5>
                  <PatientSelector v={formData.patientId} oC={handlers.handleChange} p={lists.patients} />
                  {isAdmin && <SectorSelector v={formData.sectorId} oC={handlers.handleChange} s={lists.sectors} d={!isAdmin} />}
                  <DoctorSelector v={formData.prestadorId} oC={handlers.handleChange} d={lists.doctors} dis={!formData.sectorId || status.loading.doctors} iL={status.loading.doctors} />
                </Col>
                
                <Col lg={8} className="mb-3 ps-lg-4">
                  <fieldset disabled={!formData.prestadorId || !formData.patientId}>
                    <Row>
                      <Col xl={5} className="mb-3 mb-xl-0">
                        <h5 className="mb-3">2. Servicio</h5>
                        <ServiceSelector v={formData.servicioId} oC={handlers.handleChange} s={lists.services} dis={status.loading.services || !formData.prestadorId} iL={status.loading.services} />
                      </Col>
                      <Col xl={7}>
                        <fieldset disabled={!formData.servicioId}>
                          <h5 className="mb-3">3. Fecha y Hora</h5>
                          <Row>
                            <Col md={7} className="mb-3 mb-md-0">
                              <AvailabilityCalendar date={formData.date} onDateChange={(d)=>handlers.handleChange({target:{name:'date',value:d}})} monthlyAvailability={monthlyAvailability} onActiveStartDateChange={(d)=>handlers.dispatch({type:'SET_ACTIVE_CALENDAR_DATE',payload:d})} isLoading={status.loading.monthly}/>
                            </Col>
                            <Col md={5}>
                              <TimeSlotGrid slots={lists.dynamicSlots} selectedSlot={formData.startTime} onSlotClick={(slot)=>{handlers.handleChange({target:{name:'startTime',value:slot.start}});handlers.handleChange({target:{name:'endTime',value:slot.end}});}} isLoading={status.loading.slots} dateSelected={!!formData.date} serviceSelected={!!formData.servicioId}/>
                            </Col>
                          </Row>
                        </fieldset>
                      </Col>
                    </Row>
                  </fieldset>
                </Col>
              </Row>

              <hr className="my-4"/>

              {formData.startTime && (<Alert variant="success"><strong>Cita seleccionada:</strong> {new Date(formData.date+"T12:00:00Z").toLocaleDateString('es-ES',{weekday:'long',year:'numeric',month:'long',day:'numeric', timeZone:'UTC'})} a las <strong>{formData.startTime}</strong></Alert>)}
              
              <Form.Group>
                <Form.Label>Motivo de la cita (opcional)</Form.Label>
                <Form.Control as="textarea" name="reason" value={formData.reason} onChange={handlers.handleChange} rows={2} />
              </Form.Group>

              {ui.isEditing && (
                  <Form.Group className="mt-3">
                    <Form.Label>Estado de la Cita</Form.Label>
                    <Form.Select name="status" value={formData.status} onChange={handlers.handleChange}>
                      <option value="scheduled">Programada</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                      <option value="no_show">No asistió</option>
                    </Form.Select>
                  </Form.Group>
              )}

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button variant="outline-secondary" onClick={() => handlers.navigate("/appointments")} disabled={status.loading.submit}>Cancelar</Button>
                <Button type="submit" variant="primary" className="btn-azul" disabled={status.loading.submit || !formData.startTime}>
                  {status.loading.submit ? <><Spinner as="span" animation="border" size="sm" className="me-2"/>Guardando...</> : (ui.isEditing ? 'Actualizar Cita' : 'Crear Cita')}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export default AppointmentForm;
