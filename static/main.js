var $ = Dom7;

// Init App
var myApp = new Framework7({
	id: 'io.framework7.testapp',
	root: '#app',
	theme: 'auto'
});

var apps = angular.module('application', []);

apps.filter('stringToInteger', function () {
	return function (input, key) {
		angular.forEach(input, function(value, index) {
			input[index].tempFilter = (!input[index].tempFilter) ? value[key] : input[index].tempFilter;
			input[index][key] = value[key] * 10;
		})
		
		return input;
	};
});
apps.filter('intigerToString', function () {
	return function (input, key) {
		angular.forEach(input, function (value, index) {
			input[index][key] = input[index].tempFilter;
		});

		return input;
	};
});
apps.service('services', function () {
	this.isRupiah = function (pair) {

		return (pair.substr(pair.length - 3) == "idr") ? true : false;
	};
	this.toRupiah = function (angka) {
		var rupiah = '';
		var angkarev = angka.toString().split('').reverse().join('');
		for (var i = 0; i < angkarev.length; i++) if (i % 3 == 0) rupiah += angkarev.substr(i, 3) + '.';
		return rupiah.split('', rupiah.length - 1).reverse().join('');
	};
	this.toBilanganRupiah = function (numb) {
		var stringNumber = numb.toString();

		if (stringNumber.length < 9) {
			return (numb / 1e6).toFixed(1) + " JT";
		} else if (stringNumber.length < 12) {
			return (numb / 1e9).toFixed(1) + " M";
		} else if (stringNumber.length < 14) {
			return (numb / 1e12).toFixed(1) + " T";
		}
	};
	this.toSatoshi = function (value) {

		return (value / 1e8).toFixed(8);
	};
	this.renderData = function (res, filter) {
		var tempPrices = [];
		var prevRes = nyanStorage.get('prevData');
		var _self = this;

		Object.keys(res.prices).forEach(function (pair, $index) {
			var price = res.prices[pair];
			var prevPrice = (prevRes) ? prevRes.prices[pair] : 0;
			var price24 = res.prices_24h[pair];
			var change = ((price - price24) / price24 * 100).toFixed(1);

			function pusher() {
				tempPrices.push({
					market: pair.toUpperCase(),
					price: _self.isRupiah(pair) ? _self.toRupiah(price) : _self.toSatoshi(price),
					volume: _self.isRupiah(pair) ? _self.toBilanganRupiah(res.volumes[pair]['idr']) + " IDR" :
						(res.volumes[pair]["btc"] * 1).toFixed(1) + " BTC",
					change: change,
					isGood: (change < 0) ? false : true,
					icon: (change < 0) ? "trending_down" : "trending_up",
					isGoodChange: (price == prevPrice) ? "" : (price > prevPrice) ? "up" : "down"
				})
			}

			if (_self.isRupiah(pair) && filter.isRupiah) {
				pusher()
			} else if (!_self.isRupiah(pair) && filter.isBitcoin) {
				pusher()
			}
		})

		nyanStorage.put('pairs', Object.keys(res.prices));
		nyanStorage.put('prevData', res);

		return tempPrices;
	};
	this.shorting = function(datas, sortWith, isHigher) {
		var short = datas.sort(function (a, b) { return a[sortWith] - b[sortWith] });

		return (!isHigher) ? short : short.reverse();
	}
});
apps.controller('ngController', ['$scope', '$http', 'services', function ($scope, $http, services) {
	$scope.filter = {
		isRupiah: true,
		isBitcoin: true
	};
	$scope.pairs = [];
	
	if (nyanStorage.isAvailable('filter')) {
		$scope.filter = nyanStorage.get('filter');
	}
	if (nyanStorage.isAvailable('pairs')) {
		$scope.pairs = nyanStorage.get('pairs');
	}
	if (nyanStorage.isAvailable('prevData')) {
		$scope.prices = services.renderData(nyanStorage.get('prevData'), $scope.filter);
	} else {
		$scope.prices = [
			{
				market: "BTCIDR",
				price: "N/A",
				volume: "N/A",
				change: "N/A"
			}
		];
	}

	myApp.dialog.progress();

	$http.get('https://api2.bitcoin.co.id/api/btc_idr/webdata').then(function (res) {
		if (res.status == 200) {
			$scope.prices = services.renderData(res.data, $scope.filter);
			setTimeout(() => {
				$('#overlay-preloader').hide();
				$('.price-item').forEach(function (node) {
					$(this).removeClass('up').removeClass('down');
				});
			}, 500);
			myApp.dialog.close();

			var pusher = new Pusher(atob('YTBkZmExODFiMTI0OGI5MjliMTE='), {
				cluster: 'ap1',
				encrypted: true
			});

			var pusher_tradedata = pusher.subscribe('tradedata-btcidr');
				pusher_tradedata.bind('update', function (res) {
					$scope.$apply(function() {
						$scope.prices = services.renderData(res, $scope.filter);
						$scope.pairs = nyanStorage.get('pairs');
					});

					setTimeout(() => {
						$('.price-item').forEach(function(node) {
							$(this).removeClass('up').removeClass('down');
						});
					}, 500);
				});
		}
	});
		
		


	/**
	 * Method
	 */
	$scope.openFilterDialog = function() {
		myApp.popup.open($('#my-popup'));
	}
	$scope.onFilterChange = function(isRupiah, isBitcoin) {
		$scope.filter = {
			isRupiah: isRupiah,
			isBitcoin: isBitcoin
		};

		nyanStorage.put('filter', $scope.filter);
	}	
	$scope.deletePair = function(pair) {
		console.log(pair);
	}
	$scope.toggleTheme = function(params) {
		$('body').toggleClass('theme-dark');
	}
}]);

document.addEventListener("deviceready", function() {
	if (/(android)/i.test(navigator.userAgent)) { // for android & amazon-fireos
		admobid = {
			banner: 'Y2EtYXBwLXB1Yi0zODQ4NDM1MzgyMjc4ODE1Lzk5NTYwNDg1MTY='
		};
	}

	if (typeof AdMob !== "undefined") {
		AdMob.createBanner({
			adId: atob(admobid.banner),
			position: AdMob.AD_POSITION.BOTTOM_CENTER,
			isTesting: true,
			overlap: false,
			offsetTopBar: false,
			bgColor: 'black'
		});
	}

	window.ga.startTrackerWithId("UA-115095030-1", 30, function () {
		window.ga.setUserId(device.uuid);
		window.ga.setAllowIDFACollection(true);
		window.ga.trackView('Apps');
	}, function (e) {
		console.log('onDeviceReady - Error starting GoogleAnalytics');
	});
});