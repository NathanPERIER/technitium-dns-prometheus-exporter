
export type PrometheusMetricValue = [{[key: string]: string}, number | string]

export class PrometheusMetricGroup {

    public constructor(private name: string, private description: string, private values: PrometheusMetricValue[] = []) { }

    public add_value(value: number | string, labels: {[key: string]: string} = {}): void {
        this.values.push([labels, value]);
    }

    public format(): string {
        let res: string[] = [
            `# HELP ${this.name} ${this.description}`,
            `# TYPE ${this.name} gauge`
        ];
        for(const [labels, val] of this.values) {
            if(Object.keys(labels).length === 0) {
                res.push(`${this.name} ${val}`);
            } else {
                const labels_str = Object.entries(labels).map(e => `${e[0]}=${JSON.stringify(e[1])}`).join(', ');
                res.push(`${this.name}{${labels_str}} ${val}`);
            }
        }
        return res.join('\n');
    }

    public nb_points(): number {
        return this.values.length;
    }

}


export class PrometheusDocument {

    private groups: PrometheusMetricGroup[];

    public constructor() {
        this.groups = [];
    }

    public add_group(name: string, description: string, values: [{[key: string]: string}, number | string][] = []): PrometheusMetricGroup {
        let group = new PrometheusMetricGroup(name, description, values);
        this.groups.push(group);
        return group;
    }

    public format(): string {
        return this.groups.map(g => g.format()).join('\n');
    }

    public nb_groups(): number {
        return this.groups.length;
    }

    public nb_points(): number {
        return this.groups.map(g => g.nb_points()).reduce((acc, val) => acc + val, 0);
    }

}
