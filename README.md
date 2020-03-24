<p align="center">
	<img src="https://raw.githubusercontent.com/RadhiFadlillah/duit/master/docs/readme/logo.png" alt="Duit" width="450">
</p>
<p align="center">Simple money tracker, built with Go and Mithril.js</p>
<p align="center">
	<a href="https://choosealicense.com/licenses/mit"><img src="https://img.shields.io/static/v1?label=license&message=MIT&color=5fa6b0"></a>
	<a href="https://goreportcard.com/report/github.com/RadhiFadlillah/duit"><img src="https://goreportcard.com/badge/github.com/RadhiFadlillah/duit"></a>
	<a href="https://www.paypal.me/RadhiFadlillah"><img src="https://img.shields.io/static/v1?label=donate&message=PayPal&color=00457C&logo=paypal"></a>
	<a href="https://ko-fi.com/radhifadlillah"><img src="https://img.shields.io/static/v1?label=donate&message=Ko-fi&color=F16061&logo=ko-fi"></a>
</p>

---

Duit is a simple money tracker written in Go language and Mithril.js. I created this for me and my wife, so the feature is a bit lacking, just the bare needed features to track where the money goes. However, I hope it will be useful for other families as well. This application is distributed as a single binary, which means it can be installed and used easily.

## Features

- Basic money tracking, i.e. income, expense and transfer.

   ![Basic money tracking](https://raw.githubusercontent.com/RadhiFadlillah/duit/master/docs/readme/basic-list.png)

- Simple chart to track total money available.

   ![Simple chart](https://raw.githubusercontent.com/RadhiFadlillah/duit/master/docs/readme/simple-chart.png)

- Responsive on mobile.

   ![Mobile responsive](https://raw.githubusercontent.com/RadhiFadlillah/duit/master/docs/readme/mobile.png)

## Installation

You can download the latest version of `duit` from release page. To built from source, make sure you use `go >= 1.13` then run following commands :

```
git clone git@github.com:RadhiFadlillah/duit.git
cd duit
go build -v -tags prod
```

After build finished, put it into your `$PATH` then run it.

## Usage

```
Duit, the simple money manager

Usage:
  duit [flags]

Flags:
  -c, --config string   path to config file (default "/home/radhi/.config/duit/config.toml")
  -h, --help            help for duit
  -p, --port int        port used by the server (default 8080)
```

## Configuration

Duit uses MariaDB or MySQL database, so make sure it's installed on your system before you start `duit`. 

As can be seen from usage documentation above, `duit` needs to be configurated before it started. The configuration file by default is located in user config dir (which is `$XDG_CONFIG_HOME` in Linux), but can be set manually by user.

The configuration file is a TOML file with following contents (change it depending on your case) :

```toml
dbName = "duit"
dbUser = "root"
dbHost = "127.0.0.1"
dbPassword = ""
```

Once configuration file created, you can start using `duit`.

## Attributions

Original logo is created by [Freepik](https://www.flaticon.com/authors/freepik) in theirs [business pack](https://www.flaticon.com/packs/business-471), which can be downloaded from [www.flaticon.com](https://www.flaticon.com/).

## License

Duit is distributed using [MIT license](https://choosealicense.com/licenses/mit/), which means you can use and modify it however you want. However, if you make an enhancement for it, if possible, please send a pull request. If you like this project, please consider donating to me either via [PayPal](https://www.paypal.me/RadhiFadlillah) or [Ko-Fi](https://ko-fi.com/radhifadlillah).