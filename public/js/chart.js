const ctxLine = document.getElementById('lineChart').getContext('2d');
const ctxPie = document.getElementById('pieChart').getContext('2d');

let lineChart, pieChart;

function createCharts() {
    const timestamps = allImgData.map(data => 
        new Date(data.ts_in_milsecs).toLocaleTimeString('en-SG', { timeZone: 'Asia/Singapore' })
    );
    const totalCounts = allImgData.map(data => data.vehicle_info.total_count);

    const vehicleCounts = allImgData.reduce((acc, data) => {
        acc.cars += data.vehicle_info.cars;
        acc.two_wheelers += data.vehicle_info.two_wheelers;
        acc.trucks += data.vehicle_info.trucks;
        acc.buses += data.vehicle_info.buses;
        return acc;
    }, { cars: 0, two_wheelers: 0, trucks: 0, buses: 0 });

    const vehicleTypes = ['Cars', 'Two-Wheelers', 'Trucks', 'Buses'];
    const vehicleShares = [vehicleCounts.cars, vehicleCounts.two_wheelers, vehicleCounts.trucks, vehicleCounts.buses];

    // Create or update the line chart
    if (lineChart) {
        lineChart.data.labels = timestamps;
        lineChart.data.datasets[0].data = totalCounts;
        lineChart.update();
    } else {
        lineChart = new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Total Count of Vehicles',
                    data: totalCounts,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Create or update the pie chart
    if (pieChart) {
        pieChart.data.labels = vehicleTypes;
        pieChart.data.datasets[0].data = vehicleShares;
        pieChart.update();
    } else {
        pieChart = new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: vehicleTypes,
                datasets: [{
                    label: 'Vehicle Share',
                    data: vehicleShares,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }
}

// Call createCharts initially to draw the charts
createCharts();
