# Axiomatic Design Refactoring Summary

This document records the MIT Axiomatic Design (Nam P. Suh) analysis and the
four-phase decoupling refactoring applied to FakeTraffic (`FakeHTTP` + `FakeSIP`
+ optional `fakeflow` eBPF backend).

## Functional Requirements (FRs) & Design Parameters (DPs)

- **FR0 / DP0 — Shared Parameter & Packet Marking Contract (SSOT)**:
  `schema/parameters.json` generates `contract.sh` and `contract.js` via
  `tools/sync-schema.mjs`, while `fakehttp/include/pkt_contract.h` and
  `fakesip/include/pkt_contract.h` isolate shared firewall/injection marking
  constants (`fwmark`, `FS_FAKE_IPV4_ID`, `FS_FAKE_IPV6_FLOW_WORD`) without
  crossing the GPL-3.0 / GPL-2.0-only boundary.
- **FR1 / DP1 — Traffic Capture & Loop Prevention**:
  NFQUEUE rules (`nfrules`) and eBPF TCX observers (`observer.bpf.c`) with
  per-interface protocol masks (`proto_mask`).
- **FR2 / DP2 — Decoy Payload Generation & Deterministic Rotation**:
  Consistent FIFO circular rotation across `fakehttp` (`payload.c`), `fakesip`
  (`payload.c`), and `fakeflow` (v2 generation-slot BPF maps).
- **FR3 / DP3 — Non-Disruptive Low-TTL Injection & Hop Gating**:
  Decoupled `min_hops` (`-H` / `[tcp|udp].min_hops`) separating near-peer skip
  gating from outbound decoy `ttl`, plus aligned `TTL_UNKNOWN` fallback in
  `fakesip` (`srcinfo_unavail` no longer synthesizes a 32-hop estimate).
- **FR4 / DP4 — Unified Control Plane & Backend Lifecycle**:
  Per-protocol injection settings and per-interface protocol masks in both
  `preflight-core.sh` and `fakeflow`, eliminating `DIFFERENT_PROTOCOL_DEVICES`
  and `DIFFERENT_PROTOCOL_INJECTION_SETTINGS` cross-protocol blockers while
  preserving backwards-compatible UCI/TOML v1-v2 parsing.
- **FR5 / DP5 — Read-Only Observability & Diagnostics**:
  Strictly lower-triangular read-only telemetry (`telemetry.c`, `status`,
  `preflight`, LuCI dashboard) with zero feedback into packet processing.

## Design Matrix Evolution (Before vs. After)

Before refactoring, two coupled blocks violated the Independence Axiom:
1. `DP1 <-> DP3` implicit bidirectional coupling (marking constants, `ttl`
   overloading both skip-gate and packet lifetime, `fakesip` unknown-TTL bug,
   `fakehttp` LIFO vs `fakesip` FIFO rotation drift).
2. `DP4 -> (FR1, FR3)` cross-backend coupling (`preflight-core.sh` rejected
   independent TCP/UDP interfaces and independent TCP/UDP TTL/repeat settings on
   eBPF).

After the four-phase refactoring, lifting the contract to `DP0` and adding
per-protocol injection + interface masks to `fakeflow` reduces the system matrix
to a decoupled **lower-triangular structure** (with only the unavoidable legacy
`iptables` SNAT compatibility path remaining as an optional fallback):

```text
          DP0  DP1  DP2  DP3  DP4  DP5
FR0       [ X    0    0    0    0    0 ]
FR1       [ X    X    0    0    0    0 ]
FR2       [ X    0    X    0    0    0 ]
FR3       [ X    X    X    X    0    0 ]
FR4       [ X    X    X    X    X    0 ]
FR5       [ X    X    X    X    X    X ]
```
