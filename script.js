var cryptohtml = document.getElementById("Crpyto");
var chartHTML = document.getElementById("myChart");
var tfchart = document.getElementById("tfflow");
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const period = '90'
chartHTML.height = 100;
chartHTML.clientWidth=100

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
        // Historical for chart js.
            function historicalAppend(data) {
                let price = [];
                let volume = [];
                let date = [];

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
                          backgroundColor: "rgba(0, 0, 0, 0.2)",
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

            async function getData() {
              const carsDataResponse = await fetch('https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=ada&market=EUR&apikey=J2WB3Q124ZZC6WN4');
              const coinData = await carsDataResponse.json();
              historicalAppend(coinData)
              let tempVals = [];
        
              for(var key in coinData["Time Series (Digital Currency Daily)"]){
                  tempVals.push({x:parseFloat(coinData["Time Series (Digital Currency Daily)"][key]["4a. close (EUR)"]),y:parseFloat(coinData["Time Series (Digital Currency Daily)"][key]["5. volume"])})
              }
            
              return tempVals;
            }
        
            async function run() {
              // Load and plot the original input data that we are going to train on.
              const data = await getData();
              const values = data.map(d => ({
                x: d.x,
                y: d.y,
              }));
            
              tfvis.render.scatterplot(
                {name: 'Price - Volume Cardano'},
                {values},
                {
                  xLabel: 'Price',
                  yLabel: 'Volume',
                  height: 300
                }
              );
                
              // Create the model
              const model = createModel();
              tfvis.show.modelSummary({name: 'Model Summary'}, model);
        
                // Convert the data to a form we can use for training.
              const tensorData = convertToTensor(data);
              const {inputs, labels} = tensorData;
        
              // Train the model
              await trainModel(model, inputs, labels);
              console.log('Done Training');
        
              testModel(model, data, tensorData);
              // More code will be added below
            }
        
            function createModel() {
              // Create a sequential model
              const model = tf.sequential();
            
              // Add a single input layer
              model.add(tf.layers.dense({inputShape: [1], units: 1, useBias: true}));
            
              // Add an output layer
              model.add(tf.layers.dense({units: 1, useBias: true}));
            
              return model;
            }
        
            function convertToTensor(data) {
            
              return tf.tidy(() => {
                // Step 1. Shuffle the data
                tf.util.shuffle(data);
            
                // Step 2. Convert data to Tensor
                const inputs = data.map(d => d.x)
                const labels = data.map(d => d.y);
            
                const inputTensor = tf.tensor2d(inputs, [inputs.length, 1]);
                const labelTensor = tf.tensor2d(labels, [labels.length, 1]);
            
                //Step 3. Normalize the data to the range 0 - 1 using min-max scaling
                const inputMax = inputTensor.max();
                const inputMin = inputTensor.min();
                const labelMax = labelTensor.max();
                const labelMin = labelTensor.min();
            
                const normalizedInputs = inputTensor.sub(inputMin).div(inputMax.sub(inputMin));
                const normalizedLabels = labelTensor.sub(labelMin).div(labelMax.sub(labelMin));
            
                return {
                  inputs: normalizedInputs,
                  labels: normalizedLabels,
                  // Return the min/max bounds so we can use them later.
                  inputMax,
                  inputMin,
                  labelMax,
                  labelMin,
                }
              });
            }
        
            async function trainModel(model, inputs, labels) {
              // Prepare the model for training.
              model.compile({
                optimizer: tf.train.adam(),
                loss: tf.losses.meanSquaredError,
                metrics: ['mse'],
              });
            
              const batchSize = 32;
              const epochs = 50;
            
              return await model.fit(inputs, labels, {
                batchSize,
                epochs,
                shuffle: true,
                callbacks: tfvis.show.fitCallbacks(
                  { name: 'Training Performance' },
                  ['loss', 'mse'],
                  { height: 200, callbacks: ['onEpochEnd'] }
                )
              });
            }
        
            function testModel(model, inputData, normalizationData) {
              const {inputMax, inputMin, labelMin, labelMax} = normalizationData;
            
              // Generate predictions for a uniform range of numbers between 0 and 1;
              // We un-normalize the data by doing the inverse of the min-max scaling
              // that we did earlier.
              const [xs, preds] = tf.tidy(() => {
            
                const xs = tf.linspace(0, 1, 100);
                const preds = model.predict(xs.reshape([100, 1]));
            
                const unNormXs = xs
                  .mul(inputMax.sub(inputMin))
                  .add(inputMin);
            
                const unNormPreds = preds
                  .mul(labelMax.sub(labelMin))
                  .add(labelMin);
            
                // Un-normalize the data
                return [unNormXs.dataSync(), unNormPreds.dataSync()];
              });
            
            
              const predictedPoints = Array.from(xs).map((val, i) => {
                return {x: val, y: preds[i]}
              });
            
              const originalPoints = inputData.map(d => ({
                x: d.x, y: d.y,
              }));
            
            
              tfvis.render.scatterplot(
                {name: 'Model Predictions vs Original Data'},
                {values: [originalPoints, predictedPoints], series: ['original', 'predicted']},
                {
                  xLabel: 'Price',
                  yLabel: 'Volume',
                  height: 300
                }
              );
            }
            
            document.addEventListener('DOMContentLoaded', run);
