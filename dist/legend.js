'use strict';

System.register(['angular', 'lodash', 'jquery', 'jquery.flot', 'jquery.flot.time'], function (_export, _context) {
  "use strict";

  var angular, _, $;

  return {
    setters: [function (_angular) {
      angular = _angular.default;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_jquery) {
      $ = _jquery.default;
    }, function (_jqueryFlot) {}, function (_jqueryFlotTime) {}],
    execute: function () {

      angular.module('grafana.directives').directive('barchartLegend', function () {
        return {
          link: function link(scope, elem) {
            var $container = $('<section class="graph-legend"></section>');
            var firstRender = true;
            var ctrl = scope.ctrl;
            var panel = ctrl.panel;
            var data;
            var seriesList;
            var i;

            ctrl.events.on('render', function () {
              data = ctrl.series;
              if (data) {
                for (var i in data) {
                  data[i].color = ctrl.data[i].color;
                }
                render();
              }
            });

            function render() {
              if (firstRender) {
                elem.append($container);
                firstRender = false;
              }

              seriesList = data;

              $container.empty();

              var tableLayout = panel.legendTable && panel.legend.values;

              $container.toggleClass('graph-legend-table', tableLayout);

              if (tableLayout) {
                var header = '<tr><th colspan="2" style="text-align:left"></th>';
                if (panel.legend.values) {
                  header += '<th class="pointer"></th>';
                }
                header += '</tr>';
                $container.append($(header));
              }

              for (i = 0; i < seriesList.length; i++) {
                var series = seriesList[i];

                // ignore empty series
                if (panel.legend.hideEmpty && series.allIsNull) {
                  continue;
                }
                // ignore series excluded via override
                if (!series.legend) {
                  continue;
                }

                var html = '<div class="graph-legend-series';
                html += '" data-series-index="' + i + '">';
                html += '<span class="graph-legend-icon no-pointer">';
                html += '<i class="fa fa-minus" style="color:' + series.color + '"></i>';
                html += '</span>';

                html += '<span class="graph-legend-alias no-pointer">';
                html += '<a class="no-pointer">' + series.label + '</a>';
                html += '</span>';

                if (panel.legend.values) {
                  html += '<div class="graph-legend-value no-pointer ' + ctrl.panel.valueName + '">' + series.formatValue(series.stats[ctrl.panel.valueName]) + '</div>';
                }

                html += '</div>';
                $container.append($(html));
              }
            }
          }
        };
      });
    }
  };
});
//# sourceMappingURL=legend.js.map
