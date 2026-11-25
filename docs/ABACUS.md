# Abacus in this repository

Abacus is Bo's catalogue of deterministic, certified math commands (C++; `C:\code\abacus`). Sessions working on this
simulator use it for the hard arithmetic instead of doing it in their heads or in throwaway scripts: unit
conversions at the edge, dimensional checks of new formulas, certified values of closed forms, every real root of
an equation, certified integrals. Every answer has a grade and a receipt id that anyone can replay.

Written 2026-11-16 13:29 CST. Checked on this machine the same day: `abacus version` is
`abacus 0.1.0 (abacus-core 0.1.0+git.19d662d11f7a msvc-19.44 strict-fp)`, `abacus selftest` passes 20 of 20, the MCP
server answers the 2025-11-25 handshake with 12 tools, and the 75 answers in
`docs/research/abacus/results_ship_under_way_v1_2026-11-16.jsonl` replay 75 of 75.

## Where it is

| Thing | Path |
|---|---|
| The tool | `C:\code\abacus\dist\bin\abacus.exe` (with `abacus-exact.exe`, FLINT, GMP and MPFR beside it) |
| Its own docs | `C:\code\abacus\README.md`, `contracts\envelope.md`, `contracts\<cmd>.contract.md` |
| The catalogue | `abacus describe` (29 commands), `abacus describe <family.verb>` |
| This repo's requests and answers | `docs\research\abacus\*.jsonl` |
| This repo's journal (MCP calls) | `docs\research\abacus\journal\receipts.db` (git-ignored; export it with `journal export --jsonl`) |

`C:\code\abacus` was unpacked on 2026-11-16 from `Downloads\abacus.7z`: the main tree only (82.7 MB). The build
caches (`.vcpkg`, `build`, `.bench`) and the three worktree copies stayed in the archive, so it runs but can't be
rebuilt here until they're unpacked too.

## Rules

1. **Abacus is read-only from here.** Use it; never edit `C:\code\abacus`. Report a gap to Bo instead.
2. **A certificate certifies the arithmetic, never the inputs.** A certified value computed from a guessed
   coefficient is still a guess. Say which inputs are measured, read, derived or a bet.
3. **Cite the receipt id beside the number** (`abacus1:<12 hex>`), and keep the request so it can be replayed.
4. **Journal into this repo, not into Abacus's own journal.** One-shot and batch calls journal only with
   `--journal <path>`; the MCP registration in `.mcp.json` already names this repo's journal and blob store.
5. **Leave budget headroom.** The default is 10 s; a request over its estimate answers `undecided` (exit 3), which is
   an honest answer, not an error.

## Calling it

One request, no shell quoting (the arguments are a JSON file):

```
C:\code\abacus\dist\bin\abacus.exe num.eval --in request.json
```

A simple one:

```
C:\code\abacus\dist\bin\abacus.exe units.convert --value "22.5 kn" --to m/s
```

Many requests, one per line (`{"cmd": "...", "args": {...}}`), answers in the same order:

```
C:\code\abacus\dist\bin\abacus.exe batch --in requests.jsonl --out results.jsonl
```

Re-run an answer and compare its hash (works on one line of a results file saved to its own file):

```
C:\code\abacus\dist\bin\abacus.exe replay answer.json
```

Exit codes: 0 ok, 1 refuted or outside the domain, 2 error, 3 undecided.

**MCP.** `.mcp.json` at the repository root registers the server for sessions started in this folder (the app asks
once to approve it). Tools: `abacus_describe`, `abacus_call` (reaches every command and carries a budget),
`abacus_blob`, and the curated `units_convert`, `units_check`, `check_equal`, `check_ineq`, `check_root`,
`check_contains`, `check_digits`, `float_inspect`, `lin_inertia`. To register it for every project on this machine
instead, Abacus's README gives the line: `claude mcp add --scope user abacus -- C:/code/abacus/dist/bin/abacus.exe mcp`.

## What to use it for here

| Job | Command | Example in `results_ship_under_way_v1` |
|---|---|---|
| Convert a source's units once, at the edge | `units.convert` | line 9: 52,310 long tons = 53,149.41 t; line 10: 15,000 hp = 11,185.5 kW |
| Check a new formula's dimensions before it is coded | `check.units` | lines 32-41 hold; line 42 is a planted error, refuted |
| A closed form to certified digits | `num.eval` | line 15: U²/2g at 22.5 kn = 6.8287780 m; line 24: the spheroid's minimum Cp = -0.042851261 |
| Every real root, with the count certified | `root.real` | line 43: the steady speed for one engine order; line 44: the trim at which course stability changes sign |
| Check a root or a linear solve the simulator found | `check.root`, `check.solve` | steady turning states (three unknowns), once the model exists |
| A bound over a whole operating range | `check.ineq` | a table's interpolation error, a positivity claim |
| A definite integral that must be right | `num.integrate` | integrals of the hull form for slender-body estimates |
| What binary64 really does | `float.eval`, `float.sweep`, `float.ulpdiff` | whether a `Math.pow`-free rewrite changes the last bit (the golden trace is bit-exact) |

The steady states matter most: they are test oracles that do not depend on the time stepper. "At this engine order
the core must settle at the certified root" is a test the JavaScript core, the C++ build and the CUDA build can all
be held to.

## What it does not do

No time-domain integration of the equations of motion, no panel method or CFD, no fitting. It checks numbers and
closed forms; the simulator still has to compute the sinking.

## Gotchas found on 2026-11-16

- Units it lacks: the long ton (write `2240 lb` per ton: `117174400 lb` for 52,310 long tons) and horsepower (write
  `550 ft*lbf/s` per hp). Knots are `kn`, not `knot`.
- `rpm` carries an angle dimension: convert it to `rad/s`, not to `Hz`.
- A dimensionless variable's unit is `"1"`.
- `e` and `pi` are constants, so a `let` or a variable can't be named `e`.
- A request has only `cmd`, `args`, `budget` and `options`; any other key is refused, so keep notes beside the
  request file, not inside it.
- Infix text or a program: `{"let": [["a0", "..."]], "expr": "a0/(2 - a0)"}`.
