import app from '../../core.js';
import { PrometheusDocument } from '../../../prometheus/builder.js';



app.get('/metrics', async (_req, res) => {

    let document = new PrometheusDocument();
    
    console.log(`Exporting ${document.nb_groups()} groups, totalling ${document.nb_points()} metric points`);

    res.type('text/plain');
    res.send(document.format());
});
