document.addEventListener('DOMContentLoaded', function () {
    const sectorDropdown = document.getElementById('sector');
    const container = document.getElementById('container');
    const dataOutput = document.getElementById('data-output');
    const csvUrl = 'https://raw.githubusercontent.com/edshorthouse/lightcast/741e6cc402bd252cd2c79981847f61eaef5daaa5/suffolk.csv';
    const dropdownCsvUrl = 'https://raw.githubusercontent.com/edshorthouse/lightcast/38699eda8b751e50d9c74c8784473c9b5cef8b47/dropdown.csv';

    fetchDropdownData(dropdownCsvUrl, sectorDropdown);
    fetchCsvData(csvUrl, sectorDropdown, container);
});

function fetchDropdownData(url, dropdown) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text();
        })
        .then(data => {
            Papa.parse(data, {
                header: false,
                skipEmptyLines: true,
                complete: function (results) {
                    populateDropdown(results.data, dropdown);
                }
            });
        })
        .catch(error => {
            console.error('Fetch error:', error);
            document.getElementById('data-output').textContent = 'Fetch error: ' + error.message;
        });
}

function populateDropdown(data, dropdown) {
    if (!data.length) {
        console.error('No data found in dropdown CSV');
        return;
    }

    const sectors = data.map(row => row[0]).filter(sector => sector.trim() !== "");
    sectors.forEach(sector => {
        const option = document.createElement('option');
        option.value = sector;
        option.text = sector;
        dropdown.add(option);
    });
}

function fetchCsvData(url, dropdown, container) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text();
        })
        .then(data => {
            // Remove or comment out the line that displays the CSV content
            // dataOutput.textContent = data;
            Papa.parse(data, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    console.log('Parsed CSV Data:', results.data); // Debug statement
                    console.log('Keys in first row:', Object.keys(results.data[0])); // Print keys of first row
                    initializeChart(results.data, dropdown, container);
                },
                error: function (error) {
                    console.error('Error parsing CSV:', error);
                    document.getElementById('data-output').textContent = 'Error parsing CSV: ' + JSON.stringify(error, null, 2);
                }
            });
        })
        .catch(error => {
            console.error('Fetch error:', error);
            document.getElementById('data-output').textContent = 'Fetch error: ' + error.message;
        });
}

function initializeChart(data, dropdown, container) {
    const initialSeriesData = getChartData(data, dropdown.options[0].value); // Use first sector by default
    console.log('Initial Series Data:', initialSeriesData); // Debug statement
    renderChart(container, initialSeriesData, dropdown.options[0].value); // Use first sector by default

    dropdown.addEventListener('change', function () {
        const selectedSector = dropdown.value;
        const updatedSeriesData = getChartData(data, selectedSector);
        console.log(`Updated Series Data for sector ${selectedSector}:`, updatedSeriesData); // Debug statement
        renderChart(container, updatedSeriesData, selectedSector);
    });
}

function getChartData(data, sector) {
    const yearKey = Object.keys(data[0])[0]; // Assuming the first key is the year
    const monthKey = Object.keys(data[0])[1]; // Assuming the second key is the month
    const years = [...new Set(data.map(item => item[yearKey]))];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const seriesData = years.map(year => {
        return {
            name: year,
            data: months.map(month => {
                const entry = data.find(d => d[yearKey] === year && d[monthKey] === month);
                console.log(`Year: ${year}, Month: ${month}, Entry: ${entry}`); // Debug statement
                return entry ? parseFloat(entry[sector]) : null;
            })
        };
    });
    console.log(`Series Data for sector ${sector}:`, seriesData); // Debug statement
    return seriesData;
}

const accessibleColors = [
    '#6288cd', // Blue
    '#ef8d4b', // Orange
    '#b0b0b0', // Grey
    '#82b75e', // Green
    '#ffc720', // Yellow
];

function renderChart(container, seriesData, sector) {
    Highcharts.chart(container, {
        chart: {
            type: 'spline' // Use 'spline' to create smooth lines
        },
        title: {
            text: `Monthly Job Postings for ${sector}`
        },
        xAxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            title: {
                text: 'Month'
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Number of Job Postings'
            }
        },
        legend: {
            title: {
                text: 'Year'
            }
        },
        colors: accessibleColors, // Assign the accessible color palette
        series: seriesData,
        plotOptions: {
            series: {
                marker: {
                    enabled: true,
                    radius: 4,
                    symbol: 'circle' // Ensures all markers are circles
                }
            }
        },
        accessibility: {
            description: 'Description of the chart goes here. This chart shows job postings data for different sectors over various years.',
            enabled: true,
            keyboardNavigation: {
                enabled: true
            },
            point: {
                descriptionFormatter: function (point) {
                    var seriesName = point.series.name;
                    var pointCategory = point.category;
                    var pointValue = point.y;
                    return seriesName + ', ' + pointCategory + ': ' + pointValue;
                }
            }
        }
    });
}