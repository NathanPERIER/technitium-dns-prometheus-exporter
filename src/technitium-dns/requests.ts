
import axios from 'axios';
import path from 'path';

import { ApiStatus, MetricsPoint } from './datastruct/metrics_point.js';


const API_METRICS_PATH = 'api/dashboard/stats/get';

type MetricsResponse = {
    status: string,
    response: {
        stats: {
            totalQueries:       number,
            totalNoError:       number,
            totalServerFailure: number,
            totalNxDomain:      number,
            totalRefused:       number,
            totalAuthoritative: number,
            totalRecursive:     number,
            totalCached:        number,
            totalBlocked:       number,
            totalClients:       number,
            zones:              number,
            cachedEntries:      number,
            allowedZones:       number,
            blockedZones:       number,
            allowListZones:     number,
            blockListZones:     number,
        },
        mainChartData: {
            labels: string[],
            datasets: {
                label: string,
                data: number[]
            }[]
        }
    }
};


export async function fetch_from_api(base_path: string, token: string): Promise<MetricsPoint> {
    let res: MetricsPoint = {
        status: ApiStatus.OK,
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
            blocked: 0
        }
    };
    const rsp = await axios.get<MetricsResponse>(path.join(base_path, API_METRICS_PATH), {
        params: { 'token': token, 'type': 'lastHour', 'utc': 'true' }
    });
    if(rsp.status < 200 || rsp.status >= 300) {
        console.error(`Got HTTP return code ${rsp.status} ${rsp.statusText} on request to "${base_path}"`);
        res.status = ApiStatus.HTTP_ERROR;
        return res;
    }
    const body = rsp.data;
    if(body.status != 'ok') {
        console.warn(`Got error status "${rsp.status}" from API on request to "${base_path}"`);
        res.status = ApiStatus.API_ERROR;
        return res;
    }
    const stats = body.response.stats;
    res.cached_entries = stats.cachedEntries;
    res.nb_zones = stats.zones;
    res.allowed_zones = stats.allowedZones;
    res.blocked_zones = stats.blockedZones;
    res.allow_list_zones = stats.allowListZones;
    res.block_list_zones = stats.blockListZones;
    for(const dataset_points of body.response.mainChartData.datasets) {
        const val = dataset_points.data[dataset_points.data.length - 2];
        switch(dataset_points.label) {
            case 'Total': break;
            case 'No Error':       res.hits.no_error = val;       break;
            case 'Server Failure': res.hits.server_failure = val; break;
            case 'NX Domain':      res.hits.nx_domain = val;      break;
            case 'Refused':        res.hits.refused = val;        break;
            case 'Authoritative':  res.hits.authoritative = val;  break;
            case 'Recursive':      res.hits.recursive = val;      break;
            case 'Cached':         res.cached_entries = val;      break;
            case 'Blocked':        res.hits.blocked = val;        break;
            case 'Clients':        res.nb_clients = val;          break;
            default: console.warn(`Got unknown chart point type ${dataset_points.label}`);
        }
    }
    const date = body.response.mainChartData.labels[body.response.mainChartData.labels.length - 2];
    console.info(`Request to ${base_path} completed, got point for ${date}`);
    return res;
};