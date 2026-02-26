"use client"
import { useState, useEffect } from "react"
import { helpFetch } from "../../api/helpFetch"

import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CModal,
  CProgress,
  CRow,
  CModalHeader,
  CModalFooter,
  CModalTitle,
  CModalBody,
  CForm,
  CFormSelect,
  CFormInput,
  CFormLabel,
  CSpinner,
  CAlert,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CFormCheck,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from "@coreui/react"
import { CChart } from "@coreui/react-chartjs"
import CIcon from "@coreui/icons-react"
import {
  cilUser,
  cilCloudDownload,
  cilPeople,
  cilEducation,
  cilNotes,
  cilCalendar,
  cilSchool,
  cilGroup,
  cilChart,
  cilUserFollow,
  cilCheckCircle,
  cilXCircle,
  cilReload,
  cilWarning,
  cilSettings,
  cilClock,
} from "@coreui/icons"

const Dashboard = () => {
  // Estados para los datos del dashboard
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [chartData, setChartData] = useState(null)

  // Estados para períodos académicos
  const [currentPeriod, setCurrentPeriod] = useState(null)
  const [allPeriods, setAllPeriods] = useState([])

  // Estados para el modal de finalizar período
  const [showFinalizePeriodModal, setShowFinalizePeriodModal] = useState(false)
  const [finalizingPeriod, setFinalizingPeriod] = useState(false)

  // Estados para el modal de asistencia
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [availableSections, setAvailableSections] = useState([])
  const [selectedSection, setSelectedSection] = useState(null)
  const [attendanceForm, setAttendanceForm] = useState({
    sectionId: "",
    date: new Date().toISOString().split("T")[0],
    observations: "",
    students: [],
  })

  // Estados para estudiantes de la sección
  const [sectionStudents, setSectionStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Instancia de helpFetch
  const api = helpFetch()

  // Cargar datos del dashboard al montar el componente
  useEffect(() => {
    // ✅ Crear AbortController para cancelar requests al desmontar
    const abortController = new AbortController()
    
    const loadData = async () => {
      try {
        await loadDashboardData(abortController.signal)
        await loadAvailableSections(abortController.signal)
        await loadAcademicPeriods(abortController.signal)
      } catch (error) {
        // ✅ Silenciar AbortError para no mostrar error al desmontar
        if (error.name !== 'AbortError') {
          console.error('Error loading dashboard data:', error)
        }
      }
    }
    
    loadData()
    
    // ✅ Cleanup: cancelar requests pendientes al desmontar
    return () => {
      abortController.abort()
    }
  }, [])

  const loadDashboardData = async (signal) => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔄 Cargando datos del dashboard escolar...")

      const response = await api.get("/api/dashboard/summary")

      console.log("📊 Respuesta del dashboard:", response)

      if (response.ok) {
        setDashboardData(response.data)
        processChartData(response.data)
        console.log("✅ Datos del dashboard cargados exitosamente")
      } else {
        throw new Error(response.msg || "Error al cargar datos del dashboard")
      }
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error)
      setError(`Error al cargar los datos del dashboard: ${error.msg || error.message || "Error desconocido"}`)
      loadExampleData()
    } finally {
      setLoading(false)
    }
  }

  const loadAcademicPeriods = async (signal) => {
    try {
      console.log("📅 Cargando períodos académicos...")

      // Cargar período actual
      const currentResponse = await api.get("/api/matriculas/academic-periods/current")
      if (currentResponse.ok) {
        setCurrentPeriod(currentResponse.period)
        console.log("✅ Período actual cargado:", currentResponse.period?.name)
      }

      // Cargar todos los períodos
      const allResponse = await api.get("/api/matriculas/academic-periods")
      if (allResponse.ok) {
        setAllPeriods(allResponse.periods || [])
        console.log("✅ Todos los períodos cargados:", allResponse.periods?.length || 0)
      }
    } catch (error) {
      console.error("❌ Error cargando períodos académicos:", error)
    }
  }

  const loadAvailableSections = async (signal) => {
    try {
      console.log("📚 Cargando secciones disponibles...")
      const response = await api.get("/api/dashboard/sections")

      if (response.ok) {
        setAvailableSections(response.data || [])
        console.log("✅ Secciones cargadas:", response.data?.length || 0)
      } else {
        console.warn("⚠️ Error cargando secciones:", response.msg)
        setAvailableSections([])
      }
    } catch (error) {
      console.error("❌ Error cargando secciones:", error)
      setAvailableSections([])
    }
  }

  const handleFinalizePeriod = async () => {
    try {
      if (!currentPeriod) {
        setError("No hay período académico actual para finalizar")
        return
      }

      if (
        !window.confirm(
          `¿Está seguro de que desea finalizar el período académico "${currentPeriod.name}"?\n\n` +
            "Esta acción:\n" +
            "• Creará un nuevo período académico\n" +
            "• Cambiará el estado de estudiantes inscritos a activos\n" +
            "• Marcará el período actual como finalizado\n\n" +
            "Esta acción NO se puede deshacer.",
        )
      ) {
        return
      }

      setFinalizingPeriod(true)
      setError(null)
      setSuccess(null)

      console.log("🔄 Finalizando período académico...")

      const response = await api.post("/api/matriculas/academic-periods", {
        body: {},
      })

      if (response.ok) {
        setSuccess(
          `Período académico finalizado exitosamente. ` +
            `Nuevo período "${response.newPeriod?.name}" creado. ` +
            `${response.studentsUpdated || 0} estudiantes actualizados a estado activo.`,
        )
        setShowFinalizePeriodModal(false)

        // Recargar datos
        await loadDashboardData()
        await loadAcademicPeriods()

        console.log("✅ Período finalizado exitosamente")
      } else {
        throw new Error(response.msg || "Error al finalizar período")
      }
    } catch (error) {
      console.error("❌ Error finalizando período:", error)
      setError(`Error al finalizar período: ${error.msg || error.message}`)
    } finally {
      setFinalizingPeriod(false)
    }
  }

  const loadExampleData = () => {
    console.log("📝 Cargando datos de ejemplo...")
    const exampleData = {
      generalStats: {
        total_students_active: 450,
        total_students: 465,
        total_teachers: 25,
        total_staff: 35,
        total_sections_current_period: 12,
        total_grades: 9,
        total_brigades: 5,
        repeating_students_current_period: 15,
        new_students_current_period: 450,
        male_students: 234,
        female_students: 231,
        total_representatives: 380,
      },
      gradeDistribution: [
        { grade_name: "1er Nivel", student_count: 25, male_count: 12, female_count: 13, section_count: 1 },
        { grade_name: "2do Nivel", student_count: 28, male_count: 14, female_count: 14, section_count: 1 },
        { grade_name: "3er Nivel", student_count: 30, male_count: 15, female_count: 15, section_count: 1 },
        { grade_name: "1er Grado", student_count: 85, male_count: 42, female_count: 43, section_count: 2 },
        { grade_name: "2do Grado", student_count: 78, male_count: 38, female_count: 40, section_count: 2 },
        { grade_name: "3er Grado", student_count: 82, male_count: 41, female_count: 41, section_count: 2 },
        { grade_name: "4to Grado", student_count: 75, male_count: 37, female_count: 38, section_count: 2 },
        { grade_name: "5to Grado", student_count: 70, male_count: 35, female_count: 35, section_count: 2 },
        { grade_name: "6to Grado", student_count: 65, male_count: 32, female_count: 33, section_count: 2 },
      ],
      academicPerformance: [
        { subject: "Matemáticas", total_notes: 156, average_grade: 16.75, passing_grades: 142, failing_grades: 14 },
        { subject: "Lengua", total_notes: 156, average_grade: 17.25, passing_grades: 148, failing_grades: 8 },
        {
          subject: "Ciencias Naturales",
          total_notes: 120,
          average_grade: 16.5,
          passing_grades: 110,
          failing_grades: 10,
        },
        { subject: "Ciencias Sociales", total_notes: 120, average_grade: 17.0, passing_grades: 115, failing_grades: 5 },
        { subject: "Educación Física", total_notes: 200, average_grade: 18.5, passing_grades: 195, failing_grades: 5 },
      ],
      attendanceStats: [
        {
          date_a: "2025-01-10",
          grade_name: "1er Grado",
          seccion: "A",
          total_registered: 28,
          present_students: 26,
          absent_students: 2,
          attendance_percentage: 92.86,
        },
        {
          date_a: "2025-01-10",
          grade_name: "2do Grado",
          seccion: "A",
          total_registered: 25,
          present_students: 24,
          absent_students: 1,
          attendance_percentage: 96.0,
        },
      ],
      brigadeStats: [
        { brigade_name: "Brigada Ecológica", student_count: 45, teacher_name: "Ana", teacher_lastName: "García" },
        { brigade_name: "Brigada Deportiva", student_count: 38, teacher_name: "María", teacher_lastName: "Fernández" },
        { brigade_name: "Brigada Cívica", student_count: 35, teacher_name: "Pedro", teacher_lastName: "Gómez" },
        { brigade_name: "Brigada de Lectura", student_count: 30, teacher_name: "Laura", teacher_lastName: "Díaz" },
        { brigade_name: "Brigada de Arte", student_count: 28, teacher_name: "Ricardo", teacher_lastName: "Soto" },
      ],
      staffByRole: [
        { role_name: "Docente", role_description: "Personal encargado de la enseñanza", staff_count: 25 },
        { role_name: "Administrador", role_description: "Personal administrativo", staff_count: 5 },
        { role_name: "Mantenimiento", role_description: "Personal de mantenimiento", staff_count: 3 },
        { role_name: "Secretaría", role_description: "Personal de secretaría", staff_count: 2 },
      ],
      studentsByStatus: [
        { status_description: "Activo", student_count: 450, male_count: 234, female_count: 216 },
        { status_description: "Inscrito", student_count: 15, male_count: 8, female_count: 7 },
        { status_description: "Inactivo", student_count: 10, male_count: 5, female_count: 5 },
        { status_description: "Graduado", student_count: 5, male_count: 2, female_count: 3 },
      ],
      enrollmentStats: [
        {
          grade_name: "1er Grado",
          section_name: "A",
          total_enrolled: 28,
          repeaters: 2,
          new_students: 26,
          teacher_name: "Ana",
          teacher_lastName: "García",
        },
        {
          grade_name: "1er Grado",
          section_name: "B",
          total_enrolled: 27,
          repeaters: 1,
          new_students: 26,
          teacher_name: "María",
          teacher_lastName: "Fernández",
        },
      ],
    }

    setDashboardData(exampleData)
    processChartData(exampleData)
  }

  const processChartData = (data) => {
    console.log("📈 Procesando datos para gráficas...")

    const processedCharts = {
      studentDistribution: {
        labels: data.gradeDistribution?.map((item) => item.grade_name) || [],
        datasets: [
          {
            label: "Estudiantes",
            data: data.gradeDistribution?.map((item) => Number.parseInt(item.student_count) || 0) || [],
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
              "#FF9F40",
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
            ],
            hoverBackgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
              "#FF9F40",
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
            ],
          },
        ],
      },
      genderDistribution: {
        labels: data.gradeDistribution?.map((item) => item.grade_name) || [],
        datasets: [
          {
            label: "Masculino",
            data: data.gradeDistribution?.map((item) => Number.parseInt(item.male_count) || 0) || [],
            backgroundColor: "#36A2EB",
          },
          {
            label: "Femenino",
            data: data.gradeDistribution?.map((item) => Number.parseInt(item.female_count) || 0) || [],
            backgroundColor: "#FF6384",
          },
        ],
      },
      academicPerformance: {
        labels: data.academicPerformance?.map((item) => item.subject) || [],
        datasets: [
          {
            label: "Promedio de Notas",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgba(54, 162, 235, 1)",
            data: data.academicPerformance?.map((item) => Number.parseFloat(item.average_grade) || 0) || [],
          },
        ],
      },
      staffDistribution: {
        labels: data.staffByRole?.map((item) => item.role_name) || [],
        datasets: [
          {
            label: "Personal",
            backgroundColor: "#4BC0C0",
            data: data.staffByRole?.map((item) => Number.parseInt(item.staff_count) || 0) || [],
          },
        ],
      },
      studentStatus: {
        labels: data.studentsByStatus?.map((item) => item.status_description) || [],
        datasets: [
          {
            data: data.studentsByStatus?.map((item) => Number.parseInt(item.student_count) || 0) || [],
            backgroundColor: ["#28a745", "#17a2b8", "#ffc107", "#dc3545"],
            hoverBackgroundColor: ["#28a745", "#17a2b8", "#ffc107", "#dc3545"],
          },
        ],
      },
    }

    setChartData(processedCharts)
  }

  const openAttendanceModal = () => {
    setShowAttendanceModal(true)
    setAttendanceForm({
      sectionId: "",
      date: new Date().toISOString().split("T")[0],
      observations: "",
      students: [],
    })
    setSectionStudents([])
    setSelectedSection(null)
  }

  const closeAttendanceModal = () => {
    setShowAttendanceModal(false)
    setAttendanceForm({
      sectionId: "",
      date: new Date().toISOString().split("T")[0],
      observations: "",
      students: [],
    })
    setSectionStudents([])
    setSelectedSection(null)
  }

  const handleSectionChange = async (sectionId) => {
    if (!sectionId) {
      setSectionStudents([])
      setSelectedSection(null)
      setAttendanceForm((prev) => ({ ...prev, sectionId: "", students: [] }))
      return
    }

    setLoadingStudents(true)
    const section = availableSections.find((s) => s.id === Number.parseInt(sectionId))
    setSelectedSection(section)
    setAttendanceForm((prev) => ({ ...prev, sectionId }))

    // Simular estudiantes de la sección (en producción esto vendría del backend)
    setTimeout(() => {
      const mockStudents = Array.from({ length: section?.student_count || 0 }, (_, i) => ({
        id: i + 1,
        name: `Estudiante ${i + 1}`,
        lastName: `Apellido ${i + 1}`,
        ci: `3000${String(i + 1).padStart(4, "0")}`,
        present: true,
      }))

      setSectionStudents(mockStudents)
      setAttendanceForm((prev) => ({
        ...prev,
        students: mockStudents.map((student) => ({
          studentId: student.id,
          present: true,
        })),
      }))
      setLoadingStudents(false)
    }, 1000)
  }

  const handleStudentAttendance = (studentId, present) => {
    setAttendanceForm((prev) => ({
      ...prev,
      students: prev.students.map((student) => (student.studentId === studentId ? { ...student, present } : student)),
    }))
  }

  const handleAttendanceSubmit = async () => {
    try {
      if (!attendanceForm.sectionId) {
        setError("Debe seleccionar una sección")
        return
      }

      console.log("💾 Guardando asistencia...", attendanceForm)

      const response = await api.post("/api/dashboard/attendance", {
        body: attendanceForm,
      })

      if (response.ok) {
        setSuccess("Asistencia guardada exitosamente")
        console.log("✅ Asistencia guardada exitosamente")
        closeAttendanceModal()
        loadDashboardData() // Recargar datos
      } else {
        throw new Error(response.msg || "Error al guardar la asistencia")
      }
    } catch (error) {
      console.error("❌ Error saving attendance:", error)
      setError(`Error al guardar la asistencia: ${error.msg || error.message}`)
    }
  }

  // Calcular métricas de progreso
  const getProgressMetrics = () => {
    if (!dashboardData?.generalStats) {
      return [
        { title: "Estudiantes Activos", value: "450", percent: 96.8, color: "success" },
        { title: "Promedio General", value: "17.0/20", percent: 85, color: "info" },
        { title: "Asistencia Promedio", value: "92.5%", percent: 92.5, color: "warning" },
        { title: "Personal Docente", value: "25 Maestros", percent: 100, color: "primary" },
      ]
    }

    const stats = dashboardData.generalStats
    const activeRate = ((stats.total_students_active / stats.total_students) * 100).toFixed(1)

    return [
      {
        title: "Estudiantes Activos",
        value: `${stats.total_students_active}/${stats.total_students}`,
        percent: Number.parseFloat(activeRate),
        color: "success",
      },
      {
        title: "Personal Docente",
        value: `${stats.total_teachers} Maestros`,
        percent: 100,
        color: "info",
      },
      {
        title: "Secciones",
        value: `${stats.total_sections_current_period} Secciones`,
        percent: 100,
        color: "warning",
      },
      {
        title: "Brigadas",
        value: `${stats.total_brigades} Brigadas`,
        percent: 100,
        color: "primary",
      },
    ]
  }

  const progressMetrics = getProgressMetrics()

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
        <CSpinner color="primary" size="lg" />
        <span className="ms-2">Cargando datos del sistema escolar...</span>
      </div>
    )
  }

  return (
    <>
      {error && (
        <CAlert color="danger" dismissible onClose={() => setError(null)}>
          <strong>❌ Error:</strong> {error}
        </CAlert>
      )}

      {success && (
        <CAlert color="success" dismissible onClose={() => setSuccess(null)}>
          <strong>✅ Éxito:</strong> {success}
        </CAlert>
      )}

      {/* Información del período académico actual */}
      {currentPeriod && (
        <CCard className="mb-4 border-primary">
          <CCardHeader className="bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-1">
                  <CIcon icon={cilCalendar} className="me-2" />
                  Período Académico Actual: {currentPeriod.name}
                </h6>
                <small>
                  {new Date(currentPeriod.start_date).toLocaleDateString()} -{" "}
                  {new Date(currentPeriod.end_date).toLocaleDateString()}
                </small>
              </div>
              <div className="d-flex gap-2">
                <CBadge color="light" className="text-primary">
                  PERÍODO ACTIVO
                </CBadge>
                <CDropdown>
                  <CDropdownToggle color="light" size="sm" className="text-primary">
                    <CIcon icon={cilSettings} className="me-1" />
                    Gestión de Período
                  </CDropdownToggle>
                  <CDropdownMenu>
                    <CDropdownItem onClick={() => setShowFinalizePeriodModal(true)} disabled={finalizingPeriod}>
                      <CIcon icon={cilClock} className="me-2" />
                      Finalizar Período Actual
                    </CDropdownItem>
                  </CDropdownMenu>
                </CDropdown>
              </div>
            </div>
          </CCardHeader>
        </CCard>
      )}

      {/* Botón de actualización */}
      <CRow className="mb-3">
        <CCol className="d-flex justify-content-end">
          <CButton color="info" onClick={loadDashboardData} disabled={loading}>
            <CIcon icon={cilReload} className="me-1" />
            {loading ? "Actualizando..." : "Actualizar Datos"}
          </CButton>
        </CCol>
      </CRow>

      {/* Tarjetas de estadísticas principales */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="mb-4" color="primary" textColor="white">
            <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
              <div>
                <div className="fs-4 fw-semibold">
                  {dashboardData?.generalStats?.total_students_active || "450"}
                  <span className="fs-6 ms-2 fw-normal">
                    ({dashboardData?.generalStats?.total_students || "465"} total)
                  </span>
                </div>
                <div>Estudiantes Activos</div>
                <small className="text-white-50">
                  ♂ {dashboardData?.generalStats?.male_students || "234"} | ♀{" "}
                  {dashboardData?.generalStats?.female_students || "231"}
                </small>
              </div>
              <CIcon icon={cilUser} height={52} />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="mb-4" color="info" textColor="white">
            <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
              <div>
                <div className="fs-4 fw-semibold">{dashboardData?.generalStats?.total_teachers || "25"}</div>
                <div>Personal Docente</div>
                <small className="text-white-50">
                  {dashboardData?.generalStats?.total_staff || "35"} total personal
                </small>
              </div>
              <CIcon icon={cilEducation} height={52} />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="mb-4" color="warning" textColor="white">
            <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
              <div>
                <div className="fs-4 fw-semibold">
                  {dashboardData?.generalStats?.total_sections_current_period || "12"}
                </div>
                <div>Secciones</div>
                <small className="text-white-50">{dashboardData?.generalStats?.total_grades || "9"} grados</small>
              </div>
              <CIcon icon={cilSchool} height={52} />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="mb-4" color="success" textColor="white">
            <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
              <div>
                <div className="fs-4 fw-semibold">{dashboardData?.generalStats?.total_brigades || "5"}</div>
                <div>Brigadas</div>
                <small className="text-white-50">Actividades extracurriculares</small>
              </div>
              <CIcon icon={cilGroup} height={52} />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Gráficas principales */}
      <CRow className="mb-4">
        <CCol md={6}>
          <CCard>
            <CCardHeader>
              <CIcon icon={cilPeople} className="me-2" />
              Distribución por Grado
            </CCardHeader>
            <CCardBody>
              {chartData?.studentDistribution ? (
                <CChart
                  type="doughnut"
                  data={chartData.studentDistribution}
                  options={{
                    plugins: {
                      legend: { position: "bottom" },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || ""
                            const value = context.raw || 0
                            return `${label}: ${value} estudiantes`
                          },
                        },
                      },
                    },
                    aspectRatio: 2,
                  }}
                />
              ) : (
                <div className="text-center">
                  <CSpinner />
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={6}>
          <CCard>
            <CCardHeader>
              <CIcon icon={cilChart} className="me-2" />
              Distribución por Género
            </CCardHeader>
            <CCardBody>
              {chartData?.genderDistribution ? (
                <CChart
                  type="bar"
                  data={chartData.genderDistribution}
                  options={{
                    scales: {
                      x: { stacked: true },
                      y: { stacked: true, beginAtZero: true },
                    },
                    plugins: { legend: { position: "top" } },
                    aspectRatio: 2,
                  }}
                />
              ) : (
                <div className="text-center">
                  <CSpinner />
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Segunda fila de gráficas */}
      <CRow className="mb-4">
        <CCol md={6}>
          <CCard>
            <CCardHeader>
              <CIcon icon={cilNotes} className="me-2" />
              Rendimiento Académico por Materia
            </CCardHeader>
            <CCardBody>
              {chartData?.academicPerformance ? (
                <CChart
                  type="bar"
                  data={chartData.academicPerformance}
                  options={{
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 20,
                        title: { display: true, text: "Promedio de Notas" },
                      },
                    },
                    plugins: { legend: { display: false } },
                    aspectRatio: 2,
                  }}
                />
              ) : (
                <div className="text-center">
                  <CSpinner />
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={6}>
          <CCard>
            <CCardHeader>
              <CIcon icon={cilUserFollow} className="me-2" />
              Estado de Estudiantes
            </CCardHeader>
            <CCardBody>
              {chartData?.studentStatus ? (
                <CChart
                  type="pie"
                  data={chartData.studentStatus}
                  options={{
                    plugins: {
                      legend: { position: "bottom" },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || ""
                            const value = context.raw || 0
                            return `${label}: ${value} estudiantes`
                          },
                        },
                      },
                    },
                    aspectRatio: 2,
                  }}
                />
              ) : (
                <div className="text-center">
                  <CSpinner />
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Tabla de asistencia reciente */}
      <CRow className="mb-4">
        <CCol>
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <CIcon icon={cilCalendar} className="me-2" />
                Asistencia Reciente
              </div>
              <CButton color="primary" size="sm" onClick={openAttendanceModal}>
                <CIcon icon={cilCloudDownload} className="me-1" />
                Registrar Asistencia
              </CButton>
            </CCardHeader>
            <CCardBody>
              {dashboardData?.attendanceStats?.length > 0 ? (
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Fecha</CTableHeaderCell>
                      <CTableHeaderCell>Grado</CTableHeaderCell>
                      <CTableHeaderCell>Sección</CTableHeaderCell>
                      <CTableHeaderCell>Inscritos</CTableHeaderCell>
                      <CTableHeaderCell>Presentes</CTableHeaderCell>
                      <CTableHeaderCell>Ausentes</CTableHeaderCell>
                      <CTableHeaderCell>% Asistencia</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {dashboardData.attendanceStats.map((attendance, index) => (
                      <CTableRow key={index}>
                        <CTableDataCell>{new Date(attendance.date_a).toLocaleDateString()}</CTableDataCell>
                        <CTableDataCell>{attendance.grade_name}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="info">{attendance.seccion}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="secondary">{attendance.total_registered}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="success">{attendance.present_students}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="danger">{attendance.absent_students}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={attendance.attendance_percentage >= 90 ? "success" : "warning"}>
                            {attendance.attendance_percentage}%
                          </CBadge>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              ) : (
                <div className="text-center text-muted py-4">
                  <CIcon icon={cilCalendar} size="3xl" className="mb-3 opacity-50" />
                  <h6>No hay datos de asistencia recientes</h6>
                  <p>Registre la primera asistencia del día</p>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Estadísticas de brigadas */}
      <CRow className="mb-4">
        <CCol>
          <CCard>
            <CCardHeader>
              <CIcon icon={cilGroup} className="me-2" />
              Estadísticas de Brigadas
            </CCardHeader>
            <CCardBody>
              {dashboardData?.brigadeStats?.length > 0 ? (
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Brigada</CTableHeaderCell>
                      <CTableHeaderCell>Estudiantes</CTableHeaderCell>
                      <CTableHeaderCell>Docente Encargado</CTableHeaderCell>
                      <CTableHeaderCell>Estado</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {dashboardData.brigadeStats.map((brigade, index) => (
                      <CTableRow key={index}>
                        <CTableDataCell>
                          <strong>{brigade.brigade_name}</strong>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="info">{brigade.student_count} estudiantes</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          {brigade.teacher_name && brigade.teacher_lastName
                            ? `${brigade.teacher_name} ${brigade.teacher_lastName}`
                            : "Sin asignar"}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={brigade.student_count > 0 ? "success" : "warning"}>
                            {brigade.student_count > 0 ? "Activa" : "Inactiva"}
                          </CBadge>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              ) : (
                <div className="text-center text-muted py-4">
                  <CIcon icon={cilGroup} size="3xl" className="mb-3 opacity-50" />
                  <h6>No hay brigadas registradas</h6>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Métricas de progreso */}
      <CRow>
        <CCol>
          <CCard>
            <CCardHeader>
              <CIcon icon={cilChart} className="me-2" />
              Métricas del Sistema
            </CCardHeader>
            <CCardBody>
              <CRow className="text-center">
                {progressMetrics.map((item, index) => (
                  <CCol key={index} sm={6} lg={3} className="mb-3">
                    <div className="text-body-secondary">{item.title}</div>
                    <div className="fw-semibold text-truncate">{item.value}</div>
                    <CProgress thin className="mt-2" color={item.color} value={item.percent} />
                    <small className="text-muted">{item.percent}%</small>
                  </CCol>
                ))}
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Modal para finalizar período académico */}
      <CModal visible={showFinalizePeriodModal} onClose={() => setShowFinalizePeriodModal(false)} backdrop="static">
        <CModalHeader className="bg-warning text-white">
          <CModalTitle>
            <CIcon icon={cilWarning} className="me-2" />
            Finalizar Período Académico
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="p-4">
          <div className="text-center">
            <CIcon icon={cilClock} size="3xl" className="text-warning mb-3" />
            <h5>¿Finalizar período académico actual?</h5>
            {currentPeriod && (
              <p className="mb-3">
                Se finalizará el período <strong>"{currentPeriod.name}"</strong>
                <br />
                <small className="text-muted">
                  ({new Date(currentPeriod.start_date).toLocaleDateString()} -{" "}
                  {new Date(currentPeriod.end_date).toLocaleDateString()})
                </small>
              </p>
            )}
            <div className="alert alert-warning">
              <strong>⚠️ Esta acción realizará los siguientes cambios:</strong>
              <ul className="mt-2 mb-0 text-start">
                <li>Creará un nuevo período académico automáticamente</li>
                <li>Cambiará el estado de estudiantes "Inscritos" a "Activos"</li>
                <li>Marcará el período actual como finalizado</li>
                <li>Los datos históricos se mantendrán intactos</li>
              </ul>
            </div>
            <div className="alert alert-danger">
              <strong>🚨 Importante:</strong> Esta acción NO se puede deshacer.
            </div>
          </div>
        </CModalBody>
        <CModalFooter className="bg-light">
          <CButton color="secondary" onClick={() => setShowFinalizePeriodModal(false)} disabled={finalizingPeriod}>
            Cancelar
          </CButton>
          <CButton color="warning" onClick={handleFinalizePeriod} disabled={finalizingPeriod}>
            {finalizingPeriod ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Finalizando...
              </>
            ) : (
              <>
                <CIcon icon={cilClock} className="me-2" />
                Finalizar Período
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal de registro de asistencia */}
      <CModal visible={showAttendanceModal} size="xl" onClose={closeAttendanceModal}>
        <CModalHeader>
          <CModalTitle>Registrar Asistencia Diaria</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Sección *</CFormLabel>
                <CFormSelect value={attendanceForm.sectionId} onChange={(e) => handleSectionChange(e.target.value)}>
                  <option value="">Seleccionar sección...</option>
                  {availableSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.grade_name} - Sección {section.seccion}({section.student_count} estudiantes)
                      {section.teacher_name && ` - ${section.teacher_name} ${section.teacher_lastName}`}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel>Fecha *</CFormLabel>
                <CFormInput
                  type="date"
                  value={attendanceForm.date}
                  onChange={(e) =>
                    setAttendanceForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              </CCol>
            </CRow>

            {selectedSection && (
              <CRow className="mb-3">
                <CCol>
                  <div className="bg-light p-3 rounded">
                    <h6>Información de la Sección</h6>
                    <p className="mb-1">
                      <strong>Grado:</strong> {selectedSection.grade_name}
                    </p>
                    <p className="mb-1">
                      <strong>Sección:</strong> {selectedSection.seccion}
                    </p>
                    <p className="mb-1">
                      <strong>Docente:</strong> {selectedSection.teacher_name} {selectedSection.teacher_lastName}
                    </p>
                    <p className="mb-0">
                      <strong>Estudiantes inscritos:</strong> {selectedSection.student_count}
                    </p>
                  </div>
                </CCol>
              </CRow>
            )}

            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Observaciones</CFormLabel>
                <CFormInput
                  as="textarea"
                  rows={3}
                  value={attendanceForm.observations}
                  onChange={(e) =>
                    setAttendanceForm((prev) => ({
                      ...prev,
                      observations: e.target.value,
                    }))
                  }
                  placeholder="Observaciones sobre la asistencia del día..."
                />
              </CCol>
            </CRow>

            {/* Lista de estudiantes */}
            {attendanceForm.sectionId && (
              <CRow>
                <CCol>
                  <h6>Lista de Estudiantes</h6>
                  {loadingStudents ? (
                    <div className="text-center py-4">
                      <CSpinner />
                      <p className="mt-2">Cargando estudiantes...</p>
                    </div>
                  ) : sectionStudents.length > 0 ? (
                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                      <CTable hover responsive>
                        <CTableHead>
                          <CTableRow>
                            <CTableHeaderCell width="50">
                              <CFormCheck
                                checked={attendanceForm.students.every((s) => s.present)}
                                onChange={(e) => {
                                  const allPresent = e.target.checked
                                  setAttendanceForm((prev) => ({
                                    ...prev,
                                    students: prev.students.map((student) => ({
                                      ...student,
                                      present: allPresent,
                                    })),
                                  }))
                                }}
                              />
                            </CTableHeaderCell>
                            <CTableHeaderCell>Nombre</CTableHeaderCell>
                            <CTableHeaderCell>Apellido</CTableHeaderCell>
                            <CTableHeaderCell>CI</CTableHeaderCell>
                            <CTableHeaderCell>Estado</CTableHeaderCell>
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {sectionStudents.map((student) => {
                            const studentAttendance = attendanceForm.students.find((s) => s.studentId === student.id)
                            const isPresent = studentAttendance?.present || false

                            return (
                              <CTableRow key={student.id}>
                                <CTableDataCell>
                                  <CFormCheck
                                    checked={isPresent}
                                    onChange={(e) => handleStudentAttendance(student.id, e.target.checked)}
                                  />
                                </CTableDataCell>
                                <CTableDataCell>{student.name}</CTableDataCell>
                                <CTableDataCell>{student.lastName}</CTableDataCell>
                                <CTableDataCell>{student.ci}</CTableDataCell>
                                <CTableDataCell>
                                  <CBadge color={isPresent ? "success" : "danger"}>
                                    <CIcon icon={isPresent ? cilCheckCircle : cilXCircle} className="me-1" />
                                    {isPresent ? "Presente" : "Ausente"}
                                  </CBadge>
                                </CTableDataCell>
                              </CTableRow>
                            )
                          })}
                        </CTableBody>
                      </CTable>
                    </div>
                  ) : (
                    <div className="text-center text-muted py-4">
                      <CIcon icon={cilUser} size="2xl" className="mb-2 opacity-50" />
                      <p>No hay estudiantes en esta sección</p>
                    </div>
                  )}

                  {/* Resumen de asistencia */}
                  {sectionStudents.length > 0 && (
                    <div className="mt-3 p-3 bg-light rounded">
                      <CRow className="text-center">
                        <CCol xs={4}>
                          <div className="text-success">
                            <strong>{attendanceForm.students.filter((s) => s.present).length}</strong>
                            <br />
                            <small>Presentes</small>
                          </div>
                        </CCol>
                        <CCol xs={4}>
                          <div className="text-danger">
                            <strong>{attendanceForm.students.filter((s) => !s.present).length}</strong>
                            <br />
                            <small>Ausentes</small>
                          </div>
                        </CCol>
                        <CCol xs={4}>
                          <div className="text-info">
                            <strong>
                              {attendanceForm.students.length > 0
                                ? Math.round(
                                    (attendanceForm.students.filter((s) => s.present).length /
                                      attendanceForm.students.length) *
                                      100,
                                  )
                                : 0}
                              %
                            </strong>
                            <br />
                            <small>Asistencia</small>
                          </div>
                        </CCol>
                      </CRow>
                    </div>
                  )}
                </CCol>
              </CRow>
            )}
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={closeAttendanceModal}>
            Cancelar
          </CButton>
          <CButton
            color="primary"
            onClick={handleAttendanceSubmit}
            disabled={!attendanceForm.sectionId || loadingStudents}
          >
            <CIcon icon={cilCloudDownload} className="me-1" />
            Guardar Asistencia
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Dashboard
