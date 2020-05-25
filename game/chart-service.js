google.charts.load('current', {packages:['corechart']});

function drawChart(player, playerData) {
    if (player.id != undefined || player.id !== null || player.id != '') {

        var data = new google.visualization.DataTable();
        data.addColumn('number', 'Rounds');
        data.addColumn('number', 'Points');
        data.addRows(playerData);

        var options = {
            title: player.name,
            curveType: 'function',
            vAxis:{
                title:"Points",
                minValue:-200,
                maxValue:200,
                textPosition: 'left',
            }
        };

        var chart = new google.visualization.LineChart(document.getElementById("chart" + player.id));

        chart.draw(data, options);
    }
}