# WarpWorks

Cross-domain code generation framework for Rapid Application Development

## Overwriting defaults

Overwrite WarpWorks Studio defaults with `.warp-works-studiorc`:

    {
      "port": 3000
    }

You can also overwrite WarpWorks Core default with `.warp-works-corerc`:

    {
      "cartridgePath": "../warpjs",
      "outputPath": "../warpjs",
      "projectPath": "../w2projects"
    }

This file will be read by the
[@quoin/node-rc](https://www.npmjs.com/package/@quoin/node-rc)
library.

## Debug

You can run in debug mode by defining:

    DEBUG=W2:Studio:*


## Using inside of another project

    npm install --save https://github.com/dslama/WarpWorks.git

In your application (`server/app.js`):

    const warpJs = require('@warp-works/warpjs');
    const warpStudio = require('@warp-works/studio');

    const PATH_TO_ADMIN = '/admin';
    app.use(PATH_TO_ADMIN,
        session.middlewares.requiresUser,
        warpJs.middlewares.canAccessAsAdmin.bind(null, 'someUserProp'),
        session.middlewares.unauthorized,
        // application
        warpStudio(PATH_TO_ADMIN)
    );

Implementations of `session.middlewares.requiresUser` and
`session.middlewares.unauthorized` are left as an exercise.

    function requiresUser(req, res, next) {
        req.someUserProp = { object };
    }

    function unauthorized(error, req, res, next) {
        // redirect because cannot access.
    }

This implementation for authorization might need to be revised because it should
not be limited to WarpWorks users, but should be linked to the hosting app
users.

Refer to [WarpJS](https://github.com/WarpWorks/warpjs/blob/master/README.md#authorization-middleware) for more details.
