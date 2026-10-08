import test from "node:test";
import assert from "node:assert/strict";
import { missingAuthenticatorName, selectedAuthenticator, PRIMARY_AUTHENTICATOR, BACKUP_AUTHENTICATOR } from "../../src/lib/admin/mfa";

const primary = { id: "primary", friendly_name: PRIMARY_AUTHENTICATOR };
const backup = { id: "backup", friendly_name: BACKUP_AUTHENTICATOR };
test("Backup-only offers replacement Primary with a distinct friendly name", () => {
  assert.equal(missingAuthenticatorName([backup]), PRIMARY_AUTHENTICATOR);
  assert.notEqual(missingAuthenticatorName([backup]), backup.friendly_name);
});
test("Primary-only offers Backup with a distinct friendly name", () => {
  assert.equal(missingAuthenticatorName([primary]), BACKUP_AUTHENTICATOR);
  assert.notEqual(missingAuthenticatorName([primary]), primary.friendly_name);
});
test("both labels disable enrollment regardless of response order", () => {
  assert.equal(missingAuthenticatorName([primary, backup]), null);
  assert.equal(missingAuthenticatorName([backup, primary]), null);
});
test("initial default is Primary regardless of response order", () => {
  assert.equal(selectedAuthenticator([primary, backup], ""), primary.id);
  assert.equal(selectedAuthenticator([backup, primary], ""), primary.id);
});
test("explicit Backup selection survives factor-list reload and reordering", () => {
  assert.equal(selectedAuthenticator([{ ...primary }, { ...backup }], backup.id), backup.id);
  assert.equal(selectedAuthenticator([{ ...backup }, { ...primary }], backup.id), backup.id);
});
test("removed selection falls back to Primary, or retained Backup", () => {
  assert.equal(selectedAuthenticator([primary, backup], "lost"), primary.id);
  assert.equal(selectedAuthenticator([backup], primary.id), backup.id);
});
test("empty list offers Primary and has no selected factor", () => {
  assert.equal(missingAuthenticatorName([]), PRIMARY_AUTHENTICATOR);
  assert.equal(selectedAuthenticator([], backup.id), "");
});
test("unknown names cannot bypass the existing two-factor limit", () => {
  const other = { id: "other", friendly_name: "Other" };
  assert.equal(missingAuthenticatorName([backup, other]), null);
  assert.equal(selectedAuthenticator([other, backup], ""), selectedAuthenticator([backup, other], ""));
});
