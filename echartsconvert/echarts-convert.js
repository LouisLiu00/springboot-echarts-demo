/**
 * Created by SaintLee on 2017/6/22.
 */
;(function (window, document, undefined) {
    "use strict";

    // 引入module
    var system = require('system'), // 获取参数
        path = phantom.libraryPath,
        command = require(path + '/module/command.js');// 参数module

    /**
     * phantomJs 全局异常监听
     * @param msg
     * @param trace
     */
    phantom.onError = function (msg, trace) {
        var msgStack = ['Convert ERROR: ' + msg];
        if (trace && trace.length) {
            msgStack.push('TRACE:');
            trace.forEach(function (t) {
                msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function + ')' : ''));
            });
        }
        console.error(msgStack.join('\n'));
        phantom.exit(1);
    };

    /**
     * 参数
     * @type {Command}
     */
    var commandParams = command
        .version('0.0.1')
        .option('-s, --server', 'provide echarts convert http server')
        .option('-p, --port <number>', 'change server port when add -s or --server', 9090)
        .option('-o, --opt <json>', 'add the param of echarts method [ eChart.setOption(opt) ]')
        .option('-t, --type <value>', 'provide file/base64 for image, default file', /^(file|base64)$/i, 'base64')
        .option('-f, --outfile <path>', 'add output of the image file path')
        .option('-w, --width <number>', 'change image width', '800')
        .option('-h, --height <number>', 'change image height', '400')
        .parse(system.args);


    // ***********************************
    // Echarts转换器
    // ***********************************
    function Convert(params) {
        this.params = params || commandParams; // 参数命令
        this.external = {
            JQUERY3: path + '/script/jquery-3.6.0.min.js',
            ECHARTS3: path + '/script/echarts-5.3.2.min.js',
            ECHARTS_CHINA: path + '/script/china.js'
        }; // 外部js
    }

    /**
     * 初始化
     */
    Convert.prototype.init = function () {
        var params = this.params;
        this.check(params);
        if (params.server) {
            this.server(params);
        } else {
            this.client(params);
        }
    };

    /**
     * 参数检查
     * @param params
     */
    Convert.prototype.check = function (params) {
        if (undefined === params.server && undefined === params.opt) {
            this.error("option argument missing -o, --opt <json>");
        }

        if (undefined !== params.opt) {
            var isJson = this.checkJson(params.opt);
            if (!isJson) {
                this.error("--opt <json> args not json string");
            }
        }

        if ('file' === params.type && undefined === params.outfile) {
            this.createTmpDir();
        }

    };

    /**
     * 检查是否是json字符串
     * @param value
     * @returns {boolean}
     */
    Convert.prototype.checkJson = function (value) {
        var re = /^\{[\s\S]*\}$|^\[[\s\S]*\]$/;
        // 类型为string
        if (typeof value !== 'string') {
            return false;
        }
        // 正则验证
        if (!re.test(value)) {
            return false;
        }
        // 是否能解析
        try {
            value = "\"" + value + "\"";
            JSON.parse(value);
        } catch (err) {
            return false;
        }
        return true;
    };

    /**
     * 创建临时目录，并指定输出路径
     */
    Convert.prototype.createTmpDir = function () {
        var fs = require('fs'); // 文件操作
        var tmpDir = fs.workingDirectory + '/tmp';
        // 临时目录是否存在且可写
        if (!fs.exists(tmpDir)) {
            if (!fs.makeDirectory(tmpDir)) {
                this.error('Cannot make ' + tmpDir + ' directory\n');
            }
        }
        this.params.outfile = tmpDir + "/" + new Date().getTime() + ".png";
    };

    /**
     * 服务
     * @param params
     */
    Convert.prototype.server = function (params) {
        var server = require('webserver').create(), // 服务端
            convert = this;

        var listen = server.listen(params.port, function (request, response) {
            /**
             * 输出
             * @param data
             * @param success
             */
            function write(data, success, msg) {
                response.statusCode = 200;
                response.headers = {
                    'Cache': 'no-cache',
                    'Content-Type': 'application/json;charset=utf-8'
                };
                response.write(convert.serverResult(data, success, msg));
                response.close();
            }

            //获取参数
            var args = convert.serverGetArgs(request);

            if (args.opt !== undefined) {
                var check = convert.serverCheckAndSet(params, args);

                if (check) {
                    convert.client(params, write);
                } else {
                    write("", false, "failed to get image, please check parameter [opt] is a JSON");
                }
            } else {
                write("", false, "failed to get image, missing parameter [opt]");
            }

        });

        // 判断服务是否启动成功
        if (!listen) {
            this.error("could not create echarts-convert server listening on port " + params.port);
        } else {
            console.log("echarts-convert server start success. [pid]=" + system.pid);
        }
    };

    /**
     * 服务参数检查和赋值
     * @param params
     * @param args
     * @returns {boolean}
     */
    Convert.prototype.serverCheckAndSet = function (params, args) {
        if (this.checkJson(args.opt)) {
            params.opt = args.opt;
        } else {
            return false;
        }

        if (/^(file|base64)$/i.exec(args.type)) {
            params.type = args.type;
        }

        if (!isNaN(args.width)) {
            params.width = args.width;
        }

        if (!isNaN(args.height)) {
            params.height = args.height;
        }
        return true;
    };

    /**
     * 结果返回
     * @param data
     * @param success
     * @param msg
     */
    Convert.prototype.serverResult = function (data, success, msg) {
        var result = {
            code: success ? 1 : 0,
            msg: undefined === msg ? success ? "success" : "failure" : msg,
            data: data
        };

        return JSON.stringify(result);
    };

    /**
     * 获取参数
     * @param request
     * @returns {{}}
     */
    Convert.prototype.serverGetArgs = function (request) {
        var args = {};
        if ('GET' === request.method) {
            var index = request.url.indexOf('?');
            if (index !== -1) {
                var getQuery = request.url.substr(index + 1);
                args = this.serverParseArgs(getQuery);
            }
        } else if ('POST' === request.method) {
            var postQuery = request.post;
            args = this.serverParseArgs(postQuery);
        }
        return args;
    };

    /**
     * 解析参数
     * @param query 字符串
     * @returns {{}} 对象
     */
    Convert.prototype.serverParseArgs = function (query) {
        var args = {},
            pairs = query.split("&");
        for (var i = 0; i < pairs.length; i++) {
            var pos = pairs[i].indexOf('=');
            if (pos === -1)
                continue;
            var key = pairs[i].substring(0, pos);
            var value = pairs[i].substring(pos + 1);
            // 中文解码，必须写两层
            value = decodeURIComponent(decodeURIComponent(value));
            args[key] = value;
        }
        return args;
    };

    /**
     * 访问渲染
     * @param params
     * @param fn
     */
    Convert.prototype.client = function (params, fn) {
        var page = require('webpage').create(); // 客户端
        var convert = this,
            external = this.external,
            render,
            output;

        /**
         *  渲染
         * @returns {*}
         */
        render = function () {
            switch (params.type) {
                case 'file':
                    // 渲染图片
                    page.render(params.outfile);
                    return params.outfile;
                case 'base64':
                default:
                    var base64 = page.renderBase64('PNG');
                    return base64;

            }
        };

        /**
         * 输出
         * @param content 内容
         * @param success 是否成功
         */
        output = function (content, success, msg) {
            if (params.server) {
                fn(content, success, msg);
                page.close();
            } else {
                console.log(success ? "[SUCCESS]:" : "[ERROR]:" + content);
                page.close();
                convert.exit(params);// exit
            }
        };

        /**
         * 页面console监听
         * @param msg
         * @param lineNum
         * @param sourceId
         */
        page.onConsoleMessage = function (msg, lineNum, sourceId) {
            console.log(msg);
        };

        /**
         * 页面错误监听
         * @param msg
         * @param trace
         */
        page.onError = function (msg, trace) {
            output("", false, msg); // 失败,返回错误信息
        };

        // 空白页
        page.open("about:blank", function (status) {
            // 注入依赖js包
            var hasJquery = page.injectJs(external.JQUERY3);
            var hasEchart = page.injectJs(external.ECHARTS3);
            var hasEchartChina = page.injectJs(external.ECHARTS_CHINA);

            // 检查js是否引用成功
            if (!hasJquery && !hasEchart) {
                output("Could not found " + external.JQUERY3 + " or " + external.ECHARTS3, false);
            }

            // 创建echarts
            page.evaluate(createEchartsDom, params);

            // 定义剪切范围，如果定义则截取全屏
            page.clipRect = {
                top: 0,
                left: 0,
                width: params.width,
                height: params.height
            };

            // 渲染
            var result = render();
            // 成功输出，返回图片或其他信息
            output(result, true);
        });
    };

    /**
     * 创建eCharts Dom层
     * @param params 参数
     */
    function createEchartsDom(params) {
        // 动态加载js，获取options数据
        $('<script>')
            .attr('type', 'text/javascript')
            .html('var options = ' + params.opt)
            .appendTo(document.head);

        // 取消动画,否则生成图片过快，会出现无数据
        if (options !== undefined) {
            options.animation = false;
        }

        // body背景设置为白色
        $(document.body).css('backgroundColor', 'black');
        // echarts容器
        var container = $("<div>")
            .attr('id', 'container')
            .css({
                width: params.width,
                height: params.height
            }).appendTo(document.body);

        var eChart = echarts.init(container[0]);
        eChart.setOption(options);
    }

    /**
     * debug,将对象转成json对象
     * @param obj
     */
    Convert.prototype.debug = function (obj) {
        console.log(JSON.stringify(obj, null, 4));
    };

    /**
     * 错误信息打印并退出
     * @param str 错误信息
     */
    Convert.prototype.error = function (str) {
        console.error("Error:" + str);
        this.exit();
    };

    /**
     * 退出，参数为空或是server时，不退出
     * @param params 参数
     */
    Convert.prototype.exit = function (params) {
        if (undefined === params || undefined === params.server) {
            phantom.exit();
        }
    };

    // 构建,入口
    new Convert(commandParams).init();

}(this, this.document));