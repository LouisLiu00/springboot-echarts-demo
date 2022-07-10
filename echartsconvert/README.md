# PhantomJS在服务端生成ECharts图片

 **主要功能：给定ECharts的option参数，生成ECharts图片，并以Base64字符串返回。** 

## 1. PhantomJS 介绍

[PhantomJS](http://phantomjs.org/)是一个不需要浏览器的富客户端。
    
    官方介绍：PhantomJS是一个基于 WebKit 的服务器端JavaScript API。它全面支持web而不需浏览器支持，支持各种Web标准：DOM处理，CSS选择器, JSON，Canvas，和SVG。
    PhantomJS常用于页面自动化，网络监测，网页截屏，以及无界面测试等。
    
    通常我们使用PhantomJS作为爬虫工具。传统的爬虫只能单纯地爬取html的代码，对于js渲染的页面，就无法爬取，如Echarts统计图。而PhantomJS正可以解决此类问题。

>我们可以这么理解PhantomJS，PhantomJS是一个无界面、可运行脚本的谷歌浏览器。
        
### 1.1 PhantomJS下载安装

PhantomJS安装非常简单，官网[http://phantomjs.org/download.html](http://phantomjs.org/download.html)下载最新的安装包，
安装包有Windows，Mac OS X, Linux 64/32 bit，选择对应的版本下载解压即可使用，在下载包里有个example文件夹，里面对应了许多示例供参考。

为方便使用，我们将phantomjs添加至环境变量中。

    windows：
    右键我的电脑->属性->高级系统设置->高级->环境变量->用户变量/系统变量->Path=D:\phantomjs\bin;
    或
    cmd->set path=%path%;D:\phantomjs\bin
    
    linux:
    vi /etc/profile
    export PATH=$PATH:/usr/phantomjs/bin
    
>注：linux虽然不需要其他的依赖包，但仍旧需要GLIBCXX_3.4.9和GLIBC_2.7，当然大多数linux是有这两个依赖包的。

### 1.2 PhantomJS运行脚本

进入`example`文件夹，里面有个`hello.js`脚本：

```javascript
"use strict";
console.log('Hello, world!');
phantom.exit();
```

通过`phantomjs hello.js`即可运行脚本hello.js

```bash
phantomjs hello.js
```

> 控制台输出：Hello, world!

### 1.3 PhantomJS脚本参数

在`example`文件夹中有`arguments.js`脚本：

```javascript
"use strict";
var system = require('system');
if (system.args.length === 1) {
    console.log('Try to pass some args when invoking this script!');
} else {
    system.args.forEach(function (arg, i) {
        console.log(i + ': ' + arg);
    });
}
phantom.exit();
```

运行以下命令，其中(first second third)是参数：

```bash
phantomjs arguments.js first second third
```

控制台将输出：

```bash
0: arguments.js
1: first
2: second
3: third
```

### 1.4 PhantomJS页面加载

创建`pageload.js`脚本：

```javascript
"use strict";
var page = require('webpage').create();
page.open('https://www.baidu.com/', function () {
    page.render('baidu.png');
    phantom.exit();
});
```

运行`phantomjs pageload.js`即可在同级目录下得到一张`baidu.png`的图片

>由于它的这个特性，PhantomJS 可以用来“网页截屏”，截取网页的快照，比如将网页、SVG存成图片，PDF等

>导出ECharts图片也是基于page.render此功能

## 2. PhantomJS API

PhantomJS除了有examples外，还有比较全面的API，官方地址[http://phantomjs.org/api/](http://phantomjs.org/api/)

主要包括：

1. Command Line Interface(命令行)：PhantomJS内置的一些命令行选项，比如设置编码`--output-encoding=encoding `、设置代理`--proxy=address`等等；
2. phantom Object(phantom对象)：phantom为实现各种接口，增加一个宿主对象(host object)，同时也是window的子对象。主要功能包括运行脚本路径`phantom.libraryPath`，phantom退出`phantom.exit(returnValue)`等等
3. Web Page Module(网页模块)：核心模块，该模块主要提供页面自动化，网页截屏等等功能。
4. Child Process Module(子进程模块)：PhantomJS调用子进程并通过stdin,stdout,stderr进行通信。_(to learn)_
5. File System Module(文件系统模块)：读取和操作服务器系统目录和文件。
6. System Module(系统模块)：该模块可以获取命令行参数、环境变量、操作系统和PID信息。
7. Web Server Module(Web服务器模块)：内置web服务器提供http服务。

下面将介绍部分在`echarts-convert.js`中使用到的API，便于方便查看脚本

### 2.1 phantom Object(phantom对象)

    phantom.libraryPath：获取运行脚本路径，如该脚本的路径为"E:/phantomjs/examples/hello.js"，那么phantom.libraryPath=E:/phantomjs/examples，注意最后没有"/"。
    
    phantom.exit()：结束phantom进程，脚本不写phantom.exit()时，phantom将不会自己退出，因此如非特殊场景必须增加退出功能。
    
    phantom.onError = function (msg, trace) {}：全局异常监听，如果page.onError或其他异常没有捕获，该事件将捕获错误信息。
    
### 2.2 Web Page Module(网页模块)

首先必须引入此模块`var page = require('webpage').create();`

    page.open(url,callback)：打开一个url并且加载页面，页面加载完毕后，执行回调函数callback。简单来说就是在phantom浏览器里中打开一个页面。此方法有几个重载函数，可以去官网查看。
    
    page.close()：关闭页面，主要为了释放内存。

    page.evaluate(function, arg1, arg2, ...)：评估即沙盒测试，在当前页面建立一个沙盒，在沙盒上做一些操作。该功能比较强大，可以用于无界面测试。
    
    page.injectJs(filename)：将外部JavaScript文件注入到页面中。主要用于沙盒测试。
    
    page.render(filename [, {format, quality}])：渲染也就是截图，生成图片或PDF，filename为路径，format包括PDF、PNG、JPEG、BMP等，quality图片质量为0-100。
    
    page.renderBase64(format)：渲染生成图片的Base64字符串，format包括PNG、JPEG、GIF。
    
    page.clipRect = {top: 0,left: 0,width: 400,height: 300}：截图范围，如果没有设置将截取全部页面。注：phantomjs默认的width为400
    
    page.onConsoleMessage = function (msg, lineNum, sourceId){}：页面的控制台监听，用于测试时监听控制台信息。
    
    page.onError = function (msg, trace) {}：页面错误监听，如果没有特殊需求，该监听一定要写，否则页面代码错误将无法捕获。
    
### 2.3 File System Module(文件系统模块)

首先引入`var fs = require('fs');`模块

    fs.workingDirectory：脚本运行目录，与phantom.libraryPath一样。

    fs.exists(string)：文件是否存在。
    
    fs.makeDirectory(string)：创建一个目录。
    
### 2.4 System Module(系统模块)

首先必须引入`var system = require('system');`模块

    system.args：返回命令行参数数组，第一个参数是脚本名，其他的是各个参数。
    
    system.pid：正在运行的进程id。
    
### 2.5 Web Server Module(Web服务器模块)

首先引入`var server = require('webserver').create();`模块

    server.listen(port, function (request, response) {}：开启监听服务。
    
    request 参数
    request.method：请求方式'GET'或'POST'等等
    request.url：请求地址，包括GET的参数
    request.post：请求体，仅在'POST'和'PUT'时存在
    
    response 参数
    response.statusCode：http状态码
    response.headers：http头部信息
    response.write(data)：响应体写入数据
    response.close()：关闭http连接
    
### 2.6 自定义Module
    
在`examples`目录中，有`module.js`和`universe.js`两个脚本：

`module.js`：

```javascript
"use strict";
var universe = require('./universe');
universe.start();
console.log('The answer is ' + universe.answer);
phantom.exit();
```

`universe.js`：

```javascript
"use strict";
exports.answer = 42;

exports.start = function () {
    console.log('Starting the universe....');
}
```

自定义module跟nodeJs类似，主要是`module.js`通过`require('./universe')`加载universe这个模块，然后就可以直接访问`universe.js`中exports对象的成员函数。
    
## 3. 设计思路

### 3.1 初步思路
    
    1. Web项目提供一个http服务，并公开此url地址，访问该地址可以获取Echarts统计图；
    2. Java通过Runtime调用phantomjs脚本，并传入url和filename参数，相当于打开浏览器；
    3. 使用page.open(url)打开该地址，相当于在浏览器中浏览访问；
    4. 使用page.render(filename)生成图片，相当于截图保存；
    5. Java读取filename图片文件File，将其转换成Base64字符串即可。
    
>此思路的流程是按照人的操作流程实现的，phantomjs在这里就是一个浏览器。首先有地址可访问，打开phantomjs，访问地址，截图保存，最后获取图片。

>这种设计需要在Web项目开发一个或多个页面，供phantomjs调用。首先增加开发工作量，并导致项目存在无关的页面，最后耦合度较高，不利于维护。
 
### 3.2 中期思路

    web项目不开发页面，利用Web Page Module模块中的沙盒，生成所需的页面。
    查看ECharts的文档，统计图的创建主要是通过option(配置项和数据)来控制，因此可以通过option动态生成不同的统计图。
    
    1. Java通过Runtime调用phantomjs脚本，传入ECharts的option和filename参数；
    2. 使用page.open(about:blank)打开空页面；
    3. 调用page.evaluate()在空页面上创建ECharts的Dom层和JavaScript代码；
    4. 使用page.render(filename)生成图片；
    5. Java读取filename图片文件File，将其转换成Base64字符串即可。
    
>这种方式可以解耦合，我们只需关注ECharts的option怎么传入。但是通过Java的Runtime多次打开phantomjs进程，不仅效率慢，而且大量处理时吃服务器资源。

### 3.3 改进思路(目前实现)

    为解决多次开启进程带来的资源消耗提高性能，主要是减少phantomjs进程的多次打开与关闭，目前的解决思路有两种：
    一、利用Child Process Module(子进程模块)，开启phantomjs进程时，同时启动Java进程作为子进程。通过共享的stdin,stdout,stderr进行通信。
    二、利用Web Server Module(Web服务器模块)，开启web服务，java通过http请求发送数据并获取结果。
    
    1. 使用server.listen()开启Web服务。
    2. java通过url请求地址，并传入ECharts的option参数；
    3. 使用page.open(about:blank)打开空页面；
    4. 调用page.evaluate()在空页面上创建ECharts的Dom层和JavaScript代码；
    5. 使用page.renderBase64(format)生成图片的Base64字符串；
    6. response返回Base64数据。
    
### 3.4 后续版本

    在实际使用过程中会出现各种问题，待改进。
    
## 4. 代码实现

### 4.1 引入module

```javascript
// 引入module
var system = require('system'), // 获取参数
    path = phantom.libraryPath,
    command = require(path + '/module/command.js');// 参数module
```

其中system为了获取参数选项，path是当前脚本路径，command是命令行解析模块。

### 4.2 设置选项并解析参数

```javascript
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
```

以port为例，-p是短选项，--port是长选项，<number>是命令后必须跟参数，'change server port when add -s or --server'是描述信息，9090是默认值。

参数介绍：

    -s或--server：开启服务监听，如果开启服务端，则-o不生效，这也就意味不能使用脚本命令生成图片；
    -p或--port：端口号，只有-s启用时生效，改变监听端口号；
    -o或--opt：ECharts的option,这里是json字符串，最外层不加引号；
        示例：{title:{text:'ECharts示例'},tooltip:{},legend:{data:['销量']},xAxis:{data:['衬衫','羊毛衫','雪纺衫','裤子','高跟鞋','袜子']},yAxis:{},series:[{name:'销量',type:'bar',data:[5,20,36,10,10,20]}]}
    -t或--type：生成类型file或base64，file是生成图片，base64是生成Base64字符串；
    -f或--outfile：文件输出路径，只有--type=file时生效，如果不指定，则在脚本目录下创建一个tmp文件夹，将图片以时间戳为名字，保存到tmp目录下；
    -w或--width：生成的图片宽度，默认800像素；
    -h或--height：生成的图片高度，默认400像素。
    
服务端参数

    GET或POST请求时，request的参数主要包括：
    
    opt：与--opt等同，ECharts的option,这里是json字符串；
    type：与--type等同，生成类型file或base64；
    width：与--width等同，生成的图片宽度，默认800像素；
    height：与--height等同，生成的图片高度，默认400像素。
    
system.args获取命令行参数，parse(system.args)解析参数，之后可以通过commandParams.server，commandParams.port获取相关值。

### 4.3 创建对象并初始化

```javascript
// ***********************************
// Echarts转换器
// ***********************************
function Convert(params) {
    this.params = params || commandParams; // 参数命令
    this.external = {
        JQUERY3: path + '/script/jquery-3.2.1.min.js',
        ECHARTS3: path + '/script/echarts.min.js',
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
```

创建Convert对象，对象会保存命令行参数选项以及常量如外部依赖js的路径。

init()主要是检查参数，并判断开启服务端还是客户端处理，参数检查详见`Convert.prototype.check`。

### 4.4 开启服务监听

```javascript
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
                write("", false, "get image error,please check parameter [opt]");
            }
        } else {
            write("", false, "missing parameter [opt]");
        }

    });

    // 判断服务是否启动成功
    if (!listen) {
        this.error("could not create echarts-convert server listening on port " + params.port);
    } else {
        console.log("echarts-convert server start success. [pid]=" + system.pid);
    }
};
```

`var listen = server.listen(params.port, function (request, response) {}`开启服务，返回值listen如果为false时则启动失败。

`Convert.prototype.serverGetArgs`获取并解析request参数，这里只处理了GET和POST请求，解析参数时一定要进行解码处理，尤其是中文。

```javascript
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
```

>注：中文解码必须写两层decodeURIComponent

### 4.5 调用客户端渲染

```javascript
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
    output = function (content, success) {
        if (params.server) {
            fn(content, success);
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
        output(msg, false); // 失败,返回错误信息
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
```

调用客户端，主要是为了开启沙盒，进行ECharts统计图创建以及图片渲染工作。

    1. page.open("about:blank")一个空页面；
    2. page.injectJs引入外部js，jQuery和ECharts；
    3. page.evaluate页面创建ECharts的Dom,并生成统计图；
    4. page.clipRect定义截图范围；
    5. page.render渲染生成图片；
    6. output输出，命令行直接将结果打印到控制台，Web将输出到response。
    
其中`createEchartsDom`是创建ECharts的Dom对象：

```javascript
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
    $(document.body).css('backgroundColor', 'white');
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
```
    
以ECharts官方实例为例，上述代码等同于以下html：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ECharts</title>
    <script src="jquery.min.js"></script>
    <script src="echarts.min.js"></script>
    <script type="text/javascript">
        // 指定图表的配置项和数据
        var options = {
            title: {
                text: 'ECharts示例'
            },
            tooltip: {},
            legend: {
                data:['销量']
            },
            xAxis: {
                data: ["衬衫","羊毛衫","雪纺衫","裤子","高跟鞋","袜子"]
            },
            yAxis: {},
            series: [{
                name: '销量',
                type: 'bar',
                data: [5, 20, 36, 10, 10, 20]
            }]
        };
        
        // 取消options动画效果
        if (options !== undefined) {
            options.animation = false;
        }
    </script>
</head>
<body style="background-color: white;">
    <!-- 为ECharts准备一个具备大小（宽高）的Dom -->
    <div id="container" style="width: 800px;height:400px;"></div>
    <script type="text/javascript">
        // 基于准备好的dom，初始化echarts实例
        var eChart = echarts.init(document.getElementById('container'));
        // 使用刚指定的配置项和数据显示图表。
        eChart.setOption(options);
    </script>
</body>
</html>
```

>这里采用动态加载js来生成options，也可采用JSON.parse(options)将json串解析成对象，后期如果将json的验证完善后可以考虑采用此方式

### 4.6 Web服务返回信息

```javascript
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
```

`response.headers`的`Content-Type`设置为`application/json;charset=utf-8`，将返回json，并且为方便使用，将以统一的格式返回数据

其Json格式包括：

    code：成功为1，失败为0；
    msg: 成功为'success'，失败为'failure'或其他错误信息；
    data: 数据，正确返回base64字符串或图片路径，失败为空字符串

成功调用的json格式如下：

```json
{
  "code":1,
  "msg":"success",
  "data": "base64 string"
}
```

### 4.7 异常信息处理

PhantomJS异常监听主要包括两种：web page模块异常和phantom对象异常

web page异常，此类异常最好手动处理，如果不处理，使用page.evaluate同步命令，如果出现异常PhantomJS线程将被阻止。

```javascript
/**
 * 页面错误监听
 * @param msg
 * @param trace
 */
page.onError = function (msg, trace) {
    output("", false, msg); // 失败,返回错误信息
};
```

全局异常，此类异常在page.onError之后执行，一般发生无法预估异常。

```javascript
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
```

## 5. 脚本使用

    1. 首先按照(1.1 PhantomJS下载安装)安装好PhantomJS；
    2. 下载phantom.zip并将其解压；
    3. 在`echarts-convert.js`同级目录下，运行命令` phantomjs echarts-convert.js -s `；
    4. 如果控制台出现"echarts-convert server start success. [pid]=xxxx"则表示启动成功，默认端口9090；
    5. Java通过HttpClient或URLConnection请求，url为http://localhost:9090；GET或POST请求，request参数为opt=optJson；

以HttpClient为例，java调用：

```java
import java.io.IOException;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.apache.http.HttpEntity;
import org.apache.http.NameValuePair;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;

public class EChartsConvertTest {

    public static void main(String[] args) {
         String url = "http://localhost:9090";
         // 不必要的空格最好删除，字符串请求过程中会将空格转码成+号
         String optJson = "{title:{text:'ECharts 示例'},tooltip:{},legend:{data:['销量']},"
         				+ "xAxis:{data:['衬衫','羊毛衫','雪纺衫','裤子','高跟鞋','袜子']},yAxis:{},"
         				+ "series:[{name:'销量',type:'bar',data:[5,20,36,10,10,20]}]}";
         Map<String, String> map = new HashMap<>();
         map.put("opt", optJson);
         try {
             String post = post(url, map, "utf-8");
             System.out.println(post);
         } catch (ParseException e) {
             e.printStackTrace();
         } catch (IOException e) {
             e.printStackTrace();
         }
     }
     
     // post请求
     public static String post(String url, Map<String, String> map, String encoding) throws ParseException, IOException {
         String body = "";
     
         // 创建httpclient对象
         CloseableHttpClient client = HttpClients.createDefault();
         // 创建post方式请求对象
         HttpPost httpPost = new HttpPost(url);
     
         // 装填参数
         List<NameValuePair> nvps = new ArrayList<>();
         if (map != null) {
             for (Entry<String, String> entry : map.entrySet()) {
                 nvps.add(new BasicNameValuePair(entry.getKey(), entry.getValue()));
             }
         }
         // 设置参数到请求对象中
         httpPost.setEntity(new UrlEncodedFormEntity(nvps, encoding));
     
         // 执行请求操作，并拿到结果（同步阻塞）
         CloseableHttpResponse response = client.execute(httpPost);
         // 获取结果实体
         HttpEntity entity = response.getEntity();
         if (entity != null) {
             // 按指定编码转换结果实体为String类型
             body = EntityUtils.toString(entity, encoding);
         }
         EntityUtils.consume(entity);
         // 释放链接
         response.close();
         return body;
     }
}
```

## 6. 问题与改进

目前整个脚本已经完成初版，但仍有一些已知或未知的问题和缺陷存在，主要包括以下几点：
    
1. 命令行自定义模块使用`commander.js`,但因其是为nodejs开发的，所以只抽取了部分代码，有些改动未测试；
2. PhantomJs的Web Server Module(Web服务器模块)仍处于实验性的功能模块，稳定性未知；
3. ECharts的opt目前是人为拼接json字符串，这样会带来一些不必要的问题，后期需要规范传入json的格式；
4. 目前只测试过较为简单的统计图，对于复杂的统计图并没有测试过，使用过程中可能会存在一些问题；
5. 再每次渲染生成图片后执行page.close()，关闭页面，这样会稍微增加性能消耗，后续可以考虑只在沙盒里处理；
6. 目前使用单线程处理图片，高并发下仍需要开发。

优化方向

1. 增加json字符串即带引号的json支持；
2. 通过java生成ECharts的opt json，而不是人为拼接字符串;
3. 沙盒中处理ECharts图片，不再关闭page。

## 7. 参考资料

[PhantomJS API](http://phantomjs.org/api/)

[PhantomJS快速入门教程](http://www.tuicool.com/articles/beeMNj/)

[Python爬虫利器四之PhantomJS的用法](http://cuiqingcai.com/2577.html)

[java使用phantomJs抓取动态页面](http://blog.csdn.net/kaka0930/article/details/68941932)

[JavaScript标准参考教程之PhantomJS](http://javascript.ruanyifeng.com/tool/phantomjs.html#toc1)

[commander.js](https://github.com/tj/commander.js)

[ECharts官网](http://echarts.baidu.com/)

[使用phantomJs服务器端导出Echarts图片](http://blog.csdn.net/zor_chen/article/details/31371501)

[java调用phantomjs的性能问题](https://segmentfault.com/q/1010000003989521)

    