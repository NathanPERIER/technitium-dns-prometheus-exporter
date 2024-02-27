import app from '../../core.js';
import { fetch_from_api } from '../../../technitium-dns/requests.js';
import { ApiStatus, MetricsPoint } from '../../../technitium-dns/datastruct/metrics_point.js';
import { SERVERS } from '../../../utils/env.js';
import { PrometheusMetricValue, PrometheusDocument } from '../../../prometheus/builder.js';
import { TechnitiumServer } from 'src/technitium-dns/datastruct/sever.js';


interface server_point {
    server: TechnitiumServer,
    point: MetricsPoint
};


function convert_points(srv_points: server_point[]): PrometheusDocument {
    let document = new PrometheusDocument();

    document.add_group('technitium_dns_server_urls', 'Associates a server\'s name/label/identifier to a base url.', srv_points.map( sp => [{'server': sp.server.label, 'base_url': sp.server.base_url}, 1] ));

    document.add_group('technitium_dns_status', 'Status of the connection to the DNS.', srv_points.map( sp => [{'server': sp.server.label}, sp.point.status] ));

    const srv_points_ok = srv_points.filter(sp => (sp.point.status === ApiStatus.OK));
    if(srv_points_ok.length === 0) {
        return document;
    }

    document.add_group('technitium_dns_client_count', 'Number of clients using the DNS.', srv_points.map( sp => [{'server': sp.server.label}, sp.point.nb_clients] ));

    document.add_group('technitium_dns_zone_count', 'Number of zones managed by the DNS.', srv_points.map( sp => [{'server': sp.server.label}, sp.point.nb_zones] ));
    document.add_group('technitium_dns_cached_entry_count', 'Number of DNS entries cached by the server.', srv_points.map( sp => [{'server': sp.server.label}, sp.point.cached_entries] ));

    document.add_group('technitium_dns_allowed_zone_count', 'Number of zones explicitely allowed by the DNS.', srv_points.map( sp => [{'server': sp.server.label}, sp.point.allowed_zones] ));
    document.add_group('technitium_dns_blocked_zone_count', 'Number of zones blocked by the DNS.', srv_points.map( sp => [{'server': sp.server.label}, sp.point.blocked_zones] ));
    document.add_group('technitium_dns_allow_list_zone_count', 'Number of zones in the allow lists of the DNS.', srv_points.map( sp => [{'server': sp.server.label}, sp.point.allow_list_zones] ));
    document.add_group('technitium_dns_block_list_zone_count', 'Number of zones in the block lists of the DNS.', srv_points.map( sp => [{'server': sp.server.label}, sp.point.block_list_zones] ));

    document.add_group('technitium_dns_request_result_count', 'Number of requests resolved with a given result by the DNS.', srv_points.map(sp => [
        [ {'server': sp.server.label, 'result': 'no_error'      }, sp.point.hits.no_error       ],
        [ {'server': sp.server.label, 'result': 'server_failure'}, sp.point.hits.server_failure ],
        [ {'server': sp.server.label, 'result': 'nx_domain'     }, sp.point.hits.nx_domain      ],
        [ {'server': sp.server.label, 'result': 'refused'       }, sp.point.hits.refused        ]
    ] as PrometheusMetricValue[] ).flat());

    document.add_group('technitium_dns_resolve_mode_count', 'Number of requests resolved in a given mode by the DNS.', srv_points.map(sp => [
        [ {'server': sp.server.label, 'result': 'authoritative'}, sp.point.hits.authoritative ],
        [ {'server': sp.server.label, 'result': 'recursive'    }, sp.point.hits.recursive     ],
        [ {'server': sp.server.label, 'result': 'cached'       }, sp.point.hits.cached        ],
        [ {'server': sp.server.label, 'result': 'blocked'      }, sp.point.hits.blocked       ],
        [ {'server': sp.server.label, 'result': 'dropped'      }, sp.point.hits.dropped       ]
    ] as PrometheusMetricValue[] ).flat());

    document.add_group('technitium_dns_query_protocol_count', 'Number of requests to the DNS using a given protocol during the past hour.', srv_points.map(sp =>
        Object.entries(sp.point.protocols).map(([protocol, count]) =>
            [ {'server': sp.server.label, 'protocol': protocol}, count ]
        ) as PrometheusMetricValue[]
    ).flat());

    document.add_group('technitium_dns_record_type_count', 'Number of records responded by the DNS server for a given type during the past hour.', srv_points.map(sp =>
        sp.point.records.map((record_type: string, count: number) =>
            [ {'server': sp.server.label, 'record_type': record_type}, count ]
        ) as PrometheusMetricValue[]
    ).flat());

    return document;
}


app.get('/metrics', async (_req, res) => {

    let metric_points: server_point[] = [];
    for(const server of SERVERS) {
        metric_points.push({ server: server, point: await fetch_from_api(server.base_url, server.token) });
    }

    const document = convert_points(metric_points);
    
    console.log(`Exporting ${document.nb_groups()} groups, totalling ${document.nb_points()} metric points`);

    res.type('text/plain');
    res.send(document.format());
});
