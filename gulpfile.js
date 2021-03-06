var gulp = require("gulp");
var browserify = require("gulp-browserify");
var gulpFilter = require("gulp-filter");
var debug = require("gulp-debug");
var rename = require("gulp-rename");
var typescript = require("gulp-tsc");
var wrapUmd = require("gulp-wrap-umd");
var typedoc = require("gulp-typedoc");
var rimraf = require("gulp-rimraf");
var dtsBundle = require("dts-bundle");
var fs = require("fs");

///////////////////////////////////////////////////////////////////////////////
// Overall tasks
///////////////////////////////////////////////////////////////////////////////

const MODULE_NAME="timezonecomplete";

// Nice help message
gulp.task("help", function(cb) {
	console.log("Build system for Spirit IT " + MODULE_NAME);
	console.log("");
	console.log("BUILD COMMANDS:");
	console.log("");
	console.log("gulp                 Build all");
	console.log("gulp clean           Clean build output");
	console.log("gulp build           Build");
	console.log("gulp doc             Create documentation");
	console.log("gulp help            This help message");
	console.log("gulp browser_package Create browser package");
	console.log("gulp bundle          Make a bundled timezonecomplete.d.ts file");
	console.log("gulp release         All of the above except clean");

	console.log("");
	cb(); // signal end-of-task
});

// Default task: this is called when just typing "gulp" on command line
gulp.task("default", ["release"]);

gulp.task("clean", function() {
	gulp
		.src([
			"coverage/",
			"dist/",
			"gulp-tsc*/",
			"lib/**/*.d.ts",
			"lib/**/*.js",
			"lib/**/*.map",
			"test/**/*.d.ts",
			"test/**/*.js",
			"test/**/*.map",
			"examples/**/*.d.ts",
			"examples/**/*.js",
			"examples/**/*.map",
      "doc/"
		], { read: false, base: "." })
		.pipe(rimraf({force: true}))
		.on("error", trapError) // make exit code non-zero
})

gulp.task("bundle", ["build"], function() {
	dtsBundle.bundle({
		name: 'timezonecomplete',
	    main: 'lib/index.d.ts',
		baseDir: './lib',
		externals: false,
	});
})

gulp.task("doc", function() {
	return gulp.src(["lib/**.ts"], {base: "."})
		.pipe(gulpFilter("!**/*.d.ts"))
		.pipe(typedoc({
			module: "commonjs",
			out: "./doc",
			name: "timezonecomplete",
			target: "es5",
			excludeExternals: "",
		}))
		.on("error", trapError);
});

gulp.task("build", function() {
	 return gulp.src([
			"**/*.ts",
		], {base: "."})
		.pipe(gulpFilter("!**/*.d.ts"))
		.pipe(typescript({
			module: "commonjs",
			declaration: true,
			target: "es5",
			outDir: "."
		}))
		.pipe(gulp.dest("."))
		.on("error", trapError); // make exit code non-zero
	});


gulp.task("release", ["build", "browser_package", "doc", "bundle"]);

gulp.task("browser_package", ["build"], function() {
	return browserifyTask("timezonecomplete");
})

function browserifyTask(packageName) {
	var template = fs.readFileSync("./umd-template/umd-require.jst");
	return gulp.src("lib/index.js", {base: "."})
		.pipe(browserify({
			exclude: "timezone-js",
			require: [
				["./index.js", {expose: packageName}]
			]
		}))
		.pipe(wrapUmd({
			namespace: "timezonecomplete",
			deps: [{
				name: "timezone-js",
				globalName: "timezoneJS",
				paramName: "timezoneJS",
				amdName: "timezone-js",
				cjsName: "timezone-js"
			}],
			exports: packageName,
			template: template
		}))
		.pipe(rename("timezonecomplete.js"))
		.pipe(gulp.dest("dist/"))
		.on("error", trapError); // make exit code non-zero
}


// Generic error handling function
// This is needed because Gulp always returns exit code 0
// unless an exception is thrown which gives a useless stack trace.
function trapError(e) {
	if (e.plugin && e.message) {
		// it is a gulp plugin error
		console.log("Error in plugin: " + e.plugin);
		console.log(e.message);
	}
	else {
		// some other error
		gutil.log(e);
	}
	console.log("\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\||||||||////////////////////");
	console.log(">>>>>>>>>>>>>>>>> FAILED <<<<<<<<<<<<<<<<<<<<");
	console.log("/////////////////||||||||\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\");
	exitCode++;
}
