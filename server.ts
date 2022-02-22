import { parse, log } from "./deps.ts"

const defaultPort = 8080

const args = parse(Deno.args, {
  alias: {
    'p': 'port',
    'u': 'unix-socket',
  }
})
let port: number | null = null
let unixSocket: string | null = null

if (args.p) {
    if (typeof args.p !== 'number') {
        log.critical(`Invalid port: ${args.p}`)
    }
    port = args.p
}
if (args.u) {
    unixSocket = args.u.toString()
}

if (port != null && unixSocket != null) {
    log.critical('Cannot use both -p (--port) and -u (--unix-socket)')
}

let listener: Deno.Listener
if (unixSocket != null) {
    listener = Deno.listen({ path: unixSocket, transport: 'unix' })
    log.info(`Running at ${unixSocket}`)
} else {
    if (!port) {
        port = defaultPort
    }
    listener = Deno.listen({ port, transport: 'tcp' })
    log.info(`Running at ${port}`)
}

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
            log.error(`http conn error: ${err}`)
        });
    } catch (err) {
        if (serverClosed) {
            break
        }
        log.error(`conn error: ${err}`)
    }
}

log.info('shutdown server...')
