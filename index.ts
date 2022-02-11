import { parse } from "https://deno.land/std@0.125.0/flags/mod.ts"

const defaultPort = 8080

const args = parse(Deno.args, {
  alias: {
    'p': 'port',
  }
})
let port = Number(args.port)
if (!Number.isInteger(port)) {
  console.log(`Using default port: ${defaultPort}`)
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

console.log(`Running at ${port}`)

while (true) {
    try {
        const conn = await listener.accept()
        console.log(`new conn: ${connCount++}`)
        httpConnCount = 0;
        (async () => {
            const httpConn = Deno.serveHttp(conn);
            for await (const requestEvent of httpConn) {
                console.log(`new http conn: ${httpConnCount++}`)

                const { request } = requestEvent
                console.log(`URL: ${request.url}`)
                console.log(`Method: ${request.method}`)
                console.log('Headers:')
                request.headers.forEach((v, k, _) => {
                  console.log(`- ${k}: ${v}`)
                })
                console.log(`Body: ${await request.text()}`)

                requestEvent.respondWith(new Response('OK', {status: 200}))
            }
        })().catch((err) => {
            console.log(`httpConn error: ${err}`)
        });
    } catch (err) {
        if (serverClosed) {
            break
        }
        console.log(`conn error: ${err}`)
    }
}

console.log('shutdown server...')
