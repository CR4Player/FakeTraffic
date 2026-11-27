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

  const sipPkt4 = read('components/fakesip/include/ipv4pkt.h');
  const sipPkt6 = read('components/fakesip/include/ipv6pkt.h');
  assert.ok(sipPkt4.includes(s.packetContract.fakeSipIpv4Id), 'FakeSIP IPv4 ID mismatch');
  assert.ok(sipPkt6.includes(s.packetContract.fakeSipIpv6FlowLabel), 'FakeSIP IPv6 flow label mismatch');

  const httpPayload = read('components/fakehttp/src/payload.c');
  const sipPayload = read('components/fakesip/src/payload.c');
  assert.match(httpPayload, new RegExp(`#define BUFFLEN\\s+${s.templates.payloadMaxBytes}\\b`));
  assert.match(sipPayload, new RegExp(`#define BUFFLEN\\s+${s.templates.payloadMaxBytes}\\b`));
  assert.match(sipPayload, new RegExp(`#define SIP_URI_MAXLEN\\s+${s.templates.sipUriMaxBytes}\\b`));
});
