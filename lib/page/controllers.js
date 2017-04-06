
function basicRender(name, data, req, res) {
    const path = require.resolve(`./../../views/${name}.hbs`);
    console.log(`basicRender(): path=${path}`);
    const layout = require.resolve(`./../../views/${data.layout || 'layout'}.hbs`);
    console.log(`basicRender(): layout=${layout}`);

    const resource = Object.assign({}, data, {
    });
    console.log(`basicRender(): resource=`, resource);

    res.render(name, data);
}

const home = basicRender.bind(null, 'home', { title: 'HeadStart' });
const domain = basicRender.bind(null, 'domain', { title: 'Domain Details' });
const pageView = basicRender.bind(null, 'pageView', { title: 'Page View' });
const entityGraph = basicRender.bind(null, 'entityGraph', { title: 'Entity Graph' });
const quantityStructure = basicRender.bind(null, 'quantityStructure', { title: 'Quantity Structure' });
const marketplace = basicRender.bind(null, 'marketplace', { title: 'Marketplace' });

function app(req, res) {
    console.log("Getting /app/:" + req.params.app);
    basicRender('app' + req.params.app, { title: 'test', layout: '_appLayout' }, req, res);
}

module.exports = {
    home,
    domain,
    pageView,
    entityGraph,
    quantityStructure,
    marketplace,
    app
};
