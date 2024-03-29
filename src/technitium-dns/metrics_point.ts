

import { ApiStatus } from './server.js';


export interface MetricsPoint {
    status: ApiStatus,
    update_available: number,
    nb_zones: number,
    cached_entries: number,
    blocked_zones: number,
    allowed_zones: number,
    block_list_zones: number,
    allow_list_zones: number,
    nb_clients: number,
    hits: {
        no_error: number,
        server_failure: number,
        nx_domain: number,
        refused: number,
        authoritative: number,
        recursive: number,
        cached: number,
        blocked: number,
        dropped: number
    },
    protocols: {
        udp: number,
        tcp: number,
        tls: number,
        https: number,
        quic: number
    },
    records: Map<string, number>
};
