# Contribution guide

## Before committing

Make sure to run the following before committing:

    npm run lint
    npm run coverage

## Auto run tests

During developement, you can run the following in a terminal:

    npm run watch

The configuration is set in the `package.json` file in the `watch` section. The
key is the `npm run` command to execute if a file change.
