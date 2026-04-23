/**
 * Unit tests for src/models/User.js
 *
 * Uses mongodb-memory-server for an in-process MongoDB instance.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;
const User = (await import('../../../src/models/User.js')).default;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
describe('User.create', () => {
  it('creates a user with hashed password', async () => {
    const user = await User.create({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
    });

    expect(user._id).toBeDefined();
    expect(user.name).toBe('Alice');
    expect(user.email).toBe('alice@example.com');
    // Password must be hashed, not stored as plain text
    expect(user.password).not.toBe('secret123');
    expect(user.password.length).toBeGreaterThan(20);
  });

  it('lowercases the email on save', async () => {
    const user = await User.create({
      name: 'Bob',
      email: 'BOB@EXAMPLE.COM',
      password: 'password123',
    });

    expect(user.email).toBe('bob@example.com');
  });

  it('assigns default preferences (notifications=true, language=en, theme=light)', async () => {
    const user = await User.create({
      name: 'Carol',
      email: 'carol@example.com',
      password: 'password123',
    });

    expect(user.preferences).toBeInstanceOf(Object);
    expect(user.preferences.notifications).toBe(true);
    expect(user.preferences.language).toBe('en');
    expect(user.preferences.theme).toBe('light');
  });

  it('rejects missing email', async () => {
    await expect(
      User.create({ name: 'NoEmail', password: 'password123' })
    ).rejects.toThrow();
  });

  it('rejects missing name', async () => {
    await expect(
      User.create({ email: 'noname@example.com', password: 'password123' })
    ).rejects.toThrow();
  });

  it('rejects missing password', async () => {
    await expect(
      User.create({ name: 'NoPass', email: 'nopass@example.com' })
    ).rejects.toThrow();
  });

  it('rejects duplicate email', async () => {
    await User.create({
      name: 'First',
      email: 'dup@example.com',
      password: 'password123',
    });

    await expect(
      User.create({ name: 'Second', email: 'dup@example.com', password: 'password456' })
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// comparePassword
// ---------------------------------------------------------------------------
describe('user.comparePassword', () => {
  it('returns true for the correct password', async () => {
    const user = await User.create({
      name: 'Dave',
      email: 'dave@example.com',
      password: 'MySecretPass!',
    });

    const result = await user.comparePassword('MySecretPass!');
    expect(result).toBe(true);
  });

  it('returns false for a wrong password', async () => {
    const user = await User.create({
      name: 'Eve',
      email: 'eve@example.com',
      password: 'CorrectHorse',
    });

    const result = await user.comparePassword('WrongPassword');
    expect(result).toBe(false);
  });
});
