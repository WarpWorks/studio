class HeadStartError extends Error {
    constructor(message, originalError) {
        super(message);
        this.name = `HeadStart.${this.constructor.name}`;
        this.originalError = originalError;
    }
}

module.exports = HeadStartError;
