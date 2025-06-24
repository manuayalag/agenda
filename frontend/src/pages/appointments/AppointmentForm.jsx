import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Card,
  Form,
  Row,
  Col,
  Button,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContextValue";
import {
  AppointmentService,
  DoctorService,
  PatientService,
  SectorService,
} from "../../utils/api";
import PrestadorServicioService from "../../services/PrestadorServicioService";
import { format } from "date-fns";

// Se usan estilos de Bootstrap directamente para el grid de horarios

const AppointmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { user, isAdmin } = useContext(AuthContext);
  // Utilidad para comprobar si un doctor trabaja en un día específico
  const isDoctorWorkingOnDate = (doctor, dateStr) => {
    if (
      !doctor ||
      !doctor.workingDays ||
      !dateStr ||
      !Array.isArray(doctor.workingDays)
    ) {
      console.log("Datos faltantes para verificar día laborable:", {
        doctor: !!doctor,
        workingDays: doctor ? !!doctor.workingDays : false,
        dateStr: !!dateStr,
      });
      return false;
    }

    try {
      // Asegurar formato de fecha correcto (YYYY-MM-DD)
      let formattedDate = dateStr;
      if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const tempDate = new Date(dateStr);
        formattedDate = `${tempDate.getFullYear()}-${String(
          tempDate.getMonth() + 1
        ).padStart(2, "0")}-${String(tempDate.getDate()).padStart(2, "0")}`;
      }
      // Para evitar problemas de zona horaria, usamos los componentes de la fecha directamente
      // En lugar de confiar en parseISO que puede tener problemas con las zonas horarias
      const [year, month, day] = formattedDate.split("-").map(Number);
      // Crear la fecha usando componentes específicos (año, mes (0-indexed), día)
      const dateObj = new Date(year, month - 1, day);

      // getDay() sobre este objeto date para obtener el día correcto
      const dayOfWeek = dateObj.getDay(); // 0-6 (0=domingo, 1=lunes, ..., 6=sábado)

      // Convertir de 0-6 (domingo a sábado) a 1-7 (lunes a domingo) como lo usa la base de datos
      const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

      // Información detallada para depuración

      // Convertir todos los días laborables a números y asegurarnos de que sean válidos
      const workingDaysNumbers = [];
      for (let day of doctor.workingDays) {
        // Convertir string a número si es necesario
        let dayNum = typeof day === "string" ? parseInt(day) : day;

        // Solo incluir valores válidos (1-7)
        if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 7) {
          workingDaysNumbers.push(dayNum);
        } else {
          console.warn(
            `Día inválido encontrado en workingDays: ${day} (${typeof day})`
          );
        }
      }

      // Si no hay días válidos, considerar que trabaja todos los días para prevenir bloqueos
      if (workingDaysNumbers.length === 0) {
        console.warn(
          "No se encontraron días laborables válidos, asumiendo que trabaja todos los días"
        );
        return true;
      }

      // Verificar si el día está en los días laborables usando includes para comparación exacta
      const isDayWorking = workingDaysNumbers.includes(dayNumber);

      return isDayWorking;
    } catch (error) {
      console.error("Error al verificar día laborable:", error);
      // En caso de error, asumimos que sí trabaja para no bloquear
      return true;
    }
  };

  // Utilidad para obtener los nombres de los días laborables
  const getWorkingDaysLabels = (doctor) => {
    if (!doctor || !doctor.workingDays || !Array.isArray(doctor.workingDays))
      return [];

    const dayNames = [
      "",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];
    return doctor.workingDays
      .map((day) => {
        const dayNum = typeof day === "string" ? parseInt(day) : day;
        return dayNum >= 1 && dayNum <= 7 ? dayNames[dayNum] : null;
      })
      .filter((day) => day !== null);
  };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sectors, setSectors] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [patients, setPatients] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formKey, setFormKey] = useState(Date.now()); // Para forzar la recarga del formulario
  const [originalAppointment, setOriginalAppointment] = useState(null); // Almacenar la cita original
  const [debugInfo, setDebugInfo] = useState(null); // Para almacenar información de diagnóstico
  const [servicios, setServicios] = useState([]);

  const [formData, setFormData] = useState({
    prestadorId: "",
    servicioId: "",
    patientId: "",
    date: "",
    startTime: "",
    status: "scheduled",
    reason: "",
    notes: "",
    sectorId: user.role === "sector_admin" ? user.sectorId : "",
  });

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Si estamos editando, cargar los datos de la cita
        if (isEditing) {
          const appointmentResponse = await AppointmentService.getById(id);
          const appointment = appointmentResponse.data;
          setOriginalAppointment(appointment); // Guardar la cita original

          // Formatear fechas y horas para asegurar consistencia
          const formattedDate = new Date(appointment.date)
            .toISOString()
            .split("T")[0];

          setFormData({
            ...appointment,
            date: formattedDate,
            startTime: appointment.startTime,
            prestadorId: appointment.prestadorId,
            patientId: appointment.patientId,
            servicioId: appointment.servicioId,
            sectorId:
              appointment.doctor?.sectorId ||
              (user.role === "sector_admin" ? user.sectorId : ""),
          });

          // Si tenemos doctor, precargarlo
          if (appointment.prestadorId) {
            const doctorResponse = await DoctorService.getById(
              appointment.prestadorId
            );
            const doctor = doctorResponse.data;
            setSelectedDoctor(doctor);
            console.log("Doctor cargado para edición:", doctor);

            await loadAvailableSlots(appointment.prestadorId, formattedDate);
          }
        }

        // Cargar sectores (solo si es admin)
        if (isAdmin) {
          const sectorsResponse = await SectorService.getAll();
          setSectors(sectorsResponse.data);
        }

        // Cargar doctores según filtros (sector)
        const sectorIdToUse = formData.sectorId || user.sectorId;
        await loadDoctors(sectorIdToUse);

        // Cargar pacientes para búsqueda
        const patientsResponse = await PatientService.getAll();
        setPatients(patientsResponse.data);

        // Cargar servicios solo si hay prestador seleccionado
        let serviciosResponse = { data: [] };
        console.log("Prestador ID en carga inicial:", formData.prestadorId);
        if (formData.prestadorId) {
          serviciosResponse = await PrestadorServicioService.getServicios(formData.prestadorId);
          console.log("Servicios cargadosasdsadasd:", serviciosResponse.data);
        }
        setServicios(serviciosResponse.data);
      } catch (err) {
        setError("Error al cargar los datos. Por favor, intente nuevamente.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditing, isAdmin, user.sectorId, user.role]);

  // Refuerzo: solo cargar originalAppointment una vez al entrar en edición
  useEffect(() => {
    if (isEditing && !originalAppointment && id) {
      AppointmentService.getById(id)
        .then((res) => {
          setOriginalAppointment(res.data);
        })
        .catch(() => {});
    }
    // No lo borres ni sobrescribas nunca durante la edición
    // Si cambia el id (cita), se recarga automáticamente por el useEffect principal
    // Si sales de la edición, el componente se desmonta y se limpia solo
  }, [isEditing, id]);

  // Hook para cargar horarios SOLO cuando originalAppointment esté listo en edición
  useEffect(() => {
    if (isEditing) {
      if (originalAppointment) {
        // Solo cargar horarios si ya tenemos la cita original
        const formattedDate = new Date(originalAppointment.date)
          .toISOString()
          .split("T")[0];
        loadAvailableSlots(originalAppointment.prestadorId, formattedDate);
      }
    }
    // En modo creación, la lógica normal ya funciona
    // eslint-disable-next-line
  }, [isEditing, originalAppointment]);

  // Cargar doctores según el sector seleccionado
  const loadDoctors = async (sectorId) => {
    try {
      let doctorsResponse;

      if (sectorId) {
        doctorsResponse = await DoctorService.getBySector(sectorId);
      } else {
        doctorsResponse = await DoctorService.getAll();
      }

      setDoctors(doctorsResponse.data);

      // Agrupar doctores por especialidad para mostrar en el selector
      const uniqueSpecialties = [
        ...new Set(doctorsResponse.data.map((doctor) => doctor.specialty?.id)),
      ];
      const specialtiesData = [];

      for (const specialtyId of uniqueSpecialties) {
        const doctor = doctorsResponse.data.find(
          (d) => d.specialty?.id === specialtyId
        );
        if (doctor && doctor.specialty) {
          specialtiesData.push(doctor.specialty);
        }
      }

      setSpecialties(specialtiesData);
    } catch (err) {
      console.error("Error al cargar doctores:", err);
    }
  };
  // Cargar horarios disponibles para un doctor en una fecha específica
  const loadAvailableSlots = async (prestadorId, date, servicioId) => {
    try {
      if (!prestadorId || !date) {
        setAvailableSlots([]);
        return;
      }
      // Si tienes que enviar la duración del servicio, puedes buscarla aquí:
      let duracionServicio = null;
      if (servicioId && servicios && servicios.length > 0) {
        const servicio = servicios.find(s => s.id === parseInt(servicioId));
        if (servicio) duracionServicio = servicio.tiempo;
      }
      // Si tu backend soporta duración por query:
      // const response = await DoctorService.getAvailability(prestadorId, date, duracionServicio);
      // Si no, solo pasa prestadorId y date:
      const response = await DoctorService.getAvailability(prestadorId, date);
      setAvailableSlots(response.data.availableSlots || []);
    } catch (err) {
      setAvailableSlots([]);
    }
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Si cambia el sector, cargar doctores de ese sector
    if (name === "sectorId") {
      loadDoctors(value);

      // Resetear doctor y horarios
      setFormData((prev) => ({
        ...prev,
        prestadorId: "",
        startTime: "",
        endTime: "",
      }));

      setSelectedDoctor(null);
      setAvailableSlots([]);
    }

    // Si cambia el doctor, cargar sus datos y disponibilidad
    if (name === "prestadorId") {
      const prestadorId = parseInt(value);

      // Primero obtener los datos completos del doctor
      const loadDoctorData = async () => {
        try {
          // Buscar primero en los doctores cargados
          let doctor = doctors.find((d) => d.id === prestadorId);

          // Si no lo encontramos o no tiene datos completos, cargarlo de nuevo
          if (!doctor || !doctor.workingDays) {
            const response = await DoctorService.getById(prestadorId);
            doctor = response.data;
          }

          console.log("Doctor cargado:", doctor);
          setSelectedDoctor(doctor);

          // Si ya hay fecha seleccionada, cargar horarios disponibles
          if (formData.date) {
            console.log(
              `Doctor seleccionado: ${prestadorId}, cargando horarios para fecha: ${formData.date}`
            );
            loadAvailableSlots(prestadorId, formData.date);
          }
        } catch (error) {
          console.error("Error al cargar datos del doctor:", error);
          setError("Error al cargar datos del doctor seleccionado");
        }
      };

      loadDoctorData();
    }

    // Si cambia la fecha, cargar horarios disponibles
    if (name === "date") {
      // Resetear horarios
      setFormData((prev) => ({
        ...prev,
        startTime: "",
        endTime: "",
      }));

      if (formData.prestadorId) {
        console.log(
          `Fecha seleccionada: ${value}, cargando horarios para doctor: ${formData.prestadorId}`
        );
        loadAvailableSlots(parseInt(formData.prestadorId), value);
      }
    }

    // Si selecciona un horario
    if (name === "timeSlot") {
      const [startTime, endTime] = value.split("|");

      setFormData((prev) => ({
        ...formData,
        startTime,
        endTime,
      }));
    }
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      // Validaciones básicas
      if (
        !formData.prestadorId ||
        !formData.patientId ||
        !formData.date ||
        !formData.startTime
      ) {
        setError("Por favor, complete todos los campos obligatorios.");
        setSubmitting(false);
        return;
      }

      // Verificar si el doctor trabaja ese día (a menos que sea edición y la fecha sea la misma que la original)
      if (
        selectedDoctor &&
        (!isEditing ||
          (isEditing &&
            originalAppointment &&
            formData.date !==
              new Date(originalAppointment.date).toISOString().split("T")[0]))
      ) {
        if (!isDoctorWorkingOnDate(selectedDoctor, formData.date)) {
          setError(
            `El doctor seleccionado no trabaja en la fecha elegida (${new Date(
              formData.date
            ).toLocaleDateString()}).`
          );
          setSubmitting(false);
          return;
        }
      }

      // Si estamos editando, actualizar la cita
      if (isEditing) {
        await AppointmentService.update(id, formData);
        navigate("/appointments", {
          state: { success: "Cita actualizada correctamente" },
        });
      } else {
        // Si estamos creando, crear la cita
        await AppointmentService.create(formData);

        // Reiniciar formulario y mostrar mensaje
        setFormData({
          prestadorId: "",
          patientId: "",
          date: "",
          startTime: "",
          status: "scheduled",
          reason: "",
          notes: "",
          sectorId: user.role === "sector_admin" ? user.sectorId : "",
        });

        setSelectedDoctor(null);
        setAvailableSlots([]);
        setFormKey(Date.now()); // Forzar recarga del formulario

        navigate("/appointments", {
          state: { success: "Cita creada correctamente" },
        });
      }
    } catch (err) {
      setError(
        `Error al guardar la cita: ${
          err.response?.data?.message || err.message
        }`
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Siempre incluir el slot seleccionado en availableSlots si no está presente
  useEffect(() => {
    if (formData.startTime && availableSlots.length > 0) {
      const exists = availableSlots.some(
        (slot) => slot.start === formData.startTime
      );
      if (!exists) {
        setAvailableSlots((prev) => [
          ...prev,
          { start: formData.startTime, end: formData.endTime },
        ]);
      }
    }
    // eslint-disable-next-line
  }, [formData.startTime, availableSlots.length]);

  // Cargar servicios del prestador seleccionado
  useEffect(() => {
    const fetchServiciosPrestador = async () => {
      if (formData.prestadorId) {
        try {
          const resp = await PrestadorServicioService.getServicios(formData.prestadorId);
          console.log("Servicios cargados:", resp.data);
          setServicios(resp.data);
        } catch (err) {
          setServicios([]);
        }
      } else {
        setServicios([]);
      }
    };
    fetchServiciosPrestador();
  }, [formData.prestadorId]);

  // Hook para recargar horarios cuando cambia el servicio seleccionado
  useEffect(() => {
    // Solo recargar si hay prestador, fecha y servicio seleccionados
    if (formData.prestadorId && formData.date && formData.servicioId) {
      loadAvailableSlots(parseInt(formData.prestadorId), formData.date, formData.servicioId);
    }
    // eslint-disable-next-line
  }, [formData.servicioId]);

  return (
    <Container className="py-4">
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <h4 className="mb-0">{isEditing ? "Editar Cita" : "Nueva Cita"}</h4>
        </Card.Header>

        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Cargando datos...</p>
            </div>
          ) : (
            <Form key={formKey} onSubmit={handleSubmit}>
              {error && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              )}

              <Row>
                {/* Selector de Sector (solo para admins) */}
                {isAdmin && (
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Sector</Form.Label>
                      <Form.Select
                        name="sectorId"
                        value={formData.sectorId}
                        onChange={handleChange}
                      >
                        <option value="">Seleccione un sector</option>
                        {sectors.map((sector) => (
                          <option key={sector.id} value={sector.id}>
                            {sector.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                )}

                {/* Selector de especialidad */}
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Especialidad</Form.Label>
                    <Form.Select
                      name="specialtyId"
                      onChange={(e) => {
                        // Filtrar doctores por especialidad seleccionada
                        const specialtyDoctors = doctors.filter(
                          (d) => d.specialty?.id === parseInt(e.target.value)
                        );

                        // Si hay doctores, seleccionar el primero
                        if (specialtyDoctors.length > 0) {
                          const selectedprestadorId =
                            specialtyDoctors[0].id.toString();

                          setFormData((prev) => ({
                            ...prev,
                            prestadorId: selectedprestadorId,
                            startTime: "",
                            endTime: "",
                          }));

                          setSelectedDoctor(specialtyDoctors[0]);

                          // Cargar horarios si hay fecha
                          if (formData.date) {
                            loadAvailableSlots(
                              parseInt(selectedprestadorId),
                              formData.date
                            );
                          }
                        }
                      }}
                      value={selectedDoctor?.specialty?.id || ""}
                    >
                      <option value="">Seleccione una especialidad</option>
                      {specialties.map((specialty) => (
                        <option key={specialty.id} value={specialty.id}>
                          {specialty.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Selector de Doctor */}
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Doctor</Form.Label>
                    <Form.Select
                      name="prestadorId"
                      value={formData.prestadorId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione un doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.user?.fullName || `Doctor ID: ${doctor.id}`} -{" "}
                          {doctor.specialty?.name || "Sin especialidad"}
                        </option>
                      ))}
                    </Form.Select>

                    {/* Mostrar información de días laborables del doctor seleccionado */}
                    {selectedDoctor && selectedDoctor.workingDays && (
                      <div className="mt-2 small">
                        <Alert variant="info" className="p-2">
                          <div>
                            <strong>Horario:</strong>{" "}
                            {selectedDoctor.workingHourStart?.substring(0, 5)} -{" "}
                            {selectedDoctor.workingHourEnd?.substring(0, 5)}
                          </div>
                          <div>
                            <strong>Días laborables:</strong>{" "}
                            {getWorkingDaysLabels(selectedDoctor).join(", ")}
                          </div>
                        </Alert>
                      </div>
                    )}
                  </Form.Group>
                </Col>

                {/* Selector de Servicio */}
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Servicio</Form.Label>
                    <Form.Select
                      name="servicioId"
                      value={formData.servicioId || ""}
                      onChange={handleChange}
                      disabled={!servicios || servicios.length === 0}
                      required
                    >
                      <option value="">Seleccione un servicio</option>
                      {console.log("Servicios disponibles:", servicios)}
                      {servicios && servicios.length > 0 ? (
                        servicios.map((servicio) => (
                          <option key={servicio.id} value={servicio.id}>
                            {servicio.nombre_servicio} ({servicio.tiempo} min)
                          </option>
                        ))
                      ) : null}
                    </Form.Select>
                    {/* Mensaje si el prestador no tiene servicios */}
                    {formData.prestadorId && (!servicios || servicios.length === 0) && (
                      <Alert variant="warning" className="mt-2 p-2 small">
                        El prestador seleccionado no tiene servicios asignados.
                      </Alert>
                    )}
                  </Form.Group>
                </Col>

                {/* Selector de Paciente */}
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Paciente</Form.Label>
                    <Form.Select
                      name="patientId"
                      value={formData.patientId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione un paciente</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.fullName} ({patient.documentId})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Selector de Fecha */}
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Fecha</Form.Label>
                    <Form.Control
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={
                        isEditing
                          ? undefined
                          : new Date().toISOString().split("T")[0]
                      }
                      required
                    />
                    {selectedDoctor && selectedDoctor.workingDays && (
                      <div className="mt-2 small">
                        <span className="fw-bold">
                          Días laborables del doctor:{" "}
                        </span>
                        {selectedDoctor.workingDays.map((day) => {
                          const dayNames = [
                            "",
                            "Lunes",
                            "Martes",
                            "Miércoles",
                            "Jueves",
                            "Viernes",
                            "Sábado",
                            "Domingo",
                          ];
                          const dayNum =
                            typeof day === "string" ? parseInt(day) : day;
                          return (
                            <Badge
                              key={dayNum}
                              bg={
                                formData.date &&
                                isDoctorWorkingOnDate(
                                  selectedDoctor,
                                  formData.date
                                )
                                  ? "success"
                                  : "secondary"
                              }
                              className="me-1"
                            >
                              {dayNames[dayNum]}
                            </Badge>
                          );
                        })}
                        {formData.date && (
                          <div className="mt-1">
                            {isDoctorWorkingOnDate(
                              selectedDoctor,
                              formData.date
                            ) ? (
                              <Alert
                                variant="success"
                                className="p-1 mt-1 small"
                              >
                                <i className="bi bi-check-circle me-1"></i>
                                El doctor trabaja en la fecha seleccionada
                              </Alert>
                            ) : (
                              <Alert
                                variant="warning"
                                className="p-1 mt-1 small"
                              >
                                <i className="bi bi-exclamation-circle me-1"></i>
                                El doctor NO trabaja en la fecha seleccionada
                              </Alert>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Form.Group>
                </Col>
                {/* Grid de Horarios Disponibles */}
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Horario</Form.Label>
                    <div className="time-slot-grid">
                      {availableSlots.length > 0 ? (
                        <>
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {availableSlots.map((slot, index) => {
                              const slotValue = `${slot.start}|${slot.end}`;
                              const isSelected =
                                formData.startTime &&
                                `${formData.startTime}|${formData.endTime}` ===
                                  slotValue;
                              // Detectar el slot original: usa originalAppointment si existe, si no, usa formData
                              let isOriginal = false;
                              if (isEditing) {
                                if (originalAppointment) {
                                  isOriginal =
                                    originalAppointment.startTime === slot.start &&
                                    originalAppointment.endTime === slot.end;
                                } else if (formData.startTime && formData.endTime) {
                                  isOriginal =
                                    formData.startTime === slot.start &&
                                    formData.endTime === slot.end;
                                }
                              }
                              // Pintar de verde cualquier horario seleccionado
                              let variant = isSelected ? "success" : "outline-primary";
                              return (
                                <Button
                                  key={index}
                                  variant={variant}
                                  className={`time-slot-button ${
                                    isSelected ? "selected" : ""
                                  }`}
                                  onClick={() => {
                                    const [start, end] = slotValue.split("|");
                                    setFormData({
                                      ...formData,
                                      startTime: start,
                                    });
                                  }}
                                  disabled={!formData.prestadorId || !formData.date}
                                >
                                  {slot.start.substring(0, 5)} -{" "}
                                  {slot.end.substring(0, 5)}
                                  {isOriginal && isSelected && (
                                    <span className="ms-1">(actual)</span>
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                          {formData.startTime && (
                            <div className="mt-2">
                              <Alert variant="info" className="py-1 px-2 mb-0">
                                <strong>Horario seleccionado:</strong>{" "}
                                {formData.startTime.substring(0, 5)} -{" "}
                                {formData.endTime.substring(0, 5)}
                              </Alert>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-muted mt-2">
                          {formData.prestadorId && formData.date ? (
                            <p>No hay horarios disponibles</p>
                          ) : (
                            <p>Seleccione doctor y fecha para ver horarios</p>
                          )}
                        </div>
                      )}

                      {/* Campo oculto para mantener compatibilidad con el formulario */}
                      <input
                        type="hidden"
                        name="timeSlot"
                        value={
                          formData.startTime && formData.endTime
                            ? `${formData.startTime}|${formData.endTime}`
                            : ""
                        }
                        required
                      />
                    </div>
                    {formData.prestadorId && formData.date && (
                      <div className="mt-2">
                        {" "}
                        {availableSlots.length === 0 ? (
                          <Alert variant="warning" className="p-2">
                            <i className="bi bi-exclamation-circle me-2"></i>
                            No hay horarios disponibles para esta fecha.
                            {selectedDoctor &&
                              selectedDoctor.workingDays &&
                              !isDoctorWorkingOnDate(
                                selectedDoctor,
                                formData.date
                              ) &&
                              " El doctor no trabaja este día."}
                            {selectedDoctor &&
                              selectedDoctor.workingDays &&
                              isDoctorWorkingOnDate(
                                selectedDoctor,
                                formData.date
                              ) &&
                              (debugInfo && debugInfo.reason
                                ? debugInfo.reason === "all_slots_booked"
                                  ? " Todas las citas para este día ya están reservadas."
                                  : debugInfo.reason === "no_working_hours"
                                  ? " El doctor no tiene horario de trabajo configurado."
                                  : debugInfo.reason === "invalid_working_hours"
                                  ? " El horario de trabajo del doctor está configurado incorrectamente."
                                  : debugInfo.reason === "fragmented_schedule"
                                  ? " No hay slots disponibles debido a la fragmentación del horario."
                                  : " No se pudieron generar horarios disponibles."
                                : " Todas las citas para este día ya están reservadas.")}
                            {(!selectedDoctor ||
                              !selectedDoctor.workingDays ||
                              selectedDoctor.workingDays.length === 0) &&
                              " El doctor no tiene días laborables configurados."}
                            {selectedDoctor &&
                              (!selectedDoctor.workingHourStart ||
                                !selectedDoctor.workingHourEnd) &&
                              " Los horarios de trabajo del doctor no están configurados correctamente."}
                          </Alert>
                        ) : (
                          <Alert variant="success" className="p-2">
                            <i className="bi bi-check-circle me-2"></i>
                            {availableSlots.length} horario
                            {availableSlots.length > 1 ? "s" : ""} disponible
                            {availableSlots.length > 1 ? "s" : ""}
                            {selectedDoctor &&
                              selectedDoctor.workingHourStart &&
                              selectedDoctor.workingHourEnd && (
                                <span className="ms-2">
                                  (Horario del doctor:{" "}
                                  {selectedDoctor.workingHourStart.substring(
                                    0,
                                    5
                                  )}{" "}
                                  -{" "}
                                  {selectedDoctor.workingHourEnd.substring(
                                    0,
                                    5
                                  )}
                                  )
                                </span>
                              )}
                          </Alert>
                        )}
                      </div>
                    )}
                    {!formData.prestadorId && (
                      <Form.Text className="text-muted">
                        Seleccione un doctor y una fecha para ver horarios
                        disponibles.
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>

                {/* Estado (solo para edición) */}
                {isEditing && (
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Estado</Form.Label>
                      <Form.Select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="scheduled">Programada</option>
                        <option value="completed">Completada</option>
                        <option value="cancelled">Cancelada</option>
                        <option value="no_show">No asistió</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                )}

                {/* Motivo de la cita */}
                <Col md={12} className="mb-3">
                  <Form.Group>
                    <Form.Label>Motivo de la cita</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      rows={2}
                    />
                  </Form.Group>
                </Col>

                {/* Notas (solo para edición) */}
                {isEditing && (
                  <Col md={12} className="mb-3">
                    <Form.Group>
                      <Form.Label>Notas clínicas</Form.Label>
                      <Form.Control
                        as="textarea"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                      />
                    </Form.Group>
                  </Col>
                )}
              </Row>

              {/* Información del doctor seleccionado */}
              {selectedDoctor && selectedDoctor.workingDays && (
                <Card className="mb-4">
                  <Card.Header className="bg-light">
                    <h5 className="mb-0">Información del Doctor</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={12}>
                        <h6>
                          {selectedDoctor.user?.fullName ||
                            `Doctor ID: ${selectedDoctor.id}`}
                        </h6>
                        <p className="mb-1">
                          <strong>Especialidad:</strong>{" "}
                          {selectedDoctor.specialty?.name || "No definida"}
                        </p>
                        <p className="mb-1">
                          <strong>Sector:</strong>{" "}
                          {selectedDoctor.sector?.name || "No definido"}
                        </p>
                        <p className="mb-1">
                          <strong>Duración de consulta:</strong>{" "}
                          {selectedDoctor.appointmentDuration || "No definido"}{" "}
                          minutos
                        </p>
                        <p className="mb-1">
                          <strong>Horario:</strong>{" "}
                          {selectedDoctor.workingHourStart?.substring(0, 5) ||
                            "--:--"}{" "}
                          a{" "}
                          {selectedDoctor.workingHourEnd?.substring(0, 5) ||
                            "--:--"}
                        </p>
                        <p className="mb-1">
                          <strong>Días laborables:</strong>
                        </p>
                        <div className="mb-2">
                          {[
                            "Lunes",
                            "Martes",
                            "Miércoles",
                            "Jueves",
                            "Viernes",
                            "Sábado",
                            "Domingo",
                          ].map((dayName, index) => {
                            // Convertir índice 0-6 a formato 1-7 (donde 0->Lunes, 6->Domingo)
                            const dayNum =
                              index + 1 === 7 ? 7 : (index + 1) % 7;
                            const isWorkingDay =
                              selectedDoctor.workingDays &&
                              selectedDoctor.workingDays.some((day) => {
                                const workDay =
                                  typeof day === "string" ? parseInt(day) : day;
                                return workDay === dayNum;
                              });

                            return (
                              <Badge
                                key={dayNum}
                                bg={isWorkingDay ? "success" : "secondary"}
                                className="me-2 mb-1"
                                style={{ opacity: isWorkingDay ? 1 : 0.5 }}
                              >
                                {dayName}
                              </Badge>
                            );
                          })}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}
              {/* Información de depuración */}
              {debugInfo && (
                <Alert variant="info" className="mt-3 mb-3 small">
                  <h6>Información de depuración:</h6>
                  {debugInfo.workingHours && (
                    <p className="mb-1">
                      Horario del doctor: {debugInfo.workingHours.start} -{" "}
                      {debugInfo.workingHours.end} (duración:{" "}
                      {debugInfo.workingHours.duration} min)
                    </p>
                  )}
                  {debugInfo.appointments !== undefined && (
                    <p className="mb-1">
                      Citas existentes: {debugInfo.appointments}
                    </p>
                  )}
                  {debugInfo.reason && (
                    <p className="mb-1">
                      Razón de no disponibilidad: {debugInfo.reason}
                    </p>
                  )}
                  {debugInfo.workingInfo && (
                    <>
                      <p className="mb-1">
                        Días laborables:{" "}
                        {JSON.stringify(debugInfo.workingInfo.workingDays)}
                      </p>
                      <p className="mb-1">
                        Tiene horario configurado:{" "}
                        {debugInfo.workingInfo.hasWorkingHours ? "Sí" : "No"}
                      </p>
                    </>
                  )}
                </Alert>
              )}
              {isEditing && (
                <Alert variant="warning" className="mt-2">
                  <strong>Depuración:</strong> originalAppointment = {JSON.stringify(originalAppointment)}
                </Alert>
              )}

              {/* Botones de acción */}
              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate("/appointments")}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Guardando...
                    </>
                  ) : isEditing ? (
                    "Actualizar Cita"
                  ) : (
                    "Crear Cita"
                  )}
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AppointmentForm;
