# qDesinger — native customizations

This downstream build is based on PhotoCraft v0.7.0. The patch modifies the native egui shell, the web startup path and their tests. Image editing commands are unchanged.

Actions and History share a fixed, full-height, resizable column immediately left of the main right dock. Double chevrons collapse it to two icons, which reopen the corresponding tab. Essentials contains the 26 presets in searchable, collapsible categories; Yours contains custom actions. A single click runs the original action index through the existing engine. Use + or the row context menu for the original recording and step editor. The ellipsis menu restores the original Actions tab; drag that tab into the icon rail to dock it again. Window → Actions / History and saved layouts address the column. Locked workspaces prevent moving the tab.

The site applies a one-time local preference migration to open the new column; subsequent user layout choices and locked workspaces are preserved. Generative AI actions shown in the video reference are not implemented.

Source archive: https://codeload.github.com/storytold/photocraft/tar.gz/refs/tags/v0.7.0

SHA-256: `420bc64e3548579b1b255aed33be055be1688c3427f429dc5f1c28daf8639a2c`

Apply `actions-rail.patch` with `patch -p1` from the extracted repository root. Build with Rust 1.95.0, the wasm32-unknown-unknown target and Trunk 0.21.14. From `apps/photocraft-web`, run `trunk build --release` (unset a numeric NO_COLOR environment variable, if present; Trunk requires true/false). Upstream's `wasm-release` profile and HEIF feature are retained.

The build emits the matching JavaScript/WASM pair to `dist/web/`. Copy the pair together, update the import path, WASM path and SHA-384 preload integrity values in this site's `dist/index.html`. Keep `builtin-actions.mjs` and `action-pdf.mjs`; the built-in Actions are now compiled into WASM and do not require a JavaScript database installer. Each deployed WASM must remain below the hosting provider's 25 MiB limit.

Regression coverage includes native pointer drag into the rail in Pro Medium and Studio, column open/close and full-height geometry, canvas space reservation, serialized layout restoration, Window → Actions, returning to the dock, and locked-workspace refusal. The new library harness checks grouping, collapsing, case-insensitive search, Essentials/Yours and single-click playback using original action indices. Browser interaction remains a separate verification step.

## Validation (2026-10-14, column revision)

The complete UI test command passed: 1,791 unit tests passed, 10 intentionally ignored, no failures; all native GPU integration tests and doctests also passed. The final icon-only corrections were checked by the WASM compiler and a fresh native snapshot.

The cumulative patch applies cleanly to the pinned upstream archive. All 29 crate dependency layers and all wasm-safe checks (including HEIF) pass. JavaScript syntax and one-time migration tests pass: preservation of unrelated preferences, idempotence, and workspace lock. Open and collapsed native snapshots were rendered with Mesa llvmpipe and inspected. The column reserves canvas space beside Color/Properties/Layers; longer action lists scroll.

Browser end-to-end interaction is unavailable in this environment. Strict Clippy remains blocked by pre-existing warnings in text/src/cjk.rs and UI analysis_ui.rs, canvas.rs, crop_ui.rs, transform_tool.rs, vector_ui.rs and lib.rs. No unrelated upstream lint changes were made; the lint gate is not recorded as passing.

For this constrained build host, native tests use CARGO_BUILD_JOBS=1, CARGO_TARGET_DIR=target/native, single codegen units and a test-only photocraft-ui-egui opt-level of 0; the production WASM profile is unchanged. GPU tests use the software Vulkan driver.

The production Trunk release build passed with HEIF and upstream wasm-opt settings. Its matching asset pair is `photocraft-web-e87a5c83afd5126d`; WASM size is 25,150,999 bytes, below the 25 MiB hosting cap. Matching preload paths and SHA-384 hashes were verified.

## Built-in Actions storage correction

The browser screenshot reported NotFoundError during the JavaScript preset installation path. Its exact browser storage cause is not observable here. The 26 definitions now ship in the native web binary and are appended in memory after custom preset hydration, including the storage-unavailable fallback. The JavaScript installer and its blanket instruction to enable storage were removed. Startup neither deletes the database nor rewrites the original action record; identically named saved edits win. Ordinary user action edits still use the existing persistence machinery.

The web test binary passed all 15 tests, including the three new unavailable-storage, saved-action preservation and malformed-record regressions. The unavailable-storage test plays a bundled action through the real engine. Startup JavaScript syntax and the layout migration passed; all 29 dependency layers passed.

The changed web crate also passed WASM-target Clippy with `--no-deps -- -D warnings`. The cumulative patch applies cleanly to the pinned source.

Storage correction release: `photocraft-web-11ebde36cd8d7808`, 25,165,846 WASM bytes; HEIF and upstream optimizations retained, below the 25 MiB hosting cap. Asset pairing and SHA-384 preload integrity checked.

## Actions width correction (2026-10-15 Taiwan)

Reproduced the screen-recorded defect with a pointer regression: dragging the column to 260 points and releasing let it expand to 420 points over idle frames. The search field had reserved a fixed 28 points for a 24-point clear button plus a theme-dependent gap; its overflow enlarged the panel each frame. Search now reserves the actual spacing, and column contents are constrained to the user-chosen rectangle. The width is serialized into the existing workspace preferences and restored into panel state.

The regression now passes at widths 260, 380 and 280 across Pro Medium and Studio, with 120 idle frames per drag, History switching, collapse/reopen, and a fresh egui context restored from saved preferences.

Narrow (260-point) and wide (380-point) native screenshots were rendered with Mesa llvmpipe and inspected: the search field, clear button, tabs and rows remain within the chosen column. Long labels clip within the column. Dependency layering passed. The strict UI Clippy attempt reports the same seven previously documented warnings in unrelated upstream code, with none in the width correction. Browser interaction QA remains unavailable.

Width correction release: `photocraft-web-b4de39d863539526`, 25,167,145 WASM bytes, below the 25 MiB hosting cap. The production release retains HEIF and upstream optimizations. Matching asset paths and SHA-384 preload hashes verified. All wasm-safe crate checks passed.

Final width-fix validation: all UI unit and integration suites passed (`cargo test -p photocraft-ui-egui --lib --tests`), including 1,792 passed unit tests, 10 intentional ignores and 31 dock tests. The snapshot example was built and rendered separately.

## qDesinger name

Product UI, window titles, loading text, localized app names and default built-in export filenames use the exact requested name qDesinger. Upstream PhotoCraft links, credits, licensing, project format, crate names and browser storage identifiers are retained.

Name revision release: `photocraft-web-e8e18e3781640c06`, 25,167,521 WASM bytes. Production release, wasm-safe crate checks, dependency layering, cumulative patch dry run, and JavaScript syntax checks passed. Preload hashes and paired assets verified.

Name revision validation: 1,792 UI unit tests passed, 10 intentionally ignored; all 15 web tests passed. Native startup and About snapshots were rendered and inspected. The qDesinger name renders correctly in English and Traditional Chinese mode; this native test environment lacks CJK font glyphs. Browser end-to-end QA remains unavailable.
