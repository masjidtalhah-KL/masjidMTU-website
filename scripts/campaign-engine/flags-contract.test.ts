import test from "node:test";
import assert from "node:assert/strict";
import { flagCommand, flagSnapshot, flagResult, composeAvailability } from "../../src/lib/campaigns/flag-contract";
import { readFlagBody } from "../../src/lib/campaigns/flag-body";
const state = (enabled = false, present = false, version = 0) => ({key:"campaigns.enabled",enabled,present,version});
test("bounded flag commands reject extra authority, arbitrary keys and invalid versions", () => {
  assert.deepEqual(flagCommand({key:"campaigns.enabled",enabled:true,expectedVersion:0}),{key:"campaigns.enabled",enabled:true,expectedVersion:0});
  for (const value of [null,[],{}, {key:"campaigns.enabled",enabled:true,expectedVersion:0,role:"super_admin"},
    {key:"campaigns.enabled",enabled:true,expectedVersion:0,actor_id:"forged"},
    ...[-1,0.5,2147483648,"0"].map(expectedVersion=>({key:"campaigns.enabled",enabled:true,expectedVersion})),
    {key:"../private",enabled:true,expectedVersion:0},{key:"campaigns.enabled",enabled:"true",expectedVersion:0}])
    assert.throws(()=>flagCommand(value));
});
test("missing and explicit OFF remain distinct safe states; actor fields are stripped", () => {
  assert.deepEqual(flagSnapshot([state()]),[state()]);
  assert.deepEqual(flagSnapshot([{...state(false,true,2),actor_id:"private"}]),[state(false,true,2)]);
  assert.deepEqual(composeAvailability([state()]),{available:false,reason:"off"});
  assert.deepEqual(composeAvailability([state(false,true,2)]),{available:false,reason:"off"});
});
test("unknown/unregistered module never becomes ON; composition requires both flags", () => {
  const global = state(true,true,1);
  assert.deepEqual(composeAvailability([global],"qurban.enabled"),{available:false,reason:"unsupported"});
  assert.deepEqual(composeAvailability([global],"campaigns.enabled"),{available:false,reason:"unsupported"});
  for (const [globalOn,moduleOn,expected] of [[false,false,false],[true,false,false],[false,true,false],[true,true,true]])
    assert.equal(composeAvailability([state(globalOn,true,1),{key:"local_fixture.enabled",enabled:moduleOn,present:true,version:1}],"local_fixture.enabled").available,expected);
});
test("malformed/missing/duplicate database snapshots fail closed", () => {
  for (const value of [null,{},[],[state(),state()], [{...state(),enabled:true}], [{...state(),version:1}],
    [{...state(true,true,1),version:0}],[{key:"unknown.enabled",enabled:true,present:true,version:1}],
    [{...state(),enabled:null}]]) assert.throws(()=>flagSnapshot(value));
});
test("mutation response must match requested key/state/version and safe types", () => {
  const command = flagCommand({key:"campaigns.enabled",enabled:true,expectedVersion:0});
  const result = {...state(true,true,1),changed:true};
  assert.deepEqual(flagResult(result,command),result);
  for (const value of [{...result,key:"other.enabled"},{...result,enabled:false},{...result,version:2},
    {...result,changed:false},{...result,changed:"true"}]) assert.throws(()=>flagResult(value,command));
});

const invalidBody = (error: unknown) => error instanceof Error &&
  "status" in error && error.status === 422 && "reason" in error && error.reason === "invalid";
const encoded = (text: string) => new TextEncoder().encode(text);
test("body reader accepts exactly 256 UTF-8 bytes, including split multibyte characters", async () => {
  const text = "é".repeat(128);
  const bytes = encoded(text);
  const body = new ReadableStream<Uint8Array>({start(controller) {
    controller.enqueue(bytes.subarray(0,1));controller.enqueue(bytes.subarray(1,127));
    controller.enqueue(bytes.subarray(127));controller.close();
  }});
  assert.equal(await readFlagBody(body),text);
});
test("oversized single chunk is cancelled before copying/decoding it", async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({start(controller) {controller.enqueue(new Uint8Array(1024*1024));},
    cancel() {cancelled=true;}});
  await assert.rejects(readFlagBody(body),invalidBody);assert.equal(cancelled,true);
});
test("incremental reader stops at overflow, cancels and never requests the remaining chunks", async () => {
  let pulls = 0, cancelled = false;
  const body = new ReadableStream<Uint8Array>({pull(controller) {
    pulls++;controller.enqueue(new Uint8Array(pulls === 1 ? 256 : 1));
    if(pulls>2) throw Error("Unbounded tail must never be read");
  },cancel() {cancelled=true;}},{highWaterMark:0});
  await assert.rejects(readFlagBody(body),invalidBody);
  assert.equal(pulls,2);assert.equal(cancelled,true);assert.equal(body.locked,false);
});
test("overflow rejection does not wait for a sender's unfinished cancellation", async () => {
  const body = new ReadableStream<Uint8Array>({start(controller) {controller.enqueue(new Uint8Array(257));},
    cancel() {return new Promise<void>(()=>{});}});
  await assert.rejects(readFlagBody(body),invalidBody);
  assert.equal(body.locked,false);
});
test("body bound is independent of absent or misleading Content-Length", async () => {
  for(const headers of [new Headers(),new Headers({"Content-Length":"1"})]) {
    const request = new Request("https://local.invalid",{method:"POST",body:"é".repeat(129),headers});
    await assert.rejects(readFlagBody(request.body),invalidBody);
  }
});
test("missing body, invalid UTF-8 and read failures return only safe invalid errors", async () => {
  await assert.rejects(readFlagBody(null),invalidBody);
  await assert.rejects(readFlagBody(new ReadableStream({start(controller) {
    controller.enqueue(new Uint8Array([0xff]));controller.close();
  }})),invalidBody);
  await assert.rejects(readFlagBody(new ReadableStream({start(controller) {
    controller.error(Error("private upstream details"));
  }})),invalidBody);
});
