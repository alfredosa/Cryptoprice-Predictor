var cryptohtml = document.getElementById("Crpyto");
var chartHTML = document.getElementById("myChart");
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const period = '90'
chartHTML.height = 100;
chartHTML.clientWidth=100

        fetch(`https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=ada&market=EUR&apikey=J2WB3Q124ZZC6WN4`)
        .then(function (response) {
        return response.json();
        })
        .then(function (data) {
            historicalAppend(data)
        })
        .catch(function (err) {
        console.log(err);
        });

        // Direct Fetch
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=cardano%2Cpolkadot%2Cethereum%2Cbitcoin&vs_currencies=eur')
        .then(function (response) {
        return response.json();
        })
        .then(function (data) {
        appendData(data)
        })
        .catch(function (err) {
        console.log(err);
        });


        // Singular Price pull from CoinGecko
        function appendData(data) {
            let coins = [];
            let prices = [];
            let final = "";
            for(var key in data){
                final += `<li style="text-align: center;">${key}: ${data[key]["eur"]} Euros</li>`
                coins.push(key);
                prices.push(data[key]['eur'])
            }
            
            cryptohtml.innerHTML = `<h2>Coingecko Prices Today</h2><ul style="list-style: none;">${final}</ul>`
        }

        // Historical Data as Async for usage with Maximum range for Cardano.
        async function historical() {
            fetch('https://api.coingecko.com/api/v3/coins/cardano/market_chart?vs_currency=eur&days=max&interval=daily').then(function (response) {
                return response.text();
                })
            .then(function (data) {
                appendData(data);
                })
            .catch(function (err) {
                console.log(err);
                })
            }

            function historicalAppend(data) {
                let price = [];
                let volume = [];
                let date = [];
                x = 1;
                let d = new Date(Date.now() - period * 24 * 60 * 60 * 1000)
                
                for(var key in data["Time Series (Digital Currency Daily)"]){
                    price.push(data["Time Series (Digital Currency Daily)"][key]["4a. close (EUR)"])
                    volume.push(data["Time Series (Digital Currency Daily)"][key]["5. volume"])
                    date.push(key)
                }

                let priceOrdered = price.reverse();
                let volumeOrdered = volume.reverse();
                let dateOrdered = date.reverse();
                
                var N = priceOrdered.length
                var moveMean = [];
                for (var i = 0; i < N; i++)
                {   
                    var mean = (parseFloat(priceOrdered[i]) + parseFloat(priceOrdered[i-1]) + parseFloat(priceOrdered[i-2]))/3;
                    moveMean.push(mean);
                }

                new Chart(chartHTML, {
                    type: "line",
                    label: `Prices`,
                    data: {
                      labels: dateOrdered,
                      datasets: [
                        {
                          label: "Price",
                          data: priceOrdered,
                          backgroundColor: "rgba(255, 99, 132, 0.2)",
                          borderColor: "rgba(255,99,132,1)",
                          borderWidth: 1
                        },
                        {
                            label: "3-Point SMA",
                            data: moveMean,
                            backgroundColor: "rgba(0, 99, 132, 0.2)",
                            borderColor: "rgba(0,99,132,1)",
                            borderWidth: 1
                          }
                      ]
                    },
                    options: {
                      scales: {
                        yAxes: [
                          {
                            ticks: {
                              beginAtZero: true
                            }
                          }
                        ]
                      }
                    }
                  });
                
            }

            // RNN Model 

