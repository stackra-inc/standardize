# @stackra/typescript-config

Shared TypeScript configuration presets for Stackra packages.

## Install

```bash
pnpm add -D @stackra/typescript-config typescript
```

## Presets

| Preset             | Use case                                                |
| ------------------ | ------------------------------------------------------- |
| `base`             | Strict TypeScript with NodeNext module resolution       |
| `bundler`          | ESNext modules with bundler resolution (Vite, tsup)     |
| `next`             | Next.js applications                                    |
| `react-lib`        | React libraries (web)                                   |
| `nest-lib`         | NestJS libraries with decorator support                 |
| `nest-app`         | NestJS applications                                     |
| `react-native-app` | Expo / React Native apps (extends `expo/tsconfig.base`) |
| `react-native-lib` | Publishable React Native libraries                      |

## Usage

Create a `tsconfig.json` in your project root:

```jsonc
{
  "extends": "@stackra/typescript-config/bundler",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
  },
  "include": ["src"],
}
```

### React Native (Expo)

```jsonc
{
  "extends": "@stackra/typescript-config/react-native-app",
}
```

### Next.js

```jsonc
{
  "extends": "@stackra/typescript-config/next",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"],
}
```

### NestJS

```jsonc
{
  "extends": "@stackra/typescript-config/nest-app",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
  },
}
```

## License

MIT
