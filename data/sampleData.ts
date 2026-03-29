// Sample seed data for demo mode when no files are uploaded
import type { HeadcountRow, WorkforceEventRow } from "@/types";

const MONTHS = [
  "2024-03", "2024-04", "2024-05", "2024-06", "2024-07", "2024-08",
  "2024-09", "2024-10", "2024-11", "2024-12",
  "2025-01", "2025-02", "2025-03", "2025-04", "2025-05",
];

const ORGS = ["Operations", "Engineering", "Sales", "Finance", "HR", "Legal"];
const DEPARTMENTS = {
  Operations: ["Field Ops", "Logistics", "Quality"],
  Engineering: ["Software", "Infrastructure", "Data"],
  Sales: ["Enterprise", "SMB", "Partnerships"],
  Finance: ["FP&A", "Accounting", "Treasury"],
  HR: ["Talent", "Benefits", "HRBP"],
  Legal: ["Corporate", "Compliance"],
};
const JOBS = [
  "Analyst", "Senior Analyst", "Manager", "Senior Manager", "Director",
  "VP", "Individual Contributor", "Coordinator", "Specialist",
];
const TERM_REASONS = [
  "Resignation - Personal",
  "Resignation - Career Growth",
  "Resignation - Compensation",
  "Involuntary - Performance",
  "Involuntary - Position Eliminated",
  "Transferred out",
  "Transferred in",
  "Retirement",
  "Contract End",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function generateSampleHeadcount(): HeadcountRow[] {
  const rand = seedRandom(42);
  const rows: HeadcountRow[] = [];
  const baseEmployees = 320;

  for (let m = 0; m < MONTHS.length; m++) {
    const month = MONTHS[m];
    const count = baseEmployees + Math.floor(rand() * 30) - 10 + m * 2;

    for (let i = 0; i < count; i++) {
      const org = ORGS[Math.floor(rand() * ORGS.length)];
      const deptList = DEPARTMENTS[org as keyof typeof DEPARTMENTS];
      const dept = deptList[Math.floor(rand() * deptList.length)];
      const hireYear = 2018 + Math.floor(rand() * 6);
      const hireMonth = 1 + Math.floor(rand() * 12);

      rows.push({
        employeeId: `EMP${String(1000 + i).padStart(5, "0")}`,
        snapshotMonth: month,
        firstName: `First${i}`,
        lastName: `Last${i}`,
        status: "Active",
        company: "AcmeCorp",
        companyCode: "ACM",
        organization: org,
        department: dept,
        businessLine: org,
        project: rand() > 0.63 ? `PRJ-${Math.floor(rand() * 20)}` : undefined,
        locationCode: `LOC${Math.floor(rand() * 5) + 1}`,
        jobCode: `J${100 + Math.floor(rand() * 20)}`,
        job: JOBS[Math.floor(rand() * JOBS.length)],
        flsaType: rand() > 0.3 ? "Exempt" : "Non-Exempt",
        ftOrPt: rand() > 0.1 ? "FT" : "PT",
        localUnion: rand() > 0.71 ? undefined : `Local ${100 + Math.floor(rand() * 5)}`,
        employeeType: rand() > 0.15 ? "Regular" : "Contract",
        supervisor: `EMP${String(1000 + Math.floor(rand() * 50)).padStart(5, "0")}`,
        dateOfLastHire: `${hireYear}-${String(hireMonth).padStart(2, "0")}-01`,
        dateOfOriginalHire: `${hireYear - Math.floor(rand() * 2)}-${String(hireMonth).padStart(2, "0")}-01`,
        dateOfSeniority: `${hireYear}-${String(hireMonth).padStart(2, "0")}-01`,
      });
    }
  }
  return rows;
}

export function generateSampleEvents(): WorkforceEventRow[] {
  const rand = seedRandom(99);
  const rows: WorkforceEventRow[] = [];

  for (let m = 0; m < MONTHS.length; m++) {
    const month = MONTHS[m];
    const hireCount = 8 + Math.floor(rand() * 12);
    const termCount = 5 + Math.floor(rand() * 10);
    const transferCount = m === 9 || m === 10 ? 20 + Math.floor(rand() * 15) : 3 + Math.floor(rand() * 6);

    for (let i = 0; i < hireCount; i++) {
      const org = ORGS[Math.floor(rand() * ORGS.length)];
      const deptList = DEPARTMENTS[org as keyof typeof DEPARTMENTS];
      rows.push({
        employeeId: `EMP${String(5000 + m * 30 + i).padStart(5, "0")}`,
        eventDate: `${month}-15`,
        eventMonth: month,
        eventType: "hire",
        reasonCode: "NEW",
        reason: "New Hire",
        company: "AcmeCorp",
        companyCode: "ACM",
        organization: org,
        department: deptList[Math.floor(rand() * deptList.length)],
        businessLine: org,
        jobCode: `J${100 + Math.floor(rand() * 20)}`,
        job: JOBS[Math.floor(rand() * JOBS.length)],
        employeeType: "Regular",
        annualSalary: 55000 + Math.floor(rand() * 60000),
      });
    }

    for (let i = 0; i < termCount; i++) {
      const org = ORGS[Math.floor(rand() * ORGS.length)];
      const deptList = DEPARTMENTS[org as keyof typeof DEPARTMENTS];
      const reason = TERM_REASONS.filter(
        (r) => !r.includes("Transfer")
      )[Math.floor(rand() * (TERM_REASONS.length - 2))];

      rows.push({
        employeeId: `EMP${String(1000 + m * 20 + i).padStart(5, "0")}`,
        eventDate: `${month}-20`,
        eventMonth: month,
        eventType: "termination",
        reason,
        reasonCode: reason.substring(0, 4).toUpperCase(),
        company: "AcmeCorp",
        companyCode: "ACM",
        organization: org,
        department: deptList[Math.floor(rand() * deptList.length)],
        businessLine: org,
        jobCode: `J${100 + Math.floor(rand() * 20)}`,
        job: JOBS[Math.floor(rand() * JOBS.length)],
        employeeType: "Regular",
        annualSalary: 50000 + Math.floor(rand() * 55000),
      });
    }

    // Transfers — December spike
    for (let i = 0; i < transferCount; i++) {
      const org = ORGS[Math.floor(rand() * ORGS.length)];
      const isIn = rand() > 0.5;
      rows.push({
        employeeId: `EMP${String(1000 + m * 20 + i).padStart(5, "0")}`,
        eventDate: `${month}-01`,
        eventMonth: month,
        eventType: isIn ? "transfer_in" : "transfer_out",
        reason: isIn ? "Transferred in" : "Transferred out",
        reasonCode: isIn ? "TRIN" : "TROUT",
        company: "AcmeCorp",
        companyCode: "ACM",
        organization: org,
        department: DEPARTMENTS[org as keyof typeof DEPARTMENTS][0],
        businessLine: org,
        jobCode: `J${100 + Math.floor(rand() * 20)}`,
        job: JOBS[Math.floor(rand() * JOBS.length)],
        employeeType: "Regular",
      });
    }
  }
  return rows;
}
