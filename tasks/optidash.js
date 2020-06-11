const async = require("async");
const Optidash = require("optidash");
const pretty = require("pretty-bytes");
const chalk = require("chalk");
const plural = require("plural");

module.exports = (grunt) => {
    grunt.registerMultiTask("optidash", "Optimize and recompress your images with Optidash API", function () {
        const done = this.async();

        const options = this.options({
            compression: "medium",
            concurrency: 6
        });

        let stats = {
            count: 0,
            input: 0,
            output: 0,
        };

        async.forEachLimit(this.files, options.concurrency, (file, cb) => {
            const opti = new Optidash(options.key);

            opti.upload(file.path).optimize({
                compression: options.compression
            }).toBuffer((err, meta, data) => {
                if (err) {
                    grunt.warn(`Error in file ${file.src[0]}: ${data.message || data.error}`);
                    return cb();
                }

                stats.input += meta.input.bytes;
                stats.output += meta.output.bytes;
                stats.count++;

                grunt.file.write(file.dest, data);

                const saved = meta.input.bytes - meta.output.bytes;
                const percent = ((saved / meta.input.bytes) * 100).toFixed(2);
                const message = saved > 0 ? `saved ${pretty(saved)} (${percent}%)` : "already optimized";

                grunt.verbose.writeln(chalk.green('✔ ') + file.src[0] + chalk.gray(` | ${message}`));
                process.nextTick(cb);
            });
        }, (err) => {
            if (err) {
                grunt.warn(err);
            }

            const saved = stats.input - stats.output;
            const percent = stats.input > 0 ? ((saved / stats.input) * 100).toFixed(2) : 0;

            let message = `Optimized ${stats.count} ${plural("image", stats.count)}`;

            if (stats.count > 0) {
                message += chalk.gray(` | saved ${pretty(saved)} (${percent}%)`);
            }

            grunt.log.writeln(message);
            done();
        });
    });
};