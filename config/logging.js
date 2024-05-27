const winston = require("winston");

module.exports = function () {
    winston.add(new winston.transports.Console());
    winston.add(new winston.transports.File({ filename: "logs/projectlogs.log", level: "error" }));
    winston.exceptions.handle(
        new winston.transports.Console(),
        new winston.transports.File({ filename: "logs/projectlogs.log" })
    );

    process.on("unhandledRejection", (err) => {
        throw err;
    });
};