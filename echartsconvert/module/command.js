/**
 * Created by SaintLee on 2017/6/21.
 */
exports = module.exports = new Command();

exports.Command = Command;

exports.Option = Option;

/**
 * 选项参数
 * @param flags 选项标识
 * @param description 描述信息
 * @constructor 选项参数构造器
 */
function Option(flags, description) {
    this.flags = flags; // 选项标识
    this.required = ~flags.indexOf('<'); // 必须,包含<>
    this.optional = ~flags.indexOf('['); // 可选,包含[]
    this.bool = !~flags.indexOf('-no-'); // 禁用，包含-no-
    flags = flags.split(/[ ,|]+/);
    if (flags.length > 1 && !/^[[<]/.test(flags[1]))
        this.short = flags.shift(); // 短选项
    this.long = flags.shift();// 长选项
    this.description = description || ''; // 描述信息
}

/**
 * 参数名称,以长选项为名字
 * @returns {XML|string}
 */
Option.prototype.name = function () {
    return this.long
        .replace('--', '')
        .replace('no-', '');
};

/**
 * 判断是短选项还是长选项
 * @param arg
 * @returns {boolean}
 */
Option.prototype.is = function (arg) {
    return arg === this.short || arg === this.long;
};

/**
 * 命令行
 * @param name 命令行名称
 * @constructor 命令行构造器
 */
function Command(name) {
    this.options = []; // 选项集合
    this._allowUnknownOption = false; // 是否允许未知参数
    this._args = []; // 参数集合
    this._name = name || ''; // 名称
}

Command.prototype.name = function (str) {
    this._name = str;
    return this;
};

/**
 * 版本号
 * @param str 版本号
 * @param flags 选项
 * @returns {*}
 * @api public
 */
Command.prototype.version = function (str, flags) {
    if (0 === arguments.length)
        return this._version;
    this._version = str;
    flags = flags || '-V, --version';
    this.option(flags, 'output the version number');

    return this;
};

/**
 * 使用说明
 * @param str
 * @returns {*}
 * @api public
 */
Command.prototype.usage = function (str) {
    var args = this._args.map(function (arg) {
        return humanReadableArgName(arg);
    });

    var usage = '[options]'
        + (this._args.length ? ' ' + args.join(' ') : '');

    if (0 === arguments.length)
        return this._usage || usage;

    this._usage = str;

    return this;
};

/**
 * 命令行选项赋值
 * @param flags 选项参数
 * @param description 描述
 * @param fn
 * @param defaultValue
 * @returns {Command}
 * @api public
 */
Command.prototype.option = function (flags, description, fn, defaultValue) {
    var self = this
        , option = new Option(flags, description)
        , oname = option.name()
        , name = camelcase(oname);

    // 参数为三个
    if (typeof fn !== 'function') {
        if (fn instanceof RegExp) {
            var regex = fn;
            fn = function (val, def) {
                var m = regex.exec(val);
                return m ? m[0] : def;
            }
        } else {
            defaultValue = fn;
            fn = null;
        }
    }

    // 为禁用--no-*，可选[optional]，必选<required>设置默认值
    if (false === option.bool || option.optional || option.required) {
        if (false === option.bool)
            defaultValue = true; // 默认为true
        if (undefined !== defaultValue)
            self[name] = defaultValue;
    }

    // 注册
    this.options.push(option);

    return this;
};

/**
 * 解析参数
 * @param argv 参数
 * @returns {Command}
 * @api public
 */
Command.prototype.parse = function (argv) {
    // 存储原始参数
    this.rawArgs = argv;
    // 猜名字
    this._name = this._name || argv[0];
    // 解析参数
    var parsed = this.parseOptions(this.normalize(argv.slice(1)));

    var args = this.args = parsed.args;

    var result = this.parseArgs(this.args, parsed.unknown);

    return result;
};

/**
 * 允许未知选项
 * @param arg
 * @returns {Command}
 * @api public
 */
Command.prototype.allowUnknownOption = function (arg) {
    this._allowUnknownOption = arguments.length === 0 || arg;
    return this;
};

/**
 * 规范化参数,主要处理多个短选项如：-xvf和长选项:--options=xxx
 * @param args
 * @returns {Array}
 * @api private
 */
Command.prototype.normalize = function (args) {
    var ret = []
        , arg
        , lastOpt
        , index;

    for (var i = 0, len = args.length; i < len; ++i) {
        arg = args[i];
        if (i > 0) {
            lastOpt = this.optionFor(args[i - 1]);
        }
        if (arg === '--') {
            ret = ret.concat(args.slice(i));
            break;
        } else if (lastOpt && lastOpt.required) {
            ret.push(arg);
        } else if (arg.length > 1 && '-' === arg[0] && '-' !== arg[1]) {
            arg.slice(1).split('').forEach(function (c) {
                ret.push('-' + c);
            });
        } else if (/^--/.test(arg) && ~(index = arg.indexOf('='))) {
            ret.push(arg.slice(0, index), arg.slice(index + 1));
        } else {
            ret.push(arg);
        }
    }
    return ret;
};

/**
 * 解析参数
 * @param argv
 * @returns {{args: Array, unknown: Array}}
 * @api private
 */
Command.prototype.parseOptions = function (argv) {
    var args = []
        , len = argv.length
        , literal
        , option
        , arg;

    var unknownOptions = [];

    // 解析选项
    for (var i = 0; i < len; ++i) {
        arg = argv[i];

        // 参数后为'-- xxx'时表示为文字而非参数
        if ('--' === arg) {
            literal = true;
            continue;
        }
        if (literal) {
            args.push(arg);
            continue;
        }

        // 找到匹配的选项
        option = this.optionFor(arg);

        // 定义
        if (option) {
            if (option.required) { // 选项必须
                arg = argv[++i];
                if (undefined === arg || null === arg)
                    return this.optionMissingArgument(option);
                this[option.name()] = arg;
            } else if (option.optional) { // 选项可选
                arg = argv[i + 1];
                if (undefined === arg || null === arg || ('-' === arg[0] && '-' !== arg)) {
                    arg = null;
                } else {
                    ++i;
                }
                this[option.name()] = arg;
            } else {
                if ('version' !== option.name()) {
                    this[option.name()] = true;
                } else {
                    this.outputVersion();
                    this.exit();
                }
            }
            args.push(arg);
            continue;
        }

        // 未知选项
        if (arg.length > 1 && '-' === arg[0]) {
            unknownOptions.push(arg);
            if (argv[i + 1] && '-' !== argv[i + 1][0]) {
                unknownOptions.push(argv[++i]);
            }
            continue;
        }

        args.push(arg);
    }

    return {args: args, unknown: unknownOptions};
};

/**
 * 参数匹配选项
 * @param arg
 * @returns {*}
 * @api private
 */
Command.prototype.optionFor = function (arg) {
    for (var i = 0, len = this.options.length; i < len; ++i) {
        if (this.options[i].is(arg)) {
            return this.options[i];
        }
    }
};

/**
 * 解析参数
 * @param args
 * @param unknown
 * @returns {Command}
 */
Command.prototype.parseArgs = function (args, unknown) {
    var name;
    if (args.length) {
        name = args[0];
    } else {

        outputHelpIfNecessary(this, unknown);

        if (unknown.length > 0) {
            this.unknownOption(unknown[0]);
        }
    }
    return this;
};

/**
 * 未知选项
 * @param flag
 */
Command.prototype.unknownOption = function (flag) {
    if (this._allowUnknownOption)
        return;
    console.error();
    console.error("error: unknown option `%s'", flag);
    console.error();
    this.exit();
};

Command.prototype.optionMissingArgument = function (option, flag) {
    console.error();
    if (flag) {
        console.error("error: option `%s' argument missing, got `%s'", option.flags, flag);
    } else {
        console.error("error: option `%s' argument missing", option.flags);
    }
    console.error();
    this.exit();
};

Command.prototype.outputVersion = function () {
    console.log(this._version);
};

Command.prototype.outputHelp = function (cb) {
    if (!cb) {
        cb = function (passthru) {
            return passthru;
        }
    }
    console.log(cb(this.helpInformation()));
};

Command.prototype.helpInformation = function () {
    var desc = [];
    if (this._description) {
        desc = [
            '  ' + this._description
            , ''
        ];
    }

    var cmdName = this._name;
    if (this._alias) {
        cmdName = cmdName + '|' + this._alias;
    }
    var usage = [
        ''
        , '  Usage: ' + cmdName + ' ' + this.usage()
        , ''
    ];

    var options = [
        '  Options:'
        , ''
        , '' + this.optionHelp().replace(/^/gm, '    ')
        , ''
        , ''
    ];

    return usage
        .concat(desc)
        .concat(options)
        .join('\n');
};

Command.prototype.optionHelp = function () {
    var width = this.largestOptionLength();

    return [pad('-h, --help', width) + '  ' + 'output usage information']
        .concat(this.options.map(function (option) {
            return pad(option.flags, width) + '  ' + option.description;
        }))
        .join('\n');
};
Command.prototype.largestOptionLength = function () {
    return this.options.reduce(function (max, option) {
        return Math.max(max, option.flags.length);
    }, 0);
};

Command.prototype.exit = function () {
    phantom.exit();
};

function camelcase(flag) {
    return flag.split('-').reduce(function (str, word) {
        return str + word[0].toUpperCase() + word.slice(1);
    });
}

function outputHelpIfNecessary(cmd, options) {
    options = options || [];
    for (var i = 0; i < options.length; i++) {
        if (options[i] === '--help' || options[i] === '-h') {
            cmd.outputHelp();
            cmd.exit();
        }
    }
}

function humanReadableArgName(arg) {
    var nameOutput = arg.name + (arg.variadic === true ? '...' : '');
    return arg.required
        ? '<' + nameOutput + '>'
        : '[' + nameOutput + ']'
}

function pad(str, width) {
    var len = Math.max(0, width - str.length);
    return str + new Array(len + 1).join(' ');
}
