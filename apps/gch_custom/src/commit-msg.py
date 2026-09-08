#!/usr/bin/python3

import sys
import re
from submodules.rules import rules


def main():
    with open(sys.argv[1], "r") as fp:
        lines = fp.readlines()

        for idx, line in enumerate(lines):

            if line.strip() == "# ------------------------ >8 ------------------------":
                break

            if line[0] == "#":
                continue

            if not line_valid(idx, line):

                show_rules()
                sys.exit(0)

    sys.exit(0)


def line_valid(idx, line):

    if idx == 0:

        return re.match("^(Feat: |Chore: |Hotfix: |Bug: |Refactor: )A.{,48}[0-9A-z \t]$", line)
    elif idx == 1:
        return len(line.strip()) == 0
    else:
        return len(line.strip()) <= 72


def show_rules():
    print(rules)


if __name__ == "__main__":
    main()
