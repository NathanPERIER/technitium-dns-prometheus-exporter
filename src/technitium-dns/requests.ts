

import { MetricsPoint } from './metrics_point.js';
import { TechnitiumServer, ApiStatus } from './server.js';


function make_metric_point(): MetricsPoint {
    return {
        status: ApiStatus.OK,
        update_available: -1,
        nb_clients: 0,
        cached_entries: 0,
        nb_zones: 0,
        allowed_zones: 0,
        blocked_zones: 0,
        allow_list_zones: 0,
        block_list_zones: 0,
        hits: {
            no_error: 0,
            server_failure: 0,
            nx_domain: 0,
            refused: 0,
            authoritative: 0,
            recursive: 0,
            cached: 0,
            blocked: 0,
            dropped: 0
        },
        protocols: {
            udp: 0,
            tcp: 0,
            tls: 0,
            https: 0,
            quic: 0
        },
        records: new Map<string, number>()
    };
}


export async function fetch_from_api(server: TechnitiumServer): Promise<MetricsPoint> {
    let res: MetricsPoint = make_metric_point();
    const [status, response] = await server.get_raw_metrics();
    res.status = status;
    if(res.status !== ApiStatus.OK) {
        return res;
    }
    const [update_status, update_response] = await server.get_raw_update();
    if(update_status === ApiStatus.OK) {
        res.update_available = update_response!.updateAvailable ? 1 : 0;
    }
    const stats = response!.stats;
    res.cached_entries = stats.cachedEntries;
    res.nb_zones = stats.zones;
    res.allowed_zones = stats.allowedZones;
    res.blocked_zones = stats.blockedZones;
    res.allow_list_zones = stats.allowListZones;
    res.block_list_zones = stats.blockListZones;
    const chart_data = response!.mainChartData;
    for(const dataset_points of chart_data.datasets) {
        const val = dataset_points.data[dataset_points.data.length - 2];
        switch(dataset_points.label) {
            case 'Total': break;
            case 'No Error':       res.hits.no_error = val;       break;
            case 'Server Failure': res.hits.server_failure = val; break;
            case 'NX Domain':      res.hits.nx_domain = val;      break;
            case 'Refused':        res.hits.refused = val;        break;
            case 'Authoritative':  res.hits.authoritative = val;  break;
            case 'Recursive':      res.hits.recursive = val;      break;
            case 'Cached':         res.hits.cached = val;         break;
            case 'Blocked':        res.hits.blocked = val;        break;
            case 'Dropped':        res.hits.dropped = val;        break;
            case 'Clients':        res.nb_clients = val;          break;
            default: console.warn(`Got unknown chart point type ${dataset_points.label}`);
        }
    }
    const protocol_data = response!.protocolTypeChartData;
    for(let i = 0; i < protocol_data.labels.length; i++) {
        const val = protocol_data.datasets[0].data[i];
        switch(protocol_data.labels[i]) {
            case 'Udp':   res.protocols.udp = val;   break;
            case 'Tcp':   res.protocols.tcp = val;   break;
            case 'Tls':   res.protocols.tls = val;   break;
            case 'Https': res.protocols.https = val; break;
            case 'Quic':  res.protocols.quic = val;  break;
            default: console.warn(`Got unknown query type/protocol ${protocol_data.labels[i]}`);
        }
    }
    const record_data = response!.queryTypeChartData;
    record_data.labels.forEach((label, i) => {
        res.records.set(label, record_data.datasets[0].data[i]);
    });
    const date = chart_data.labels[chart_data.labels.length - 2];
    console.info(`Request to ${server.base_url} completed, got point for ${date}`);
    return res;
};
