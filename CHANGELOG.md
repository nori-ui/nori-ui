## [1.6.0](https://github.com/nori-ui/nori-ui/compare/v1.5.0...v1.6.0) (2026-05-21)

### Features

* **table:** add Table primitive + DataTable wrapper ([#6](https://github.com/nori-ui/nori-ui/issues/6)) ([9257f5a](https://github.com/nori-ui/nori-ui/commit/9257f5a38d006a8e76e29ebe29e8ae427d46109b))

## [1.5.0](https://github.com/nori-ui/nori-ui/compare/v1.4.0...v1.5.0) (2026-05-21)

### Features

* **combobox:** add Combobox as a searchable Select wrapper ([#5](https://github.com/nori-ui/nori-ui/issues/5)) ([baa8590](https://github.com/nori-ui/nori-ui/commit/baa85902a0234a2f49887b1d120ca6f77c26723a))

## [1.4.0](https://github.com/nori-ui/nori-ui/compare/v1.3.0...v1.4.0) (2026-05-21)

### Features

* **sheet:** add Sheet (Drawer alias) slide-from-edge modal ([#4](https://github.com/nori-ui/nori-ui/issues/4)) ([6a9111d](https://github.com/nori-ui/nori-ui/commit/6a9111dd367175204f58d3ccd9b7687429e04550))

## [1.3.0](https://github.com/nori-ui/nori-ui/compare/v1.2.0...v1.3.0) (2026-05-21)

### Features

* **menu:** add DropdownMenu + ContextMenu ([#3](https://github.com/nori-ui/nori-ui/issues/3)) ([05ee546](https://github.com/nori-ui/nori-ui/commit/05ee5465fb817dd5f7df47a136c42e7c0be5ddac))

## [1.2.0](https://github.com/nori-ui/nori-ui/compare/v1.1.0...v1.2.0) (2026-05-21)

### Features

* **date-picker:** add DatePicker + DatePicker.Range ([#2](https://github.com/nori-ui/nori-ui/issues/2)) ([6f3636d](https://github.com/nori-ui/nori-ui/commit/6f3636dba9a36c66f61e26aed1d5ffd4a2077ca6))

## [1.1.0](https://github.com/nori-ui/nori-ui/compare/v1.0.6...v1.1.0) (2026-05-21)

### ⚠ BREAKING CHANGES

* **field:** label, helperText, error removed from TextInput and
TextArea. Wrap controls in <Field> to keep the previous UX.

Sprint 1 of the 9-sprint shadcn parity push. Spec at
docs/superpowers/specs/2026-05-20-field-label-design.md.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>

### Features

* **calendar:** add flash-calendar as optional peer dep for native scroll ([f07e800](https://github.com/nori-ui/nori-ui/commit/f07e800bdfeefb4483445d477989cb6331f7f6a5))
* **calendar:** behavior="scroll" on native via flash-calendar wrapper ([2fe5f14](https://github.com/nori-ui/nori-ui/commit/2fe5f148ad09305aa13d319172a882c1b6c0403a))
* **calendar:** behavior="scroll" on web (css scroll + intersectionobserver) ([63cdcaf](https://github.com/nori-ui/nori-ui/commit/63cdcaf7adb8e6372163ec4062fafe2df69bd6f4))
* **calendar:** native a11y — labels, roles, and states on cells/chevrons/grid ([e466635](https://github.com/nori-ui/nori-ui/commit/e466635b815d89d18e08b3938062cb29404e427c))
* **calendar:** scroll-mode chevrons advance month, focused-month change scrolls to target ([26ae1fa](https://github.com/nori-ui/nori-ui/commit/26ae1fa0ded44da3e009f32db3a7cafdc9653301))
* **calendar:** scroll-mode window constants ([fb5233e](https://github.com/nori-ui/nori-ui/commit/fb5233ec4f226d166211798ecb9552270aec1512))
* **calendar:** scrollbody shared interface (platform-extension fallback) ([d0555ca](https://github.com/nori-ui/nori-ui/commit/d0555cadfc4382ad161eb82a32a842919ef804f4))
* **field:** add Field + Label primitives and migrate controls ([9ec6d30](https://github.com/nori-ui/nori-ui/commit/9ec6d3024dd550d4eeac2ca24a2d6d6e611308fc))
* **field:** shorthand API — label/description/error as props ([9f23beb](https://github.com/nori-ui/nori-ui/commit/9f23beb15b108cc9235bbdfc7bfce2d8ff66b796))
* **playground-native:** calendar stories for scroll/dropdown/renderDay variants ([1c724b2](https://github.com/nori-ui/nori-ui/commit/1c724b2907406a13620067ffd9a555cf416ede1e))

### Performance Improvements

* **calendar:** cache day-label formatters; mark i18n suffix limitation ([8391ea2](https://github.com/nori-ui/nori-ui/commit/8391ea24ccaff291c4c10eefaddc5f1db3659d08))

## [1.0.6](https://github.com/nori-ui/nori-ui/compare/v1.0.5...v1.0.6) (2026-05-08)

### Bug Fixes

* **ci:** unblock playwright e2e — resolve .web.* extensions + realign story testIDs ([70cba41](https://github.com/nori-ui/nori-ui/commit/70cba41bf86d149b1eb10286d65f649d0e1e34f4))

## [1.0.5](https://github.com/nori-ui/nori-ui/compare/v1.0.4...v1.0.5) (2026-05-08)

### Bug Fixes

* **release:** override breaking changes to patch while pre-launch (no consumers yet) ([0b0980d](https://github.com/nori-ui/nori-ui/commit/0b0980d14133d94f1d876e8a541c38f479bd580e))

## [1.0.4](https://github.com/nori-ui/nori-ui/compare/v1.0.3...v1.0.4) (2026-05-08)

### Bug Fixes

* **playground-web:** unblock e2e by removing dead glob guard + browser globals ([34bed11](https://github.com/nori-ui/nori-ui/commit/34bed11986f81e85771bcde858251773a57308a8))

## [1.0.3](https://github.com/nori-ui/nori-ui/compare/v1.0.2...v1.0.3) (2026-05-08)

### Bug Fixes

* **playground-web:** correct optimizeDeps id for the client subpath ([655ce45](https://github.com/nori-ui/nori-ui/commit/655ce45f3eb2419dc9cf5048bc405d81adcdcf05))

## [1.0.2](https://github.com/nori-ui/nori-ui/compare/v1.0.1...v1.0.2) (2026-05-08)

### Bug Fixes

* **ci:** exempt auto-generated CHANGELOG.md from biome formatting ([7f77612](https://github.com/nori-ui/nori-ui/commit/7f7761299fa036d03aa19ce4ecfc96b49935c794))

## [1.0.1](https://github.com/nori-ui/nori-ui/compare/v1.0.0...v1.0.1) (2026-05-08)

### Bug Fixes

* **ci:** disable npm provenance on private repos (oidc still active) ([387e556](https://github.com/nori-ui/nori-ui/commit/387e5561338d68e0072035dc3a0c6999effc529a))
* **release:** restore root workspaces + stop semantic-release from committing root files ([f7b654e](https://github.com/nori-ui/nori-ui/commit/f7b654e82d4f8897d809e66314afc280ce9d7c00))

## 1.0.0 (2026-05-08)

### ⚠ BREAKING CHANGES

* **core:** * Flat compound exports removed from public API:
  - `PaginationFirst/Last/Item/Items/Prev/Next/Ellipsis/Jumper/Range/`
    `PageSize/Root` — use `Pagination.First`/`Pagination.Item`/etc.
  - `FloatButtonGroup`, `FloatButtonBackToTop` — use `FloatButton.Group` /
    `FloatButton.BackToTop`.
  - `SliderGestureProvider`, `useSliderInteractionActive` — internal only.
* Callback rename:
  - `<Accordion onValueChange>` → `<Accordion onChange>`
  - `<Slider onValueChange>` → `<Slider onChange>`
  - `<Toggle onPressedChange>` → `<Toggle onChange>`
  - `<Toggle.Group onValueChange>` → `<Toggle.Group onChange>`
* `Pagination.onPageChange` signature: `(info)` → `(page, meta?)`.
* Doc URL: `/docs/components/radio-group` → `/docs/components/radio`.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
* **core:** existing imports of flat-named parts must be replaced
with the root + dot access. Codemod: replace `import { CardHeader }` →
`import { Card }`, `<CardHeader>` → `<Card.Header>`. Same pattern for
all other listed compounds.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
* **select:** `SelectProps` is now a discriminated union of
`SelectSingleProps | SelectMultiProps`. Existing single-select callers
that imported `SelectProps` directly may need to narrow with `multiple`
to retain the previous shape — at the call site (`<Select ... />`) the
existing API is identical with no migration required.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
* **breadcrumb:** Consumers relying on the prior overflow-as-clip default
must pass `collapseOnOverflow={false}`. Tests asserting against label
text via `getByText` will see two matches per label (visible row +
hidden measurement copy) when the default is active — opt out in tests
that aren't exercising the collapse algorithm.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>

### Features

* 6 new components, dark-aware bug fixes, and a unified docs toolbar ([0e70029](https://github.com/nori-ui/nori-ui/commit/0e70029487e94d34d050a348480ef25e3e4e9992))
* **animation:** reanimated as required peer + cross-platform timing match ([e5bd785](https://github.com/nori-ui/nori-ui/commit/e5bd785e02fc245625600749dbc036aeacd4bf27))
* **breadcrumb:** cross-platform Breadcrumb with width-aware collapse ([dc2bc5b](https://github.com/nori-ui/nori-ui/commit/dc2bc5bcbf7724e36ddd59855b8b34823058ab3c))
* **breadcrumb:** default collapseOnOverflow to true ([75f990b](https://github.com/nori-ui/nori-ui/commit/75f990bfad6ec0d079f7a66694f0626338d35dfc))
* **core/calendar:** add constraint helpers (isOutOfRange, composeUnavailable) ([b0152b7](https://github.com/nori-ui/nori-ui/commit/b0152b743143772606a8c8bbef24b9417ae828d1))
* **core/calendar:** add DayCell view component with state-based styling ([a1c1c40](https://github.com/nori-ui/nori-ui/commit/a1c1c40984b74a90462c745b615570f91d27ac6b))
* **core/calendar:** add DayGrid — weekday header row and 6×7 cell grid for one month ([d9bcdd2](https://github.com/nori-ui/nori-ui/commit/d9bcdd258c9612980d5cc752cf8eb1660bc62f66))
* **core/calendar:** add visible body fade-up animation on view/month change ([845bec9](https://github.com/nori-ui/nori-ui/commit/845bec97e1c097f2da38e29b48d4da9f18da4314))
* **core/calendar:** calendar component with single/range/multi + drill-down + visibleMonths ([4848a07](https://github.com/nori-ui/nori-ui/commit/4848a0773cd3123645d1857fe376636d26dbbd46))
* **core/calendar:** caption=dropdown with month/year selects + composition slot ([28e9398](https://github.com/nori-ui/nori-ui/commit/28e9398386858a04f989615b520074761845ad7b))
* **core/calendar:** define shared types (Mode, View, CalendarProps, DayContext) ([9986493](https://github.com/nori-ui/nori-ui/commit/9986493136349aca2b416f31b4874bbb3d285db4))
* **core/calendar:** every month title triggers drilldown; visibleMonths is now a max ([d69a4b4](https://github.com/nori-ui/nori-ui/commit/d69a4b4be7723d26231e3a7e1de5257f685aa99f))
* **core/calendar:** header with prev/next nav and view-drilldown title ([8f30c62](https://github.com/nori-ui/nori-ui/commit/8f30c62d12692e5785806845007ef8d1d73f80a3))
* **core/calendar:** keyboard handler implementing the React Aria key contract ([5f38e27](https://github.com/nori-ui/nori-ui/commit/5f38e27f195223aaadbbf056f9e43cb1fcb1071c))
* **core/calendar:** locale utilities (firstDayOfWeek, weekend, formatters) ([282e0ae](https://github.com/nori-ui/nori-ui/commit/282e0aedd6dd2c360db3979bb5b90106500069bd))
* **core/calendar:** monthGrid and yearGrid for drill-down navigation ([234acee](https://github.com/nori-ui/nori-ui/commit/234acee22f739d71e94d8852c323414e8b0deb07))
* **core/calendar:** refined visual design with hover transitions and continuous range fill ([df55945](https://github.com/nori-ui/nori-ui/commit/df55945ab6b0300128da9a9f404e35d49f0b9a86))
* **core/calendar:** useCalendarState (single + multiple modes, view drill-down, focus arithmetic) ([80952d6](https://github.com/nori-ui/nori-ui/commit/80952d6bdea43545b66023514184d7bf7e1f2a7d))
* **core/calendar:** useRangeState (pending start, hover preview, min/max nights) ([8daa522](https://github.com/nori-ui/nori-ui/commit/8daa522fd2289c085c1518ff8fe574a085058ef2))
* **core/select:** keyboard a11y — popup arrow nav and type-ahead without search ([e0e46cb](https://github.com/nori-ui/nori-ui/commit/e0e46cb8d96c57298b30c420f1dfcfd2d4b8105d))
* **core:** add Alert with tone, dismiss, and default semantic icon ([16d70db](https://github.com/nori-ui/nori-ui/commit/16d70db526d19a400a33cc3e9e273876f4eaddeb))
* **core:** add Avatar with image fallback to initials ([fa9f841](https://github.com/nori-ui/nori-ui/commit/fa9f84171d7ce90dea15f9abad08f3830ca8cc30))
* **core:** add Badge with tone + appearance ([c83a2d9](https://github.com/nori-ui/nori-ui/commit/c83a2d9b4f9d5f7bcfa199f6130f7a83aa9091b2))
* **core:** add Card with header/title/description/content/footer ([4b0a13a](https://github.com/nori-ui/nori-ui/commit/4b0a13a212a8575126afaafea092692f4af9d172))
* **core:** add Dialog with focus trap, scroll lock, escape close ([ddbb1ee](https://github.com/nori-ui/nori-ui/commit/ddbb1ee37f6cde419553fb2647775816a8fe93d0))
* **core:** add LocaleProvider and useLocale with Intl auto-detection ([25acfb0](https://github.com/nori-ui/nori-ui/commit/25acfb09adb89db80e830bfcb9c625cbcd1c69a9))
* **core:** add RadioGroup + Radio with full keyboard nav ([1129771](https://github.com/nori-ui/nori-ui/commit/11297716bb324bfb48911234f6e93e75fd48c7f5))
* **core:** add SegmentedControl with WAI-ARIA radiogroup keyboard nav ([da8861a](https://github.com/nori-ui/nori-ui/commit/da8861a0bd20cdeb71db3a11f0267a97f5bd3dff))
* **core:** add Select with search, async, virtualization, groups, locale sort ([3af8403](https://github.com/nori-ui/nori-ui/commit/3af84037da55dfe26b2939e2437625bc2bfb5b2d))
* **core:** add Separator primitive ([b871cdb](https://github.com/nori-ui/nori-ui/commit/b871cdb2b8b9eec836aa4ed9a6465ca6f9fb265a))
* **core:** add Skeleton with subtle pulse animation ([ec3ed5f](https://github.com/nori-ui/nori-ui/commit/ec3ed5facb87ff4326624c4c7b948d1846e89900))
* **core:** add Slider with single/range/multi, RTL, vertical, full a11y ([64b9015](https://github.com/nori-ui/nori-ui/commit/64b9015f527c5ea6e3049d29b194cc4b9f0b5353))
* **core:** add Tabs with WAI-ARIA tablist + roving tabindex ([55b046d](https://github.com/nori-ui/nori-ui/commit/55b046d256241c9a3df70e04f7627510270e2c51))
* **core:** add Toast with provider, useToast(), auto-dismiss, action ([6423e19](https://github.com/nori-ui/nori-ui/commit/6423e19727d1f2b46aab346b7dbb575e8d634786))
* **core:** clickable labels, resizable TextArea, Box flex prop ([0ba0d35](https://github.com/nori-ui/nori-ui/commit/0ba0d352bd2491e3b31b02f242e5afe831db23ff))
* **core:** export Calendar from package root with compound slots ([294179a](https://github.com/nori-ui/nori-ui/commit/294179a9827d772a7fca120d0e08b3a981f4603e))
* **core:** first-class dark-mode support across every visual component ([9c12a60](https://github.com/nori-ui/nori-ui/commit/9c12a60214a915f3e87850bf6d1fabc4e33c75c8)), closes [#ffffff](https://github.com/nori-ui/nori-ui/issues/ffffff) [#27272a](https://github.com/nori-ui/nori-ui/issues/27272a)
* **core:** migrate all compounds to dot notation ([77945c1](https://github.com/nori-ui/nori-ui/commit/77945c10e35de2c088411a1dd713d44ad9ace97f))
* **core:** NoriProvider accepts locale prop with Intl auto-detection default ([4acc067](https://github.com/nori-ui/nori-ui/commit/4acc067a42656498132efe2112890dd2ea836c87))
* **core:** noriProvider colorScheme prop to force light/dark for descendants ([079ac8d](https://github.com/nori-ui/nori-ui/commit/079ac8d7fbecf861ba90f5c43df403a458106ba0))
* **core:** optional reanimated peer + Toggle visibility fix ([2bfb34c](https://github.com/nori-ui/nori-ui/commit/2bfb34c5c62e1f14a5fafc798642c8ab9ff47b18))
* **core:** release 0.0.3 + regenerate snacks against it ([8ed5aed](https://github.com/nori-ui/nori-ui/commit/8ed5aeddccd6155c1ba87aa5dffc21cc60fdbc44))
* **core:** subtle CSS transitions on Switch, Tabs, Toast, Dialog ([6059534](https://github.com/nori-ui/nori-ui/commit/6059534a1100f025ba6f23b3beabea85faa8b9f5))
* **core:** theme support — six bundled presets + custom NoriTheme API ([616d50b](https://github.com/nori-ui/nori-ui/commit/616d50b9ddc650bf42ce01823e08efc8091819f8))
* **core:** theme tokens flow through every component ([0e20041](https://github.com/nori-ui/nori-ui/commit/0e2004136427399e99e3870c51f37ac2b8b1da55))
* **docs:** add @nori-ui/tailwindcss-stub to unblock snack ([b40ffd8](https://github.com/nori-ui/nori-ui/commit/b40ffd85cfb231fcd3b33fdd5657fb5c05d003bd))
* **docs:** add /mcp route exposing search / get-docs / get-props / list-examples ([0814414](https://github.com/nori-ui/nori-ui/commit/0814414958a03e63cf4ae10915f5f2662c5272b5))
* **docs:** add changelog page sourced from GitHub releases ([6184776](https://github.com/nori-ui/nori-ui/commit/61847768e8887248f52aee306b494b718c7a908b))
* **docs:** add copy-as-markdown and view-as-json per page ([2c75753](https://github.com/nori-ui/nori-ui/commit/2c7575341f8d4c0465f39ddbdc294df2d40f52ed))
* **docs:** add direction (LTR/RTL) and locale toggles to Preview ([13f461c](https://github.com/nori-ui/nori-ui/commit/13f461c6fbe26f574df6f404208751daf458aad8))
* **docs:** add edit-on-GitHub link per page ([cadff82](https://github.com/nori-ui/nori-ui/commit/cadff82dbc7e4821c65d0a8c3ccc8ca27258975a))
* **docs:** add Exo 2 as the self-hosted sans companion to Fraunces ([8e5f515](https://github.com/nori-ui/nori-ui/commit/8e5f515f538d593dec4465ffa8d9f37f36c675ca))
* **docs:** add Install tabs and Preview component (live + source) ([894a8ff](https://github.com/nori-ui/nori-ui/commit/894a8ffa8e945ef0054ad7e128d238c86cf4b221))
* **docs:** add LivePreview (web) and ExpoSnack (native) preview components ([068b6ba](https://github.com/nori-ui/nori-ui/commit/068b6baa66138c9517828cfaf16818c66840811a))
* **docs:** add prev/next footer arrows on every doc page ([5faffad](https://github.com/nori-ui/nori-ui/commit/5faffad10df97f5e8dc3fa3fd09349b1bb608453))
* **docs:** add root + /docs layouts, MDX page, home page ([a0c4011](https://github.com/nori-ui/nori-ui/commit/a0c40112771012427dd1eb2bb132e26ccb03eb87))
* **docs:** auto-generate prop tables from TS source ([cd1eb2d](https://github.com/nori-ui/nori-ui/commit/cd1eb2de7cb4a6c64c3c6985899c4b7357b4fa03))
* **docs:** editorial landing page in the brand palette ([e609bb2](https://github.com/nori-ui/nori-ui/commit/e609bb2d09cc8771e5b3b626d72ad93ec08b25c6))
* **docs:** flatten /docs URLs to /docs/components/<slug> + iOS Universal Links ([345c071](https://github.com/nori-ui/nori-ui/commit/345c0710d20e21aadfc4e00493e7e97ec21548f0))
* **docs:** generate real expo snacks programmatically, wire into mdx ([2d9bb64](https://github.com/nori-ui/nori-ui/commit/2d9bb64619f94bfbc82d133befe3132dcc56e89b))
* **docs:** landing copy now reflects dual audience, version sourced from package.json ([97db86c](https://github.com/nori-ui/nori-ui/commit/97db86c5dec86eb5c45683c72ee2159ed703657f))
* **docs:** per-component bundle-size badge ([c58a617](https://github.com/nori-ui/nori-ui/commit/c58a617468a22132cedcf359736d97236ef34a5e))
* **docs:** real logo as favicon + 80px logo above intro page ([0865bb2](https://github.com/nori-ui/nori-ui/commit/0865bb21193a470e990b4adc1e1032f29e7e16ff))
* **docs:** scaffold apps/docs (next.js 15 + fumadocs 15) ([ec56923](https://github.com/nori-ui/nori-ui/commit/ec569231a2a11c7c53c290798c2a6f7100417145))
* **docs:** serve llms.txt and llms-full.txt from fumadocs source ([f560fd4](https://github.com/nori-ui/nori-ui/commit/f560fd4fa1e00acc5437c1417fdf221901f39f4b))
* **docs:** syntax-highlight Install + Preview code via shiki tokens ([3c7a7a9](https://github.com/nori-ui/nori-ui/commit/3c7a7a91b9272028a4414041f1a58a3b777ce379))
* **docs:** theme switcher actually flips Button colors via CSS variables ([0d9aacf](https://github.com/nori-ui/nori-ui/commit/0d9aacf86b2ba47ab6c5be397bcda4e877be09f4))
* **docs:** theme switcher flips full primary ramp + vertical Separator + tabular slider readouts ([cf2ce16](https://github.com/nori-ui/nori-ui/commit/cf2ce16e48074f65ffb540bbd0bd4d6373197729)), closes [#ffe4e6](https://github.com/nori-ui/nori-ui/issues/ffe4e6) [#ffedd5](https://github.com/nori-ui/nori-ui/issues/ffedd5) [#fecdd3](https://github.com/nori-ui/nori-ui/issues/fecdd3) [#fed7aa](https://github.com/nori-ui/nori-ui/issues/fed7aa) [#fda4af](https://github.com/nori-ui/nori-ui/issues/fda4af) [#fdba74](https://github.com/nori-ui/nori-ui/issues/fdba74)
* **docs:** top-of-page prev/next arrows on every doc ([809cc01](https://github.com/nori-ui/nori-ui/commit/809cc01ae2bdf7ffd04f70786eb0a50eda0ee743))
* **docs:** use the brand wordmark image for the landing hero ([8923413](https://github.com/nori-ui/nori-ui/commit/892341371ce80d766c8f6a573b99f35c4be7e721))
* **docs:** wire fumadocs source with typed frontmatter schema ([37eb4bc](https://github.com/nori-ui/nori-ui/commit/37eb4bc02ce77404c1333a7ecfd9e5eb798e06a2))
* **float-button:** cross-platform AntD-parity Floating Action Button ([4124183](https://github.com/nori-ui/nori-ui/commit/4124183128e81f3dc6d80e51704b458920424a2f))
* **mcp:** local @nori-ui/mcp package + HTTP route now wraps the same server ([d54dbba](https://github.com/nori-ui/nori-ui/commit/d54dbbac32fb7a3dbb66b9dd3275af75b174fa47))
* **pagination:** add Pagination.Jumper sub-part ([6da466c](https://github.com/nori-ui/nori-ui/commit/6da466c86fb765dcc9e923fa233093fd0f347ced))
* **pagination:** cross-platform Pagination + headless usePagination hook ([dc1c9ec](https://github.com/nori-ui/nori-ui/commit/dc1c9ecd09ac1ca3c79fa14a2d568a7ecc3ebc26))
* **playground-native:** app icon and splash screen with theme-aware backgrounds ([0f54a52](https://github.com/nori-ui/nori-ui/commit/0f54a52819acacc5370e58af548b0de3d9a246d1)), closes [#EFE7D2](https://github.com/nori-ui/nori-ui/issues/EFE7D2) [#1F2D24](https://github.com/nori-ui/nori-ui/issues/1F2D24)
* **playground-native:** floating color-scheme toggle (auto/light/dark) ([66fa884](https://github.com/nori-ui/nori-ui/commit/66fa88462ca8f10cc25d8c3182dfe72c41d7e115))
* **playground-native:** full library showcase with dark editorial chrome ([f92e24b](https://github.com/nori-ui/nori-ui/commit/f92e24bb2d7879abfaa2e082e074d73643ef6f49))
* **playground-native:** scaffold expo sdk 55 + new architecture ([c62b75a](https://github.com/nori-ui/nori-ui/commit/c62b75a046f195402fdeab929e19055d14b62c56))
* **playground-native:** showcase home + detail with deep linking ([bb30731](https://github.com/nori-ui/nori-ui/commit/bb30731b9656eb18b4da39b74c39fcfd1a465c79))
* **playground-native:** swap to expo-router + nori-ui:// scheme ([b312b50](https://github.com/nori-ui/nori-ui/commit/b312b50358587d9e2c76bace25afb083badc4d3d))
* **playground-native:** wire nativewind v4, metro workspace resolution, tokens preset ([9f3215e](https://github.com/nori-ui/nori-ui/commit/9f3215ecd10ea87847711536e9c04afc1486a3df))
* **playground-web:** add storybook 8 on vite builder, discovers stories from packages/ui ([0db7cbf](https://github.com/nori-ui/nori-ui/commit/0db7cbfe8773fc459a831c4c67579bf3db83ee61))
* **playground-web:** scaffold vite + react 19 + react-native-web ([57a1838](https://github.com/nori-ui/nori-ui/commit/57a1838b46aa572d8bd63e6d2d1a19bbd3a539bb))
* **playground-web:** wire nativewind + tailwind preset from @nori-ui/tokens ([b059cb0](https://github.com/nori-ui/nori-ui/commit/b059cb0ae3f41d3aa9295c045546af1e467b665b))
* **plugin:** add @nori-ui/plugin agent-skills installer package ([7fcea85](https://github.com/nori-ui/nori-ui/commit/7fcea85ee1c140e6ef3a52ac8bcb8862e66a0096))
* **select:** multi-select via discriminated `multiple` prop ([52623b5](https://github.com/nori-ui/nori-ui/commit/52623b546129e5ff676142753dc6d6b64bdaab6b))
* **stories:** per-story platforms filter, hide Breadcrumb WidthCollapse on native ([c6fdb6c](https://github.com/nori-ui/nori-ui/commit/c6fdb6ced60600f63a517a644627c043e992682f))
* **toast:** cross-platform sonner-based Toast ([e5ae4af](https://github.com/nori-ui/nori-ui/commit/e5ae4af526e9d73b61d104fdea8bfd92619effde))
* **toast:** swap custom native viewport for sonner-native ([5e069d1](https://github.com/nori-ui/nori-ui/commit/5e069d13c142e22d92a90a9a180762f43b5af004))
* **tokens:** add public entry re-exporting generated theme + preset path ([34ca8e6](https://github.com/nori-ui/nori-ui/commit/34ca8e67ccc0c5a072bd20855cfe138b98f6d37a))
* **tokens:** add style-dictionary config with light+dark modes ([1696b6b](https://github.com/nori-ui/nori-ui/commit/1696b6b89a0eda721a51aa02bb45ae414aefa683))
* **tokens:** add tailwind-preset custom format ([54a4a9a](https://github.com/nori-ui/nori-ui/commit/54a4a9afcebe015203af239178c6dc40c2adab95))
* **tokens:** add theme-types custom format ([eedcb24](https://github.com/nori-ui/nori-ui/commit/eedcb24b0431cd98e6cafc0adf6d298b66ca4888))
* **tokens:** seed color core tokens (primary, neutral, semantic) ([6a5c6b0](https://github.com/nori-ui/nori-ui/commit/6a5c6b0975675affa63d901026bd523f75e12c85))
* **tokens:** seed semantic aliases for light and dark modes ([1c84ea1](https://github.com/nori-ui/nori-ui/commit/1c84ea1d545460ed862fde4a7ff36b18f42f8b01))
* **tokens:** seed spacing, radius, typography, shadow core tokens ([72794fa](https://github.com/nori-ui/nori-ui/commit/72794fa2840de11c82400611b789015ed177fc7b))
* tooltip + accordion slide animation + softer dialog blur + flat docs nav ([5143b05](https://github.com/nori-ui/nori-ui/commit/5143b0555c35c711a31489616265bbce63d351b0))
* **ui:** add Box layout primitive ([8c7e8ba](https://github.com/nori-ui/nori-ui/commit/8c7e8ba348e37c03c8989fdfbc81ad85b6d83460))
* **ui:** add Button stories and re-export Button + Spinner from components barrel ([8ec1834](https://github.com/nori-ui/nori-ui/commit/8ec1834388fd991cd6d62422a36bf52db5c5fab0))
* **ui:** add Button with 4 variants, 3 sizes, loading state, icon slots, asChild ([8ca0888](https://github.com/nori-ui/nori-ui/commit/8ca08883bfec628699fb462580eb351edf16294d))
* **ui:** add Checkbox + Switch stories and registry entries ([bc7c50d](https://github.com/nori-ui/nori-ui/commit/bc7c50d92d2f115692a700ad422c39db06c8dada))
* **ui:** add Checkbox with indeterminate, asChild, semantic-icon checkmark ([8a8c804](https://github.com/nori-ui/nori-ui/commit/8a8c8040b87c930ee663910635814f4d28822d0b))
* **ui:** add client entry with use-client exports ([b410f62](https://github.com/nori-ui/nori-ui/commit/b410f627eb98d90f5cb5051fefc902467483e9a6))
* **ui:** add cn() class-name helper with clsx-compatible shape ([92040b9](https://github.com/nori-ui/nori-ui/commit/92040b98a36da3463010bceca9fb3bc884fe96cf))
* **ui:** add composeRefs helper for merging refs ([e37e9b5](https://github.com/nori-ui/nori-ui/commit/e37e9b5b762c7abe615ff6f4bc15cdcf9179008c))
* **ui:** add HStack layout primitive with gap/align/justify ([164e5c6](https://github.com/nori-ui/nori-ui/commit/164e5c6941b63203284bb9cd6ec3f4bd15c7e228))
* **ui:** add i18n public barrel (rsc-safe subset) ([db2ab3c](https://github.com/nori-ui/nori-ui/commit/db2ab3c984f6d79d6cfdb29a5490baa0e9099b44))
* **ui:** add i18n resolver for dict/function/default inputs with interpolation and plurals ([072b938](https://github.com/nori-ui/nori-ui/commit/072b938a13f094276f2a1e00a6ac3122626d8828))
* **ui:** add I18nProvider and useTranslation hook ([ebacecf](https://github.com/nori-ui/nori-ui/commit/ebacecf708d5e4d598f2f427cd778337f440974f))
* **ui:** add icons public barrel ([d06e1e6](https://github.com/nori-ui/nori-ui/commit/d06e1e64920d647253b2c38cd2bdf8cd8cf88091))
* **ui:** add NoriProvider composing theme/i18n/icons ([b659b6f](https://github.com/nori-ui/nori-ui/commit/b659b6f146231ceeca2509e889d71afe088a00f2))
* **ui:** add RSC-safe Icon wrapper with keyword + numeric size ([a8c1402](https://github.com/nori-ui/nori-ui/commit/a8c1402feaf0c3bb91e0223158821430dbab0d15))
* **ui:** add semantic-icons registry with provider override ([103c0ad](https://github.com/nori-ui/nori-ui/commit/103c0ad71c37a33ef69db779e3c273471a842a86))
* **ui:** add Slot primitive for asChild composition pattern ([7edd460](https://github.com/nori-ui/nori-ui/commit/7edd460a22cbf8c3949e4699c28309aa3b147fc7))
* **ui:** add Spinner stories and registry entries ([e1d93f9](https://github.com/nori-ui/nori-ui/commit/e1d93f968aa993c5e096995a36472b39860b82e6))
* **ui:** add Spinner with a11y role=progressbar and reduced-motion support ([99836c4](https://github.com/nori-ui/nori-ui/commit/99836c4eca690035a7b5af3ecd872b60ba7dc7f5))
* **ui:** add stories for Text, Box, HStack, VStack + registry entries ([59166f7](https://github.com/nori-ui/nori-ui/commit/59166f7824c5f6563aa548b57ee900c3b031a2f7))
* **ui:** add story registry and placeholder smoke story ([c7f7a5d](https://github.com/nori-ui/nori-ui/commit/c7f7a5df4fcb13d16bb0e1baf957bcd516288475))
* **ui:** add Switch with role=switch, controlled+uncontrolled, asChild ([7d81116](https://github.com/nori-ui/nori-ui/commit/7d81116ad257e42285e1037eef8556ecab8aa98e))
* **ui:** add Text primitive with 7 variants and heading a11y role ([b773f2e](https://github.com/nori-ui/nori-ui/commit/b773f2e3eaabd4d0df5b1209d9ef48e90d9b22c9))
* **ui:** add TextArea as multiline wrapper over TextInput ([f047e33](https://github.com/nori-ui/nori-ui/commit/f047e33dd285619da10643cfa180a48c151d792f))
* **ui:** add TextInput + TextArea stories, re-export from components barrel ([d865c04](https://github.com/nori-ui/nori-ui/commit/d865c04c3faf5c011ab033842a1e8967b74e0e43))
* **ui:** add TextInput with label, helper, error, prefix/suffix slots, WCAG AA a11y ([daf31da](https://github.com/nori-ui/nori-ui/commit/daf31da58d2dc462461a95a12876ecbf33f22f3e))
* **ui:** add ThemeProvider and useTheme hook ([fe205c5](https://github.com/nori-ui/nori-ui/commit/fe205c5b3144d9303c0cc349bf8ef56a801da561))
* **ui:** add VStack layout primitive ([077e376](https://github.com/nori-ui/nori-ui/commit/077e37662e1da0ff4753626dfefc20fbd3d40224))
* **ui:** re-export layout primitives from public entry ([33743b6](https://github.com/nori-ui/nori-ui/commit/33743b6abf5f5d5a4e697c8eb2963d11c611231f))
* **ui:** rewrite default entry as RSC-safe barrel ([5d89e93](https://github.com/nori-ui/nori-ui/commit/5d89e93d35b556aaf52f2a7f6b2875c8ea0745a3))
* **ui:** seed i18n types and default English dictionary ([39bb6e5](https://github.com/nori-ui/nori-ui/commit/39bb6e53476953f4bd4023dd57a0efb484ce10c7))
* **ui:** wire @nori-ui/tokens into packages/ui as theme export ([5754a1f](https://github.com/nori-ui/nori-ui/commit/5754a1fb594d434c59c831878cce00e1d639b512))

### Bug Fixes

* **breadcrumb:** width-collapse memo never invalidated on native ([9764843](https://github.com/nori-ui/nori-ui/commit/9764843b0ed5f8ca12570b2da175af9849947d90))
* **breadcrumb:** width-collapse on native + pseudo-link demos ([61233db](https://github.com/nori-ui/nori-ui/commit/61233db8f4c386bd039db98329589fe4de6d7ee8))
* **button:** disabled state suppresses hover + adds pointer-events-none ([9efb9f7](https://github.com/nori-ui/nori-ui/commit/9efb9f7e24d2f6fa069d4887cf433a711f40550d))
* **button:** drop Tailwind utilities for theme-controlled props ([99943df](https://github.com/nori-ui/nori-ui/commit/99943dfcd31856121ca7b4a531478d7cf8118697))
* **button:** inline-style flow so ThemeProvider tokens reach the rendered button ([446e5fe](https://github.com/nori-ui/nori-ui/commit/446e5fefccedf13be6b74d50f809b24aa072463c))
* **ci:** detach root workspaces field so npm version stops walking the tree ([dca8f63](https://github.com/nori-ui/nori-ui/commit/dca8f63c0264b60ad153965260017f808f3f38ea))
* **ci:** drop registry-url from setup-node so oidc trusted publishing works ([9f397bd](https://github.com/nori-ui/nori-ui/commit/9f397bd02c795797e56039433bc50cdf1ce436f6))
* **ci:** quote step name containing colon so yaml parses ([fe8ab94](https://github.com/nori-ui/nori-ui/commit/fe8ab94158cf835f0be216ff96bb1f5166f96625))
* **ci:** read oidc env vars from shell, not workflow expression context ([6bb1bee](https://github.com/nori-ui/nori-ui/commit/6bb1beee05cf5873df07c7412d8f61a394ebd935))
* **ci:** rewrite workspace: protocol in all package.json files (apps included) ([5d317dc](https://github.com/nori-ui/nori-ui/commit/5d317dccca2d5dee1f32d8c51faa8ab598ecd655))
* **ci:** substitute workspace: protocol before npm version (npm 11 rejects it) ([af80df1](https://github.com/nori-ui/nori-ui/commit/af80df19dd8f99e9c3e3c58e44a01f8bb6f1dda9))
* **ci:** unbreak docs eval + playwright after the per-component split ([4f30f50](https://github.com/nori-ui/nori-ui/commit/4f30f5067f8d4bf83435a3f5891aff8ccb0b81b6))
* **core/calendar:** address PR [#1](https://github.com/nori-ui/nori-ui/issues/1) review — range-mode parity, slot removal, locale regex ([461ba52](https://github.com/nori-ui/nori-ui/commit/461ba52269c433e705e05a626ce69205aae092fe))
* **core/calendar:** correct px() misuse — paddings were 4x too tight ([7a3c125](https://github.com/nori-ui/nori-ui/commit/7a3c1250b9440758a5e59114e43fa94c02f91559))
* **core/calendar:** disable search on month and year dropdowns ([224db0a](https://github.com/nori-ui/nori-ui/commit/224db0a680adf7c12c24e9817e0d10c120725443))
* **core/calendar:** drilldown selection lands in the slot the title was clicked from ([08c83db](https://github.com/nori-ui/nori-ui/commit/08c83dbf888db30d59119c4fd21f78aaebaaeca1))
* **core/calendar:** dropdown selection stays in the clicked slot, not slot 0 ([80b2a2f](https://github.com/nori-ui/nori-ui/commit/80b2a2f9536b73676bbc8b1038484d6af5deecc5))
* **core/calendar:** keep dom focus glued to focuseddate across keyboard nav ([092160b](https://github.com/nori-ui/nori-ui/commit/092160b74ef318e2244bf7039bd8e97734686e38))
* **core/calendar:** keyboard arrow nav now visibly moves the focus ring ([bfe353f](https://github.com/nori-ui/nori-ui/commit/bfe353f4029e61044b86b98ecdd5067e76bd3bdd))
* **core/calendar:** per-month titles in multi-month layout (Airbnb pattern) ([d8b583a](https://github.com/nori-ui/nori-ui/commit/d8b583a10efa446e8a1e93af016281c1804afb4f))
* **core/calendar:** pgdn/pgup also shift the visible anchor ([bc5a053](https://github.com/nori-ui/nori-ui/commit/bc5a053928a1e46ab2466c3f54edfe2bc5ad3db7))
* **core/calendar:** prev/next arrows no longer revert via the snap-effect ([a0e5061](https://github.com/nori-ui/nori-ui/commit/a0e50610fc841df97765d820ac78a98f614bc15f))
* **core/calendar:** responsive layout, anchored months, centered drilldown, better demo ([c5202c5](https://github.com/nori-ui/nori-ui/commit/c5202c5d22e40269e033ae46746902120bb064e5))
* **core/calendar:** skip disabled days during keyboard nav; fall back to root focus ([e0737a1](https://github.com/nori-ui/nori-ui/commit/e0737a136d20bc8df12057473419fcf20444fcaa))
* **core:** accordion height, hstack/vstack inline layout, checkbox stories ([dfc0fb2](https://github.com/nori-ui/nori-ui/commit/dfc0fb2623beadc619cb3e9988a74d465fa65816))
* **core:** animate Dialog backdrop blur smoothly from 0 to 8px ([84dd59f](https://github.com/nori-ui/nori-ui/commit/84dd59ff7f8c36b562a7f26bdfcdbe9784327d89))
* **core:** blur scrim fallback, slider gesture provider, story polish ([1291f1b](https://github.com/nori-ui/nori-ui/commit/1291f1b78e33d08cc5ed96d60af987854ec72cc1))
* **core:** bump tsup DTS heap to 8 GB so per-component build doesn't OOM ([f3f5fa1](https://github.com/nori-ui/nori-ui/commit/f3f5fa144d080f87aef03c6e9389ae7dabfe6efe))
* **core:** clip textarea resize grippy inside the input border ([aae5a65](https://github.com/nori-ui/nori-ui/commit/aae5a65442d1faa0c13228736fbce84549e78434))
* **core:** csf-slugs handles undefined regex group under noUncheckedIndexedAccess ([5f3abad](https://github.com/nori-ui/nori-ui/commit/5f3abad24444f05f6d270b0c23cfb6194f2670cd))
* **core:** dark-mode awareness, expo-blur scrim, select native crash, popover viewport clamp ([bc257dc](https://github.com/nori-ui/nori-ui/commit/bc257dc2a75ea296a3487493fa9c4c675b2e3a1e))
* **core:** dark-mode theme colors + native Accordion animation + flat showcase ([1a46cd9](https://github.com/nori-ui/nori-ui/commit/1a46cd90a366d503bb84554340a98182702076e7))
* **core:** dialog asChild trigger/close forwards both onClick and onPress ([5b590da](https://github.com/nori-ui/nori-ui/commit/5b590dafb0210169f0b451a24847fd114fa749c1))
* **core:** port Dialog's animated backdrop blur to AlertDialog ([a23b728](https://github.com/nori-ui/nori-ui/commit/a23b7286d38329946d3e563870e7edc2b6fc0283))
* **core:** re-export SliderGestureProvider and useSliderInteractionActive ([1a2c04c](https://github.com/nori-ui/nori-ui/commit/1a2c04c3e07200ff4336f25a700db002406e1644))
* **core:** real native blur, slider responder capture, popover overflow, toggle text color ([df0113a](https://github.com/nori-ui/nori-ui/commit/df0113a43ff7a874a56c4ede7ba8538b8648754f))
* **core:** select popup uses position:fixed so it escapes ancestor overflow ([309d5aa](https://github.com/nori-ui/nori-ui/commit/309d5aaad59cc52bd465d6464a5060a76b5db33e))
* **core:** ship inline-style defaults for NativeWind-less environments ([ace22b9](https://github.com/nori-ui/nori-ui/commit/ace22b9c355e99c6d938bcc98d1c6088bd97a000))
* **core:** slider native gesture support, vertical story, toggle-group examples ([a2b7e5b](https://github.com/nori-ui/nori-ui/commit/a2b7e5be015cb5577af00e7370e84d773ab272f6))
* **core:** text honors colorScheme override on native — single context instance ([29f850a](https://github.com/nori-ui/nori-ui/commit/29f850ac412f641fb94b21232ca742c73c8b74b6))
* **core:** tighten peer deps so expo snacks resolve to working versions ([177ffc5](https://github.com/nori-ui/nori-ui/commit/177ffc53eb66dded8613e3930419ffc7987ce10b))
* **core:** wrap raw string children in Text — fixes native crash + dark mode ([cd42fb3](https://github.com/nori-ui/nori-ui/commit/cd42fb3b162e9a8a1de3a480a8043ecee6726cae))
* **docs:** apply yarn patch so fumadocs-ui createPreset() actually loads ([3a52cc8](https://github.com/nori-ui/nori-ui/commit/3a52cc8d70dfa9cc662109b430e5cdb2678de4a3))
* **docs:** build @nori-ui/mcp before docs in Vercel pipeline ([1a5d470](https://github.com/nori-ui/nori-ui/commit/1a5d47021a349743140605c1002455730e5d6848))
* **docs:** custom-render demo uses themed colors so it works in dark mode ([5b31dea](https://github.com/nori-ui/nori-ui/commit/5b31dea2897435311f70f7e8b0357439c3ae1d24))
* **docs:** dialog demo cancel button uses secondary, not ghost ([b9410c1](https://github.com/nori-ui/nori-ui/commit/b9410c10b99f64bd1540871b3430f3032e3f2271))
* **docs:** drop closeButton from the global Toaster — wasn't requested ([9879c57](https://github.com/nori-ui/nori-ui/commit/9879c573769be7106e9f99f44cea6084fec8bb94))
* **docs:** drop tailwindcss entirely from snacks, pin rn-css-interop 0.2.1 ([25f7866](https://github.com/nori-ui/nori-ui/commit/25f7866746d38b000e0b31da996199283a0e9354))
* **docs:** drop tailwindcss from snack deps (snack fetches it transitively) ([4a6e93b](https://github.com/nori-ui/nori-ui/commit/4a6e93bef9fc7b27804a2df843d8eeef5a388855))
* **docs:** drop unsupported snack config files, fix sdk55 version pins ([bc3bade](https://github.com/nori-ui/nori-ui/commit/bc3bade691f57ff40361ea56de129249a26917a9))
* **docs:** inline generate step into build/dev/etc — yarn 4 doesn't run pre* hooks ([7f968a0](https://github.com/nori-ui/nori-ui/commit/7f968a0d39ba36bce994378758d847f9eca004ed))
* **docs:** one global Toaster — multiple per-demo Toasters were duplicating every toast ([38c753f](https://github.com/nori-ui/nori-ui/commit/38c753fb6bf6cf1d071303f499bdf88778e20c6a))
* **docs:** regenerate snacks with plain semver (tarball URL was rejected) ([6a752b8](https://github.com/nori-ui/nori-ui/commit/6a752b88e447d88c12af25530bee997ecf2205d4))
* **docs:** regenerate snacks with tarball URLs to bypass snack cache ([d32ea65](https://github.com/nori-ui/nori-ui/commit/d32ea65ae110c48e78a1af4c405782615d4bc2a6))
* **docs:** register calendar page in sidebar nav ([745332f](https://github.com/nori-ui/nori-ui/commit/745332fb5375996d3cd6cf8a37e801038c59ef09))
* **docs:** search + dark-mode content area ([0b953d5](https://github.com/nori-ui/nori-ui/commit/0b953d568bd09a7363c343b26438837e396212ab))
* **docs:** ship nativewind config + correct peers in every snack ([6463dea](https://github.com/nori-ui/nori-ui/commit/6463deac0b2ca95aa83b1fa3a7a24a5958d6d352))
* **docs:** snack deps — pin tailwindcss 3.3.3, drop rn-css-interop explicit ([f93a124](https://github.com/nori-ui/nori-ui/commit/f93a124f69b00a4ceca7637c658a3a90a52de44d))
* **docs:** snacks import components directly, skip NoriProvider subpath ([c9e62e2](https://github.com/nori-ui/nori-ui/commit/c9e62e273b0d5ce70ffb0d2c4b3ab1da5bc1544c))
* **docs:** tighten lineHeight in custom-render demo so 2 lines fit the cell ([286c1b9](https://github.com/nori-ui/nori-ui/commit/286c1b9b48229554e5587d77c1fc22d24c26b606))
* **docs:** use Separator in ThemingTokens demo instead of VStack gap=5 ([d66e2ca](https://github.com/nori-ui/nori-ui/commit/d66e2cab31608202231840ad0d29d6a8f8651b6f))
* **docs:** web stub for reanimated must render real Views, not noop ([c5f4a64](https://github.com/nori-ui/nori-ui/commit/c5f4a64cbb10870a65edc945bdf74a2f66e56782))
* **docs:** wire fumadocs source correctly and flip previews to client ([8a2a9c0](https://github.com/nori-ui/nori-ui/commit/8a2a9c0c98f2fd35305587e9ba6e70484993c278))
* **docs:** wire preview locale switcher to noriprovider locale prop ([9eec085](https://github.com/nori-ui/nori-ui/commit/9eec085b9cb4e67eda5121fd9ecf9c9e4c13f281))
* **float-button:** native positioning + group X icon tint ([67b7cd0](https://github.com/nori-ui/nori-ui/commit/67b7cd04c35ba700e3792b9f73445b6af6c5ec4e))
* **float-button:** render properly on iOS — drop function-form style on native ([7331155](https://github.com/nori-ui/nori-ui/commit/73311554c68d3c7e1abe9e1757509e7afb7e5862))
* **float-button:** silently degrade when no SafeAreaProvider is mounted ([ccb6d1c](https://github.com/nori-ui/nori-ui/commit/ccb6d1c083eb951419914e917c510472085d4343))
* **float-button:** tint icons to match the variant foreground ([7050e3b](https://github.com/nori-ui/nori-ui/commit/7050e3bcd61acb85936a55b863a25c6906f338e9))
* **mcp:** generate data corpus inline before tsup runs ([8c5925d](https://github.com/nori-ui/nori-ui/commit/8c5925d12e98069c932d56a2b591067e80806822))
* **pagination,select:** native rendering — visible selected pill, no Select crash, wrap on overflow ([853be3c](https://github.com/nori-ui/nori-ui/commit/853be3cdfe406266960f6bfbcbe7c4468cbcee4c))
* **playground-native:** hoist hooks above the not-found early return ([097ce91](https://github.com/nori-ui/nori-ui/commit/097ce91d0acf0f4594af40864c5f0bdc9d68ea17))
* **playground-native:** inline plural alias screen so expo-router routes it ([6fbdc66](https://github.com/nori-ui/nori-ui/commit/6fbdc661495ab46555da78319745e6bfb165bd9e))
* **playground-native:** polyfill import.meta in babel-preset-expo for Hermes ([0450a8f](https://github.com/nori-ui/nori-ui/commit/0450a8f1cb86ac7bc10a618cdc51956c028de57f))
* **playground-native:** use theme tokens for chrome so OS scheme drives both ([862d061](https://github.com/nori-ui/nori-ui/commit/862d0614e97463fe4bcd98be91327c94f5118a15))
* **playground-native:** wrap app in SafeAreaProvider for sonner-native insets ([95f25dd](https://github.com/nori-ui/nori-ui/commit/95f25dd3c7d7bc6c396d15eb26e926a6383cbb07))
* **playground-web:** stub react-native ReactFabric shim for web builds ([1d3cb5c](https://github.com/nori-ui/nori-ui/commit/1d3cb5ce327225acd0cce7831f95572877b21d3b))
* **release:** add trailing slash to publishconfig.registry so oidc is recognized ([abe4f05](https://github.com/nori-ui/nori-ui/commit/abe4f05c0ee4c7f473d5d73a41f5836ab8b6ca23))
* **select:** popup renders + opens on native via Modal ([648c390](https://github.com/nori-ui/nori-ui/commit/648c390e803969bcbbe26d7a313b58be6a435959))
* **separator:** vertical rule centered + sized to text glyphs; nori-ui.com domain in select demo ([1308078](https://github.com/nori-ui/nori-ui/commit/13080787056741cc762c76914784eef1d3b1c108))
* **separator:** vertical separator no longer collapses to height: 0 ([eb5f9e0](https://github.com/nori-ui/nori-ui/commit/eb5f9e02a1e3d6f22f650bc19ad87e6e8e78c8b1))
* **slider:** vertical default direction — drag UP increases (top = max) ([840501a](https://github.com/nori-ui/nori-ui/commit/840501af3fa5686821c0fe763195d75ce51da68d))
* **stories:** break csf-slugs ↔ csf-loader cycle, ungate docs parity test ([a67866c](https://github.com/nori-ui/nori-ui/commit/a67866c7a0be2677b238aaa6c94266119721fa3d))
* **stories:** isolate import.meta in csf-loader-bundler.ts ([c2eafcf](https://github.com/nori-ui/nori-ui/commit/c2eafcf01a63e6f4e8a6593a17652e59ea899067))
* **styling:** real visual output — rn-web 0.21, fumadocs v14, nicer App.tsx ([c90ff2d](https://github.com/nori-ui/nori-ui/commit/c90ff2de056f4d4adca5a1812b653b1a6c1561b1))
* **styling:** wire nativewind jsx runtime across library + web apps ([75ed602](https://github.com/nori-ui/nori-ui/commit/75ed60277da978f334631cc5f995d9624378f448))
* **toast:** compute offset = insets + buffer to actually clear the notch ([e279fdc](https://github.com/nori-ui/nori-ui/commit/e279fdcdb393f9ee7085a9b04d61e8e757cba8e7))
* **toast:** drop manual safe-area padding — sonner-native already adds it ([dd83aad](https://github.com/nori-ui/nori-ui/commit/dd83aad2022f39bbe97b20e13cdc7333a16eaefb))
* **toast:** inset native toast from notch/home-indicator via positionerStyle ([e2e3a13](https://github.com/nori-ui/nori-ui/commit/e2e3a133ed3f70c8ce60c5249ef181ae8c24e10f))
* **toggle:** non-string children now flip color with selected state ([e60170b](https://github.com/nori-ui/nori-ui/commit/e60170b62ce57848ed113f4bffb4da9301d140b6))
* **ui:** add inline-style fallbacks so Checkbox/Switch render without NativeWind ([8fc87e0](https://github.com/nori-ui/nori-ui/commit/8fc87e055661e61b5b79fd65f0cee30f08549977))

### Performance Improvements

* **core:** split per-component dist entries so tree-shaking actually works ([45ec948](https://github.com/nori-ui/nori-ui/commit/45ec948906e5c9f7f03b2fb2df7f79db4a44dfec))

### Reverts

* **button:** restore Tailwind utilities I removed in 99943df ([53bcada](https://github.com/nori-ui/nori-ui/commit/53bcada85874435ee141638cdc0d5b8720beb338))
* Revert "fix(ui): add inline-style fallbacks so Checkbox/Switch render without NativeWind" ([ff512b4](https://github.com/nori-ui/nori-ui/commit/ff512b47b848c6e0be98032837c41197607a11a9))

### Code Refactoring

* **core:** consolidate component API surface for consistency ([3696ad1](https://github.com/nori-ui/nori-ui/commit/3696ad1faef263e28681407cd71a50aef4901848))
