#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
node tools/verificar-formato-cuadrado.mjs
