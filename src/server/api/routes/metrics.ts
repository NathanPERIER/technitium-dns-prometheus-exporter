import app from '../../core.js';
import { fetch_from_api } from '../../../technitium-dns/requests.js';
import { ApiStatus, MetricsPoint } from '../../../technitium-dns/datastruct/metrics_point.js';
import { TECHNITIUM_BASE_URL, TECHNITIUM_TOKEN } from '../../../utils/env.js';
import { PrometheusDocument } from '../../../prometheus/builder.js';


function convert_point(point: MetricsPoint): PrometheusDocument {
    let document = new PrometheusDocument();

    document.add_group('technitium_dns_status', 'Status of the connection to the DNS.', [[{}, (<any>ApiStatus)[point.status]]]);

    if(point.status != ApiStatus.OK) {
        return document;
    }

    document.add_group('technitium_dns_client_count', 'Number of clients using the DNS.', [[{}, point.nb_clients]]);

    document.add_group('technitium_dns_zone_count', 'Number of zones managed by the DNS.', [[{}, point.nb_zones]]);
    document.add_group('technitium_dns_cached_entry_count', 'Number of DNS entries cached by the server.', [[{}, point.cached_entries]]);

    document.add_group('technitium_dns_allowed_zone_count', 'Number of zones explicitely allowed by the DNS.', [[{}, point.allowed_zones]]);
    document.add_group('technitium_dns_blocked_zone_count', 'Number of zones blocked by the DNS.', [[{}, point.blocked_zones]]);
    document.add_group('technitium_dns_allow_list_zone_count', 'Number of zones in the allow lists of the DNS.', [[{}, point.allow_list_zones]]);
    document.add_group('technitium_dns_block_list_zone_count', 'Number of zones in the block lists of the DNS.', [[{}, point.block_list_zones]]);

    document.add_group('technitium_dns_request_result_count', 'Number of requests resolved with a given result by the DNS.', [
        [ {'result': 'no_error'},       point.hits.no_error       ],
        [ {'result': 'server_failure'}, point.hits.server_failure ],
        [ {'result': 'nx_domain'},      point.hits.nx_domain      ],
        [ {'result': 'refused'},        point.hits.refused        ]
    ]);

    document.add_group('technitium_dns_resolve_mode_count', 'Number of requests resolved in a given mode by the DNS.', [
        [ {'mode': 'authoritative'}, point.hits.authoritative ],
        [ {'mode': 'recursive'},     point.hits.recursive     ],
        [ {'mode': 'cached'},        point.hits.cached        ],
        [ {'mode': 'blocked'},       point.hits.blocked       ]
    ]);

    return document;
}


app.get('/metrics', async (_req, res) => {

    const metric_point = await fetch_from_api(TECHNITIUM_BASE_URL, TECHNITIUM_TOKEN);

    const document = convert_point(metric_point);
    
    console.log(`Exporting ${document.nb_groups()} groups, totalling ${document.nb_points()} metric points`);

    res.type('text/plain');
    res.send(document.format());
});
