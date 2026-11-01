import { db } from '../db.js';
import { Project, ApiKey, ProjectCredentials, Environment } from '@praman-network/types';
import { generateApiKey, hashApiKey } from '@praman-network/crypto';
import { randomUUID, randomBytes } from 'node:crypto';

export class ProjectService {
  public static listProjects(orgId: string): Project[] {
    return Array.from(db.projects.values()).filter(p => p.orgId === orgId);
  }

  public static getProject(id: string): Project | null {
    const proj = db.projects.get(id);
    return proj || null;
  }

  public static getProjectByClientId(clientId: string): Project | null {
    const clean = (clientId || '').trim();
    if (!clean) return null;
    return (
      Array.from(db.projects.values()).find(
        p => p.clientId === clean || p.clientId.startsWith(clean) || clean.startsWith(p.clientId)
      ) || null
    );
  }

  public static createProject(data: {
    orgId: string;
    name: string;
    description?: string;
    websiteUrl?: string;
    environment?: Environment;
    callbackUrls?: string[];
  }): { project: Project; credentials: ProjectCredentials } {
    const projectId = `proj_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const env = data.environment || 'DEVELOPMENT';
    const clientId = `prm_client_${randomBytes(8).toString('hex')}`;
    const rawClientSecret = `prm_secret_${randomBytes(24).toString('hex')}`;
    const webhookSecret = `whsec_${randomBytes(20).toString('hex')}`;

    const project: Project & { clientSecretHash: string; callbackUrls: string[] } = {
      id: projectId,
      orgId: data.orgId,
      name: data.name,
      description: data.description,
      websiteUrl: data.websiteUrl,
      environment: env,
      clientId,
      clientSecretHash: hashApiKey(rawClientSecret),
      webhookSecret,
      callbackUrls: data.callbackUrls || ['http://localhost:3000/callback'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.projects.set(projectId, project);

    return {
      project,
      credentials: {
        projectId,
        clientId,
        clientSecret: rawClientSecret, // Shown ONLY once upon generation
        webhookSecret,
      },
    };
  }

  public static updateProject(
    id: string,
    updates: Partial<Pick<Project, 'name' | 'description' | 'websiteUrl' | 'webhookUrl'>> & { callbackUrls?: string[] }
  ): Project {
    const existing = db.projects.get(id);
    if (!existing) {
      throw new Error('Project not found');
    }

    const updated = {
      ...existing,
      ...updates,
      callbackUrls: updates.callbackUrls || existing.callbackUrls,
      updatedAt: new Date().toISOString(),
    };

    db.projects.set(id, updated);
    return updated;
  }

  public static generateApiKey(
    projectId: string,
    name: string = 'Default API Key',
    scopes: string[] = ['read', 'write']
  ): { apiKey: ApiKey; rawKey: string } {
    const proj = db.projects.get(projectId);
    if (!proj) {
      throw new Error('Project not found');
    }

    const generated = generateApiKey(proj.environment);
    const keyId = `key_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

    const apiKey: ApiKey & { keyHash: string } = {
      id: keyId,
      projectId,
      name,
      keyPrefix: generated.keyPrefix,
      keyHash: generated.keyHash,
      scopes,
      createdAt: new Date().toISOString(),
    };

    db.apiKeys.set(keyId, apiKey);

    return {
      apiKey: {
        id: apiKey.id,
        projectId: apiKey.projectId,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        scopes: apiKey.scopes,
        createdAt: apiKey.createdAt,
      },
      rawKey: generated.rawKey, // Returned once!
    };
  }

  public static listApiKeys(projectId: string): ApiKey[] {
    return Array.from(db.apiKeys.values())
      .filter(k => k.projectId === projectId)
      .map(k => ({
        id: k.id,
        projectId: k.projectId,
        name: k.name,
        keyPrefix: k.keyPrefix,
        scopes: k.scopes,
        lastUsedAt: k.lastUsedAt,
        expiresAt: k.expiresAt,
        createdAt: k.createdAt,
      }));
  }

  public static revokeApiKey(keyId: string): boolean {
    return db.apiKeys.delete(keyId);
  }

  public static validateApiKey(rawKey: string): ApiKey | null {
    const hash = hashApiKey(rawKey);
    const found = Array.from(db.apiKeys.values()).find(k => (k as any).keyHash === hash);
    if (!found) return null;
    return {
      id: found.id,
      projectId: found.projectId,
      name: found.name,
      keyPrefix: found.keyPrefix,
      scopes: found.scopes,
      createdAt: found.createdAt,
    };
  }
}

