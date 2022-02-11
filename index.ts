import { parse } from "https://deno.land/std@0.125.0/flags/mod.ts"
import { Server } from "https://deno.land/std@0.125.0/http/server.ts"

const defaultPort = 8080

const args = parse(Deno.args, {
  alias: {
    'p': 'port'
  }
})
let port = Number(args.port)
if (!Number.isInteger(port)) {
  console.log(`Using default port: ${defaultPort}`)
  port = defaultPort
}

const handler = async (request: Request) => {
  console.log(`URL: ${request.url}`)
  console.log(`Method: ${request.method}`)
  console.log('Headers:')
  request.headers.forEach((v, k, _) => {
    console.log(`- ${k}: ${v}`)
  })
  console.log(`Body: ${await request.text()}`)

  const respHeaders = new Headers()
  respHeaders.append('Content-Type', 'text/plain')

  return new Response('OK', {
    status: 200,
    headers: respHeaders,
  })
}

const server = new Server({ port, handler });

const shutdown = () => {
  console.log('shutdown triggered')
  setTimeout(() => {
    server.close()
    console.log('server closed')
  }, 1000)
}

Deno.addSignalListener('SIGINT', shutdown)
Deno.addSignalListener('SIGTERM', shutdown)

server.listenAndServe()
console.log(`Running at ${port}`);
