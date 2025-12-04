#!/bin/sh
command -v sh >/dev/null 2>&1 || { echo >&2 "sh not found"; exit 1; }
if [ -z "$husky_skip_init" ]; then
  export husky_skip_init=1
  sh "$0" "$@"
  exit $?
fi
