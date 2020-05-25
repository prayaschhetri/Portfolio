var app = angular.module("gameApp", []);

app.controller('gameController', function ($scope) {
    var game = this;
    game.payOut = null;
    game.payReceive = null;
    game.participants = [];
    game.newPlayer = '';
    game.history = [];
    game.multiplier = 1;
    game.viewReport = false;

    game.deleteHistory = function (item) {
        game.history = game.history.filter(obj => obj !== item);
    }

    game.changeWinner = function (item) {
        item.show = true;
        game.participants.forEach(player => {
            if (item.id !== player.id) {
                player.winner = false;
            }
        });
    }

    game.addPlayer = function (name) {
        if (name != '') {
            const newPlayer = {
                id: game.participants.length + 1,
                name: name,
                winner: false,
                show: true,
                joot: false,
                points: 0,
                pay: 0,
                active: true,
            }
            game.participants.push(newPlayer);
            game.newPlayer = '';
        }
    }

    game.deletePlayer = function (player) {
        if (player.active) {
            player.active = false;
        } else {
            player.active = true;
        }
    }

    game.payout = function () {

        var count = 0;
        var payRecieve = null;
        var payOut = null;
        for (i = game.history.length - 1; i >= 0; i = i - 1) {
            var pgame = game.history[i];
            pgame.participants.forEach(player => {
                if (payOut === null && player.pay <= -100) {
                    payOut = player;
                } else if (payRecieve === null && player.pay >= 100) {
                    payRecieve = player;
                }
            });
        }

        if (!payRecieve || !payOut) {
            alert("No one to pay/receive");
        } else {
            for (i = game.history.length - 1; i >= 0; i = i - 1) {
                var pgame = game.history[i];
                pgame.participants.forEach(player => {
                    if (payRecieve != null && player.pay >= 100) {
                        if (player.id === payRecieve.id) {
                            player.pay = player.pay - 100;
                        }
                    }

                    if (payOut != null && player.pay <= -100) {
                        if (player.id === payOut.id) {
                            player.pay = player.pay + 100;
                        }
                    }
                });
            }

            game.payOut = payOut;
            game.payReceive = payRecieve;
        }

    }

    game.closePayout = function () {
        game.payOut = null;
        game.payReceive = null;
    }

    game.calculate = function () {
        var activePlayers = game.participants.filter(obj => obj.active == true);
        if (activePlayers.length > 1) {
            var totalPoints = 0;
            //Total Points
            game.participants.forEach(item => {
                if (item.show || item.winner) {
                    totalPoints += item.points
                }
            });

            //Payout
            var winner = game.participants.filter(obj => obj.winner === true && obj.active == true);
            var winnerPay = 0;
            if (winner.length === 1) {
                var winner = winner[0];
                if (winner.joot) {
                    totalPoints += 5;
                }

                game.participants.forEach(looser => {
                    if (looser.active == false) {
                        if (game.history != null && game.history.length > 0) {
                            var lastGame = game.history[0];
                            if (lastGame != null) {
                                var user = lastGame.participants.filter(obj => obj.id === looser.id);
                                if (user != null && user.length > 0) {
                                    user = user[0];
                                    looser.show = false;
                                    looser.winner = false;
                                    looser.joot = false;
                                    looser.points = 0;
                                    looser.pay = user.pay;
                                }
                            }
                        }
                    } else {
                        if (!looser.winner && looser.active == true) {
                            var winnerPoint = 10;
                            var total = 0;
                            if (looser.joot) {
                                winnerPoint = 0;
                            } else if (looser.show) {
                                winnerPoint = 3;
                            }
                            total = totalPoints + winnerPoint;
                            looser.pay = ((game.participants.length * looser.points) - total) * game.multiplier;
                            winnerPay += looser.pay;
                        }
                    }
                });

                winner.pay = winnerPay * -1;
                var report = {
                    round: game.history.length + 1,
                    totalPoints: totalPoints,
                    participants: []
                }

                game.participants.forEach(player => {
                    const playerReport = {
                        id: player.id,
                        name: player.name,
                        winner: player.winner,
                        show: player.show,
                        joot: player.joot,
                        points: player.points,
                        pay: player.pay,
                        active: player.active,
                    }
                    report.participants.push(playerReport);
                });

                if (game.history && game.history.length > 0) {
                    var lastGame = game.history[0];
                    if (lastGame) {
                        report.participants.forEach(currentPlayer => {
                            if (currentPlayer.active) {
                                if (lastGame.participants && lastGame.participants.length > 0) {
                                    var lastPlayer = lastGame.participants.filter(obj => obj.id === currentPlayer.id);
                                    if (lastPlayer != null && lastPlayer.length > 0) {
                                        lastPlayer = lastPlayer[0];
                                        currentPlayer.pay = currentPlayer.pay + lastPlayer.pay;
                                    }
                                }
                            }
                        });
                    }
                }

                report.date = Date.now();
                game.history.unshift(report);
            } else {
                alert("Invalid Winner");
            }
        } else {
            alert("There must be at least two active players");
        }
    }

    game.resetInput = function () {
        game.participants.forEach(player => {
            player.points = 0;
            player.winner = false;
            player.show = false;
            player.joot = false;
            player.pay = 0;
        });
    }

    game.isPair = function (player) {
        if (player.joot) {
            player.show = true;
        }
    }

    game.download = function () {
        var a = document.createElement("a");
        var file = new Blob([JSON.stringify(game.history)], { type: 'application/json' });
        a.href = URL.createObjectURL(file);
        a.download = "Game Data";
        a.click();
    }

    game.payStatus = function (pay) {
        if (pay <= -100) {
            return "dotRed";
        } else if (pay >= 100) {
            return "dotGreen";
        } else {
            return "";
        }
    }

    game.upload = function () {
        game.history = [];
        var f = document.getElementById('file').files[0],
            r = new FileReader();

        r.onloadend = function (e) {
            var data = e.target.result;
            var parsedData = JSON.parse(data);
            parsedData.forEach(pdata => {

                var hparticipants = [];
                pdata.participants.forEach(hplayer => {
                    hpart = {
                        id: hplayer.id,
                        name: hplayer.name,
                        date: hplayer.date,
                        winner: hplayer.winner,
                        show: hplayer.show,
                        joot: hplayer.joot,
                        points: hplayer.points,
                        pay: hplayer.pay
                    }
                    hparticipants.push(hpart);
                });
                var history = {
                    round: pdata.round,
                    totalPoints: pdata.totalPoints,
                    participants: hparticipants,
                }
                game.history.push(history);
            });
            var lastGame = game.history[0];
            game.participants = [];
            lastGame.participants.forEach(player => {
                var newPlayer = {
                    id: game.participants.length + 1,
                    name: player.name,
                    date: null,
                    winner: false,
                    show: false,
                    joot: false,
                    points: 0,
                    pay: 0,
                    active: true,
                }
                game.participants.push(newPlayer);
            });
            $scope.$apply();
        }

        r.readAsBinaryString(f);
    }

    game.drawPlayerChart = function () {

        var x = document.getElementById("report");
        if (x.style.display === "none") {
            x.style.display = "block";
        } else {
            x.style.display = "none";
        }
        
        if (!game.viewReport) {
            game.viewReport = true;
            game.participants.forEach(player => {
                var playerData = [];
                if (game.history != null && game.history.length > 0) {
                    game.history.forEach(game => {

                        var pay = 0;
                        var user = game.participants.filter(obj => obj.id == player.id);
                        if (user.length > 0) {
                            user = user[0];
                            pay = user.pay;
                        }

                        var row = [
                            game.round,
                            pay
                        ];

                        playerData.push(row);
                    });
                }

                console.log(playerData);
                drawChart(player, playerData);
            });
        } else {
            game.viewReport = false;
        }


        //console.log(player);
        //drawChart("chart"+ player.id);

        // var playerData = {
        //     cols: [],
        //     rows: []
        // };
        // if(game.history != null && game.history.length > 0) {

        //     game.history.forEach(game => {
        //         playerData.cols.push(game.round);
        //         var user = game.participants.filter(obj => obj.id == player.id);
        //         if(user.length > 0) {
        //             user = user[0];
        //             playerData.rows.push();
        //             playerData = {"cols": [
        //                 {id: "month", label: "Month", type: "string"},
        //                 {id: "laptop-id", label: "Laptop", type: "number"},
        //                 {id: "desktop-id", label: "Desktop", type: "number"},
        //                 {id: "server-id", label: "Server", type: "number"},
        //                 {id: "cost-id", label: "Shipping", type: "number"}
        //             ], "rows": [
        //                 {c: [
        //                     {v: "January"},
        //                     {v: 19, f: "42 items"},
        //                     {v: 12, f: "Ony 12 items"},
        //                     {v: 7, f: "7 servers"},
        //                     {v: 4}
        //                 ]},
        //                 {c: [
        //                     {v: "February"},
        //                     {v: 13},
        //                     {v: 1, f: "1 unit (Out of stock this month)"},
        //                     {v: 12},
        //                     {v: 2}
        //                 ]},
        //                 {c: [
        //                     {v: "March"},
        //                     {v: 24},
        //                     {v: 0},
        //                     {v: 11},
        //                     {v: 6}

        //                 ]}
        //             ]};
        //         }
        //     });
        // }
    }
});