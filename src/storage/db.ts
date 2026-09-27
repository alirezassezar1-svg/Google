import { Project, VersionSnapshot } from '../types';

const DB_NAME = 'nononick_editor_db';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';
const VERSIONS_STORE = 'versions';
const SETTINGS_STORE = 'settings';

// In-memory fallback cache for restricted cookie / iframe storage modes
const memoryStorage: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return memoryStorage[key] || null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    memoryStorage[key] = value;
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    delete memoryStorage[key];
  }
}

class DBManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        return reject(new Error('IndexedDB not supported in this environment'));
      }

      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
            db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(VERSIONS_STORE)) {
            const vStore = db.createObjectStore(VERSIONS_STORE, { keyPath: 'id' });
            vStore.createIndex('projectId', 'projectId', { unique: false });
          }
          if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });

    return this.dbPromise;
  }

  // --- Project CRUD ---
  async getAllProjects(): Promise<Project[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(PROJECTS_STORE, 'readonly');
        const store = tx.objectStore(PROJECTS_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback to safe storage / memory
      const local = safeGetItem('nononick_projects');
      return local ? JSON.parse(local) : [];
    }
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(PROJECTS_STORE, 'readonly');
        const store = tx.objectStore(PROJECTS_STORE);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const projects = await this.getAllProjects();
      return projects.find((p) => p.id === id) || null;
    }
  }

  async saveProject(project: Project): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(PROJECTS_STORE, 'readwrite');
        const store = tx.objectStore(PROJECTS_STORE);
        const req = store.put(project);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback
      const projects = await this.getAllProjects();
      const idx = projects.findIndex((p) => p.id === project.id);
      if (idx >= 0) projects[idx] = project;
      else projects.push(project);
      safeSetItem('nononick_projects', JSON.stringify(projects));
    }

    // Background push to persistent server database
    try {
      fetch('/api/db/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      }).catch((e) => console.warn('Could not sync project with server DB:', e));
    } catch {}
  }

  async deleteProject(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(PROJECTS_STORE, 'readwrite');
        const store = tx.objectStore(PROJECTS_STORE);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const projects = (await this.getAllProjects()).filter((p) => p.id !== id);
      safeSetItem('nononick_projects', JSON.stringify(projects));
    }

    // Delete from server DB
    try {
      fetch(`/api/db/projects/${id}`, { method: 'DELETE' }).catch((e) =>
        console.warn('Could not delete project from server DB:', e)
      );
    } catch {}
  }

  // --- Two-Way Server Sync ---
  async syncWithServer(): Promise<{ synced: boolean; projects: Project[]; count: number }> {
    try {
      const localProjects = await this.getAllProjects();
      const response = await fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientProjects: localProjects }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed with HTTP ${response.status}`);
      }

      const data = await response.json();
      const serverProjects: Project[] = data.projects || [];

      // Update local storage with merged server projects
      const db = await this.getDB().catch(() => null);
      if (db) {
        const tx = db.transaction(PROJECTS_STORE, 'readwrite');
        const store = tx.objectStore(PROJECTS_STORE);
        for (const sp of serverProjects) {
          store.put(sp);
        }
      } else {
        safeSetItem('nononick_projects', JSON.stringify(serverProjects));
      }

      return {
        synced: true,
        projects: serverProjects,
        count: serverProjects.length,
      };
    } catch (err: any) {
      console.warn('Server sync error:', err);
      const fallback = await this.getAllProjects();
      return { synced: false, projects: fallback, count: fallback.length };
    }
  }

  async getServerDbStats(): Promise<any> {
    try {
      const res = await fetch('/api/db/stats');
      if (res.ok) return await res.json();
    } catch {}
    return { status: 'offline', projectsCount: 0 };
  }

  // --- Version Snapshots ---
  async getVersions(projectId: string): Promise<VersionSnapshot[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(VERSIONS_STORE, 'readonly');
        const store = tx.objectStore(VERSIONS_STORE);
        const index = store.index('projectId');
        const req = index.getAll(projectId);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const raw = safeGetItem(`nononick_versions_${projectId}`);
      return raw ? JSON.parse(raw) : [];
    }
  }

  async saveVersion(version: VersionSnapshot): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(VERSIONS_STORE, 'readwrite');
        const store = tx.objectStore(VERSIONS_STORE);
        const req = store.put(version);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = await this.getVersions(version.projectId);
      list.unshift(version);
      safeSetItem(`nononick_versions_${version.projectId}`, JSON.stringify(list.slice(0, 50)));
    }
  }

  // --- Key-Value Settings ---
  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(SETTINGS_STORE, 'readonly');
        const store = tx.objectStore(SETTINGS_STORE);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.value : defaultValue);
        req.onerror = () => resolve(defaultValue);
      });
    } catch {
      const val = safeGetItem(`nononick_setting_${key}`);
      return val ? JSON.parse(val) : defaultValue;
    }
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(SETTINGS_STORE, 'readwrite');
        const store = tx.objectStore(SETTINGS_STORE);
        const req = store.put({ key, value });
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {
      safeSetItem(`nononick_setting_${key}`, JSON.stringify(value));
    }
  }
}

export const dbManager = new DBManager();
