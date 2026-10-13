import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
  clearAccessPins,
  hasAccessPin,
  isValidAccessPin,
  saveAccessPins,
  verifyAccessPin,
} from '../access-pin';
import { __resetStore } from './mocks/expo-secure-store';

describe('access-pin', () => {
  beforeEach(() => {
    __resetStore();
  });

  describe('isValidAccessPin', () => {
    it('accepts exact 6-digit strings', () => {
      assert.equal(isValidAccessPin('123456'), true);
      assert.equal(isValidAccessPin('000000'), true);
      assert.equal(isValidAccessPin('999999'), true);
    });

    it('rejects pins with incorrect length', () => {
      assert.equal(isValidAccessPin(''), false);
      assert.equal(isValidAccessPin('12345'), false);
      assert.equal(isValidAccessPin('1234567'), false);
    });

    it('rejects pins with non-digit characters', () => {
      assert.equal(isValidAccessPin('12345a'), false);
      assert.equal(isValidAccessPin('abcdef'), false);
      assert.equal(isValidAccessPin('12 456'), false);
      assert.equal(isValidAccessPin('12-456'), false);
      assert.equal(isValidAccessPin('12.456'), false);
    });
  });

  describe('saveAccessPins and hasAccessPin', () => {
    it('returns false when no credentials exist', async () => {
      assert.equal(await hasAccessPin(), false);
    });

    it('saves credentials and reports configured', async () => {
      await saveAccessPins('123456', '654321');
      assert.equal(await hasAccessPin(), true);
    });

    it('throws if either pin is not 6 digits', async () => {
      await assert.rejects(
        () => saveAccessPins('12345', '654321'),
        /PINs must each contain 6 digits/,
      );
      await assert.rejects(
        () => saveAccessPins('123456', '65432'),
        /PINs must each contain 6 digits/,
      );
    });

    it('throws if normal and decoy pins are identical', async () => {
      await assert.rejects(
        () => saveAccessPins('123456', '123456'),
        /The two PINs must be different/,
      );
    });
  });

  describe('verifyAccessPin', () => {
    it('rejects verification when no pins have been configured', async () => {
      assert.equal(await verifyAccessPin('123456'), 'invalid');
    });

    it('returns invalid on bad formatting', async () => {
      await saveAccessPins('123456', '654321');
      assert.equal(await verifyAccessPin('123'), 'invalid');
      assert.equal(await verifyAccessPin('abcdef'), 'invalid');
    });

    it('verifies normal and decoy pins correctly', async () => {
      await saveAccessPins('123456', '654321');
      assert.equal(await verifyAccessPin('123456'), 'normal');
      assert.equal(await verifyAccessPin('654321'), 'decoy');
    });

    it('returns invalid for wrong pin', async () => {
      await saveAccessPins('123456', '654321');
      assert.equal(await verifyAccessPin('000000'), 'invalid');
    });

    it('locks out after 5 consecutive failed attempts', async () => {
      await saveAccessPins('123456', '654321');

      for (let i = 0; i < 4; i++) {
        assert.equal(await verifyAccessPin('000000'), 'invalid');
      }

      // 5th failure triggers lockout
      assert.equal(await verifyAccessPin('000000'), 'invalid');

      // Subsequent attempt within 30s is locked
      assert.equal(await verifyAccessPin('123456'), 'locked');
      assert.equal(await verifyAccessPin('000000'), 'locked');
    });

    it('triggers decoy unlock even when locked out', async () => {
      await saveAccessPins('123456', '654321');

      for (let i = 0; i < 5; i++) {
        await verifyAccessPin('000000');
      }

      // Normal pin is locked out
      assert.equal(await verifyAccessPin('123456'), 'locked');

      // Decoy pin bypasses lockout to permit emergency wipe under duress
      assert.equal(await verifyAccessPin('654321'), 'decoy');
    });

    it('resets failure count upon successful normal authentication', async () => {
      await saveAccessPins('123456', '654321');

      // 4 failures
      for (let i = 0; i < 4; i++) {
        assert.equal(await verifyAccessPin('000000'), 'invalid');
      }

      // Successful unlock resets counter
      assert.equal(await verifyAccessPin('123456'), 'normal');

      // Another 4 failures should still not lock out
      for (let i = 0; i < 4; i++) {
        assert.equal(await verifyAccessPin('000000'), 'invalid');
      }
      assert.equal(await verifyAccessPin('123456'), 'normal');
    });
  });

  describe('clearAccessPins', () => {
    it('removes stored credentials, failures, and locks', async () => {
      await saveAccessPins('123456', '654321');
      assert.equal(await hasAccessPin(), true);

      await clearAccessPins();
      assert.equal(await hasAccessPin(), false);
      assert.equal(await verifyAccessPin('123456'), 'invalid');
    });
  });
});
