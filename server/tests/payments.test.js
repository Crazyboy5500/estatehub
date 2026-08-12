import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import User from '../models/User';
import Payment from '../models/Payment';

let ownerToken;
let buyerToken;
let ownerId;
let buyerId;
let propertyId;

beforeAll(async () => {
  const owner = await User.create({
    name: 'Refund Test Owner',
    email: 'refundowner@estatehub.test',
    password: 'password123',
    role: 'owner',
    isEmailVerified: true,
  });
  const buyer = await User.create({
    name: 'Refund Test Buyer',
    email: 'refundbuyer@estatehub.test',
    password: 'password123',
    role: 'buyer',
    isEmailVerified: true,
  });
  ownerId = owner._id;
  buyerId = buyer._id;
  ownerToken = (await request(app).post('/api/auth/login').send({ email: owner.email, password: 'password123' })).body.token;
  buyerToken = (await request(app).post('/api/auth/login').send({ email: buyer.email, password: 'password123' })).body.token;

  const created = await request(app)
    .post('/api/properties')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      title: 'Refund Test Flat',
      description: 'A flat used for refund tests.',
      type: 'Apartment',
      purpose: 'sale',
      price: 4500000,
      area: 900,
      bedrooms: 2,
      bathrooms: 1,
      address: '1 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      lat: 19.076,
      lng: 72.8777,
    });
  propertyId = created.body.data._id;
});

const makePayment = (status, type = 'token') =>
  Payment.create({
    buyerId,
    ownerId,
    propertyId,
    type,
    amount: 50000,
    currency: 'INR',
    status,
    razorpayOrderId: 'order_test_1',
    razorpayPaymentId: 'pay_test_1',
  });

describe('Payment refunds', () => {
  it('blocks buyers from refunding', async () => {
    const payment = await makePayment('paid');
    const res = await request(app)
      .post(`/api/payments/${payment._id}/refund`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(res.status).toBe(403);
  });

  it('rejects refunds for unpaid token payments', async () => {
    const payment = await makePayment('created');
    const res = await request(app)
      .post(`/api/payments/${payment._id}/refund`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(400);
  });

  it('rejects refunds for full payments', async () => {
    const payment = await makePayment('paid', 'full');
    const res = await request(app)
      .post(`/api/payments/${payment._id}/refund`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(400);
  });
});
