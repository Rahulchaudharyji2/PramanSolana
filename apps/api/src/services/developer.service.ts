import { db } from '../db.js';
import { Developer, Organization } from '@praman-network/types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'praman_developer_session_jwt_secret_2026';

export class DeveloperService {
  public static async register(data: {
    email: string;
    password: string;
    name: string;
    organizationName?: string;
  }): Promise<{ developer: Developer; organization: Organization; token: string }> {
    const existing = Array.from(db.developers.values()).find(d => d.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error('DEVELOPER_ALREADY_EXISTS: An account with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const devId = `dev_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const orgId = `org_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const orgName = data.organizationName || `${data.name}'s Organization`;
    const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const developer: Developer = {
      id: devId,
      email: data.email,
      name: data.name,
      createdAt: new Date().toISOString(),
    };

    const organization: Organization = {
      id: orgId,
      name: orgName,
      slug: orgSlug,
      tier: 'FREE',
      createdAt: new Date().toISOString(),
    };

    db.developers.set(devId, { ...developer, passwordHash });
    db.organizations.set(orgId, organization);

    // Create default project
    const projId = `proj_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const clientId = `prm_client_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    db.projects.set(projId, {
      id: projId,
      orgId,
      name: 'Default Project',
      description: 'Default development environment',
      environment: 'DEVELOPMENT',
      clientId,
      clientSecretHash: 'sec_hash_default',
      callbackUrls: ['http://localhost:3000/callback'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const token = jwt.sign(
      { sub: developer.id, email: developer.email, orgId: organization.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { developer, organization, token };
  }

  public static async login(data: {
    email: string;
    password: string;
  }): Promise<{ developer: Developer; organization: Organization; token: string }> {
    const dev = Array.from(db.developers.values()).find(d => d.email.toLowerCase() === data.email.toLowerCase());
    if (!dev) {
      throw new Error('INVALID_CREDENTIALS: Email or password is incorrect.');
    }

    // Allow demo mock password or real bcrypt verify
    const isValid = dev.passwordHash.startsWith('$2a$10$demo') || (await bcrypt.compare(data.password, dev.passwordHash));
    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS: Email or password is incorrect.');
    }

    // Find organization
    const org = Array.from(db.organizations.values())[0] || {
      id: 'org_default',
      name: 'Default Org',
      slug: 'default-org',
      tier: 'FREE',
      createdAt: new Date().toISOString(),
    };

    const developer: Developer = {
      id: dev.id,
      email: dev.email,
      name: dev.name,
      avatarUrl: dev.avatarUrl,
      createdAt: dev.createdAt,
    };

    const token = jwt.sign(
      { sub: developer.id, email: developer.email, orgId: org.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { developer, organization: org, token };
  }

  public static verifyToken(token: string): { sub: string; email: string; orgId: string } {
    return jwt.verify(token, JWT_SECRET) as any;
  }
}

