{
    backgroundColor: '#000000',
    color: ['#FEE108', '#9e9e9e'],
    title: {
        text: '${title}',
        left: 25,
        top: 10,
        textStyle: {
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 'normal'
        }
    },
    grid: {
        top: '60px',
        left: '60px',
        right: '80px',
        bottom: '80px'
    },
    xAxis: {
        type: 'category',
        axisLine: {
            onZero: false,
            lineStyle: {
                color: '#FFFFFF'
            }
        },
        splitLine: {
            show: false
        },
        axisTick: {
            inside: true
        },
        axisLabel: {
            color: '#FFFFFF'
        },
        data: ${categories}
    },
    yAxis: {
        type: 'value',
        position: 'right',
        splitLine: {
            show: false
        },
        axisLine: {
            lineStyle: {
                color: '#FFFFFF'
            }
        },
        axisLabel: {
            color: '#FFFFFF',
            formatter:function (value, index) {
                return value.toFixed(0);
            }
        },
        min: function (value, index) {
            return value.min - 1;
        },
        max: function (value, index) {
            return value.max + 1;
        }
    },
    series: [
        {
            type: 'line',
            symbol: 'none',
            data: ${values},
        },{
            type: 'line',
            markLine: {
            symbol: ['none', 'none'],
            label: {
                show: false,
                fontSize: 0
            },
            data: [{
                yAxis: 0,
                lineStyle: {
                    color: '#9e9e9e'
                }
            }]
        }
    }],
    graphic: [{
        type: 'text',
        right: '48',
        top: '10',
        style: {
            fill: '#FFFFFF',
            text: 'https://github.com/LouisLiu00',
            font: '14px sans-serif',
        }
    },{
        type: 'text',
        right: '70',
        bottom: '80',
        style: {
            fill: '#333333',
            text: 'Louis',
            font: '48px sans-serif',
        }
    }]
}