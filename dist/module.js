"use strict";

System.register(["lodash", "app/plugins/sdk", "app/core/utils/kbn", "app/core/time_series", "./legend", "./barchz-panel.css!", "jquery", "jquery.flot", "jquery.flot.stack"], function (_export, _context) {
    "use strict";

    var _, MetricsPanelCtrl, kbn, TimeSeries, legend, $, _createClass, barchzCtrl;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    return {
        setters: [function (_lodash) {
            _ = _lodash.default;
        }, function (_appPluginsSdk) {
            MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
        }, function (_appCoreUtilsKbn) {
            kbn = _appCoreUtilsKbn.default;
        }, function (_appCoreTime_series) {
            TimeSeries = _appCoreTime_series.default;
        }, function (_legend) {
            legend = _legend.default;
        }, function (_barchzPanelCss) {}, function (_jquery) {
            $ = _jquery.default;
        }, function (_jqueryFlot) {}, function (_jqueryFlotStack) {}],
        execute: function () {
            _createClass = function () {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }

                return function (Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            }();

            _export("PanelCtrl", _export("barchzCtrl", barchzCtrl = function (_MetricsPanelCtrl) {
                _inherits(barchzCtrl, _MetricsPanelCtrl);

                function barchzCtrl($scope, $injector, $rootScope) {
                    _classCallCheck(this, barchzCtrl);

                    var _this = _possibleConstructorReturn(this, (barchzCtrl.__proto__ || Object.getPrototypeOf(barchzCtrl)).call(this, $scope, $injector));

                    _this.$rootScope = $rootScope;

                    var panelDefaults = {
                        legend: {
                            show: true, // disable/enable legend
                            values: true
                        },
                        links: [],
                        datasource: null,
                        maxDataPoints: 3,
                        interval: null,
                        targets: [{}],
                        cacheTimeout: null,
                        nullPointMode: 'connected',
                        legendTable: false,
                        aliasColors: {},
                        format: 'short',
                        valueName: 'current',
                        yaxis: {
                            label: null,
                            show: true,
                            tickDecimals: 0
                        },
                        xaxis: {
                            show: true,
                            tickDecimals: 2
                        },
                        decimals: 2
                    };

                    _.defaults(_this.panel, panelDefaults);
                    _.defaults(_this.panel.legend, panelDefaults.legend);

                    _this.events.on('render', _this.onRender.bind(_this));
                    _this.events.on('data-received', _this.onDataReceived.bind(_this));
                    _this.events.on('data-error', _this.onDataError.bind(_this));
                    _this.events.on('data-snapshot-load', _this.onDataReceived.bind(_this));
                    _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
                    return _this;
                }

                _createClass(barchzCtrl, [{
                    key: "onInitEditMode",
                    value: function onInitEditMode() {
                        this.addEditorTab('Axes', 'public/plugins/grafana-barchz-panel/axes.html');
                        this.addEditorTab('Options', 'public/plugins/grafana-barchz-panel/editor.html');
                        this.unitFormats = kbn.getUnitFormats();
                    }
                }, {
                    key: "setUnitFormat",
                    value: function setUnitFormat(subItem) {
                        this.panel.format = subItem.value;
                        this.render();
                    }
                }, {
                    key: "onDataError",
                    value: function onDataError() {
                        this.series = [];
                        this.render();
                    }
                }, {
                    key: "onRender",
                    value: function onRender() {
                        this.data = this.parseSeries(this.series);
                    }
                }, {
                    key: "parseSeries",
                    value: function parseSeries(series) {
                        var _this2 = this;

                        return _.map(this.series, function (serie, i) {
                            return {
                                label: serie.alias,
                                data: serie.flotpairs[0],
                                color: _this2.panel.aliasColors[serie.alias] || _this2.$rootScope.colors[i]
                            };
                        });
                    }
                }, {
                    key: "onDataReceived",
                    value: function onDataReceived(dataList) {
                        this.series = dataList.map(this.seriesHandler.bind(this));
                        this.data = this.parseSeries(this.series);
                        this.render(this.data);
                    }
                }, {
                    key: "seriesHandler",
                    value: function seriesHandler(seriesData) {
                        var series = new TimeSeries({
                            datapoints: seriesData.datapoints,
                            alias: seriesData.target
                        });

                        series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);

                        return series;
                    }
                }, {
                    key: "getDecimalsForValue",
                    value: function getDecimalsForValue(value) {
                        if (_.isNumber(this.panel.decimals)) {
                            return { decimals: this.panel.decimals, scaledDecimals: null };
                        }

                        var delta = value / 2;
                        var dec = -Math.floor(Math.log(delta) / Math.LN10);

                        var magn = Math.pow(10, -dec);
                        var norm = delta / magn; // norm is between 1.0 and 10.0
                        var size;

                        if (norm < 1.5) {
                            size = 1;
                        } else if (norm < 3) {
                            size = 2;
                            // special case for 2.5, requires an extra decimal
                            if (norm > 2.25) {
                                size = 2.5;
                                ++dec;
                            }
                        } else if (norm < 7.5) {
                            size = 5;
                        } else {
                            size = 10;
                        }

                        size *= magn;

                        // reduce starting decimals if not needed
                        if (Math.floor(value) === value) {
                            dec = 0;
                        }

                        var result = {};
                        result.decimals = Math.max(0, dec);
                        result.scaledDecimals = result.decimals - Math.floor(Math.log(size) / Math.LN10) + 2;

                        return result;
                    }
                }, {
                    key: "formatValue",
                    value: function formatValue(value) {
                        var decimalInfo = this.getDecimalsForValue(value);
                        var formatFunc = kbn.valueFormats[this.panel.format];
                        if (formatFunc) {
                            return formatFunc(value, decimalInfo.decimals, decimalInfo.scaledDecimals);
                        }
                        return value;
                    }
                }, {
                    key: "link",
                    value: function link(scope, elem, attrs, ctrl) {
                        var data, panel;

                        elem = elem.find('.barchz-panel');
                        var $tooltip = $('<div id="tooltip">');

                        ctrl.events.on('render', function () {
                            render();
                            ctrl.renderingCompleted();
                        });

                        function setElementHeight() {
                            try {
                                var height = ctrl.height || panel.height || ctrl.row.height;
                                if (_.isString(height)) {
                                    height = parseInt(height.replace('px', ''), 10);
                                }

                                height -= 5; // padding
                                height -= panel.title ? 24 : 9; // subtract panel title bar

                                elem.css('height', height + 'px');

                                return true;
                            } catch (e) {
                                // IE throws errors sometimes
                                return false;
                            }
                        }

                        function processOffsetHook(plot, gridMargin) {
                            var left = panel.yaxis;
                            var right = panel.yaxis;
                            if (left.show && left.label) {
                                gridMargin.left = 20;
                            }
                            if (right.show && right.label) {
                                gridMargin.right = 20;
                            }
                        }

                        function drawHook(plot) {
                            // add left axis labels
                            if (panel.yaxis.label) {
                                var yaxisLabel = $("<div class='axisLabel left-yaxis-label'></div>").text(panel.yaxis.label).appendTo(elem);

                                yaxisLabel[0].style.marginTop = elem.height() / 6 + 'px';
                            }
                        }

                        function addbarchz() {
                            var width = elem.width();
                            var height = elem.height();

                            var size = Math.min(width, height);

                            var plotCanvas = $('<div></div>');
                            var plotCss = {
                                top: '10px',
                                margin: 'auto',
                                position: 'relative',
                                height: size - 20 + 'px'
                            };

                            plotCanvas.css(plotCss);

                            var $panelContainer = elem.parents('.panel-container');
                            var backgroundColor = $panelContainer.css('background-color');

                            elem.html(plotCanvas);

                            var plotSeries = [];
                            var plotTicksX = [];
                            var plotTicksY = [];
                            var TotalAxisX = 0;

                            _.map(data, function (origData, i) {
                                TotalAxisX = TotalAxisX + origData.data[1];

                                plotSeries.push({
                                    label: origData.label,
                                    data: [[origData.data[1], //Se inviritio este renglon para la grafica horizonta
                                    1]
                                    /*,
                                    [
                                       origData.data[1]*0.2,  //Se inviritio este renglon para la grafica horizonta
                                       2
                                    ],
                                    [
                                       origData.data[1]*0.4,  //Se inviritio este renglon para la grafica horizonta
                                       3
                                    ]*/
                                    ],

                                    color: origData.color,

                                    xaxis: {
                                        ticks: [origData.data[1], origData.data[1]]
                                    }
                                });
                                plotTicksX.push([origData.data[1], origData.data[1]]);
                                plotTicksY.push([i, origData.label]);
                            });

                            var options = {
                                series: {
                                    stack: true,
                                    bars: {
                                        show: true
                                    }
                                },
                                bars: {
                                    align: "center",
                                    horizontal: true,
                                    barWidth: .8,
                                    lineWidth: 0
                                },
                                hooks: {
                                    draw: [drawHook],
                                    processOffset: [processOffsetHook]
                                },
                                legend: {
                                    show: false
                                },
                                xaxis: {
                                    max: 100,
                                    //ticks: plotTicksX,
                                    show: panel.xaxis.show,
                                    tickFormatter: function tickFormatter(val, axis) {
                                        return ctrl.formatValue(val);
                                    }
                                },
                                yaxis: {
                                    ticks: plotTicksY,
                                    show: panel.yaxis.show,
                                    tickFormatter: function tickFormatter(val, axis) {
                                        return ctrl.formatValue(val);
                                    }
                                },
                                shadowSize: 0,
                                grid: {
                                    minBorderMargin: 0,
                                    markings: [],
                                    backgroundColor: backgroundColor,
                                    borderWidth: 0,
                                    hoverable: true,
                                    color: '#c8c8c8',
                                    margin: { left: 0, right: 0 }
                                },
                                selection: {
                                    mode: "y",
                                    color: '#666'
                                }
                            };

                            //console.log(plotSeries);
                            //console.log(TotalAxisX);
                            options.xaxis.max = TotalAxisX;
                            //console.log(options);


                            $.plot(plotCanvas, plotSeries, options);
                            plotCanvas.bind("plothover", function (event, pos, item) {
                                if (!item) {
                                    $tooltip.detach();
                                    return;
                                }

                                var body;
                                var formatted = ctrl.formatValue(item.series.data[0][0]);
                                body = '<div class="graph-tooltip-small"><div class="graph-tooltip-time">';
                                body += '<div class="graph-tooltip-value">' + item.series.label + ': ' + formatted;
                                body += '</div>';
                                body += "</div></div>";
                                $tooltip.html(body).place_tt(pos.pageX + 20, pos.pageY);
                            });
                        }

                        function render() {
                            if (!ctrl.data) {
                                return;
                            }

                            data = ctrl.data;
                            panel = ctrl.panel;

                            if (setElementHeight()) {
                                addbarchz();
                            }
                        }
                    }
                }]);

                return barchzCtrl;
            }(MetricsPanelCtrl)));

            _export("barchzCtrl", barchzCtrl);

            barchzCtrl.templateUrl = 'module.html';

            _export("PanelCtrl", barchzCtrl);
        }
    };
});
//# sourceMappingURL=module.js.map
