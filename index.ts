import { parse } from "https://deno.land/std@0.98.0/flags/mod.ts"
import { serve } from "https://deno.land/std@0.98.0/http/server.ts"
import { readAll } from "https://deno.land/std@0.98.0/io/util.ts"

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

const server = serve({port});
console.log(`Running at ${port}`);

[Deno.Signal.SIGTERM, Deno.Signal.SIGINT].forEach(
  sig => {
    Deno.signal(sig).then(() => {
      console.log(`Signal ${sig.toString()} recieved. Shutdown...`)
      Deno.exit(0)
    })
  }
)

for await (const request of server) {
  console.log(`URL: ${request.url}`)
  console.log(`Method: ${request.method}`)
  console.log('Headers:')
  request.headers.forEach((v, k, _) => {
    console.log(`- ${k}: ${v}`)
  })
  console.log(`Body: ${new TextDecoder().decode(await readAll(request.body))}`)

  const respHeaders = new Headers()
  respHeaders.append('Content-Type', 'text/plain')

  request.respond({
    status: 200,
    headers: respHeaders,
    body: 'OK'
  })
}
