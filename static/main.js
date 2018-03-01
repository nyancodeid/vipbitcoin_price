var $ = Dom7;

// Init App
var app = new Framework7({
    id: 'io.framework7.testapp',
    root: '#app',
    theme: 'auto'
});
var isRupiah = function(pair) {
    return (pair.substr(pair.length - 3) == "idr") ? true : false;
}
var toRupiah = function(angka) {
    var rupiah = '';
    var angkarev = angka.toString().split('').reverse().join('');
    for (var i = 0; i < angkarev.length; i++) if (i % 3 == 0) rupiah += angkarev.substr(i, 3) + '.';
    return rupiah.split('', rupiah.length - 1).reverse().join('');
}
var toSatoshi = function(value) {
    return (value / 1e8).toFixed(8);
}
var renderData = function(res) {
    var tempPrices = [];
    var prevRes = nyanStorage.get('prevData');

    Object.keys(res.prices).forEach(function (pair, $index) {
        var price = res.prices[pair];
        var prevPrice = (prevRes) ? prevRes.prices[pair] : 0;
        var price24 = res.prices_24h[pair];
        var change = ((price - price24) / price24 * 100).toFixed(1);

        tempPrices.push({
            market: pair.toUpperCase(),
            price: isRupiah(pair) ? toRupiah(price) : toSatoshi(price),
            volume: isRupiah(pair) ? toRupiah(res.volumes[pair]['idr']) + " IDR" :
                (res.volumes[pair]["btc"] * 1).toFixed(1) + " BTC",
            change: change,
            isGood: (change < 0) ? false : true,
            icon: (change < 0) ? "trending_down" : "trending_up",
            isGoodChange: (price == prevPrice) ? "" : (price > prevPrice) ? "up" : "down"
        })
    })

    nyanStorage.put('prevData', res);

    return tempPrices;
}

var apps = angular.module('application', []);

apps.controller('ngController', ['$scope', '$http', function ($scope, $http) {
    $scope.prices = [
        {
            market: "BTCIDR",
            price: "161.000.000",
            volume: "92,2bl IDR",
            change: "4.8"
        }
    ];

    $http.get('https://api2.bitcoin.co.id/api/btc_idr/webdata').then(function (res) {
        if (res.status == 200) {
            $scope.prices = renderData(res.data);
            setTimeout(() => {
                $('.price-item').forEach(function (node) {
                    $(this).removeClass('up').removeClass('down');
                });
            }, 500);

            var pusher_tradedata = pusher.subscribe('tradedata-btcidr');
                pusher_tradedata.bind('update', function (res) {
                    console.log('update');
                    $scope.$apply(function() {
                        $scope.prices = renderData(res);
                    })

                    setTimeout(() => {
                        $('.price-item').forEach(function(node) {
                            $(this).removeClass('up').removeClass('down');
                        });
                    }, 500);
                });
        }
    });
}]);

