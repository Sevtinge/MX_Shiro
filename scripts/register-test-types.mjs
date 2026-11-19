import { registerHooks } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../src/', import.meta.url))
registerHooks({
  resolve(specifier, context, next) {
    const target = specifier.startsWith('~/')
      ? pathToFileURL(path.join(root, specifier.slice(2))).href
      : specifier
    try {
      return next(target, context)
    } catch (error) {
      if (
        (target.startsWith('.') || target.startsWith('file:')) &&
        !/\.[a-z]+$/i.test(target)
      ) {
        for (const extension of ['.ts', '.tsx']) {
          try {
            return next(target + extension, context)
          } catch {}
        }
      }
      throw error
    }
  },
})
