const test = require('node:test');
const assert = require('node:assert/strict');

test('valida formato básico de e-mail', () => {
  const valid = /^\S+@\S+\.\S+$/;
  assert.equal(valid.test('pessoa@exemplo.com'), true);
  assert.equal(valid.test('invalido'), false);
});

test('exige senha mínima de oito caracteres', () => {
  assert.equal('1234567'.length >= 8, false);
  assert.equal('12345678'.length >= 8, true);
});
