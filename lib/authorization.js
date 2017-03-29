// const debug = require('debug')('HS:authorization');

function isWriteAccessRelationship(relationship) {
    return Boolean(relationship) && (relationship.name === 'WriteAccess');
}

function hasAnyRoles(userRoles, entityRoles) {
    if (!userRoles || !userRoles.length) {
        return false;
    } else if (!entityRoles) {
        return false;
    }

    return entityRoles.reduce((canWrite, role) => {
        return canWrite || Boolean(userRoles.filter((userRole) => Boolean(role.id) && (role.id === userRole.id)).length);
    }, false);
}

module.exports = {
    hasAnyRoles,
    isWriteAccessRelationship
};
