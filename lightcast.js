document.addEventListener('DOMContentLoaded', function () {
    const sectorDropdown = document.getElementById('sector');
    const container = document.getElementById('container');
    const dataOutput = document.getElementById('data-output');
    const tableOutput = document.getElementById('table-output'); // New table output element
    const csvUrl = 'https://raw.githubusercontent.com/edshorthouse/lightcast/741e6cc402bd252cd2c79981847f61eaef5daaa5/suffolk.csv';
    const dropdownCsvUrl = 'https://raw.githubusercontent.com/edshorthouse/lightcast/38699eda8b751e50d9c74c8784473c9b5cef8b47/dropdown.csv';

    fetchDropdownData(dropdownCsvUrl, sectorDropdown)
    .then(() => fetchCsvData(csvUrl, sectorDropdown, container, tableOutput))
    .catch(error => {
        console.error('Initialization error:', error);
        dataOutput.textContent = 'Initialization error: ' + error.message;
    });
});

function fetchDropdownData(url, dropdown) {
    return fetch(url)
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
            throw error; // Re-throw error to propagate to caller
        });
}

function fetchCsvData(url, dropdown, container, tableOutput) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text();
        })
        .then(data => {
            Papa.parse(data, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    console.log('Parsed CSV Data:', results.data);
                    initializeChart(results.data, dropdown, container, tableOutput);
                },
                error: function (error) {
                    console.error('Error parsing CSV:', error);
                    document.getElementById('data-output').textContent = 'Error parsing CSV: ' + JSON.stringify(error, null, 2);
                    throw error; // Re-throw error to propagate to caller
                }
            });
        })
        .catch(error => {
            console.error('Fetch error:', error);
            document.getElementById('data-output').textContent = 'Fetch error: ' + error.message;
            throw error; // Re-throw error to propagate to caller
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

function initializeChart(data, dropdown, container, tableOutput) {
    // Ensure dropdown is populated before accessing its value
    if (dropdown.options.length > 0) {
        const initialSeriesData = getChartData(data, dropdown.options[0].value); // Use first sector by default
        console.log('Initial Series Data:', initialSeriesData); // Debug statement
        renderChart(container, initialSeriesData, dropdown.options[0].value); // Use first sector by default
        renderTable(data, dropdown.options[0].value, tableOutput); // Render the table

        dropdown.addEventListener('change', function () {
            const selectedSector = dropdown.value;
            const updatedSeriesData = getChartData(data, selectedSector);
            console.log(`Updated Series Data for sector ${selectedSector}:`, updatedSeriesData); // Debug statement
            renderChart(container, updatedSeriesData, selectedSector);
            renderTable(data, selectedSector, tableOutput); // Update the table
        });
    } else {
        console.error('Dropdown is empty');
    }
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
            text: `Monthly Job Postings for ${sector} - Suffolk`
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

function renderTable(data, sector, tableOutput) {
    const yearKey = Object.keys(data[0])[0]; // Assuming the first key is the year
    const monthKey = Object.keys(data[0])[1]; // Assuming the second key is the month
    const years = [...new Set(data.map(item => item[yearKey]))];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Create the table
    let tableHtml = '<table>';
    tableHtml += '<thead><tr><th>Year/Month</th>';
    months.forEach(month => {
        tableHtml += `<th>${month}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    // Populate the table rows with data
    years.forEach(year => {
        tableHtml += `<tr><td>${year}</td>`;
        months.forEach(month => {
            const entry = data.find(d => d[yearKey] === year && d[monthKey] === month);
            const value = entry ? parseFloat(entry[sector]) : '';
            tableHtml += `<td>${value}</td>`;
        });
        tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';

    // Set the table HTML
    tableOutput.innerHTML = tableHtml;
}