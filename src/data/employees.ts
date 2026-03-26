import { Employee } from "@/types/employee";

export const employees: Employee[] = [
  // Personal Propio - 8 Horas - JEFES
  {
    id: 1,
    name: "RAHIN GIL ANTONIO",
    category: "JEFE BARES",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X',
      'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X'
    ]
  },
  {
    id: 2,
    name: "PAVÓN GARCÍA ARANZAZU",
    category: "2º JEFE BARES",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X',
      'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X'
    ]
  },
  {
    id: 3,
    name: "PÉREZ TACORONTE ANDRÉS",
    category: "JEFE SECTOR",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X',
      'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L'
    ]
  },
  {
    id: 4,
    name: "TOLEDO NAVARRO MARCOS",
    category: "JEFE SECTOR",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L',
      'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X'
    ]
  },
  {
    id: 5,
    name: "MONTAÑEZ LORENZO JORGE",
    category: "JEFE SECTOR",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X',
      'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L'
    ]
  },
  {
    id: 6,
    name: "GONZÁLEZ RODRÍGUEZ ANTONIO",
    category: "JEFE SECTOR",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X',
      'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X'
    ]
  },

  // Personal Propio - 8 Horas - CAMAREROS
  {
    id: 7,
    name: "GRIMALDI SANTANA JUAN ALFONSO",
    category: "CAMARERO",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X',
      'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 8,
    name: "SUÁREZ LEÓN ELYOENAI",
    category: "CAMARERO",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L',
      'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X'
    ]
  },
  {
    id: 9,
    name: "SÁNCHEZ VERA DANIEL",
    category: "CAMARERO",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X',
      'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 10,
    name: "GALLARDO JUEZ RAMOS",
    category: "CAMARERO",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L',
      'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L'
    ]
  },
  {
    id: 11,
    name: "FARÍAS HERNÁNDEZ JOSE ANTONIO",
    category: "CAMARERO",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L',
      'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X'
    ]
  },
  {
    id: 12,
    name: "GONZÁLEZ PALMERO EDUARDO",
    category: "CAMARERO",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X',
      'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L'
    ]
  },
  {
    id: 13,
    name: "PÉREZ MONZÓN ROGELIO",
    category: "CAMARERO",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V',
      'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V', 'V'
    ]
  },
  {
    id: 14,
    name: "PAGANO DA COSTA CRISTINA",
    category: "CAMARERA",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X',
      'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 15,
    name: "RAMOS LÓPEZ AMADO",
    category: "CAMARERO",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X',
      'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X'
    ]
  },

  // Personal Propio - 8 Horas - AYUDANTES DE CAMARERO
  {
    id: 16,
    name: "CANAL ZAPATA HEVERT ALONSO",
    category: "AYTE CAMAR",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X',
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 18,
    name: "ARIAS ORDOÑEZ MINERVA",
    category: "AYTE CAMA",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',
      'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E'
    ]
  },
  {
    id: 19,
    name: "ARENCIBIA GUERRA RENÉ",
    category: "AYTE CAMAR",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X',
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 20,
    name: "LÓPEZ BENTANCOR JENNIFER",
    category: "AYTE CAMAR",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X',
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 21,
    name: "FRAILE MIZZIAN EVA FRANCISCA",
    category: "AYTE CAMAR",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X',
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 22,
    name: "TABARES RAMÍREZ JUAN MOISES",
    category: "AYTE CAMAR",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X',
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 23,
    name: "MAMADOU MOUSSA",
    category: "AYTE CAMAR",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X',
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 24,
    name: "BAGUENNA MHAMED",
    category: "AYTE CAMAR",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X',
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 25,
    name: "GUEDES MENA HORTENSIA",
    category: "AYTE CAMAR",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X',
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 27,
    name: "HERNANDEZ LÓPEZ MOISES",
    category: "AYTE CAMAR",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X',
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 28,
    name: "MESA SANTANA ROBERTO JAVIER",
    category: "AYTE CAMAR",
    contract: 8,
    contractUnit: 1.0,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X',
      'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'
    ]
  },

  // Personal Propio - 6 Horas (75% = 0.75U)
  {
    id: 29,
    name: "ALVAREZ AFONSO MILAGROSA",
    category: "AYTE CAMA",
    contract: 6,
    contractUnit: 0.75,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X',
      'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X'
    ]
  },
  {
    id: 30,
    name: "GUTIERREZ GUTIERREZ ELIANA DEL SOCORRO",
    category: "AYTE CAMA",
    contract: 6,
    contractUnit: 0.75,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X',
      'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 31,
    name: "VAZQUEZ CONTRERAS Mª FERNANDA",
    category: "AYTE CAMA",
    contract: 6,
    contractUnit: 0.75,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X',
      'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 32,
    name: "HERRERO SANTANA JOSE LUÍS",
    category: "AYTE CAMA",
    contract: 6,
    contractUnit: 0.75,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X',
      'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 33,
    name: "MORENO ALMEIDA ALEJANDRO",
    category: "AYTE CAMA",
    contract: 6,
    contractUnit: 0.75,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X',
      'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 35,
    name: "CRUZ CHARÓN GEILER",
    category: "SUST ENF J.LUÍS",
    contract: 6,
    contractUnit: 0.75,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X',
      'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X'
    ]
  },
  
  // Personal Propio - 5 Horas (60% = 0.625U)
  {
    id: 36,
    name: "BORDÓN MARRERO ROSAURA",
    category: "AYTE CAMA",
    contract: 5,
    contractUnit: 0.625,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X',
      'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 37,
    name: "BARTOMEUS PIÑERO JORGE",
    category: "AYTE CAMA",
    contract: 5,
    contractUnit: 0.625,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X',
      'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 38,
    name: "DOMINGUEZ SUÁREZ CARMEN",
    category: "AYTE CAMA",
    contract: 5,
    contractUnit: 0.625,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X',
      'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 39,
    name: "ROMÁN VERA JOSE RUBEN",
    category: "AYTE CAMA",
    contract: 5,
    contractUnit: 0.625,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X',
      'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 43,
    name: "DOMINGUEZ MELIÁN ELIGIO",
    category: "AYTE CAMA",
    contract: 5,
    contractUnit: 0.625,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X',
      'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 44,
    name: "LEÓN RODRÍGUEZ RAYCO",
    category: "AYTE CAMA",
    contract: 5,
    contractUnit: 0.625,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X',
      'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 45,
    name: "RODRÍGUEZ RODRÍGUEZ EFRÉN",
    category: "AYTE CAMA",
    contract: 5,
    contractUnit: 0.625,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X',
      'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X'
    ]
  },
  {
    id: 46,
    name: "ORTIZ MAYKEL",
    category: "AYTE CAMA",
    contract: 5,
    contractUnit: 0.625,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X',
      'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X'
    ]
  },

  // Personal Propio - 4 Horas (50% = 0.5U)
  {
    id: 40,
    name: "SUÁREZ MEJIAS Mª JESÚS",
    category: "AYTE CAMA",
    contract: 4,
    contractUnit: 0.5,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'L',
      'L', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X'
    ]
  },
  {
    id: 41,
    name: "GIL KEENAN CAROLINE",
    category: "AYTE CAMA",
    contract: 4,
    contractUnit: 0.5,
    department: "PROPIO",
    schedule: [
      'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'L', 'L',
      'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X'
    ]
  },
  {
    id: 42,
    name: "ARÍAS SANTANA FRANCK",
    category: "AYTE CAMA",
    contract: 4,
    contractUnit: 0.5,
    department: "PROPIO",
    schedule: [
      'X', 'L', 'L', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'L', 'L', 'X',
      'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X'
    ]
  },

  // Personal ETT - 8 Horas
  {
    id: 102,
    name: "VEGA MARIA ETT",
    category: "AYUDANTE",
    contract: 6,
    contractUnit: 0.75,
    department: "ETT",
    schedule: [
      'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X',
      'L', 'L', 'X', 'X', 'X', 'X', 'X', 'L', 'L', 'X', 'X', 'X', 'X', 'X', 'X'
    ]
  }
];

export const occupancyBudgets = [
  { occupancy: 115, clients: 1580, jefeBares: 1, segundoJefeBares: 0, jefeSector: 4, camareros: 6, ayudantes: 17, presentialTotal: 28, ettExternal: 3, ratio: 56.43 },
  { occupancy: 110, clients: 1511, jefeBares: 1, segundoJefeBares: 0, jefeSector: 4, camareros: 6, ayudantes: 17, presentialTotal: 28, ettExternal: 3, ratio: 53.96 },
  { occupancy: 105, clients: 1443, jefeBares: 1, segundoJefeBares: 0, jefeSector: 4, camareros: 6, ayudantes: 17, presentialTotal: 28, ettExternal: 3, ratio: 51.54 },
  { occupancy: 100, clients: 1374, jefeBares: 1, segundoJefeBares: 0, jefeSector: 4, camareros: 6, ayudantes: 17, presentialTotal: 28, ettExternal: 3, ratio: 49.07 },
  { occupancy: 95, clients: 1306, jefeBares: 1, segundoJefeBares: 0, jefeSector: 4, camareros: 6, ayudantes: 17, presentialTotal: 28, ettExternal: 3, ratio: 46.64 },
  { occupancy: 90, clients: 1237, jefeBares: 1, segundoJefeBares: 0, jefeSector: 4, camareros: 6, ayudantes: 17, presentialTotal: 28, ettExternal: 3, ratio: 44.18 },
  { occupancy: 85, clients: 1169, jefeBares: 1, segundoJefeBares: 0, jefeSector: 4, camareros: 6, ayudantes: 16.7, presentialTotal: 27.7, ettExternal: 3, ratio: 42.21 },
  { occupancy: 80, clients: 1100, jefeBares: 1, segundoJefeBares: 0, jefeSector: 4, camareros: 6, ayudantes: 15.5, presentialTotal: 26.5, ettExternal: 3, ratio: 41.51 },
  { occupancy: 75, clients: 1032, jefeBares: 1, segundoJefeBares: 0, jefeSector: 3, camareros: 6, ayudantes: 15.5, presentialTotal: 25.5, ettExternal: 3, ratio: 40.47 },
  { occupancy: 70, clients: 963, jefeBares: 1, segundoJefeBares: 0, jefeSector: 3, camareros: 6, ayudantes: 15.5, presentialTotal: 25.5, ettExternal: 3, ratio: 37.76 },
  { occupancy: 65, clients: 895, jefeBares: 1, segundoJefeBares: 0, jefeSector: 3, camareros: 5, ayudantes: 15.5, presentialTotal: 24.5, ettExternal: 3, ratio: 36.53 },
  { occupancy: 60, clients: 826, jefeBares: 1, segundoJefeBares: 0, jefeSector: 3, camareros: 5, ayudantes: 14.5, presentialTotal: 23.5, ettExternal: 3, ratio: 35.15 },
  { occupancy: 55, clients: 758, jefeBares: 1, segundoJefeBares: 0, jefeSector: 3, camareros: 5, ayudantes: 14.5, presentialTotal: 23.5, ettExternal: 3, ratio: 32.26 },
  { occupancy: 50, clients: 689, jefeBares: 1, segundoJefeBares: 0, jefeSector: 3, camareros: 5, ayudantes: 14.5, presentialTotal: 23.5, ettExternal: 3, ratio: 29.32 },
  { occupancy: 45, clients: 621, jefeBares: 1, segundoJefeBares: 0, jefeSector: 3, camareros: 5, ayudantes: 14.5, presentialTotal: 23.5, ettExternal: 3, ratio: 26.43 },
  { occupancy: 40, clients: 552, jefeBares: 1, segundoJefeBares: 0, jefeSector: 3, camareros: 5, ayudantes: 14.5, presentialTotal: 23.5, ettExternal: 3, ratio: 23.49 },
  { occupancy: 35, clients: 484, jefeBares: 1, segundoJefeBares: 0, jefeSector: 3, camareros: 5, ayudantes: 14.5, presentialTotal: 23.5, ettExternal: 3, ratio: 20.60 },
  { occupancy: 30, clients: 412, jefeBares: 1, segundoJefeBares: 0, jefeSector: 3, camareros: 5, ayudantes: 14.5, presentialTotal: 23.5, ettExternal: 3, ratio: 17.53 }
];