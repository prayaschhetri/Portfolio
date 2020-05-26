var app = angular.module("gameApp", []);

app.controller('gameController', function ($scope) {
    var game = this;
    game.payOut = null;
    game.payReceive = null;
    game.displayPayments = [];
    game.participants = [];
    game.payments = [];
    game.newPlayer = '';
    game.history = {
        data: [],
        payments: []
    };
    game.multiplier = 1;
    game.viewReport = false;

    game.deleteHistory = function (item) {
        game.history.data = game.history.data.filter(obj => obj !== item);
    }

    game.changeWinner = function (item) {
        item.show = true;
        game.participants.forEach(player => {
            if (item.id !== player.id) {
                player.winner = false;
            }
        });
    }

    game.changeShow = function(item) {
        if(item.joot == true) {
            item.joot = false
        }
        item.points = 0;
    }

    game.isPair = function (player) {
        if (player.joot) {
            player.show = true;
        }
    }

    game.changePoints = function(item) {
        if(item.points > 0) {
            item.show = true;
        }
    }

    game.addPlayer = function (name) {
        if (name != '') {
            const newPlayer = {
                id: game.participants.length + 1,
                name: name,
                winner: false,
                show: false,
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

    game.closePayout = function (payment) {
        game.displayPayments = game.displayPayments.filter(obj => obj != payment);
    }

    game.calculate = function () {
        var payout = false;
        var payusers = [];
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
                    round: game.history.data.length + 1,
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

                if (game.history && game.history.data && game.history.data.length > 0) {
                    var lastGame = game.history.data[0];
                    if (lastGame) {
                        report.participants.forEach(currentPlayer => {
                            if (currentPlayer.active) {
                                if (lastGame.participants && lastGame.participants.length > 0) {
                                    var lastPlayer = lastGame.participants.filter(obj => obj.id === currentPlayer.id);
                                    if (lastPlayer != null && lastPlayer.length > 0) {
                                        lastPlayer = lastPlayer[0];
                                        currentPlayer.pay = currentPlayer.pay + lastPlayer.pay;

                                        if (currentPlayer.pay <= -100) {
                                            payout = true;
                                            payusers.push(currentPlayer);
                                            currentPlayer.pay = currentPlayer.pay + 100;
                                        }
                                    }
                                }
                            }
                        });
                    }
                }

                report.date = Date.now();
                //payments
                if (payout == true && payusers.length > 0) {
                    payusers.forEach(payuser => {
                        //get receiving player
                        highestPoint = 0;
                        highestPointUser = null;
                        report.participants.forEach(user => {
                            if (user.pay > highestPoint) {
                                highestPoint = user.pay;
                                highestPointUser = user;
                            }
                        });

                        if (highestPointUser != null) {
                            highestPointUser.pay = highestPointUser.pay - 100;
                            var displayPayment = {
                                pay: payuser,
                                receive: highestPointUser,
                            }
                            game.displayPayments.push(displayPayment);
                            var paymentPay = {
                                round: report.round,
                                user: payuser,
                                points: -100,
                                date: Date.now()
                            }
                            var paymentReceive = {
                                round: report.round,
                                user: highestPointUser,
                                points: 100,
                                date: Date.now()
                            }
                            if (game.history.payments == null || game.history.payments == undefined) {
                                game.history.payments = [];
                            }
                            game.history.payments.push(paymentPay);
                            game.history.payments.push(paymentReceive);
                        }
                    });
                }

                game.history.data.unshift(report);

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
        game.history = {
            data: [],
            payments: []
        };
        var f = document.getElementById('file').files[0],
            r = new FileReader();

        r.onloadend = function (e) {
            var data = e.target.result;
            var parsedData = JSON.parse(data);
            var payments = [];
            if (parsedData.payments != null || parsedData.payments != undefined) {
                parsedData.payments.forEach(payment => {
                    var pay = {
                        round: payment.round,
                        user: payment.user,
                        points: payment.points,
                        date: payment.date
                    }
                    payments.push(pay);
                });
                game.history.payments = payments;
            }
            parsedData.data.forEach(pdata => {

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
                game.history.data.push(history);
            });
            var lastGame = game.history.data[0];
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
                if (game.history.payments != null && game.history.payments.length > 0) {
                    pdata = game.history.payments.filter(obj => obj.user.id == player.id);

                    var tempData = [];
                    if (pdata.length > 0) {
                        pdata.forEach(element => {
                            var dt = new Date(element.date);
                            var d = {
                                date: dt.getFullYear() + "-" + dt.getMonth() + "-" + dt.getDay(),
                                points: element.points
                            }
                            tempData.push(d);
                        });
                    }

                    let array = tempData,
                        result = Object.values(array.reduce((a, { date, points }) => {
                            a[date] = (a[date] || { date, points: 0 });
                            a[date].points = Number(a[date].points) + Number(points);
                            return a;
                        }, {}));

                    if (result.length > 0) {
                        result.forEach(game => {
                            var dt = new Date(game.date);
                            var row = [
                                new Date(dt.getFullYear(), dt.getMonth()),
                                game.points
                            ];

                            playerData.push(row);
                        });
                    }
                }
                drawChart(player, playerData);
            });
        } else {
            game.viewReport = false;
        }
    }
});