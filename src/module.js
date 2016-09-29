import _ from "lodash";
import {MetricsPanelCtrl} from "app/plugins/sdk";
import kbn from "app/core/utils/kbn";
import TimeSeries from "app/core/time_series";
import legend from './legend';
import './barchz-panel.css!';
import $ from "jquery";
import "jquery.flot";
import "jquery.flot.stack";


export class barchzCtrl extends MetricsPanelCtrl {

    constructor($scope, $injector, $rootScope) {
        super($scope, $injector);
        this.$rootScope = $rootScope;

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

        _.defaults(this.panel, panelDefaults);
        _.defaults(this.panel.legend, panelDefaults.legend);

        this.events.on('render', this.onRender.bind(this));
        this.events.on('data-received', this.onDataReceived.bind(this));
        this.events.on('data-error', this.onDataError.bind(this));
        this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
        this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    }

    onInitEditMode() {
        this.addEditorTab('Axes', 'public/plugins/grafana-barchz-panel/axes.html');
        this.addEditorTab('Options', 'public/plugins/grafana-barchz-panel/editor.html');
        this.unitFormats = kbn.getUnitFormats();
    }

    setUnitFormat(subItem) {
        this.panel.format = subItem.value;
        this.render();
    }

    onDataError() {
        this.series = [];
        this.render();
    }

    onRender() {
        this.data = this.parseSeries(this.series);
    }

    parseSeries(series) {
        return _.map(this.series, (serie, i) => {
            return {
                label: serie.alias,
                data: serie.flotpairs[0],
                color: this.panel.aliasColors[serie.alias] || this.$rootScope.colors[i]
            };
        });
    }

    onDataReceived(dataList) {
        this.series = dataList.map(this.seriesHandler.bind(this));
        this.data = this.parseSeries(this.series);
        this.render(this.data);
    }

    seriesHandler(seriesData) {
        var series = new TimeSeries({
            datapoints: seriesData.datapoints,
            alias: seriesData.target
        });

        series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);

        return series;
    }

    getDecimalsForValue(value) {
        if (_.isNumber(this.panel.decimals)) {
            return {decimals: this.panel.decimals, scaledDecimals: null};
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

    formatValue(value) {
        var decimalInfo = this.getDecimalsForValue(value);
        var formatFunc = kbn.valueFormats[this.panel.format];
        if (formatFunc) {
            return formatFunc(value, decimalInfo.decimals, decimalInfo.scaledDecimals);
        }
        return value;
    }

    link(scope, elem, attrs, ctrl) {
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
            } catch (e) { // IE throws errors sometimes
                return false;
            }
        }

        function processOffsetHook(plot, gridMargin) {
            var left = panel.yaxis;
            var right = panel.yaxis;
            if (left.show && left.label) { gridMargin.left = 20; }
            if (right.show && right.label) { gridMargin.right = 20; }
        }

        function drawHook(plot) {
             // add left axis labels
            if (panel.yaxis.label) {
                var yaxisLabel = $("<div class='axisLabel left-yaxis-label'></div>")
                    .text(panel.yaxis.label)
                    .appendTo(elem);

                yaxisLabel[0].style.marginTop = (elem.height() / 6) + 'px';
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
                height: (size - 20) + 'px'
            };

            plotCanvas.css(plotCss);

            var $panelContainer = elem.parents('.panel-container');
            var backgroundColor = $panelContainer.css('background-color');

            elem.html(plotCanvas);

            var plotSeries = [];
            var plotTicksX = [];
            var plotTicksY = [];
            var TotalAxisX=0;

            _.map(data, function(origData, i) {
              TotalAxisX = TotalAxisX +origData.data[1];

                plotSeries.push({
                                    label: origData.label,
                                    data: [
                                      [
                                         origData.data[1],  //Se inviritio este renglon para la grafica horizonta
                                         1
                                      ]
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
                plotTicksX.push([
                                   origData.data[1],
                                   origData.data[1]
                               ]);
                plotTicksY.push([
                                    i,
                                    origData.label
                                  ]);


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
                    processOffset: [processOffsetHook],
                },
                legend: {
                    show: false
                },
                xaxis: {
                    max: 100,
                    //ticks: plotTicksX,
                    show: panel.xaxis.show,
                    tickFormatter: function (val, axis) {
                        return ctrl.formatValue(val);
                    }
                },
                yaxis: {
                  ticks:plotTicksY,
                    show: panel.yaxis.show,
                    tickFormatter: function (val, axis) {
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
                    margin: {left: 0, right: 0},
                },
                selection: {
                    mode: "y",
                    color: '#666'
                }
            };

            //console.log(plotSeries);
            //console.log(TotalAxisX);
            options.xaxis.max=TotalAxisX;
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
}

barchzCtrl.templateUrl = 'module.html';

export {
    barchzCtrl as PanelCtrl
};
