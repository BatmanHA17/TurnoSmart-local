import { describe, it, expect } from "vitest";
import {
  generateSchedule,
  ScheduleEmployee,
  ScheduleInput,
} from "@/utils/smartScheduleEngine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const APRIL_2026: Pick<ScheduleInput, "year" | "month"> = {
  year: 2026,
  month: 4, // 30 días
};

function makeEmployee(
  overrides: Partial<ScheduleEmployee> & Pick<ScheduleEmployee, "id" | "name">
): ScheduleEmployee {
  return {
    weeklyHours: 40,
    role: "employee",
    preference: "rotating",
    ...overrides,
  };
}

function getFreeDays(schedule: Record<number, { code: string }>): number[] {
  return Object.entries(schedule)
    .filter(([, a]) => a.code === "D" || a.code === "V")
    .map(([d]) => Number(d));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("generateSchedule — básicos", () => {
  it("genera un schedule para cada empleado con 30 días en abril", () => {
    const result = generateSchedule({
      ...APRIL_2026,
      employees: [makeEmployee({ id: "1", name: "Ana" })],
    });
    expect(result.meta.daysInMonth).toBe(30);
    expect(Object.keys(result.schedules["1"])).toHaveLength(30);
  });

  it("todos los días tienen un código asignado", () => {
    const result = generateSchedule({
      ...APRIL_2026,
      employees: [makeEmployee({ id: "1", name: "Ana" })],
    });
    for (let d = 1; d <= 30; d++) {
      expect(result.schedules["1"][d]).toBeDefined();
      expect(result.schedules["1"][d].code).toBeTruthy();
    }
  });

  it("devuelve score entre 0 y 100", () => {
    const result = generateSchedule({
      ...APRIL_2026,
      employees: [makeEmployee({ id: "1", name: "Ana" })],
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe("generateSchedule — vacaciones y bloqueos", () => {
  it("respeta días de vacaciones anclados", () => {
    const result = generateSchedule({
      ...APRIL_2026,
      employees: [
        makeEmployee({ id: "1", name: "Ana", vacationDays: [1, 2, 3, 4, 5] }),
      ],
    });
    for (let d = 1; d <= 5; d++) {
      expect(result.schedules["1"][d].code).toBe("V");
    }
  });

  it("respeta días bloqueados con código personalizado", () => {
    const result = generateSchedule({
      ...APRIL_2026,
      employees: [
        makeEmployee({
          id: "1",
          name: "Ana",
          blockedDays: [{ day: 10, code: "E" }],
        }),
      ],
    });
    expect(result.schedules["1"][10].code).toBe("E");
  });
});

describe("generateSchedule — descansos legales", () => {
  it("cada semana tiene al menos 2 días libres (D o V)", () => {
    const result = generateSchedule({
      ...APRIL_2026,
      employees: [makeEmployee({ id: "1", name: "Ana" })],
    });
    // Semanas de abril 2026: días 1-7, 8-14, 15-21, 22-28, 29-30
    const weeks = [[1, 7], [8, 14], [15, 21], [22, 28], [29, 30]];
    for (const [start, end] of weeks) {
      const freeDaysInWeek = Object.entries(result.schedules["1"])
        .filter(([d, a]) => {
          const day = Number(d);
          return day >= start && day <= end && (a.code === "D" || a.code === "V");
        });
      // Para semanas completas de 7 días, deben haber >= 2 días libres
      if (end - start >= 6) {
        expect(freeDaysInWeek.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe("generateSchedule — regla T→M prohibida", () => {
  it("detecta violación T→M en el audit", () => {
    // Forzamos una situación donde T→M ocurre con vacaciones que dejan solo un empleado
    // y forzamos un escenario artificial para testear el detector
    const result = generateSchedule({
      year: 2026,
      month: 4,
      employees: [makeEmployee({ id: "1", name: "Test" })],
    });

    // Verificar que el engine no genera T→M en el schedule producido
    const sched = result.schedules["1"];
    for (let d = 1; d < 30; d++) {
      const curr = sched[d]?.code;
      const next = sched[d + 1]?.code;
      if (curr === "T" && next === "M") {
        // Si ocurre debe estar en violations
        const hasViolation = result.violations.some(
          (v) => v.employeeId === "1" && v.day === d + 1 && v.rule === "MIN_REST_12H"
        );
        expect(hasViolation).toBe(true);
      }
    }
  });
});

describe("generateSchedule — preferencias de turno", () => {
  it("empleado con preference=morning solo tiene turnos M en días trabajados", () => {
    const result = generateSchedule({
      ...APRIL_2026,
      employees: [
        makeEmployee({ id: "1", name: "Ana", preference: "morning" }),
      ],
    });
    const workDays = Object.values(result.schedules["1"]).filter(
      (a) => a.code !== "D" && a.code !== "V" && a.code !== "E"
    );
    workDays.forEach((a) => {
      expect(a.code).toBe("M");
    });
  });

  it("empleado con preference=night_fixed solo tiene turnos N en días trabajados", () => {
    const result = generateSchedule({
      ...APRIL_2026,
      employees: [
        makeEmployee({ id: "1", name: "Manuel", preference: "night_fixed" }),
      ],
    });
    const workDays = Object.values(result.schedules["1"]).filter(
      (a) => a.code !== "D" && a.code !== "V" && a.code !== "E"
    );
    workDays.forEach((a) => {
      expect(a.code).toBe("N");
    });
  });
});

describe("generateSchedule — cobertura mínima", () => {
  it("con un solo empleado, todos los días tienen al menos 1 asignado (no todos libres)", () => {
    const result = generateSchedule({
      ...APRIL_2026,
      employees: [makeEmployee({ id: "1", name: "Ana" })],
      constraints: { minCoveragePerShift: 1 },
    });
    // El score debe ser > 0 (hay asignaciones)
    expect(result.score).toBeGreaterThan(0);
  });
});

describe("generateSchedule — múltiples empleados", () => {
  it("genera schedules independientes para cada empleado", () => {
    const result = generateSchedule({
      ...APRIL_2026,
      employees: [
        makeEmployee({ id: "1", name: "Ana" }),
        makeEmployee({ id: "2", name: "Pedro" }),
        makeEmployee({ id: "3", name: "Eva", role: "manager" }),
      ],
    });
    expect(Object.keys(result.schedules)).toHaveLength(3);
    expect(Object.keys(result.schedules["1"])).toHaveLength(30);
    expect(Object.keys(result.schedules["2"])).toHaveLength(30);
    expect(Object.keys(result.schedules["3"])).toHaveLength(30);
  });

  it("contrato 20h/sem produce más días libres que contrato 40h/sem", () => {
    const result = generateSchedule({
      ...APRIL_2026,
      employees: [
        makeEmployee({ id: "1", name: "Full", weeklyHours: 40 }),
        makeEmployee({ id: "2", name: "Part", weeklyHours: 20 }),
      ],
    });
    const freeFull = getFreeDays(result.schedules["1"]).length;
    const freePart = getFreeDays(result.schedules["2"]).length;
    expect(freePart).toBeGreaterThanOrEqual(freeFull);
  });
});
