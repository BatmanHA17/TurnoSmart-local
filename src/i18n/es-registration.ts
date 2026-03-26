// Strings de internacionalización para el flujo de registro - exactos de las imágenes
export const registrationStrings = {
  // Botón CTA del landing
  startFreeTrial: "Start your Free Trial",
  
  // Paso 1 - Email
  emailTitle: "Empieza tu prueba de 7 días gratis",
  emailSubtitle: "Crea tu cuenta en un par de minutos. No necesitas agregar tu información bancaria.",
  emailLabel: "Correo electrónico",
  emailPlaceholder: "",
  continueButton: "Seguir",
  modifyButton: "Modificar",
  
  // Paso 2 - Password
  passwordTitle: "Empieza tu prueba de 7 días gratis",
  passwordSubtitle: "Crea tu cuenta en un par de minutos. No necesitas agregar tu información bancaria.",
  passwordLabel: "Elige tu contraseña",
  passwordPlaceholder: "",
  passwordMinText: "Debe incluir al menos 10 caracteres.",
  showPassword: "Mostrar contraseña",
  hidePassword: "Ocultar contraseña",
  termsText: "Acepto los ",
  termsLink: "Términos y Condiciones",
  andText: " y la ",
  privacyLink: "Política de Privacidad",
  turnosmartBrand: " de Combo.",
  createAccountButton: "Crear una cuenta",
  
  // Paso 3 - Información personal (1 de 2)
  personalInfoTitle: "Bienvenido a Combo",
  personalInfoSubtitle: "Cuéntanos un poco sobre ti. Esta información la usaremos para completar tu perfil.",
  step1of2: "1 de 2",
  firstNameLabel: "Nombre",
  firstNamePlaceholder: "",
  lastNameLabel: "Apellidos",
  lastNamePlaceholder: "",
  companyNameLabel: "Nombre de la empresa",
  companyNamePlaceholder: "",
  positionLabel: "Cargo",
  positionPlaceholder: "Seleccionar un cargo",
  phoneLabel: "Teléfono",
  phonePlaceholder: "",
  nextButton: "Siguiente",
  
  // Paso 4 - Información de empresa (2 de 2)
  companyInfoTitle: "Cuéntanos sobre tu empresa",
  companyInfoSubtitle: "Esta información servirá para configurar tu cuenta.",
  step2of2: "2 de 2",
  
  establishmentsLabel: "¿Cuántos establecimientos tienes actualmente?",
  establishmentsOptions: {
    "0": "0",
    "1": "1", 
    "2-5": "2-5",
    "6-20": "6-20",
    "+20": "+20",
  },
  
  employeesLabel: "Número de empleados", 
  employeesPlaceholder: "Seleccionar un número",
  employeesOptions: {
    "1-10": "1-10 empleados",
    "11-50": "11-50 empleados",
    "51-200": "51-200 empleados", 
    "200+": "200+ empleados",
  },
  
  phoneRequired: "El campo del teléfono es obligatorio",
  
  industryLabel: "Industria",
  industryPlaceholder: "Seleccionar una industria",
  industryOptions: {
    hospitality: "Hospitalidad y Turismo",
    restaurant: "Restauración", 
    retail: "Comercio",
    healthcare: "Salud y farmacia",
    education: "Educación",
    manufacturing: "Manufactura",
    services: "Servicios",
    other: "Otro",
  },
  
  franchiseLabel: "Soy franquiciado",
  
  countryLabel: "País",
  countryPlaceholder: "Seleccionar un país",
  countryOptions: {
    ES: "España",
    PE: "Perú", 
    MX: "México",
    AR: "Argentina",
    CO: "Colombia",
    CL: "Chile",
  },
  
  startButton: "Comenzar",
  
  // Dropdowns de cargo 
  positionOptions: {
    propietario: "Propietario",
    director: "Director",
    manager: "Manager",
    jefe_departamento: "Manager", // UNIFICADO: mostrar como Manager
    empleado: "Empleado",
  },
  
  // Progress bar
  progressStep1: "Paso 1 de 2",
  progressStep2: "Paso 2 de 2",
  progress50: "50%",
  progress100: "100%",
  
  // Navegación
  backButton: "Atrás",
  
  // Estados de carga
  creatingAccount: "Creando cuenta...",
  verifyingEmail: "Verificando email...",
  savingProfile: "Guardando perfil...",
  
  // Mensajes de error
  emailRequired: "El correo electrónico es obligatorio",
  emailInvalid: "Introduce un correo electrónico válido",
  passwordRequired: "La contraseña es obligatoria",
  passwordTooShort: "La contraseña debe tener al menos 8 caracteres",
  nameRequired: "El nombre es obligatorio",
  lastNameRequired: "Los apellidos son obligatorios",
  companyRequired: "El nombre de la empresa es obligatorio",
  positionRequired: "El cargo es obligatorio",
  termsRequired: "Debes aceptar los términos y condiciones",
  
  // Mensajes de éxito
  accountCreated: "¡Cuenta creada con éxito!",
  redirectingToDashboard: "Redirigiendo al panel de control...",
  emailSent: "Email de confirmación enviado",
  checkYourEmail: "Revisa tu email para confirmar tu cuenta",
  
  // Dashboard
  welcomeMessage: "¡Bienvenido a TurnoSmart!",
  profileDropdownText: "Ver mi perfil",
  rolesAndPermissions: "Rol y Permisos",
  defaultRole: "Propietario",
  roleDescription: "Este usuario no puede cambiarse el rol a sí mismo. Para ello debería contactar con El Equipo de Soporte de TurnoSmart. (Sólo el Super-admin de TurnoSmart puede modificar estas preferencias)",
} as const;