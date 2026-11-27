/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * pkt_contract.h - Shared packet marking and parameter bounds contract
 * decoupling firewall rule generation (nfrules) from packet injection (rawsend).
 */

#ifndef FH_PKT_CONTRACT_H
#define FH_PKT_CONTRACT_H

#include <stdint.h>

#define FH_DEFAULT_FWMARK      UINT32_C(0x8000)
#define FH_DEFAULT_NFQNUM      UINT32_C(512)
#define FH_DEFAULT_TTL         UINT8_C(3)
#define FH_DEFAULT_MIN_HOPS    UINT8_C(0)
#define FH_DEFAULT_REPEAT      2
#define FH_MAX_REPEAT          10
#define FH_MAX_MIN_HOPS        254
#define FH_MAX_PAYLOAD_LEN     1200

#endif /* FH_PKT_CONTRACT_H */
