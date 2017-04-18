class StudioError extends Error {
    constructor(message, originalError) {
        super(message);
        this.name = `WarpWorksStudio.${this.constructor.name}`;
        this.originalError = originalError;
    }
}

module.exports = StudioError;
