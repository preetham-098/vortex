import { getFirebaseAdmin } from '../firebase/admin';
import { Employee, Project, Assignment, TrainingCourse, Recommendation, User } from '@/types';

// In-Memory store for development / local demo fallback
class InMemoryStore {
  users: Map<string, User> = new Map();
  employees: Map<string, Employee> = new Map();
  projects: Map<string, Project> = new Map();
  assignments: Map<string, Assignment> = new Map();
  courses: Map<string, TrainingCourse> = new Map();
  recommendations: Map<string, Recommendation> = new Map();
}

// Global singleton across hot reloads in dev
const globalStore = (global as unknown as { __workforce_store__?: InMemoryStore });
if (!globalStore.__workforce_store__) {
  globalStore.__workforce_store__ = new InMemoryStore();
}
const mockStore = globalStore.__workforce_store__;

export const dbService = {
  // --- USERS ---
  async getUser(uid: string): Promise<User | null> {
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      const doc = await adminDb.collection('users').doc(uid).get();
      return doc.exists ? (doc.data() as User) : null;
    }
    return mockStore.users.get(uid) || null;
  },

  async saveUser(user: User): Promise<void> {
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      await adminDb.collection('users').doc(user.uid).set(user, { merge: true });
      return;
    }
    mockStore.users.set(user.uid, user);
  },

  // --- EMPLOYEES ---
  async getEmployees(orgId: string): Promise<Employee[]> {
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      const snapshot = await adminDb.collection('employees').where('organizationId', '==', orgId).get();
      return snapshot.docs.map(doc => doc.data() as Employee);
    }
    return Array.from(mockStore.employees.values()).filter(e => e.organizationId === orgId);
  },

  async getEmployee(orgId: string, employeeId: string): Promise<Employee | null> {
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      const doc = await adminDb.collection('employees').doc(employeeId).get();
      if (!doc.exists) return null;
      const data = doc.data() as Employee;
      return data.organizationId === orgId ? data : null;
    }
    const emp = mockStore.employees.get(employeeId);
    return emp && emp.organizationId === orgId ? emp : null;
  },

  async saveEmployee(orgId: string, employee: Employee): Promise<Employee> {
    const enriched = {
      ...employee,
      organizationId: orgId,
      updatedAt: new Date().toISOString(),
      createdAt: employee.createdAt || new Date().toISOString(),
    };
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      await adminDb.collection('employees').doc(employee.employeeId).set(enriched, { merge: true });
      return enriched;
    }
    mockStore.employees.set(employee.employeeId, enriched);
    return enriched;
  },

  async deleteEmployee(orgId: string, employeeId: string): Promise<boolean> {
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      const doc = await adminDb.collection('employees').doc(employeeId).get();
      if (!doc.exists || (doc.data() as Employee).organizationId !== orgId) return false;
      await adminDb.collection('employees').doc(employeeId).delete();
      return true;
    }
    const emp = mockStore.employees.get(employeeId);
    if (emp && emp.organizationId === orgId) {
      mockStore.employees.delete(employeeId);
      return true;
    }
    return false;
  },

  // --- PROJECTS ---
  async getProjects(orgId: string): Promise<Project[]> {
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      const snapshot = await adminDb.collection('projects').where('organizationId', '==', orgId).get();
      return snapshot.docs.map(doc => doc.data() as Project);
    }
    return Array.from(mockStore.projects.values()).filter(p => p.organizationId === orgId);
  },

  async getProject(orgId: string, projectId: string): Promise<Project | null> {
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      const doc = await adminDb.collection('projects').doc(projectId).get();
      if (!doc.exists) return null;
      const data = doc.data() as Project;
      return data.organizationId === orgId ? data : null;
    }
    const proj = mockStore.projects.get(projectId);
    return proj && proj.organizationId === orgId ? proj : null;
  },

  async saveProject(orgId: string, project: Project): Promise<Project> {
    const enriched = {
      ...project,
      organizationId: orgId,
      updatedAt: new Date().toISOString(),
      createdAt: project.createdAt || new Date().toISOString(),
    };
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      await adminDb.collection('projects').doc(project.projectId).set(enriched, { merge: true });
      return enriched;
    }
    mockStore.projects.set(project.projectId, enriched);
    return enriched;
  },

  async deleteProject(orgId: string, projectId: string): Promise<boolean> {
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      const doc = await adminDb.collection('projects').doc(projectId).get();
      if (!doc.exists || (doc.data() as Project).organizationId !== orgId) return false;
      await adminDb.collection('projects').doc(projectId).delete();
      return true;
    }
    const proj = mockStore.projects.get(projectId);
    if (proj && proj.organizationId === orgId) {
      mockStore.projects.delete(projectId);
      return true;
    }
    return false;
  },

  // --- ASSIGNMENTS ---
  async getAssignments(orgId: string, filter?: { projectId?: string; employeeId?: string; status?: string }): Promise<Assignment[]> {
    let list: Assignment[] = [];
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      let query = adminDb.collection('assignments').where('organizationId', '==', orgId);
      if (filter?.projectId) query = query.where('projectId', '==', filter.projectId);
      if (filter?.employeeId) query = query.where('employeeId', '==', filter.employeeId);
      if (filter?.status) query = query.where('status', '==', filter.status);
      const snapshot = await query.get();
      list = snapshot.docs.map(doc => doc.data() as Assignment);
    } else {
      list = Array.from(mockStore.assignments.values()).filter(a => a.organizationId === orgId);
      if (filter?.projectId) list = list.filter(a => a.projectId === filter.projectId);
      if (filter?.employeeId) list = list.filter(a => a.employeeId === filter.employeeId);
      if (filter?.status) list = list.filter(a => a.status === filter.status);
    }
    return list;
  },

  async saveAssignment(orgId: string, assignment: Assignment): Promise<Assignment> {
    const enriched = {
      ...assignment,
      organizationId: orgId,
      updatedAt: new Date().toISOString(),
      createdAt: assignment.createdAt || new Date().toISOString(),
    };
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      await adminDb.collection('assignments').doc(assignment.assignmentId).set(enriched, { merge: true });
      return enriched;
    }
    mockStore.assignments.set(assignment.assignmentId, enriched);
    return enriched;
  },

  async deleteAssignment(orgId: string, assignmentId: string): Promise<boolean> {
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      const doc = await adminDb.collection('assignments').doc(assignmentId).get();
      if (!doc.exists || (doc.data() as Assignment).organizationId !== orgId) return false;
      await adminDb.collection('assignments').doc(assignmentId).delete();
      return true;
    }
    const a = mockStore.assignments.get(assignmentId);
    if (a && a.organizationId === orgId) {
      mockStore.assignments.delete(assignmentId);
      return true;
    }
    return false;
  },

  // --- TRAINING COURSES ---
  async getCourses(orgId: string, skill?: string): Promise<TrainingCourse[]> {
    const { adminDb } = getFirebaseAdmin();
    let list: TrainingCourse[] = [];
    if (adminDb) {
      const snapshot = await adminDb.collection('trainingCourses').where('organizationId', '==', orgId).get();
      list = snapshot.docs.map(doc => doc.data() as TrainingCourse);
    } else {
      list = Array.from(mockStore.courses.values()).filter(c => c.organizationId === orgId);
    }
    if (skill) {
      const lower = skill.toLowerCase();
      list = list.filter(c => c.skill.toLowerCase() === lower);
    }
    return list;
  },

  async saveCourse(orgId: string, course: TrainingCourse): Promise<TrainingCourse> {
    const enriched = { ...course, organizationId: orgId };
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      await adminDb.collection('trainingCourses').doc(course.courseId).set(enriched, { merge: true });
      return enriched;
    }
    mockStore.courses.set(course.courseId, enriched);
    return enriched;
  },

  // --- RECOMMENDATIONS ---
  async getRecommendations(orgId: string, projectId: string): Promise<Recommendation[]> {
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      const snapshot = await adminDb.collection('recommendations')
        .where('organizationId', '==', orgId)
        .where('projectId', '==', projectId)
        .get();
      return snapshot.docs.map(doc => doc.data() as Recommendation);
    }
    return Array.from(mockStore.recommendations.values()).filter(r => r.organizationId === orgId && r.projectId === projectId);
  },

  async saveRecommendation(orgId: string, rec: Recommendation): Promise<Recommendation> {
    const enriched = { ...rec, organizationId: orgId, createdAt: rec.createdAt || new Date().toISOString() };
    const { adminDb } = getFirebaseAdmin();
    if (adminDb) {
      await adminDb.collection('recommendations').doc(rec.recommendationId).set(enriched, { merge: true });
      return enriched;
    }
    mockStore.recommendations.set(rec.recommendationId, enriched);
    return enriched;
  },

  // Clear / Reset store for testing
  resetMockStore() {
    mockStore.users.clear();
    mockStore.employees.clear();
    mockStore.projects.clear();
    mockStore.assignments.clear();
    mockStore.courses.clear();
    mockStore.recommendations.clear();
  }
};
