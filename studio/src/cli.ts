import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'

const HELP = `airspace-studio [command]

Commands:
  run        Run studio
  build      Build studio into ./.airspace-studio
  preview    Serve ./.airspace-studio

Options:
  --port <port>   Port to listen on
  --host <host>   Host to listen on
  --open          Open studio in your browser
  --help

Run in a directory containing lexicons.ts or studio.config.ts.
`

const COMMANDS = new Set(['run', 'build', 'preview'])

type NuxtCommand = 'build' | 'preview'

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      port: { type: 'string' },
      host: { type: 'string' },
      open: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  })

  const command = positionals[0] ?? 'run'

  if (values.help) {
    process.stdout.write(HELP)
    return 0
  }
  if (!COMMANDS.has(command)) {
    process.stderr.write(`Unknown command "${command}".\n\n${HELP}`)
    return 1
  }
  if (!existsSync('lexicons.ts') && !existsSync('studio.config.ts')) {
    process.stderr.write('No lexicons.ts or studio.config.ts found in this directory.\n')
    return 1
  }

  // Same from src/ and dist/: both sit one level below the package root.
  const studioDir = resolve(import.meta.dirname, '..')
  const manifest = createRequire(import.meta.url).resolve('nuxt/package.json')
  const { bin } = JSON.parse(readFileSync(manifest, 'utf8')) as { bin: string | Record<string, string> }
  const nuxt = join(dirname(manifest), typeof bin === 'string' ? bin : bin.nuxt!)

  const nuxtRun = (nuxtCommand: NuxtCommand): Promise<number> => {
    const args = [nuxt, nuxtCommand, '--cwd', studioDir]
    if (nuxtCommand === 'preview') {
      if (values.port)
        args.push('--port', values.port)
      if (values.host)
        args.push('--host', values.host)
      if (values.open)
        args.push('--open')
    }

    const child = spawn(process.execPath, args, {
      cwd: studioDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        AIRSPACE_STUDIO_ROOT: process.cwd(),
        AIRSPACE_STUDIO_OUTPUT: command === 'run' ? 'cache' : 'project',
      },
    })
    return new Promise((done) => {
      child.on('error', (error) => {
        process.stderr.write(`Failed to start Studio: ${error.message}\n`)
        done(1)
      })
      child.on('exit', code => done(code ?? 0))
    })
  }

  const steps: NuxtCommand[] = command === 'run' ? ['build', 'preview'] : [command as NuxtCommand]
  for (const step of steps) {
    const code = await nuxtRun(step)
    if (code)
      return code
  }
  return 0
}
