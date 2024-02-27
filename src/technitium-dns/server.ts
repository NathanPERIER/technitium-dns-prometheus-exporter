
import axios from 'axios';


const API_METRICS_PATH = 'api/dashboard/stats/get';
const API_UPDATE_PATH = 'api/user/checkForUpdate';


export enum ApiStatus {
    OK = 0,
    UNREACHABLE = 1,
    HTTP_ERROR = 2,
    API_ERROR = 3
}


type ChartDataLabelsIn = {
    labels: string[],
    datasets: {
        label: string,
        data: number[]
    }[]
}

type ChartDataLabelsTop = {
    labels: string[],
    datasets: {
        data: number[]
    }[]
}

export type MetricsResponse = {
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
    mainChartData: ChartDataLabelsIn,
    queryTypeChartData: ChartDataLabelsTop,
    protocolTypeChartData: ChartDataLabelsTop
};


export type UpdateResponse = {
    updateAvailable: boolean,
	currentVersion?: string,
	updateVersion?: string
};



export class TechnitiumServer {

    public readonly label: string;
    public readonly base_url: string;
    private readonly token: string;

    public constructor(label: string, base_url: string, token: string) {
        if(!base_url.endsWith('/')) {
            base_url += '/';
        }
        this.label = label;
        this.base_url = base_url;
        this.token = token;
    }

    public async get_raw_body<RetType>(path: string, additional_params: { [key: string]: string } = {}): Promise<[ApiStatus,RetType?]> {
        const url = this.base_url + path;
        try {
            const rsp = await axios.get<{status: string, response: RetType}>(url, {
                params: { 'token': this.token, ...additional_params },
                validateStatus: null
            });
            if(rsp.status < 200 || rsp.status >= 300) {
                console.error(`Got HTTP return code ${rsp.status} ${rsp.statusText} on request to "${url}"`);
                return [ApiStatus.HTTP_ERROR, undefined];
            }
            const body = rsp.data;
            if(body.status != 'ok') {
                console.warn(`Got error status "${rsp.status}" from API on request to "${url}"`);
                return [ApiStatus.API_ERROR, undefined];
            }
            return [ApiStatus.OK, body.response];
        } catch (err) {
            if(err instanceof axios.AxiosError) {
                console.warn(`Got error from Axios during a request to "${url}" : ${err.message}`);
            } else {
                console.warn(`Got unknown error of type ${typeof err} during a request to "${url}"`);
            }
            return [ApiStatus.UNREACHABLE, undefined];
        }
    }


    public async get_raw_metrics(): Promise<[ApiStatus,MetricsResponse?]> {
        return this.get_raw_body<MetricsResponse>(API_METRICS_PATH, {'type': 'lastHour', 'utc': 'true'});
    }

    public async get_raw_update(): Promise<[ApiStatus,UpdateResponse?]> {
        return this.get_raw_body<UpdateResponse>(API_UPDATE_PATH);
    }
    
}
