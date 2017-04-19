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
      "outputPath": "../warpjs/runtime",
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

    const hsApp = require('WarpWorks/server/app');
    const hsMiddlewares = require('WarpWorks/lib/middlewares');
    app.use('/admin',
        // Authentication and authorization
        session.middlewares.requiresUser,
        hsMiddlewares.canAccess.bind(null, 'someUserProp'),
        session.middlewares.unauthorized,
        // application
        hsApp('/admin')
    );

Make sure that the path `/admin` matches on both lines:

    app.use('/admin',
        ...
        hsApp('/admin')
    );

Implementations of `session.middlewares.requiresUser` and
`session.middlewares.unauthorized` are left as an exercise.

    function requiresUser(req, res, next) {
        req.someUserProp = { object };
    }

    function unauthorized(error, req, res, next) {
        // redirect because cannot access.
    }

The `hsMiddlewares.canAccess.bind(null, 'someUserProp')` indicates to validate
the variable `req.someUserProp` will be checked for a valid user.

This implementation for authorization might need to be revised because it should
not be limited to WarpWorks users, but should be linked to the hosting app
users.
