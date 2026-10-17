import test from 'node:test';
import assert from 'node:assert/strict';
import { payForCart } from '../lib/payment.mjs';
globalThis.localStorage = { getItem: () => null, removeItem() {} };
test('payment is confirmed only after the server verifies the callback', async () => {
  let options;
  const requests = [];
  const saved = [];
  globalThis.window = {
    Razorpay: class {
      constructor(value) {
        options = value;
      }
      on() {}
      open() {
        queueMicrotask(() =>
          options.handler({
            razorpay_order_id: 'order_test',
            razorpay_payment_id: 'pay_test',
            razorpay_signature: 'signature',
          }),
        );
      }
    },
  };
  globalThis.sessionStorage = { setItem: (...value) => saved.push(value) };
  globalThis.fetch = async (url, init) => {
    requests.push({ url, body: JSON.parse(init.body) });
    return new Response(
      JSON.stringify(
        url.endsWith('/checkout/')
          ? {
              order_id: 8,
              payment: {
                key_id: 'test_key',
                razorpay_order_id: 'order_test',
                amount: 25000,
                currency: 'INR',
              },
            }
          : { status: 'paid' },
      ),
    );
  };
  assert.equal(
    await payForCart(
      { name: 'Test', phone: '1234567890', address_id: 4 },
      'test@example.test',
    ),
    8,
  );
  assert.deepEqual(requests[0].body, {
    name: 'Test',
    phone: '1234567890',
    address_id: 4,
  });
  assert.equal(requests[1].body.razorpay_signature, 'signature');
  assert.equal(requests[1].body.order_id, 8);
  assert.deepEqual(saved, [['marketplace_verified_order', '8']]);
});
test('failed server verification never stores a confirmed order', async () => {
  let options;
  let saved = false;
  globalThis.window = {
    Razorpay: class {
      constructor(value) {
        options = value;
      }
      on() {}
      open() {
        queueMicrotask(() =>
          options.handler({
            razorpay_order_id: 'order_test',
            razorpay_payment_id: 'pay_test',
            razorpay_signature: 'bad',
          }),
        );
      }
    },
  };
  globalThis.sessionStorage = { setItem: () => (saved = true) };
  globalThis.fetch = async (url) =>
    new Response(
      JSON.stringify(
        url.endsWith('/checkout/')
          ? {
              order_id: 9,
              key_id: 'test',
              razorpay_order_id: 'order_test',
              amount: 100,
              currency: 'INR',
            }
          : { detail: 'Invalid signature' },
      ),
      { status: url.endsWith('/checkout/') ? 200 : 400 },
    );
  await assert.rejects(
    payForCart({ name: 'Test', phone: '123', address_id: 4 }, ''),
    /verification is incomplete/,
  );
  assert.equal(saved, false);
});
test('cancelled payment leaves the order unconfirmed', async () => {
  let options;
  globalThis.window = {
    Razorpay: class {
      constructor(value) {
        options = value;
      }
      on() {}
      open() {
        queueMicrotask(() => options.modal.ondismiss());
      }
    },
  };
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        order_id: 10,
        key_id: 'test',
        razorpay_order_id: 'order_test',
        amount: 100,
      }),
    );
  await assert.rejects(
    payForCart({ name: 'Test', phone: '123', address_id: 4 }, ''),
    /cancelled/,
  );
});
