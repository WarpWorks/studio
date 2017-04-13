# HeadStart
Cross-domain code generation framework for Rapid Application Development

## Overwriting defaults

You can create a `.HeadStartrc` in your project:

    {
      "cartridgePath": "../dslama/MonApp",
      "outputPath": "../dslama/MonApp/runtime",
      "projectPath": "../dslama/IIC-Data"
    }

This file will be read by the [rc](https://www.npmjs.com/package/rc) library.


## Using inside of another project

    npm install --save https://github.com/dslama/HeadStart.git

In your application (`server/app.js`):

    const hsApp = require('HeadStart/server/app');
    const hsMiddlewares = require('HeadStart/lib/middlewares');
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
not be limited to HeadStart users, but should be linked to the hosting app
users.
