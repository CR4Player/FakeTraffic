#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
#
# Stage the three netfilter userspace libraries the fakehttp/fakesip engines link
# against (libnetfilter_queue, libnfnetlink, libmnl) for the SDK target, so that
# tools/build-unified-apk.sh can compile the engines without a full OpenWrt tree.
#
# Usage: sh .github/scripts/build-netfilter-libs.sh /path/to/sdk
set -eu

SDK=$(CDPATH= cd -- "${1:?usage: $0 /path/to/sdk}" && pwd)
STAGING="$SDK/staging_dir"
TARGET_STAGING=$(find "$STAGING" -maxdepth 1 -type d -name 'target-*' | head -n 1)
[ -n "$TARGET_STAGING" ] || { echo "no target-* staging dir under $STAGING" >&2; exit 1; }

CROSS=$(find "$STAGING" -maxdepth 3 -name '*-openwrt-linux-musl-gcc' | head -n 1)
[ -n "$CROSS" ] || { echo "no *-openwrt-linux-musl-gcc under $STAGING" >&2; exit 1; }
TCBIN=$(dirname "$CROSS")
HOST=$(basename "$CROSS")
HOST=${HOST%-gcc}
PREFIX="$TARGET_STAGING/usr"

echo "target staging : $TARGET_STAGING"
echo "cross prefix   : $HOST"
echo "install prefix : $PREFIX"

mkdir -p "$PREFIX"
export PATH="$TCBIN:$PATH"
export PKG_CONFIG_LIBDIR="$PREFIX/lib/pkgconfig"
export PKG_CONFIG_PATH="$PREFIX/lib/pkgconfig"
export CFLAGS="-O2 -fPIC -I$PREFIX/include"
export LDFLAGS="-L$PREFIX/lib -Wl,-rpath-link,$PREFIX/lib"

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

build() {
	name=$1
	url=$2
	echo "== building $name"
	curl -fL --retry 5 --retry-all-errors --retry-delay 3 --connect-timeout 30 \
		-o "$work/$name.tar.bz2" "$url"
	tar -xf "$work/$name.tar.bz2" -C "$work"
	(
		cd "$work/$name"
		./configure --host="$HOST" --prefix="$PREFIX" --disable-static
		make -j"$(nproc)" 2>&1 | tail -n 40
		make install
	)
}

build libmnl-1.0.5 \
	https://www.netfilter.org/projects/libmnl/files/libmnl-1.0.5.tar.bz2
build libnfnetlink-1.0.2 \
	https://www.netfilter.org/projects/libnfnetlink/files/libnfnetlink-1.0.2.tar.bz2
build libnetfilter_queue-1.0.5 \
	https://www.netfilter.org/projects/libnetfilter_queue/files/libnetfilter_queue-1.0.5.tar.bz2

echo "== staged libraries"
ls -l "$PREFIX/lib"/*.so* 2>/dev/null || true
file "$PREFIX/lib"/*.so.*.*.* 2>/dev/null || true
