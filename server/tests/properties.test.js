import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import User from '../models/User';

let ownerToken;
let buyerToken;

beforeAll(async () => {
  const owner = await User.create({
    name: 'Test Owner',
    email: 'testowner@estatehub.test',
    password: 'password123',
    role: 'owner',
    isEmailVerified: true,
  });
  const buyer = await User.create({
    name: 'Test Buyer 2',
    email: 'testbuyer2@estatehub.test',
    password: 'password123',
    role: 'buyer',
    isEmailVerified: true,
  });
  ownerToken = (await request(app).post('/api/auth/login').send({ email: owner.email, password: 'password123' })).body.token;
  buyerToken = (await request(app).post('/api/auth/login').send({ email: buyer.email, password: 'password123' })).body.token;
});

const validProperty = {
  title: 'Cozy 2BHK in Pune',
  description: 'A lovely apartment near the metro.',
  type: 'Apartment',
  purpose: 'sale',
  price: 5500000,
  area: 1100,
  bedrooms: 2,
  bathrooms: 2,
  address: '12 Lake View Street',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411001',
  lat: 18.5204,
  lng: 73.8567,
};

describe('Properties', () => {
  it('blocks buyers from creating listings', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send(validProperty);
    expect([400, 403]).toContain(res.status);
  });

  it('owner creates a listing (status pending)', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(validProperty);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.title).toBe('Cozy 2BHK in Pune');
  });

  it('rejects listing without required fields', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Incomplete' });
    expect(res.status).toBe(400);
  });

  it('lists public properties (empty until verified)', async () => {
    const res = await request(app).get('/api/properties');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('rejects $ operators in query params (sanitizer)', async () => {
    const res = await request(app).get('/api/properties?city[$ne]=x');
    expect(res.status).toBe(400);
  });

  it('normal city filter works', async () => {
    const res = await request(app).get('/api/properties?city=Pune');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

const bookFreshVisit = async () => {
  const myProps = await request(app)
    .get('/api/properties/my')
    .set('Authorization', `Bearer ${ownerToken}`);
  const propertyId = myProps.body.data[0]._id;
  const book = await request(app)
    .post(`/api/visits/property/${propertyId}`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ date: new Date(Date.now() + 86400000).toISOString(), time: '11:00', message: 'hello' });
  return { propertyId, visit: book.body.data };
};

describe('Visits + notifications flow', () => {
  it('buyer books a visit, owner gets a notification', async () => {
    const { visit } = await bookFreshVisit();
    expect(visit.status).toBe('pending');

    const notifs = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(notifs.status).toBe(200);
    expect(notifs.body.data.some((n) => n.type === 'visit')).toBe(true);
    const unread = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(unread.body.count).toBeGreaterThan(0);
  });

  it('owner accepts → buyer notified; mark-all-read works', async () => {
    const { visit } = await bookFreshVisit();

    const accept = await request(app)
      .put(`/api/visits/${visit._id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'accepted' });
    expect(accept.status).toBe(200);
    expect(accept.body.data.status).toBe('accepted');

    const buyerNotifs = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(buyerNotifs.body.data.some((n) => n.message.includes('accepted'))).toBe(true);

    const readAll = await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(readAll.status).toBe(200);
    const unread = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(unread.body.count).toBe(0);
  });

  it('owner reschedules with note → buyer notified', async () => {
    const { visit } = await bookFreshVisit();

    const resched = await request(app)
      .put(`/api/visits/${visit._id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'rescheduled', date: new Date(Date.now() + 2 * 86400000).toISOString(), time: '15:00', rescheduleNote: 'Only evening slots available' });
    expect(resched.status).toBe(200);
    expect(resched.body.data.status).toBe('rescheduled');
    expect(resched.body.data.rescheduleNote).toContain('evening');

    const buyerNotifs = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(buyerNotifs.body.data.some((n) => n.message.includes('rescheduled'))).toBe(true);
  });
});

describe('Security', () => {
  it('rejects malicious JSON payloads (no $ operators in body)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: { $gt: '' }, email: 'x@y.test', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('sets security headers via helmet', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});
