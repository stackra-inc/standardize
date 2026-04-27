# @stackra/tsup-config

Shared [tsup](https://tsup.egoist.dev/) configuration presets for Stackra
packages.

## Installation

```bash
pnpm add -D @stackra/tsup-config tsup
```

## Usage

Create a `tsup.config.ts` file in your package root:

### Base Library

```typescript
import { defineConfig } from 'tsup';
import { basePreset } from '@stackra/tsup-config';

export default defineConfig(basePreset);
```

### NestJS Library

For NestJS modules and libraries (uses `tsc` for decorators):

```typescript
import { defineConfig } from 'tsup';
import { nestLibPreset } from '@stackra/tsup-config';

export default defineConfig(nestLibPreset);
```

### NestJS Application

For NestJS applications (single-file bundle with shebang):

```typescript
import { defineConfig } from 'tsup';
import { nestAppPreset } from '@stackra/tsup-config';

export default defineConfig(nestAppPreset);
```

### CLI Library

```typescript
import { defineConfig } from 'tsup';
import { cliLibPreset } from '@stackra/tsup-config';

export default defineConfig(cliLibPreset);
```

### React Library

```typescript
import { defineConfig } from 'tsup';
import { reactLibPreset } from '@stackra/tsup-config';

export default defineConfig(reactLibPreset);
```

## Custom Configuration

Override any preset option:

```typescript
import { defineConfig } from 'tsup';
import { basePreset } from '@stackra/tsup-config';

export default defineConfig({
  ...basePreset,
  minify: true,
  sourcemap: true,
});
```

## Utilities

```typescript
import { loadPackageJson, computeExternals, buildBanner } from '@stackra/tsup-config';

const pkg = loadPackageJson();
const externals = computeExternals(pkg);
const banner = buildBanner(pkg);
```

## Exports

| Export             | Description                                |
| ------------------ | ------------------------------------------ |
| `basePreset`       | Standard TypeScript library                |
| `nestLibPreset`    | NestJS module/library (tsc for decorators) |
| `nestAppPreset`    | NestJS application (single-file bundle)    |
| `cliLibPreset`     | CLI tools and binaries                     |
| `reactLibPreset`   | React component libraries                  |
| `loadPackageJson`  | Load and parse package.json                |
| `computeExternals` | Auto-detect dependencies as externals      |
| `buildBanner`      | Generate license banner for output         |
| `viteAdapter`      | Vite integration adapter                   |

## License

MIT
