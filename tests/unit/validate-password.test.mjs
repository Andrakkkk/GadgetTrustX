import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validatePassword } from '../../src/utils/validation.js';

const tooLong = `${'A'.repeat(72)}1`;
const longestValid = `${'A'.repeat(71)}1`;

const cases = [
  {
    name: 'TC-01 rejects an empty password',
    password: '',
    options: { isNew: true, confirmPassword: '' },
    expected: { isValid: false, error: 'Password wajib diisi.' },
  },
  {
    name: 'TC-02 rejects a 7-character password',
    password: 'Ab12345',
    options: { isNew: true, confirmPassword: 'Ab12345' },
    expected: {
      isValid: false,
      error: 'Password minimal 8 karakter demi keamanan akun.',
    },
  },
  {
    name: 'TC-03 rejects a 73-character password',
    password: tooLong,
    options: { isNew: true, confirmPassword: tooLong },
    expected: { isValid: false, error: 'Password maksimal 72 karakter.' },
  },
  {
    name: 'TC-04 accepts an 8-character password in login mode without requiring a digit',
    password: 'password',
    options: { isNew: false },
    expected: { isValid: true },
  },
  {
    name: 'TC-05 rejects a new password without digits',
    password: 'abcdefgh',
    options: { isNew: true, confirmPassword: 'abcdefgh' },
    expected: {
      isValid: false,
      error: 'Password baru wajib mengandung kombinasi huruf dan angka.',
    },
  },
  {
    name: 'TC-06 accepts a new password when optional confirmation is omitted',
    password: 'Buyer123',
    options: { isNew: true },
    expected: { isValid: true },
  },
  {
    name: 'TC-07 rejects a new password with a mismatched confirmation',
    password: 'Buyer123',
    options: { isNew: true, confirmPassword: 'Buyer124' },
    expected: { isValid: false, error: 'Konfirmasi password tidak cocok.' },
  },
  {
    name: 'TC-08 accepts a new password with matching confirmation',
    password: 'Buyer123',
    options: { isNew: true, confirmPassword: 'Buyer123' },
    expected: { isValid: true },
  },
  {
    name: 'TC-09 rejects a non-string password',
    password: 12345678,
    options: { isNew: false },
    expected: { isValid: false, error: 'Password wajib diisi.' },
  },
  {
    name: 'TC-10 rejects a new password without letters',
    password: '12345678',
    options: { isNew: true, confirmPassword: '12345678' },
    expected: {
      isValid: false,
      error: 'Password baru wajib mengandung kombinasi huruf dan angka.',
    },
  },
  {
    name: 'TC-11 accepts a password of exactly 72 characters',
    password: longestValid,
    options: { isNew: true, confirmPassword: longestValid },
    expected: { isValid: true },
  },
  {
    name: 'TC-12 uses login validation when no options are supplied',
    password: 'password',
    expected: { isValid: true },
  },
  {
    name: 'TC-13 treats an empty confirmation as a mismatch in new-password mode',
    password: 'Buyer123',
    options: { isNew: true, confirmPassword: '' },
    expected: { isValid: false, error: 'Konfirmasi password tidak cocok.' },
  },
];

for (const { name, password, options, expected } of cases) {
  test(name, () => {
    // Arrange: the case supplies the input and expected outcome.
    // Act
    const actual = validatePassword(password, options);

    // Assert
    assert.deepEqual(actual, expected);
  });
}
