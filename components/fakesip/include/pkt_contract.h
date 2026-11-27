/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * pkt_contract.h - Shared packet marking and ICMP-filter fingerprint contract
 * decoupling firewall rule generation (nfrules) from packet injection (rawsend).
 */

#ifndef FS_PKT_CONTRACT_H
#define FS_PKT_CONTRACT_H

#include <stdint.h>

#define FS_DEFAULT_FWMARK        UINT32_C(0x10000)
#define FS_DEFAULT_NFQNUM        UINT32_C(513)
#define FS_DEFAULT_TTL           UINT8_C(3)
#define FS_DEFAULT_MIN_HOPS      UINT8_C(0)
#define FS_DEFAULT_REPEAT        2
#define FS_MAX_REPEAT            10
#define FS_MAX_MIN_HOPS          254
#define FS_MAX_PAYLOAD_LEN       1200

#define FS_FAKE_IPV4_ID          UINT16_C(0x4653)
#define FS_FAKE_IPV6_FLOW_LABEL  UINT32_C(0x46553)
#define FS_FAKE_IPV6_FLOW_WORD   ((UINT32_C(6) << 28) | FS_FAKE_IPV6_FLOW_LABEL)

#endif /* FS_PKT_CONTRACT_H */
