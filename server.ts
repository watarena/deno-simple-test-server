import { parse, log } from "./deps.ts"

const defaultPort = 8080

const args = parse(Deno.args, {
  alias: {
    'p': 'port',
  }
})
let port = Number(args.port)
if (!Number.isInteger(port)) {
  log.info(`Using default port: ${defaultPort}`)
  port = defaultPort
}

const listener = Deno.listen({ port })

let connCount = 0
let httpConnCount = 0

let serverClosed = false

const signals: Deno.Signal[] = ['SIGINT', 'SIGTERM']
signals.forEach((sig) => {
    Deno.addSignalListener(sig, () => {
        console.log(`signal ${sig} recieved`)
        serverClosed = true
        listener.close()
    })
})

log.info(`Running at ${port}`)

async function logRequest(request: Request) {
    log.info(`--- Request ---
URL: ${request.url}
Method: ${request.method}
Headers
${Array.from(request.headers.entries()).map(([key, value]) => `- ${key}: ${value}`).join('\n')}
Body
${await request.text()}
---`)
}

while (true) {
    try {
        const conn = await listener.accept()
        log.info(`new conn: ${connCount++}`)
        httpConnCount = 0;
        (async () => {
            const httpConn = Deno.serveHttp(conn);
            for await (const requestEvent of httpConn) {
                log.info(`new http conn: ${httpConnCount++}`)

                await(logRequest(requestEvent.request))

                requestEvent.respondWith(new Response('OK', {status: 200}))
            }
        })().catch((err) => {
            log.error(err)
        });
    } catch (err) {
        if (serverClosed) {
            break
        }
        log.error(err)
    }
}

log.info('shutdown server...')
