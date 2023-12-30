# Technitium DNS Prometheus Exporter

## Run with Docker (recommended)

First, we need the access token for the Technitium DNS API. For that, one would ideally create a group which can only access the dashboard in "View" mode and nothing else. Then, one needs a user in that group and an access token. All of this can be managed in the "Administration" tab of the DNS server's web interface.

Then, we need to build the container :

```bash
docker build . -t technitium-dns-exporter
```

And finally we run the image :

```bash
docker run --name technitium-exporter \
    -p 8080:8080 \
    -e 'TECHNITIUM_API_DNS_BASE_URL=...' \
    -e 'TECHNITIUM_API_DNS_TOKEN=...' \
    -e 'TECHNITIUM_API_DNS_LABEL=...' \
    technitium-dns-exporter:latest
```

### A note on environment variables

In order to enable monitoring several DNS servers with the same exporter, environment variables are managed in a special way. A server is defined by two environment variables :

- `TECHNITIUM_API_*_BASE_URL`: the URL at which the server can be accessed (without the API path)
- `TECHNITIUM_API_*_TOKEN`: the API token

The variable part represented by a `*` is a kind of identifier, it can only contain numbers, uppercase letters and underscores. In the metrics, it is exported in lowercase as the `server` label. For instance if one were to set `TECHNITIUM_API_MY_DNS_BASE_URL`/`TECHNITIUM_API_MY_DNS_TOKEN`, one would have metrics with the `server="my_dns"` label. One would be able to override the label via the `TECHNITIUM_API_MY_DNS_LABEL` environment variable. 

## Run with NodeJS (dev)

> Note: so far, this has only be tested with node 18

First, we install the dependencies :

```bash
npm install
```

Then, we set the variables and run the exporter :

```bash
export TECHNITIUM_API_DNS_BASE_URL='...'
export TECHNITIUM_API_DNS_TOKEN='...'
npm run dev
```
