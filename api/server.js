import { toNodeHandler } from 'srvx/node'
import server from '../dist/server/server.js'

// Convert the TanStack Start Web API fetch handler to a Node.js HTTP handler.
// srvx/node handles streaming responses correctly (React 18 SSR streams).
export default toNodeHandler(server.fetch)
