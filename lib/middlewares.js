function canAccess(userObjectProperty, req, res, next) {
    const user = req[userObjectProperty];

    if (!user) {
        next(new Error("Unauthenticated user."));
    }

    const isAdmin = Boolean(user.Roles.filter((role) => role.label === 'admin').length);
    if (isAdmin) {
        next();
    } else {
        next(new Error("Unauthorized user."));
    }
}

module.exports = {
    canAccess
};
