this is a stacked horizontal bar chart

The barchz-panel is based on the job of  Mathias Methner, mathiasmethner@gmail.com creator of the barchart-panel https://github.com/mmethner/barchart-panel



![Barchz Screenshot](/src/img/barchz-panel.png?raw=true)

# Installation

Until this plugin is not pushed to grafana.net, just clone the barchart-panel repository to your 
grafana plugin dir. See [official documentation](http://docs.grafana.org/plugins/installation/) 
for more information.

```
git clone https://github.com/hebelmx/barchz-panel.git
sudo service grafana-server restart
```

# Changelog

## 0.0.1

First working version.

# Testing

To start grafana with a local copy run

 i dont know how to do docker's yet
 so this is not goint to work yet
 29 sep 2016
```
docker build -t barchz-panel .
docker run -p3000:3000 barchz-panel
```

# Development

Install node_modules ``npm install`` and grunt cli ``npm install -g grunt-cli``   
Build ``grunt``

To develop with a running grafana instance, start the file watcher 
and mount the sources to docker:

```
grunt watch
docker build -t barchz-panel .
docker run -p3000:3000 -v $WORKSPACE/barchz-panel:/data/plugins/grafana-barchz-panel/ barchz-panel 
```
