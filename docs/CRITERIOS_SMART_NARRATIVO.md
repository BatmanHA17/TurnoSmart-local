# TurnoSmart -- Documento Narrativo de Criterios SMART

> **Version:** 3.0 -- Actualizado 2026-04-05
> **Fuente:** Catalogo `criteriaDefaults.ts` (98 criterios) + Analisis cuadrante real Abril 2026
> **Autor:** Jose Galvan (PO) + Documentacion tecnica TurnoSmart

---

## Indice

1. [Introduccion](#1-introduccion)
2. [Glosario de Turnos y Codigos](#2-glosario-de-turnos-y-codigos)
3. [Criterios Obligatorios (OB-01 a OB-18)](#3-criterios-obligatorios-ob-01-a-ob-18)
4. [Criterios Opcionales (OP-01 a OP-39)](#4-criterios-opcionales-op-01-a-op-39)
5. [Checks de Validacion (CK-01 a CK-25)](#5-checks-de-validacion-ck-01-a-ck-25)
6. [Features SMART+IA (SM-01 a SM-10)](#6-features-smartia-sm-01-a-sm-10)
7. [Reglas de Dominio Aprendidas del Cuadrante Real](#7-reglas-de-dominio-aprendidas-del-cuadrante-real)
8. [Roles y su Interaccion con los Criterios](#8-roles-y-su-interaccion-con-los-criterios)

---

## 1. Introduccion

TurnoSmart utiliza un sistema de **98 criterios** organizados en 4 categorias para gobernar la generacion inteligente de cuadrantes de turnos. Estos criterios representan la formalizacion de la legislacion laboral espanola, el convenio colectivo de hosteleria o cualquier otro convenio sectorial, las mejores practicas operativas y la inteligencia proactiva del sistema.

**Estructura:**
- **18 Obligatorios (OB):** Criterios legales y organizacionales que siempre estan activos. No se pueden desactivar. Violarlos supone un riesgo legal o operacional grave.
- **43 Opcionales (OP):** Criterios personalizables que el usuario Manager/Admin puede activar o desactivar segun la operativa de su establecimiento. Cada uno tiene un **boost** (peso de 1 a 3) que determina cuanto enfasis pone el motor en ese criterio.
- **27 Checks (CK):** Validaciones que se ejecutan antes, durante y despues de la generacion del cuadrante. Son los "guardianes" que verifican que el resultado cumple las reglas.
- **10 SMART+IA (SM):** Funciones de inteligencia proactiva donde el sistema piensa por delante del usuario, detecta patrones y propone mejoras automaticamente.

**Sistema de Boost:**
Cada criterio opcional tiene un boost de 1 a 3 que indica su peso relativo:
- 1 = Normal (el motor lo considera pero no lo prioriza)
- 2 = Importante (el motor lo prioriza activamente)
- 3 = Maximo (prioridad maxima, casi equivalente a obligatorio)

---

## 2. Glosario de Turnos y Codigos

Antes de entrar en los criterios, es fundamental conocer los codigos de turno que el motor maneja. Los turnos, codigos y glosario deben ser configurados por el usuario Manager/Admin durante el onboarding inicial de la herramienta. La aplicacion comienza con turnos de ejemplo que el Manager/Admin personaliza con horarios, nombres, codigos y descripciones especificas de su establecimiento para poder emplearlos en la generacion de turnos.

| Codigo | Nombre | Horario | Quien lo usa | Descripcion |
|--------|--------|---------|-------------|-------------|
| **M** | Manana | 07:00-15:00 | Todos | Turno estandar de manana |
| **T** | Tarde | 15:00-23:00 | Todos | Turno estandar de tarde |
| **N** | Noche | 23:00-07:00 | Night Agent + FDAs cobertura | Turno nocturno |
| **D** | Descanso | -- | Todos | Dia de descanso semanal (2 por semana, obligatorio) |
| **V** | Vacaciones | -- | Todos | Dia de vacaciones aprobadas |
| **F** | Festivo disfrutado | -- | Todos | Festivo del convenio concedido al empleado |
| **DB** | Dia Debido | -- | Todos | Dia a favor del empleado en su balance personal. Se acumula por: festivos trabajados, semanas de 6 dias, horas extra. El empleado solicita cuando disfrutarlo y el Manager valida o rechaza la peticion |
| **DG** | Debido Guardia | -- | Solo FOM | Dia a favor generado tras realizar una Guardia (G). El usuario Manager decide cuando disfrutarlo |
| **G** | Guardia | 09:00-21:00 | Solo FOM | Turno de guardia en sabado/domingo. Solo el FOM las realiza |
| **GT** | Guardia Tarde | 11:00-23:00 | Solo FOM | Guardia excepcional en horario de tarde. Se usa cuando no hay posibilidad matematica de cubrir T y al FOM le coincide con una Guardia (G). Lo genera manualmente el Manager |
| **E** | Enfermedad/Baja | -- | Todos | Baja medica o enfermedad |
| **PM** | Permiso Mudanza | -- | Todos | Permiso personal por mudanza |
| **PC** | Permiso Curso | -- | Todos | Permiso por formacion |
| **11x19** | Transicion | 11:00-19:00 | Todos | Turno de transicion para garantizar las 12h legales de descanso entre un turno T y un turno M al dia siguiente |
| **9x17** | GEX Manana | 09:00-17:00 | GEX principalmente | Turno de manana para Guest Experience. Se asigna cuando hay mas check-outs (salidas) |
| **12x20** | GEX Refuerzo | 12:00-20:00 | GEX principalmente | Turno de refuerzo que cubre manana y tarde-noche. Se asigna cuando hay mas check-ins (llegadas) |

**Diferencia critica entre D, DB y FDS:**
- **D** = Descanso semanal estandar. 2 por semana, obligatorio por ley. Son los "libres" normales.
- **DB** = Dia Debido. Es un saldo a favor del empleado. Se acumula por diversas razones (festivos trabajados, excesos de jornada, etc.) y el empleado solicita cuando gastarlo, pero el Manager debe validar o rechazar la peticion. NO es un descanso semanal.
- **FDS Largo** = Fin de semana largo mensual. Es un criterio aparte: cada empleado tiene derecho a 1 bloque de 4 dias consecutivos al mes (S+D+L+M). NO es lo mismo que D ni que DB. No es una obligacion legal, sino un perk/gratitud del establecimiento que se usa para motivar y atraer talento.

---

## 3. Criterios Obligatorios (OB-01 a OB-18)

Los criterios obligatorios son las reglas inamovibles que el motor siempre respeta. Provienen de la legislacion laboral espanola y el convenio colectivo sectorial correspondiente. Una vez generado el turno, un usuario Manager/Admin podria modificarlo manualmente, pero un mensaje critico debe alertar sobre cualquier violacion de criterio obligatorio. **No se pueden desactivar.**

---

### OB-01 -- Descanso minimo 12h entre jornadas
**Codigo:** `12H_REST` | **Severidad:** BLOCKER | **Boost:** 3

Entre el final de un turno y el inicio del siguiente debe haber un minimo de 12 horas de descanso. Esta regla prohibe de forma absoluta el llamado "turno pijama" (T seguido de M al dia siguiente), ya que un empleado que termina Tarde a las 23:00 y empieza Manana a las 07:00 solo descansaria 8 horas. La generacion automatica debe evitarlo a toda costa. Solo en caso excepcional donde el algoritmo matematico no encuentra otra solucion, el turno pijama aparecera senalado visualmente en un recuadro especial para ser validado y confirmado por un usuario Manager/Admin antes de publicarse.

**Excepcion por fuerza mayor (OB-13):** El Manager puede forzar una violacion en casos excepcionales, pero requiere doble confirmacion (Manager + empleado) y queda registrado con motivo en el historial para trazabilidad legal.

**Turno de transicion 11x19:** Cuando el motor detecta que un empleado pasa de T a M, en lugar de violar las 12h, propone el turno 11x19 como solucion. El empleado entra a las 11:00 en vez de a las 07:00, garantizando las 12h de descanso tras salir del T a las 23:00. Este turno tambien se usa para transiciones en turnos GEX (de 12x20 a 9x17).

---

### OB-02 -- 2 dias libres consecutivos por semana
**Codigo:** `CONSECUTIVE_REST_DAYS` | **Severidad:** BLOCKER | **Boost:** 3

Todo empleado tiene derecho a 2 dias de descanso consecutivos por semana. Los descansos no pueden estar separados (por ejemplo, descansar lunes y jueves) salvo excepcion validada por un usuario Manager/Admin. En casos de picos de trabajo, puede reducirse a 1 dia de descanso, pero no mas de 3 semanas consecutivas ni mas de 9 veces al ano, siempre con validacion de un usuario Manager/Admin.

**Flujo del motor:**
1. Intenta siempre colocar 2 dias libres consecutivos (obligatorio por ley). En picos de trabajo puede reducirse a 1 dia (max 3 semanas consecutivas, max 9 veces/ano) con validacion Manager/Admin.
2. Si la cobertura lo requiere y no hay otra solucion, los separa automaticamente para resolver el hueco. Se requiere validacion por un usuario Manager/Admin.
3. Marca esos dias como **conflicto** (celda en naranja/rojo en el cuadrante).
4. Avisa al Manager: "El empleado X tiene libres separados esta semana por necesidad de cobertura."
5. El Manager gestiona la doble confirmacion (Manager + empleado) para validar el override. Se envia una alerta de aceptacion al empleado para su validacion personal, lo que sirve como confirmacion legal para evitar futuros problemas o denuncias del empleado hacia la organizacion.
6. Se registra en historial con motivo + consentimiento (trazabilidad legal, OB-14).

**Regla del cuadrante real:** Los 2 descansos son siempre consecutivos. Ademas, tras cubrir las noches del Night Agent, el empleado recibe 2 dias de descanso consecutivos inmediatamente despues de su ultima noche.

---

### OB-03 -- Salida de noche seguida de dia libre
**Codigo:** `NIGHT_THEN_REST` | **Severidad:** BLOCKER | **Boost:** 3

Cuando un empleado de tipo ROTA_COMPLETO (Front Desk Agent) realiza un turno de noche (N), el dia siguiente debe ser obligatoriamente libre/descanso, a modo de agradecimiento y cuidado del empleado. Esto no aplica al Night Agent fijo, ya que su rol es permanentemente nocturno y sus noches consecutivas son parte de su contrato.

**En la practica (cuadrante real):** Cuando un FDA cubre las 2 noches de descanso del Night Agent, al dia siguiente de su ultima noche recibe automaticamente 2 dias de descanso consecutivos. El descanso post-noche puede convertirse en el inicio de su bloque de descanso semanal, o si ya ha trabajado sus 5 dias semanales previamente, serian sus 2 descansos correspondientes a esa semana.

---

### OB-04 -- Maximo 40h semanales
**Codigo:** `MAX_WEEKLY_HOURS` | **Severidad:** ERROR | **Boost:** 3

La jornada maxima semanal depende del tipo de contrato del empleado: 40 horas para contratos de 8 horas, y la parte proporcional correspondiente para contratos inferiores (35h para contratos de 7h, 30h para 6h, 25h para 5h, 20h para 4h). Este criterio es configurable porque la reforma laboral futura reducira el maximo a 37.5 horas para contratos completos.

**Importante:** TurnoSmart NO es un control horario. No registra entradas/salidas reales (clock-in/out). Solo contabiliza las horas que aparecen en los codigos de turno (M=8h, T=8h, N=8h, G=12h, 9x17=8h, 12x20=8h, 11x19=8h). El motor usa estas horas para verificar que el cuadrante generado suma aproximadamente las horas semanales correspondientes al tipo de contrato de cada empleado.

**Configuracion:**
- `maxHours`: 40 (contrato 8h)
- `contractTypes`: [40, 35, 30, 25, 20] (horas semanales segun tipo de contrato)
- `futureMaxHours`: 37.5 (futura reforma para contratos completos)

---

### OB-05 -- 48 dias vacaciones/ano (hosteleria)
**Codigo:** `VACATION_48_DAYS` | **Severidad:** ERROR | **Boost:** 3

En el convenio de hosteleria, cada empleado tiene derecho a 48 dias de vacaciones al ano: 30 dias naturales + 18 dias por festivos trabajados compensados. Sin embargo, existen otros convenios sectoriales con condiciones diferentes que el sistema debe poder soportar.

**Dos contadores separados (OB-15):**
- Contador 1: Vacaciones naturales (30/ano). Visible en ficha empleado: "Disfrutados: X / 30".
- Contador 2: Festivos (18/ano). Cada festivo trabajado genera un dia compensatorio.

**Ratio de vacaciones:** El motor vigila que al llegar al 31 de diciembre, todos los empleados hayan disfrutado al menos el 90% de sus vacaciones. Si detecta en octubre que un empleado esta por debajo del ritmo esperado, alerta al usuario Manager/Admin.

---

### OB-06 -- Festivos trabajados = compensacion
**Codigo:** `HOLIDAY_COMPENSATION` | **Severidad:** ERROR | **Boost:** 3

Si un festivo cae en dia laboral y el empleado trabaja, se genera un dia compensatorio (F) que se anade a su saldo. El sistema debe conocer:

1. **Festivos nacionales** del pais (Espana): los festivos que aplican a todo el territorio.
2. **Festivos regionales/provinciales:** Extraidos del convenio colectivo subido en la seccion de criterios. Cada provincia tiene sus festivos especificos. EJEMPLO En abril, por ejemplo, hay 2 festivos por convenio de Cadiz.

**Regla del convenio de Cadiz:** Si el festivo coincide con un dia libre del empleado, NO genera compensacion (el empleado ya estaba descansando).

EL manager marca **F** en el cuadrante cuando entrega el festivo al empleado, es decir, cuando le permite disfrutar de ese dia compensatorio.

---

### OB-07 -- Jornada maxima anual 1.792h
**Codigo:** `MAX_ANNUAL_HOURS` | **Severidad:** WARNING | **Boost:** 3

Control de horas acumuladas anuales segun el convenio sectorial correspondiente. El maximo anual es de 1.792 horas para contratos de 40 horas semanales, y la parte proporcional para contratos de menor jornada. El motor proyecta las horas acumuladas y alerta cuando un empleado se acerca a su limite segun tipo de contrato.

**Configuracion:**
- `maxAnnualHours`: 1792

---

### OB-08 -- Cobertura minima por turno
**Codigo:** `MIN_COVERAGE` | **Severidad:** BLOCKER | **Boost:** 3

Siempre debe haber al menos el numero minimo configurado de personas por cada turno activo. El servicio nunca puede quedar desatendido. Esto lo establece el usuario Manager/Admin en la seccion de Criterios SMART.

**Configuracion por defecto (minimo 1):**
- M (Manana): 1 persona
- T (Tarde): 1 persona
- N (Noche): 1 persona

Estos valores son configurables por el Manager segun las necesidades de su establecimiento. El motor trata este criterio como absoluto: si no puede garantizar la cobertura minima sin violar otras reglas, alerta al usuario Manager/Admin.

---

### OB-09 -- Salir librando antes de vacaciones
**Codigo:** `PRE_VACATION_REST` | **Severidad:** ERROR | **Boost:** 3

En la seccion de peticiones, cuando el empleado solicita vacaciones, debe aparecerle una opcion para elegir si desea salir con 2 dias de descanso (5 dias de trabajo + 2 dias de descanso + inicio de vacaciones) o entrar de sus vacaciones con 2 dias de descanso (fin de vacaciones + 2 dias de descanso + 5 dias de trabajo). Esto siempre debe validarse por un usuario Manager/Admin.

**Criterio opcional ampliado (del cuadrante real):**
- **"Salir a mis vacaciones con mis 2 dias de descanso":** Los descansos se colocan justo antes del inicio de vacaciones.
- **"Entrar de mis vacaciones con mis 2 dias de descanso":** Los descansos se colocan justo despues de volver de vacaciones.

El empleado elige una de las dos opciones segun su preferencia. El Manager valida o rechaza.

---

### OB-10 -- Guardia solo para jefes
**Codigo:** `GUARD_ONLY_CHIEF` | **Severidad:** BLOCKER | **Boost:** 3

Los turnos de Guardia (G, 09:00-21:00) solo pueden asignarse al FOM. Las guardias se realizan exclusivamente en sabados y domingos, y se seleccionan en el wizard de generacion (Step 3). El AFOM NUNCA hace guardias.

**Maximo:** 2 fines de semana como maximo con guardia por periodo (mes).

**Guardia de Tarde (GT, 11:00-23:00):** Es excepcional. Se usa unicamente cuando no existe ninguna posibilidad matematica de asignar un turno de Tarde (T) a ningun empleado y al FOM le coincide con una Guardia (G) ese dia. El FOM asume esta responsabilidad haciendo una guardia en horario de tarde en lugar de la guardia normal de 9 a 21.

**Despues de una guardia:** Se genera un DG (Debido Guardia) que va a la "mochila"/balance del FOM. El FOM decide manualmente cuando disfrutar ese dia.

---

### OB-11 -- GEX turnos propios
**Codigo:** `GEX_OWN_SHIFTS` | **Severidad:** ERROR | **Boost:** 3

El Guest Experience Agent (GEX) es un rol especial que tiene sus propios turnos y NO entra en la rotacion M/T/N general. Sus turnos son:
- **9x17** (09:00-17:00): Se usa para horarios de manana, especialmente cuando hay mas check-outs (salidas).
- **12x20** (12:00-20:00): Se usa para refuerzo cubriendo un poco de manana y tarde-noche, especialmente cuando hay mas check-ins (llegadas).

Estos turnos se asignan en funcion de las llegadas y salidas del hotel del dia y estan supeditados a la validacion del Manager. El GEX tambien tiene sus 2 descansos semanales y su FDS largo mensual.

---

### OB-12 -- Descanso semanal minimo 2 dias consecutivos
**Codigo:** `WEEKLY_REST_CONSECUTIVE` | **Severidad:** ERROR | **Boost:** 3

El convenio establece 2 dias libres consecutivos por semana como norma. En casos de picos de trabajo, puede reducirse a 1 dia de descanso, pero con las siguientes limitaciones estrictas: no mas de 3 semanas consecutivas con descanso reducido, y no mas de 9 veces al ano. Cualquier reduccion requiere validacion por un usuario Manager/Admin, alerta al empleado afectado, y registro en historial con trazabilidad legal.

---

### OB-13 -- Override 12h por fuerza mayor con trazabilidad
**Codigo:** `FORCE_MAJEURE_12H` | **Severidad:** BLOCKER | **Boost:** 3

El Manager/Admin puede forzar una violacion de la regla de 12h en casos excepcionales de fuerza mayor. Este override requiere:
1. Doble confirmacion: el Manager activa el override explicitamente.
2. Consentimiento del empleado afectado: se le envia una alerta de aceptacion para su validacion personal. Esto sirve como confirmacion legal para que en un futuro no haya problemas ni denuncias del empleado hacia la organizacion.
3. Registro completo con motivo + consentimiento en el historial (trazabilidad legal).
4. Alerta visual en el cuadrante (celda en color diferente + icono de advertencia).

No es un toggle permanente: es un override puntual por dia/turno concreto.

---

### OB-14 -- Separacion libres con conflicto + doble confirmacion
**Codigo:** `SPLIT_REST_CONFLICT` | **Severidad:** ERROR | **Boost:** 3

Cuando la cobertura obliga a separar los 2 dias libres consecutivos de un empleado, el motor debe:
1. Marcar la situacion como **conflicto**.
2. Requerir doble confirmacion: aprobacion del Manager + aceptacion del empleado. Se envia una alerta de aceptacion al empleado para su validacion personal, garantizando trazabilidad legal y evitando futuros problemas o denuncias.
3. Registrar todo con trazabilidad (motivo, fecha, quien aprobo).

---

### OB-15 -- Dos contadores vacaciones separados (30 nat + 18 fest)
**Codigo:** `DUAL_VACATION_COUNTER` | **Severidad:** ERROR | **Boost:** 3

Los 48 dias de vacaciones anuales NO se gestionan como un solo contador. Son dos contadores independientes:

**Contador 1 -- Vacaciones naturales (30 dias/ano):**
- Visible siempre en la ficha del empleado: "Disfrutados: X / 30"
- El motor bloquea asignar mas V cuando llega a 30
- Bloqueo suave al llegar a 0: avisa pero permite override con registro

**Contador 2 -- Festivos (18 dias/ano):**
- Calendario de festivos de provincia cargado (region seleccionada por el usuario)
- Festivo trabajado genera compensatorio automaticamente
- Festivo que coincide con dia libre del empleado NO genera compensacion
- Visible: "Festivos trabajados: X | Compensatorios disponibles: X | Disfrutados: X"

**Reglas adicionales:**
- Alerta preventiva al 80% de vacaciones consumidas antes de octubre (SM-09).
- Reset automatico de contadores el 1 de enero de cada ano.
- Historial de vacaciones disfrutadas por ano para auditorias.

**Configuracion:**
- `naturalDays`: 30
- `holidayDays`: 18
- `alertThreshold`: 0.8 (80%)
- `alertBeforeMonth`: 10 (octubre)

---

### OB-16 -- Espejo FOM - AFOM
**Codigo:** `FOM_AFOM_MIRROR` | **Severidad:** ERROR | **Boost:** 3

La asignacion del AFOM se calcula DESPUES de fijar el turno del FOM, siguiendo la logica de espejo:

| FOM hace... | AFOM hace... |
|------------|-------------|
| M (manana L-V) | T (tarde) ese dia |
| D (libra S+D sin guardia) | M (cubre manana) |
| G (guardia S/D) | D (libra) -- momento ideal para su FDS largo |
| V (vacaciones/baja) | Cubre (trabaja M) |

El AFOM NUNCA realiza guardias (G ni GT). Solo el FOM tiene esa responsabilidad.

---

### OB-17 -- Cobertura noches del Night Agent por rotacion estricta de antiguedad
**Codigo:** `NIGHT_COVERAGE_EQUITY` | **Severidad:** ERROR | **Boost:** 3

Cuando el Night Agent libra (sus 2 dias de descanso semanales), las noches las cubren los FDAs siguiendo un **orden estricto de rotacion por antiguedad (round-robin)**:

1. **Ciclo 1:** FDA#1 (mas antiguo) cubre el primer ciclo de las 2 noches de descanso del Night Agent.
2. **Ciclo 2:** FDA#2 (siguiente en antiguedad) cubre el siguiente ciclo de las 2 noches de descanso del rol nocturno.
3. **Ciclo 3:** FDA#3 cubre el siguiente ciclo de las 2 noches de descanso del rol nocturno.
4. Y asi sucesivamente con criterio rotativo hasta que todos los FDAs han cubierto, y se reinicia el ciclo.

**Reglas criticas:**
- Despues de cubrir noches, el FDA recibe **2 dias de descanso consecutivos** inmediatamente (dia despues de su ultima N + dia siguiente).
- El motor debe **leer los turnos ya generados** (cuadrantes anteriores) para saber donde quedo la rotacion y continuarla, independientemente de la antiguedad. Si el criterio rotativo indica que le toca al FDA#3 por ejemplo, se continuara por ahi, sin reiniciar desde FDA#1.
- Los FDAs marcados con `canCoverNights = false` se excluyen de la rotacion.
- NO se genera DB ni compensacion economica por cubrir noches del Night Agent. Solo se contabiliza en historial de equidad.

**Cobertura extendida:** Cuando el Night Agent se ausenta mas de sus 2 dias de descanso (por vacaciones, permisos, etc.), se aplica exactamente el mismo criterio rotativo: FDA#1 cubre la primera semana completa, FDA#2 la segunda semana, etc. El motor debe leer los turnos ya generados para continuar la rotacion donde quedo, sin reiniciar desde FDA#1 independientemente de la antiguedad.

---

### OB-18 -- GEX turno por ocupacion (check-ins/check-outs)
**Codigo:** `GEX_BY_OCCUPANCY` | **Severidad:** WARNING | **Boost:** 3

El algoritmo decide que turno asigna al GEX segun el volumen de movimientos del hotel ese dia O LA OPERATIVA:
- Mas check-outs (salidas) por la manana --> **9x17**
- Mas check-ins (llegadas) por la tarde --> **12x20**

El Manager siempre puede hacer override manual de esta decision.

---

## 4. Criterios Opcionales (OP-01 a OP-43)

Los criterios opcionales son personalizables por el Manager. Cada uno tiene un toggle ON/OFF y un boost (1-3) que determina su peso en la generacion.

---

### OP-01 -- Fin de semana largo mensual (FDS Largo)
**Codigo:** `LONG_WEEKEND_MONTHLY` | **Severidad:** WARNING | **Boost:** 3

Cada empleado tiene derecho a 1 fin de semana largo al mes. Se construye uniendo:
- **Sabado + Domingo** (libres de la semana X)
- **Lunes + Martes** (libres de la semana X+1)
= **4 dias consecutivos** incluyendo fin de semana.

Esto implica que las libranzas semanales se posicionan estrategicamente para crear este bloque de 4 dias. El motor verifica al final de la generacion mensual que TODOS los empleados tienen su FDS largo asignado (CK-20).

**EJEMPLO Del cuadrante real:** UN FDA tuvo su FDS largo los dias 24-25-26-27 de abril (jueves-viernes-sabado-domingo).

**No confundir con DB:** El FDS largo es una gratitud/perk mensual de la organizacion, no una obligacion legal ni un dia debido del balance personal. Se usa para motivar y atraer talento.

---

### OP-02 -- Rotacion ergonomica M-T-N
**Codigo:** `ERGONOMIC_ROTATION` | **Severidad:** INFO | **Boost:** 3

La rotacion ideal sigue la secuencia hacia adelante: M (manana) --> T (tarde) --> N (noche) --> Libre. Nunca N directamente a M. Esta es una preferencia suave: el motor la favorece pero no la impone rigidamente.

**Realidad del cuadrante real:** La rotacion NO es por bloques semanales, es dia a dia segun cobertura. Un mismo empleado puede hacer M y T (e incluso N) dentro de la misma semana. El turno 11x19 se usa activamente como puente cuando se detecta una transicion que violaria las 12h.

---

### OP-03 -- Equidad de noches
**Codigo:** `NIGHT_EQUITY` | **Severidad:** WARNING | **Boost:** 3

Todos los empleados rotativos deben cubrir aproximadamente el mismo numero de noches a lo largo del ano. La tolerancia es de +/-2 noches por ano. El Night Agent fijo esta excluido de este calculo (es un rol contratado especialmente para este horario).

---

### OP-04 -- Equidad de fines de semana
**Codigo:** `WEEKEND_EQUITY` | **Severidad:** WARNING | **Boost:** 3

Los sabados y domingos trabajados deben repartirse equitativamente entre todos los empleados a lo largo del ano. Ningun empleado debe trabajar significativamente mas fines de semana que otro. La tolerancia es de +/-2 fines de semana por ano.

---

### OP-05 -- Equidad M/T/N
**Codigo:** `SHIFT_EQUITY_MTN` | **Severidad:** WARNING | **Boost:** 3

La cantidad de mananas, tardes y noches debe ser equitativa entre personas a lo largo del ciclo anual. Excepcion: el Night Agent fijo (N siempre) y el GEX (solo 9x17/12x20).

**Tolerancia:** +/-3 turnos por defecto (configurable). Los desequilibrios de un periodo se compensan en el siguiente (vision de ciclo largo, no perfeccion mensual).

---

### OP-06 -- Libres rotativos
**Codigo:** `ROTATING_REST_DAYS` | **Severidad:** INFO | **Boost:** 3

Los dias libres rotan de posicion semana a semana: nadie libra siempre lunes ni siempre viernes. Si un empleado libro L-M esta semana, la semana siguiente deberia librar en otros dias (Mi-J, J-V, etc.).

---

### OP-07 -- Dimensionamiento por ocupacion
**Codigo:** `OCCUPANCY_STAFFING` | **Severidad:** WARNING | **Boost:** 3

Reforzar turnos segun el volumen de check-in/check-out/eventos del dia. Si hay mucho trabajo, el motor propone al Manager asignar +1 persona sobre lo establecido como minimo. El motor no auto-asigna: propone y el Manager valida o rechaza.

Los datos de ocupacion se cargan desde la tabla `daily_occupancy` y pueden introducirse manualmente o importarse desde archivo (CSV/Excel/PDF del PMS).

---

### OP-08 -- Cobertura equitativa del nocturno
**Codigo:** `NIGHT_COVER_EQUITY` | **Severidad:** WARNING | **Boost:** 3

Cuando el Night Agent libra, sus noches se reparten equitativamente entre los FDAs rotativos. Este criterio trabaja junto con OB-17 (rotacion estricta por antiguedad y analisis del turno anterior) para garantizar que la carga nocturna se distribuya justamente.

---

### OP-09 -- Peso de indeseabilidad por turno
**Codigo:** `UNDESIRABILITY_WEIGHT` | **Severidad:** INFO | **Boost:** 3

Cada tipo de turno tiene un peso de indeseabilidad configurable que refleja lo "costoso" que es para el empleado:
- N (Noche) = 3
- T (Tarde) = 2
- M (Manana) = 1

El motor usa estos pesos para equilibrar la carga ponderada total entre empleados a largo plazo. Un empleado con muchas noches acumula mas "carga" que uno con muchas mananas. Estos pesos alimentan la estadistica de equidad.

---

### OP-10 -- Duracion ciclo rotacion
**Codigo:** `ROTATION_CYCLE_LENGTH` | **Severidad:** INFO | **Boost:** 2

Define la longitud del ciclo de rotacion: 4 semanas (default), 6 u 8 semanas. Ciclos mas largos permiten mejor optimizacion de equidad; ciclos mas cortos dan mas flexibilidad.

**Configuracion:**
- `weeks`: 4 (default)

---

### OP-11 -- Tolerancia de desequilibrio
**Codigo:** `IMBALANCE_TOLERANCE` | **Severidad:** INFO | **Boost:** 2

Margen permitido de diferencia en horas o numero de turnos entre empleados antes de generar alerta.

**Configuracion:**
- `toleranceShifts`: 3 (max diferencia en numero de turnos)
- `toleranceHours`: 3 (max diferencia en horas)

---

### OP-12 -- Observador SMART+IA de patrones
**Codigo:** `SMART_IA_OBSERVER` | **Severidad:** INFO | **Boost:** 2

Observador inteligente que analiza todas las celdas, horarios, turnos semanales y mensuales para encontrar patrones: tipos de horarios especificos por llegadas y/o salidas, patrones recurrentes, fechas de vacaciones habituales, y aprendizaje de turnos elaborados anteriormente. Se nutre de todo el historial para proponer mejoras proactivamente. Incluye la propuesta automatica de turnos frecuentes a favoritos (SM-01).

---

### OP-13 -- Convenio personalizado por provincia
**Codigo:** `CUSTOM_COLLECTIVE_AGREEMENT` | **Severidad:** INFO | **Boost:** 3

Permite cargar un convenio colectivo especifico (PDF/JSON) que sobreescribe las reglas genericas. El motor debe extraer de este convenio:
- Festivos regionales especificos por mes
- Reglas laborales particulares de la provincia
- Condiciones especificas del sector.

---

### OP-14 -- Peticiones blandas de empleados
**Codigo:** `SOFT_PETITIONS` | **Severidad:** INFO | **Boost:** 2

Preferencias de los empleados tipo "prefiero librar miercoles". El Manager puede configurar el peso de cada peticion en 2 niveles:
- 1 = Deseo (se intenta pero no se prioriza)
- 2 = Critico (casi obligatorio, el motor lo prioriza activamente)

---

### OP-15 -- Intercambios entre empleados
**Codigo:** `EMPLOYEE_SWAPS` | **Severidad:** INFO | **Boost:** 2

Los empleados pueden proponer intercambios de turnos entre ellos. El sistema valida automaticamente que el intercambio no viole reglas (12h, cobertura, horas) y el Manager da la aprobacion final. Cuando el Manager aprueba o rechaza, se envia alerta a ambos empleados implicados. Ver tambien OP-28.

---

### OP-16 -- Maximo noches consecutivas
**Codigo:** `MAX_CONSECUTIVE_NIGHTS` | **Severidad:** WARNING | **Boost:** 3

Limite configurable de noches seguidas para rotativos. No aplica al Night Agent fijo (es su rol permanente). La alerta es suave: aviso visible pero NO bloqueo.

**Configuracion:**
- `maxNights`: 2 (default)
- `minNights`: 1
- `maxConfigurable`: 6

---

### OP-17 -- Simulador pre-publicacion
**Codigo:** `PRE_PUBLISH_SIMULATOR` | **Severidad:** INFO | **Boost:** 3

Proyeccion de horas, impacto de peticiones y comparativa de cuadrantes antes de publicar. Permite al Manager ver el efecto de sus decisiones antes de comprometerse.

---

### OP-18 -- Turno de transicion 11x19
**Codigo:** `TRANSITION_11X19` | **Severidad:** INFO | **Boost:** 3

Turno especial (11:00-19:00) para transiciones legales. Se usa en dos escenarios:
1. **T a M:** Un empleado que termina tarde (23:00) y al dia siguiente tiene manana. En lugar de violar las 12h, entra a las 11:00.
2. **Transiciones GEX:** De 12x20 a 9x17 al dia siguiente.

El motor detecta automaticamente cuando se necesita y lo propone como solucion (SM-10).

---

### OP-19 -- Acumulador DB (Dia Debido)
**Codigo:** `DB_ACCUMULATOR` | **Severidad:** INFO | **Boost:** 3

Sistema de balance personal del empleado. Los dias debidos se acumulan por diversas razones:
- Festivos trabajados y no disfrutados
- Semanas con 6 dias trabajados y solo 1 dia de descanso (circunstancias excepcionales)
- Horas extra acumuladas (cada +8h extras = +1 DB)

El empleado solicita cuando disfrutar sus DB a traves de la seccion de Peticiones. El Manager valida o rechaza la solicitud.

**Del cuadrante real:** Triana tiene dias marcados como DB, que son dias que ella tiene a su favor en su estadistica personal y que ha podido disfrutar previa peticion al Manager y su posterior validacion.

---

### OP-20 -- Acumulador DG (Debido Guardia)
**Codigo:** `DG_ACCUMULATOR` | **Severidad:** INFO | **Boost:** 3

Especifico para el FOM. Cada guardia G realizada genera +1 DG (dia libre debido) que va a la "mochila" del FOM. El FOM decide manualmente cuando disfrutarlo.

**Del cuadrante real:** Eva (FOM) tiene dias marcados como DG, que son dias libres ganados por guardias anteriores que ha decidido disfrutar.

---

### OP-21 -- Bolsa de horas (en revision)
**Codigo:** `HOUR_BANK` | **Severidad:** INFO | **Boost:** 2

**Nota:** TurnoSmart no es una herramienta de control horario (clock-in/clock-out). Este acumulador funciona con las horas planificadas en el cuadrante, no con horas reales trabajadas.

Acumulador de horas extras generadas por coberturas de ausencias. Compensable en tiempo (dias libres) o en dinero, segun politica del establecimiento.

---

### OP-22 -- Split shifts (turno partido)
**Codigo:** `SPLIT_SHIFTS` | **Severidad:** INFO | **Boost:** 2 | **Default: OFF**

Permite turnos partidos (ejemplo: 10-14 + 18-22). Configurable si cuenta como 1 o 2 turnos. Desactivado por defecto. Se usa frecuentemente en otros sectores como retail o restauracion.

---

### OP-23 -- Turnos ad-hoc desde celda (SMART+IA)
**Codigo:** `AD_HOC_SHIFTS` | **Severidad:** INFO | **Boost:** 3

El Manager puede escribir cualquier horario libre directamente en una celda del cuadrante (ejemplo: "14x22"). El sistema guarda el turno y, si lo usa 3 o mas veces, propone anadirlo a favoritos.

**Del cuadrante real:** La manager creo turnos como 14x22 (para un grupo que llegaba a las 20h) y 13x21 (para un cocktail contratado por tour operador). Esto demuestra que la operativa real requiere esta flexibilidad.

---

### OP-24 -- Tipos de ausencia/permiso extensibles
**Codigo:** `EXTENSIBLE_ABSENCE_TYPES` | **Severidad:** INFO | **Boost:** 2

Codigos base de ausencia: D, V, E, F, DB, DG, PM (Permiso Mudanza), PC (Permiso Curso), G. El Manager puede crear nuevos tipos manualmente segun las necesidades de su establecimiento. Cuando y donde ubicar estas ausencias lo suelen determinar las peticiones de los empleados.

---

### OP-25 -- Sistema peticiones digital
**Codigo:** `DIGITAL_PETITIONS` | **Severidad:** INFO | **Boost:** 3

Flujo digital de peticiones: empleado solicita --> Manager valida/rechaza --> resultado notificado mediante alerta al empleado. Cuatro tipos:
- **A (Dura):** Obligatoria. Vacaciones aprobadas, baja medica. El motor la respeta al 100%.
- **B (Blanda):** Preferencia. "Prefiero manana el viernes." El motor intenta respetar pero puede saltar si la cobertura lo exige.
- **C (Intercambio):** Dos empleados acuerdan cambio. El Manager valida o rechaza.
- **D (Recurrente):** Detectada automaticamente cuando el empleado pide lo mismo 3+ meses (SM-02/OP-26).

---

### OP-26 -- Peticion recurrente auto-detectada (Tipo D)
**Codigo:** `RECURRING_PETITION_DETECT` | **Severidad:** INFO | **Boost:** 3

Si un empleado pide lo mismo 3 o mas meses seguidos (ejemplo: "prefiero no trabajar los miercoles"), el sistema lo detecta y propone al Manager: "Este empleado siempre pide los miercoles libres. Quieres convertirlo en restriccion permanente?"

---

### OP-27 -- Deadline peticiones configurable
**Codigo:** `PETITION_DEADLINE` | **Severidad:** INFO | **Boost:** 2

El Manager configura una fecha limite para recibir peticiones antes de generar el cuadrante. Las peticiones que llegan despues de la fecha limite entran como blandas con prioridad baja.

---

### OP-28 -- Intercambios con validacion automatica
**Codigo:** `SWAP_AUTO_VALIDATION` | **Severidad:** INFO | **Boost:** 3

Cuando dos empleados proponen un intercambio de turnos, el sistema pre-valida automaticamente:
1. No genera turno pijama
2. No viola las 12h de descanso
3. No deja ningun turno sin cubrir
4. Las horas semanales siguen dentro del limite

Si pasa la pre-validacion al 100%, llega al Manager para aprobacion final. Si no pasa, rechaza automaticamente y explica el motivo a ambos empleados enviandoles una alerta. Cuando el Manager aprueba o rechaza, se envia alerta a ambos empleados implicados.

---

### OP-29 -- Conflicto vacaciones con panel comparativo
**Codigo:** `VACATION_CONFLICT_PANEL` | **Severidad:** WARNING | **Boost:** 3

Cuando 2 o mas empleados piden las mismas fechas de vacaciones, el sistema muestra un panel comparativo con:
- Antiguedad de cada empleado
- Quien disfruto vacaciones en esas fechas el ano pasado
- Historial de satisfaccion de peticiones (% de peticiones aprobadas)
- Cobertura resultante si se aprueba una u otra

El Manager siempre toma la decision final con toda la informacion delante.

---

### OP-30 -- Import ocupacion PDF/CSV/Excel + manual
**Codigo:** `OCCUPANCY_IMPORT` | **Severidad:** INFO | **Boost:** 3

Input manual de llegadas/salidas por dia + import de archivo exportado del PMS. En el futuro, integracion directa con PMS (Opera, Mews, Cloudbeds) via API.

---

### OP-31 -- Umbral refuerzo por ocupacion
**Codigo:** `REINFORCEMENT_THRESHOLD` | **Severidad:** WARNING | **Boost:** 3

A partir de un numero configurable de llegadas/dia (default: 40), el motor propone refuerzo extra al Manager si hay personal disponible. Si no hay personal, genera alerta (OP-32).

Las llegadas y salidas se suman para determinar la carga total del dia (40 llegadas + 11 salidas = 51 movimientos).

**Configuracion:**
- `threshold`: 40

---

### OP-32 -- Alerta sin personal + sugerencias
**Codigo:** `NO_STAFF_ALERT` | **Severidad:** WARNING | **Boost:** 3

Cuando un dia necesita refuerzo pero no hay personal disponible:
1. Marca el dia en naranja/rojo en el cuadrante (alerta visual).
2. Envia sugerencias concretas al Manager: "Dia 12: 102 llegadas. Opciones: mover el libre de [FDA X] a otro dia, solapar turno (entrada a las 12h en vez de 15h), o contactar cobertura extra."
3. El sistema NO toma accion automatica, solo informa y sugiere. El Manager siempre toma la ultima decision, validando o rechazando.

---

### OP-33 -- 2-3 alternativas de cuadrante con score
**Codigo:** `MULTI_ALTERNATIVE` | **Severidad:** INFO | **Boost:** 3

El motor genera 2-3 versiones del cuadrante con diferentes trade-offs:
- **Version 1 -- Equilibrio:** Equidad M/T/N perfecta, pero alguna peticion blanda no satisfecha. Las peticiones no satisfechas se senalan a nivel informativo.
- **Version 2 -- Peticiones:** Todas las peticiones respetadas, pero equidad +/-3.
- **Version 3 -- Cobertura:** Cobertura optima, pero FDS largo cae en semana de alta ocupacion.

Cada version muestra su score (0-100) desglosado por categorias. El Manager compara, elige y asume la accountability de su decision (queda registrado que version eligio y por que).

---

### OP-34 -- Cambios post-publicacion en azul + notificacion
**Codigo:** `POST_PUB_BLUE_CHANGES` | **Severidad:** INFO | **Boost:** 3

Despues de publicar el cuadrante, el Manager puede editar cualquier turno. Cada cambio:
1. Pasa por validacion automatica (12h, cobertura, horas).
2. Se marca visualmente en azul en el cuadrante.
3. Genera notificacion automatica al empleado afectado: "Tu turno del dia X ha cambiado de M a T."
4. Se registra en historial con quien lo cambio, cuando y motivo.

---

### OP-35 -- Config criterios global + puntual por generacion
**Codigo:** `CRITERIA_GLOBAL_PUNCTUAL` | **Severidad:** INFO | **Boost:** 3

El Manager configura sus criterios una vez en Settings (configuracion global). En cada generacion puede ajustar criterios puntualmente sin afectar la configuracion global. Si cambia el mismo criterio puntualmente 3+ veces seguidas, el sistema propone dejarlo activado por defecto (SM-03).

---

### OP-36 -- Capas visualizacion toggleables
**Codigo:** `VISUAL_LAYERS` | **Severidad:** INFO | **Boost:** 3

Capas de visualizacion activables/desactivables desde la toolbar:
- Heatmap de carga (dias de alta ocupacion mas intensos)
- Indicadores de equidad (balance M/T/N por empleado)
- Alertas inline (iconos en celdas conflictivas)
- Comparador lado a lado (2 versiones en paralelo)

Modo minimalista (todo OFF excepto alertas) para el dia a dia; modo datos (todo ON) para analisis.

---

### OP-37 -- Nueva incorporacion: manual a auto
**Codigo:** `NEW_HIRE_PROGRESSIVE` | **Severidad:** INFO | **Boost:** 2

Fase 1: El Manager asigna manualmente los primeros turnos del nuevo empleado. El motor pregunta al Manager si quiere o no incluirlo en la rotacion automatica.
Fase 2: Cuando el Manager lo activa, entra en rotacion automatica con historial en cero (sin deuda ni credito inicial).

---

### OP-38 -- Noches consecutivas: alerta suave configurable
**Codigo:** `CONSECUTIVE_NIGHTS_ALERT` | **Severidad:** WARNING | **Boost:** 3

Umbral por defecto: 2 noches consecutivas. Al superarlo: aviso visible en el cuadrante pero NO bloqueo. Configurable de 1 a 6. No aplica al Night Agent fijo.

**Configuracion:**
- `threshold`: 2 (default)
- `min`: 1
- `max`: 6

---

### OP-39 -- Tipo empleado auto-detectado + override manual
**Codigo:** `AUTO_DETECT_EMPLOYEE_TYPE` | **Severidad:** INFO | **Boost:** 3

El sistema detecta automaticamente el tipo de empleado (FIJO_NO_ROTA, ROTA_COMPLETO, ROTA_PARCIAL, COBERTURA) basandose en su contrato, rol asignado e historial. El Manager puede hacer override manual en cualquier momento.

---

### OP-40 -- Calendario festivos nacional + regional
**Codigo:** `HOLIDAY_CALENDAR_NATIONAL_REGIONAL` | **Severidad:** WARNING | **Boost:** 3

El motor debe conocer y cargar automaticamente los festivos que aplican al establecimiento:

1. **Festivos nacionales** de Espana: los que aplican a todo el territorio (1 enero, 6 enero, Viernes Santo, 1 mayo, 15 agosto, 12 octubre, 1 noviembre, 6 diciembre, 8 diciembre, 25 diciembre, etc.).
2. **Festivos regionales/provinciales:** Extraidos del convenio colectivo subido en la seccion de criterios. Cada provincia y sector tiene sus festivos especificos.

Estos festivos determinan:
- Cuando se genera un dia F (festivo trabajado) y su correspondiente compensatorio.
- La planificacion mensual (en abril 2026 hay 2 festivos por convenio de Cadiz).
- Los contadores de festivos del OB-15.

**Configuracion:**
- `country`: "ES"
- `province`: "Cadiz"
- `sector`: "hosteleria"

---

### OP-41 -- Vacaciones: salir/entrar con descansos
**Codigo:** `VACATION_REST_ENTRY_EXIT` | **Severidad:** INFO | **Boost:** 3

En la seccion de peticiones, cuando el empleado solicita vacaciones, debe aparecerle una opcion para elegir si desea salir con 2 dias de descanso o entrar de sus vacaciones con 2 dias de descanso. Esto siempre debe validarse por un usuario Manager/Admin.

- **"Salir a vacaciones con mis 2 dias de descanso":** Los descansos se colocan JUSTO ANTES del inicio de vacaciones. El empleado termina de trabajar, descansa 2 dias, y entra directamente en periodo de vacaciones. Ejemplo real: Triana tuvo D el 30-31 de marzo y V del 1-5 de abril.
- **"Entrar de vacaciones con mis 2 dias de descanso":** Los descansos se colocan JUSTO DESPUES de volver de vacaciones. El empleado sale de vacaciones y tiene 2 dias de descanso antes de reincorporarse.

Cada empleado elige su preferencia. El Manager valida o rechaza.

**Configuracion:**
- `mode`: "exit_with_rest" (default)
- `options`: ["exit_with_rest", "enter_with_rest"]

---

### OP-42 -- Exclusion empleado de rotacion nocturna (canCoverNights)
**Codigo:** `CAN_COVER_NIGHTS_FLAG` | **Severidad:** INFO | **Boost:** 3

Flag configurable por empleado en su ficha. Por defecto, todos los FDAs (ROTA_COMPLETO) participan en la rotacion de cobertura nocturna cuando el Night Agent libra. Si se establece `canCoverNights = false`, ese FDA se excluye permanentemente de la rotacion.

**Casos de uso:**
- Empleados con restricciones medicas que impiden trabajo nocturno.
- Empleados con acuerdos contractuales que excluyen noches.
- Empleados en periodo de formacion o adaptacion.

La exclusion es inmediata: el motor recalcula la rotacion con los FDAs restantes.

---

### OP-43 -- Sugerencia disfrute dias debidos (DB/DG)
**Codigo:** `DB_DG_ENJOY_PROMPT` | **Severidad:** INFO | **Boost:** 3

Cuando el motor detecta que un empleado tiene dias debidos acumulados (DB o DG), sugiere proactivamente al Manager su disfrute. El prompt incluye el desglose del saldo:

"Tienes X dias debidos:
- X por guardias realizadas (DG)
- X por festivos trabajados y no disfrutados
- X por semanas con 6 dias trabajados y 1 solo dia de descanso
Quieres colocar alguno esta semana? Si es asi, indicalo en el turno y bloquealo."

Solo el Manager decide cuando y donde colocar los dias. El motor los marca correctamente (DB o DG) y los descuenta del saldo.

---

## 5. Checks de Validacion (CK-01 a CK-27)

Los checks son validaciones que se ejecutan en diferentes momentos del ciclo de vida del cuadrante. Se clasifican por cuando se ejecutan:

- **Pre-gen:** Antes de generar el cuadrante (verificaciones previas).
- **Post-gen:** Despues de generar, antes de publicar.
- **Tiempo real:** Cada vez que el Manager edita una celda manualmente.
- **Pre-publicacion:** Justo antes de publicar el cuadrante.
- **Pre-aprobacion:** Antes de aprobar un intercambio o cambio.

---

### CK-01 -- Descanso 12h
**Codigo:** `CHECK_12H_REST` | **Severidad:** BLOCKER | **Subcategoria:** Post-gen + Tiempo real

Verifica que entre el fin de un turno y el inicio del siguiente hay al menos 12 horas. Se ejecuta tanto despues de generar como en tiempo real cuando el Manager edita.

---

### CK-02 -- Libres consecutivos
**Codigo:** `CHECK_CONSECUTIVE_REST` | **Severidad:** ERROR | **Subcategoria:** Post-gen

Verifica que los 2 dias libres de cada semana son consecutivos. Si no lo son, genera alerta de conflicto.

---

### CK-03 -- Cobertura minima
**Codigo:** `CHECK_MIN_COVERAGE` | **Severidad:** BLOCKER | **Subcategoria:** Post-gen

Verifica que cada turno activo tiene al menos el numero minimo configurado de personas (M:1, T:1, N:1 por defecto).

---

### CK-04 -- Horas semanales
**Codigo:** `CHECK_WEEKLY_HOURS` | **Severidad:** ERROR | **Subcategoria:** Post-gen

Verifica que ningun empleado supera las horas semanales correspondientes a su tipo de contrato (40h, 35h, 30h, 25h o 20h).

---

### CK-05 -- Turno pijama
**Codigo:** `CHECK_PAJAMA_SHIFT` | **Severidad:** BLOCKER | **Subcategoria:** Post-gen + Tiempo real

Detecta la secuencia T seguida de M al dia siguiente (tarde seguida de manana), que viola las 12h de descanso.

---

### CK-06 -- Noche seguida de libre
**Codigo:** `CHECK_NIGHT_THEN_FREE` | **Severidad:** BLOCKER | **Subcategoria:** Post-gen

Verifica que despues de un turno N el dia siguiente es libre. Aplica a ROTA_COMPLETO y COBERTURA, no al Night Agent fijo.

---

### CK-07 -- Equilibrio noches
**Codigo:** `CHECK_NIGHT_BALANCE` | **Severidad:** WARNING | **Subcategoria:** Post-gen

Verifica que el desequilibrio de noches entre empleados no supera la tolerancia configurada.

---

### CK-08 -- Equilibrio FDS
**Codigo:** `CHECK_WEEKEND_BALANCE` | **Severidad:** WARNING | **Subcategoria:** Post-gen

Verifica el desequilibrio de fines de semana trabajados entre empleados.

---

### CK-09 -- FDS largo mensual
**Codigo:** `CHECK_LONG_WEEKEND` | **Severidad:** ERROR | **Subcategoria:** Post-gen

Verifica que cada empleado tiene un bloque S+D+L+M (o equivalente de 4 dias) al menos 1 vez al mes.

---

### CK-10 -- Pre-vacaciones librando
**Codigo:** `CHECK_PRE_VACATION` | **Severidad:** ERROR | **Subcategoria:** Pre-gen + Post-gen

Verifica que antes de vacaciones el empleado tiene sus 2 libres semanales colocados correctamente (segun su preferencia de salir o entrar con descansos).

---

### CK-11 -- Festivos compensados
**Codigo:** `CHECK_HOLIDAY_COMPENSATED` | **Severidad:** WARNING | **Subcategoria:** Post-gen

Verifica que los festivos trabajados tienen su compensatorio programado en el mes. El motor conoce los festivos nacionales del pais y los regionales del convenio.

---

### CK-12 -- Guardia = solo jefe
**Codigo:** `CHECK_GUARD_ROLE` | **Severidad:** ERROR | **Subcategoria:** Tiempo real

Verifica que el turno G solo esta asignado a roles de Manager (FOM). Si alguien intenta asignar G a otro rol, se bloquea.

---

### CK-13 -- GEX exclusion rotacion
**Codigo:** `CHECK_GEX_EXCLUSION` | **Severidad:** ERROR | **Subcategoria:** Pre-gen

Verifica que el GEX no entra en la rotacion M/T/N general. Solo puede tener turnos 9x17, 12x20 u otros horarios especificos establecidos por el Manager.

---

### CK-14 -- Restricciones duras empleado
**Codigo:** `CHECK_HARD_RESTRICTIONS` | **Severidad:** BLOCKER | **Subcategoria:** Post-gen

Verifica que ninguna restriccion dura (Tipo A: vacaciones aprobadas, baja medica) ha sido violada.

---

### CK-15 -- Horas acumuladas anuales
**Codigo:** `CHECK_ANNUAL_HOURS` | **Severidad:** WARNING | **Subcategoria:** Post-gen

Proyeccion de horas anuales: verifica que no se superan las horas anuales del convenio sectorial correspondiente.

---

### CK-16 -- Descanso semanal 36h
**Codigo:** `CHECK_36H_WEEKLY_REST` | **Severidad:** ERROR | **Subcategoria:** Post-gen

Verifica que los 2 dias de descanso semanal son consecutivos. En casos de excepcion por picos (OB-12), verifica que no se superen las 3 semanas consecutivas ni las 9 veces anuales.

---

### CK-17 -- Progresion natural turnos
**Codigo:** `CHECK_SHIFT_PROGRESSION` | **Severidad:** WARNING | **Subcategoria:** Post-gen

Verifica que no hay saltos bruscos en la asignacion (ejemplo: M directo a N sin pasar por T). Es una verificacion suave de la rotacion ergonomica.

---

### CK-18 -- Dimensionamiento vs ocupacion
**Codigo:** `CHECK_STAFFING_VS_OCCUPANCY` | **Severidad:** WARNING | **Subcategoria:** Post-gen

Verifica que el personal presencial programado coincide con el forecast de ocupacion del dia. Si hay 102 llegadas y solo 1 persona en turno, alerta.

---

### CK-19 -- Validacion intercambios (12h + cobertura + horas)
**Codigo:** `CHECK_SWAP_VALIDATION` | **Severidad:** ERROR | **Subcategoria:** Pre-aprobacion

Antes de aprobar un intercambio Tipo C entre empleados, valida: no genera pijama, no viola 12h, cobertura OK, horas semanales OK.

---

### CK-20 -- FDS largo para todos en el mes
**Codigo:** `CHECK_ALL_LONG_WEEKENDS` | **Severidad:** ERROR | **Subcategoria:** Post-gen

Verificacion critica al finalizar la generacion mensual: TODOS los empleados deben tener su FDS largo asignado. Si alguno no lo tiene, marca en rojo.

---

### CK-21 -- Espejo FOM-AFOM consistente
**Codigo:** `CHECK_FOM_AFOM_MIRROR` | **Severidad:** ERROR | **Subcategoria:** Post-gen

Verifica que la logica espejo se mantiene: FOM en M implica AFOM en T; FOM libra implica AFOM trabaja; FOM en G implica AFOM libra.

---

### CK-22 -- Score minimo para publicar
**Codigo:** `CHECK_MIN_SCORE` | **Severidad:** ERROR | **Subcategoria:** Pre-publicacion

El cuadrante debe tener un score minimo (configurable, default 70) para ser publicable sin override. Si el score es inferior, el Manager debe confirmar explicitamente que quiere publicar con score bajo.

**Configuracion:**
- `minScore`: 70

---

### CK-23 -- Continuidad con periodo anterior
**Codigo:** `CHECK_CROSS_PERIOD` | **Severidad:** BLOCKER | **Subcategoria:** Pre-gen

Verifica que el dia 1 del nuevo periodo no genera turno pijama respecto al ultimo turno del periodo anterior. El motor lee el historial y lo verifica automaticamente.

---

### CK-24 -- Peticiones duras respetadas al 100%
**Codigo:** `CHECK_HARD_PETITIONS` | **Severidad:** BLOCKER | **Subcategoria:** Post-gen

Verifica que NINGUNA peticion Tipo A (vacaciones aprobadas, baja medica) ha sido violada. Si alguna fue violada, bloquea la publicacion.

---

### CK-25 -- Turnos ad-hoc validados (12h)
**Codigo:** `CHECK_AD_HOC_12H` | **Severidad:** ERROR | **Subcategoria:** Tiempo real

Cuando el Manager escribe un turno ad-hoc en una celda (ejemplo: "14x22"), verifica que no viola las 12h de descanso con el turno anterior ni con el siguiente.

---

### CK-26 -- Ratio vacaciones anual >=90% al 31/dic
**Codigo:** `CHECK_VACATION_ANNUAL_RATIO` | **Severidad:** WARNING | **Subcategoria:** Post-gen

Verificacion de proyeccion anual: cada empleado debe llegar al 31 de diciembre con al menos el 90% de sus vacaciones disfrutadas (tanto naturales como festivos). El motor proyecta el ritmo actual de consumo y alerta si algun empleado no va a cumplir el objetivo.

Esto es diferente de SM-09 (que alerta al 80% antes de octubre): este check es una verificacion continua del ritmo anual, no una alerta puntual.

**Configuracion:**
- `minRatio`: 0.9 (90%)
- `projectionMonth`: 12 (diciembre)

---

### CK-27 -- Continuidad rotacion nocturna cross-periodo
**Codigo:** `CHECK_NIGHT_ROTATION_CONTINUITY` | **Severidad:** ERROR | **Subcategoria:** Pre-gen

Antes de generar un nuevo cuadrante, el motor debe leer los cuadrantes anteriores para determinar donde quedo la rotacion de cobertura nocturna. Si FDA#3 fue el ultimo en cubrir las noches del Night Agent en el periodo anterior, el nuevo periodo debe empezar con FDA#4 (o el siguiente en antiguedad).

Esta verificacion garantiza la equidad a largo plazo: ningun FDA cubre mas noches que otro por un "reinicio" de la rotacion en cada generacion.

---

## 6. Features SMART+IA (SM-01 a SM-10)

Las features SMART+IA representan la inteligencia proactiva del sistema. No son reglas que se verifican, sino comportamientos inteligentes donde el sistema "piensa por delante" del usuario, detecta patrones y propone mejoras.

---

### SM-01 -- Auto-proponer turnos a favoritos
**Codigo:** `SMARTIA_AUTO_FAVORITES` | **Boost:** 3

Detecta turnos usados frecuentemente por el Manager y propone anadirlos a favoritos. Ejemplo: si el Manager usa el turno "14x22" en 3 o mas ocasiones sin guardarlo, el sistema propone: "Has usado 14x22 en 3 ocasiones. Quieres anadirlo a tus favoritos?"

**Configuracion:**
- `usageThreshold`: 3

---

### SM-02 -- Peticion recurrente como restriccion permanente
**Codigo:** `SMARTIA_RECURRING_PETITION` | **Boost:** 3

Detecta cuando un empleado pide lo mismo 3 o mas meses seguidos y propone al Manager convertirlo en restriccion permanente. Ejemplo: "El empleado X siempre pide los miercoles libres. Quieres convertirlo en restriccion permanente?"

**Configuracion:**
- `monthsThreshold`: 3

---

### SM-03 -- Config puntual a config global
**Codigo:** `SMARTIA_PUNCTUAL_TO_GLOBAL` | **Boost:** 2

Detecta cuando el Manager activa el mismo criterio puntualmente en 3 o mas generaciones seguidas y propone: "Has activado [criterio X] las ultimas 3 generaciones. Quieres dejarlo activado por defecto?"

**Configuracion:**
- `generationsThreshold`: 3

---

### SM-04 -- Conflicto inteligente de peticiones blandas
**Codigo:** `SMARTIA_SOFT_CONFLICT` | **Boost:** 3

Cuando dos peticiones blandas chocan, el sistema prioriza automaticamente al empleado con menor ratio de satisfaccion historica. Ejemplo: si empleado A tiene un 90% de peticiones satisfechas y empleado B tiene un 60%, el sistema prioriza a B.

---

### SM-05 -- Sugerencias de refuerzo por ocupacion
**Codigo:** `SMARTIA_REINFORCEMENT_SUGGEST` | **Boost:** 3

Cuando un dia necesita refuerzo pero no hay personal disponible, el sistema genera sugerencias concretas: "Dia 12: 102 llegadas. Opciones: mover el libre de [FDA X] a otro dia, solapar turno (entrada a las 12h en vez de 15h), cubrir con jefes, o contactar cobertura extra."

---

### SM-06 -- Score como accountability documental
**Codigo:** `SMARTIA_SCORE_ACCOUNTABILITY` | **Boost:** 3

Cada cuadrante publicado queda registrado con su score, la version elegida (de las 2-3 alternativas), quien la eligio y por que. Esto protege al FOM: puede justificar su decision con datos objetivos ante direccion o empleados.

---

### SM-07 -- Recordar preferencia de capas visuales
**Codigo:** `SMARTIA_VISUAL_PREFS` | **Boost:** 1

El sistema recuerda que capas de visualizacion tiene activas el MANAGER entre sesiones. No tiene que reactivar heatmaps, indicadores de equidad, etc. cada vez que abre la app.

---

### SM-08 -- Codigo ausencia auto-guardado
**Codigo:** `SMARTIA_ABSENCE_AUTO_SAVE` | **Boost:** 2

Cuando el MANAGER crea un codigo de ausencia personalizado varias veces (ejemplo: "PF" = Permiso Familiar), el sistema propone guardarlo permanentemente.

**Configuracion:**
- `usageThreshold`: 3

---

### SM-09 -- Alerta preventiva vacaciones 80%
**Codigo:** `SMARTIA_VACATION_80_ALERT` | **Boost:** 3

Avisa al MANAGER cuando un empleado ha consumido mas del 80% de sus vacaciones antes de octubre. Esto permite gestionar el saldo restante con tiempo y evitar que se acumule todo al final del ano.

**Configuracion:**
- `alertThreshold`: 0.8 (80%)
- `beforeMonth`: 10 (octubre)

---

### SM-10 -- Transicion 11x19 propuesta automatica
**Codigo:** `SMARTIA_TRANSITION_11X19` | **Boost:** 3

Cuando el sistema detecta una transicion que violaria las 12h (ejemplo: T a M al dia siguiente), propone automaticamente el turno 11x19 como solucion. El MANAGER confirma o rechaza la propuesta.

---

## 7. Reglas de Dominio Aprendidas del Cuadrante Real

Las siguientes reglas se extrajeron del analisis del cuadrante real de abril 2026, realizado por la manager del Hotel Atlantico. Representan el conocimiento operativo real que el motor debe replicar.

### 7.1 Sistema de Balance/Mochila Personal

Cada empleado acumula "dias debidos" (DB) en su balance personal. Las fuentes de acumulacion son:
- **Festivos trabajados** y no disfrutados
- **Semanas de 6 dias** trabajados con solo 1 dia de descanso (circunstancias excepcionales)
- **Horas extra** acumuladas (cada +8h = +1 DB)
- **Guardias realizadas** (solo FOM, generan DG)

El empleado realiza peticiones para solicitar cuando disfrutar estos dias. Solo el Manager puede validar o rechazar. El motor debe poder:
1. Mostrar el saldo actual del empleado.
2. Permitir al empleado solicitar el disfrute de sus dias.
3. Registrar cuando se disfrutan tras la validacion del Manager.

### 7.2 Rotacion de Cobertura Nocturna

La rotacion de cobertura de las noches del Night Agent sigue un orden **estricto de antiguedad** (round-robin):
1. FDA#1 (mas antiguo) cubre las 2 noches de la semana 1.
2. FDA#2 cubre las 2 noches de la semana 2.
3. FDA#3 cubre la semana 3.
4. Y asi sucesivamente.

**Regla critica:** El motor debe leer los cuadrantes ya generados para saber donde quedo la rotacion y continuarla. Si FDA#3 fue el ultimo en cubrir en el cuadrante anterior, el siguiente cuadrante debe empezar con FDA#4.

**Cobertura extendida:** Si el Night Agent se ausenta mas de 2 dias (vacaciones, permisos, etc.), se aplica el mismo criterio: FDA#1 cubre la primera semana completa de ausencia, FDA#2 la segunda, etc.

**Exclusion:** Los FDAs con `canCoverNights = false` se excluyen de la rotacion.

### 7.3 Vacaciones con Descansos

Criterio opcional por empleado:
- **"Salir a vacaciones con mis 2 dias de descanso":** Los descansos semanales se colocan justo ANTES del inicio de vacaciones. Ejemplo real: Triana descanso el 30-31 de marzo y empezo vacaciones el 1 de abril.
- **"Entrar de vacaciones con mis 2 dias de descanso":** Los descansos se colocan justo DESPUES de volver.

### 7.4 Festivos Nacionales y Regionales

El motor debe conocer:
1. **Festivos nacionales** de Espana (fijos cada ano).
2. **Festivos regionales/provinciales** extraidos del convenio colectivo subido en la seccion de criterios. En abril de 2026, por ejemplo, hay 2 festivos por convenio de Cadiz.

La manager marca **F** cuando entrega el festivo al empleado (lo marca como disfrutado).

### 7.5 Turnos Vinculados a Ocupacion

Los turnos 9x17 y 12x20 estan directamente vinculados a las llegadas y salidas del hotel:
- **9x17:** Mas check-outs por la manana.
- **12x20:** Mas check-ins por la tarde.

Estos turnos los usa principalmente el GEX pero tambien pueden ser usados por otros roles en circunstancias especificas. Siempre estan supeditados a la validacion del manager.

### 7.6 Guardia de Tarde (GT) Excepcional

El GT (Guardia de Tarde, 11:00-23:00) es un turno excepcional que solo se usa cuando:
- No existe ninguna posibilidad matematica de asignar un turno T (tarde) a ningun empleado.
- El FOM asume personalmente esta responsabilidad.
- En lugar de la guardia normal G (9-21), realiza una GT (11-23) para cubrir la deficiencia.

---

## 8. Roles y su Interaccion con los Criterios

### FOM (Front Office Manager)
- **Tipo motor:** FIJO_NO_ROTA
- **Turno:** M fijo L-V. Libra S+D siempre (salvo guardia).
- **Criterios que le aplican especialmente:** OB-10 (solo el hace guardias), OB-16 (espejo con AFOM), OP-20 (acumulador DG).
- **Guardias:** Max 2 FDS/mes. G (9-21) o GT (11-23) excepcional.

### AFOM (Assistant Front Office Manager)
- **Tipo motor:** COBERTURA
- **Turno:** Espejo del FOM (OB-16).
- **Criterios:** NUNCA hace guardias. Cubre cuando FOM ausente. Puede hacer noches cuando la logica de generacion de horarios lo requiera.

### Night Agent (Auditor de Noche)
- **Tipo motor:** FIJO_NO_ROTA
- **Turno:** N fijo permanente.
- **Criterios:** OP-16 (noches consecutivas) NO le aplica. Sus descansos los cubren FDAs por OB-17.

### GEX (Guest Experience Agent)
- **Tipo motor:** ROTA_PARCIAL
- **Turnos:** Solo 9x17 y 12x20 (OB-11). No entra en rotacion M/T/N.
- **Criterios:** OB-18 (turno por ocupacion). Tiene sus 2 D semanales y FDS largo mensual.

### Front Desk Agent (FDA / Recepcionista)
- **Tipo motor:** ROTA_COMPLETO
- **Turno:** Rotacion completa M/T/N ~5 dias/semana.
- **Criterios que le aplican especialmente:** OB-17 (cubre noches Night Agent), OB-03 (N seguido de libre), OP-01 (FDS largo), OP-03 (equidad noches).
- **canCoverNights:** Flag configurable. Si es false, se excluye de la rotacion nocturna.

---

> **Fin del documento.**
> Ultima actualizacion: 2026-04-05
> Este documento debe mantenerse sincronizado con `src/data/criteriaDefaults.ts` y `TurnoSmart_Criterios_SMART.xlsx`.
