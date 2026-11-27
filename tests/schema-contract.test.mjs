// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSchema, renderContractTargets } from '../tools/sync-schema.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8').replaceAll('\r', '');

test('generated shell and LuCI parameter contracts match schema/parameters.json', () => {
  for (const [rel, expected] of renderContractTargets(root)) {
    assert.equal(read(rel), expected, 'Contract drift in ' + rel);
  }
});

test('engine C headers and source bounds agree with schema/parameters.json SSOT', () => {
  const s = loadSchema(root);
  const abi = read('components/fakeflow/ebpf/include/abi.h');
  assert.match(abi, new RegExp(`#define FF_PAYLOAD_MAX ${s.templates.payloadMaxBytes}\\b`));
  assert.match(abi, new RegExp(`#define FF_TEMPLATE_MAX ${s.templates.ebpfMax}\\b`));
  assert.match(abi, new RegExp(`#define FF_INTERFACES ${s.interfaces.ebpfMaxCount}\\b`));

  const httpContract = read('components/fakehttp/include/pkt_contract.h');
  const sipContract = read('components/fakesip/include/pkt_contract.h');
  assert.ok(sipContract.includes(s.packetContract.fakeSipIpv4Id), 'FakeSIP IPv4 ID mismatch');
  assert.ok(sipContract.includes(s.packetContract.fakeSipIpv6FlowLabel), 'FakeSIP IPv6 flow label mismatch');
  assert.match(httpContract, new RegExp(`#define FH_MAX_REPEAT\\s+${s.repeat.nfqueue.max}\\b`));
  assert.match(sipContract, new RegExp(`#define FS_MAX_REPEAT\\s+${s.repeat.nfqueue.max}\\b`));
  assert.match(httpContract, new RegExp(`#define FH_MAX_MIN_HOPS\\s+${s.minHops.max}\\b`));
  assert.match(sipContract, new RegExp(`#define FS_MAX_MIN_HOPS\\s+${s.minHops.max}\\b`));

  const httpPayload = read('components/fakehttp/src/payload.c');
  const sipPayload = read('components/fakesip/src/payload.c');
  assert.match(httpPayload, new RegExp(`#define BUFFLEN\\s+${s.templates.payloadMaxBytes}\\b`));
  assert.match(sipPayload, new RegExp(`#define BUFFLEN\\s+${s.templates.payloadMaxBytes}\\b`));
  assert.match(sipPayload, new RegExp(`#define SIP_URI_MAXLEN\\s+${s.templates.sipUriMaxBytes}\\b`));
});
