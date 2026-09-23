import { Project, VersionSnapshot } from '../types';

const DB_NAME = 'nononick_editor_db';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';
const VERSIONS_STORE = 'versions';
const SETTINGS_STORE = 'settings';

class DBManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        return reject(new Error('IndexedDB not supported in this environment'));
      }

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
      // Fallback to localStorage
      const local = localStorage.getItem('nononick_projects');
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
      localStorage.setItem('nononick_projects', JSON.stringify(projects));
    }
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
      localStorage.setItem('nononick_projects', JSON.stringify(projects));
    }
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
        req.onsuccess = () => {
          const list: VersionSnapshot[] = req.result || [];
          resolve(list.sort((a, b) => b.timestamp - a.timestamp));
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      const local = localStorage.getItem(`nononick_versions_${projectId}`);
      return local ? JSON.parse(local) : [];
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
      localStorage.setItem(`nononick_versions_${version.projectId}`, JSON.stringify(list.slice(0, 30)));
    }
  }

  // --- Settings ---
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
      const val = localStorage.getItem(`nononick_setting_${key}`);
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
      localStorage.setItem(`nononick_setting_${key}`, JSON.stringify(value));
    }
  }
}

export const dbManager = new DBManager();
