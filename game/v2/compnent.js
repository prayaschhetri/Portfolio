var app = angular.module("gameApp", ['ngPatternRestrict', 'ui.sortable']);

app.controller('gameController', function ($scope) {
    var game = this;
    game.newPlayer = '';
    game.initialPoint = 0;
    game.viewReport = false;
    game.filterPayments = '';

    game.data = {
        participants: [],
        multiplierThreshold: 25,
        multiplier: 1,
        payinterval: 50,
        displayPayments: [],
        payments: [],
        records: [],
        dashboard: {
            rounds: 0,
            roundsToday: 0,
            highestPoint: 0,
            highestPointPlayer: '',
            participants: [],
            highestPay: 0,
            highestPayPlayer: '',
        },
    }

    game.movePlayerDown = function (item) {
        var index = game.data.participants.indexOf(item);
        var newIndex = index + 1;
        if (newIndex > game.data.participants.length - 1)
            newIndex = 0;

        game.data.participants.splice(index, 1);
        game.data.participants.splice(newIndex, 0, item);
    }

    game.movePlayerUp = function (item) {
        var index = game.data.participants.indexOf(item);
        var newIndex = index - 1;
        if (newIndex < 0)
            newIndex = game.data.participants.length - 1;

        game.data.participants.splice(index, 1);
        game.data.participants.splice(newIndex, 0, item);
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

    game.resetInput = function () {
        game.data.participants.forEach(player => {
            player.points = null;
            player.winner = false;
            player.show = false;
            player.joot = false;
            player.pay = 0;
        });
    }

    game.deleteRecord = function (item) {
        game.data.records = game.data.records.filter(obj => obj !== item);
    }

    game.changeDealer = function (item) {
        item.dealer = true;
        game.data.participants.forEach(player => {
            if (item.id !== player.id) {
                player.dealer = false;
            }
        });
    }

    game.autoChangeDealer = function () {
        var dealer = game.data.participants.filter(obj => obj.dealer == true);
        if (dealer.length > 0)
            dealer = dealer[0];

        if (dealer != null) {
            var index = game.data.participants.indexOf(dealer);
            var nextDealer = game.data.participants[index + 1];
            if (nextDealer == null) {
                nextDealer = game.data.participants[0];
            }
            nextDealer.dealer = true;
            game.data.participants.forEach(player => {
                if (nextDealer.id !== player.id) {
                    player.dealer = false;
                }
            });

        }
    }

    game.changeWinner = function (item) {
        item.show = true;
        game.data.participants.forEach(player => {
            if (item.id !== player.id) {
                player.winner = false;
            }
        });
    }

    game.changeShow = function (item) {
        if (item.joot == true) {
            item.joot = false
        }
        item.points = 0;
    }

    game.isPair = function (player) {
        if (player.joot) {
            player.show = true;
        }
    }

    game.changePoints = function (item) {
        if (item.points === 0) {
            item.points = null;
        } else if (item.points > 0) {
            item.show = true;
        }

        var haveWinner = false;
        game.data.participants.forEach(player => {
            if (player.winner == true) {
                haveWinner = true;
            }
        });
        if (!haveWinner) {
            item.winner = true;
        }
    }

    game.addPlayer = function (name, initialpoints) {
        if (name != '') {
            const newPlayer = {
                id: game.data.participants.length + 1,
                name: name,
                winner: false,
                show: false,
                joot: false,
                points: null,
                pay: 0,
                dealer: false,
                active: true,
            }
            game.data.participants.push(newPlayer);
            game.newPlayer = '';
            game.initialPoint = 0;

            if (game.data.records.length === 0) {
                var report = {
                    round: 0,
                    totalPoints: 0,
                    participants: []
                }
                const player = {
                    id: newPlayer.id,
                    name: newPlayer.name,
                    winner: false,
                    show: false,
                    joot: false,
                    points: 0,
                    pay: initialpoints,
                    dealer: false,
                    active: true,
                }
                report.participants.push(player);
                game.data.records.push(report);
            } else if (game.data.records.length === 1) {
                var initial = game.data.records.filter(obj => obj.round == 0);
                if (initial.length > 0) {
                    initial = initial[0];
                    const player = {
                        id: newPlayer.id,
                        name: newPlayer.name,
                        winner: false,
                        show: false,
                        joot: false,
                        points: 0,
                        pay: initialpoints,
                        dealer: false,
                        active: true,
                    }
                    initial.participants.push(player);
                }
            }
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
        game.data.displayPayments = game.data.displayPayments.filter(obj => obj != payment);
    }

    game.download = function () {
        var a = document.createElement("a");
        var file = new Blob([JSON.stringify(game.data)], { type: 'application/json' });
        a.href = URL.createObjectURL(file);
        a.download = "GameData_" + Date.now();
        a.click();
    }

    game.upload = function () {
        var f = document.getElementById('file').files[0],
            r = new FileReader();

        r.onloadend = function (e) {
            var data = e.target.result;
            var parsedData = JSON.parse(data);
            game.data = parsedData;

            game.updateDashboard_updateRoundsToday();

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
            game.data.participants.forEach(player => {
                var playerData = [];
                if (game.data.payments != null && game.data.payments.length > 0) {
                    pdata = game.data.payments.filter(obj => obj.user.id == player.id);

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

    game.calculate = function () {

        var payout = false;
        var payusers = [];
        var activePlayers = game.data.participants.filter(obj => obj.active == true);
        if (activePlayers.length > 1) {
            var totalPoints = 0;
            //Total Points
            game.data.participants.forEach(item => {
                if (item.show || item.winner) {
                    totalPoints += item.points
                }
            });

            //Dealer
            var dealer = game.data.participants.filter(obj => obj.dealer === true && obj.active === true);
            if (dealer.length > 0) {
                //Payout
                var winner = game.data.participants.filter(obj => obj.winner === true && obj.active == true);
                var winnerPay = 0;
                if (winner.length === 1) {
                    var winner = winner[0];
                    if (winner.joot) {
                        totalPoints += 5;
                    }

                    game.data.participants.forEach(looser => {
                        if (looser.active == false) {
                            if (game.data.records != null && game.data.records.length > 0) {
                                var lastGame = game.data.records[0];
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
                                looser.pay = ((game.data.participants.length * looser.points) - total) * game.data.multiplier;
                                winnerPay += looser.pay;
                            }
                        }
                    });

                    winner.pay = winnerPay * -1;
                    var report = {
                        round: game.data.records.length + 1,
                        totalPoints: totalPoints,
                        participants: []
                    }

                    game.data.participants.forEach(player => {
                        const playerReport = {
                            id: player.id,
                            name: player.name,
                            winner: player.winner,
                            show: player.show,
                            joot: player.joot,
                            points: player.points,
                            pay: player.pay,
                            dealer: player.dealer,
                            active: player.active,
                        }
                        report.participants.push(playerReport);
                    });

                    if (game.data.records && game.data.records.length > 0) {
                        var lastGame = game.data.records[0];
                        if (lastGame) {
                            report.participants.forEach(currentPlayer => {
                                if (currentPlayer.active) {
                                    if (lastGame.participants && lastGame.participants.length > 0) {
                                        var lastPlayer = lastGame.participants.filter(obj => obj.id === currentPlayer.id);
                                        if (lastPlayer != null && lastPlayer.length > 0) {
                                            lastPlayer = lastPlayer[0];
                                            currentPlayer.pay = currentPlayer.pay + lastPlayer.pay;

                                            if (currentPlayer.pay <= (game.data.payinterval * -1)) {
                                                payout = true;
                                                payusers.push(currentPlayer);
                                                currentPlayer.pay = currentPlayer.pay + game.data.payinterval;
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    }

                    report.date = Date.now();
                    //payments
                    if (game.data.payinterval > 0) {
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
                                    highestPointUser.pay = highestPointUser.pay - game.data.payinterval;
                                    var displayPayment = {
                                        pay: payuser,
                                        receive: highestPointUser,
                                    }
                                    game.data.displayPayments.push(displayPayment);
                                    var paymentPay = {
                                        round: report.round,
                                        user: payuser,
                                        points: (game.data.payinterval * -1),
                                        date: Date.now()
                                    }
                                    var paymentReceive = {
                                        round: report.round,
                                        user: highestPointUser,
                                        points: game.data.payinterval,
                                        date: Date.now()
                                    }
                                    if (game.data.payments == null || game.data.payments == undefined) {
                                        game.data.payments = [];
                                    }
                                    game.data.payments.push(paymentPay);
                                    game.data.payments.push(paymentReceive);
                                    //Dashboard
                                    var dashboardPay = game.data.dashboard.participants.filter(obj => obj.id == paymentPay.user.id);
                                    if (dashboardPay.length > 0) {
                                        dashboardPay = dashboardPay[0];
                                        dashboardPay.points += paymentPay.points;
                                    }
                                    var dashboardReceive = game.data.dashboard.participants.filter(obj => obj.id == paymentReceive.user.id);
                                    if (dashboardReceive.length > 0) {
                                        dashboardReceive = dashboardReceive[0];
                                        dashboardReceive.points += paymentReceive.points;
                                    }
                                    game.updateDashboard_updateHighestPay();
                                }
                            });
                        }
                    }

                    game.updateDashboard(report);

                    game.data.records.unshift(report);

                    //multiplier
                    if (game.data.multiplierThreshold > 0) {
                        var multiplied = false;
                        game.data.participants.forEach(player => {
                            if (player.points >= game.data.multiplierThreshold) {
                                multiplied = true;
                            }
                        });
                        if (multiplied) {
                            game.data.multiplier = 2;
                        }
                        else {
                            game.data.multiplier = 1;
                        }
                    }

                    //Change Dealer
                    game.autoChangeDealer();


                } else {
                    alert("Invalid Winner");
                }
            } else {
                alert("Please select the dealer");
            }
        } else {
            alert("There must be at least two active players");
        }
    }





    game.updateDashboard = function (report) {
        if (game.data.dashboard == null) {
            game.data.dashboard = {
                rounds: 0,
                roundsToday: 0,
                highestPoint: 0,
                highestPointPlayer: '',
                participants: [],
            }

            //Rounds
            game.data.dashboard.rounds = game.data.records.length;
            //RoundsToday
            game.updateDashboard_updateRoundsToday();
            //Highest Point
            game.updateDashboard_updateHighestPoint();
            //Highest Pay
            game.updateDashboard_updateHighestPay();

            //participants
            if (game.data.records.length > 0) {
                var lastGame = game.data.records[0];
                lastGame.participants.forEach(element => {
                    var player = {
                        id: element.id,
                        name: element.name,
                        winner: element.winner ? 1 : 0,
                        show: element.show ? 1 : 0,
                        joot: element.joot ? 1 : 0,
                        points: 0,
                        pay: element.pay,
                    }
                    game.data.dashboard.participants.push(player);
                });
            } else {
                game.data.participants.forEach(element => {
                    var player = {
                        id: element.id,
                        name: element.name,
                        winner: element.winner ? 1 : 0,
                        show: element.show ? 1 : 0,
                        joot: element.joot ? 1 : 0,
                        points: 0,
                        pay: element.pay,
                    }
                    game.data.dashboard.participants.push(player);
                });
            }

        } else {
            if (report != null) {

                //Rounds
                game.data.dashboard.rounds++;
                //RoundsToday
                game.data.dashboard.roundsToday++;
                //HighestPoint
                report.participants.forEach(element => {
                    if (element.points >= game.data.dashboard.highestPoint) {
                        game.data.dashboard.highestPoint = element.points;
                        game.data.dashboard.highestPointPlayer = element.name;
                    }
                });


                //participants
                report.participants.forEach(element => {
                    var player = game.data.dashboard.participants.filter(obj => obj.id == element.id);
                    if (player.length > 0) {
                        player = player[0];
                        player.pay = element.pay;
                        player.winner = element.winner ? player.winner + 1 : player.winner;
                        player.show = element.show ? player.show + 1 : player.show;
                        player.joot = element.joot ? player.joot + 1 : player.joot;
                    } else {
                        var newPlayer = {
                            id: element.id,
                            name: element.name,
                            winner: element.winner ? 1 : 0,
                            show: element.show ? 1 : 0,
                            joot: element.joot ? 1 : 0,
                            points: 0,
                            pay: element.pay,
                        }
                        game.data.dashboard.participants.push(newPlayer);
                    }
                });
            }
        }
    }

    game.updateDashboard_updateRoundsToday = function () {
        const today = new Date()
        var count = 0;
        game.data.records.forEach(element => {
            var date = new Date(element.date);
            if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
                count++;
            }
        });

        game.data.dashboard.roundsToday = count;
    }

    game.updateDashboard_updateHighestPoint = function () {
        var highestPoint = 0;
        var highestPointPlayer = '';
        game.data.records.forEach(element => {
            element.participants.forEach(player => {
                if (player.points > highestPoint) {
                    highestPoint = player.points;
                    highestPointPlayer = player.name;
                }
            });
        });

        game.data.dashboard.highestPoint = highestPoint;
        game.data.dashboard.highestPointPlayer = highestPointPlayer;
    }

    game.updateDashboard_updateHighestPay = function(){
        var pay = 0;
        var player = '';
        game.data.dashboard.participants.forEach(element => {
            if(element.points >= pay){
                pay = element.points;
                player = element.name;
            }
        });

        game.data.dashboard.highestPay = pay;
        game.data.dashboard.highestPayPlayer = player;
    }

});