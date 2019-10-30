document.addEventListener('DOMContentLoaded', () => {

  // Set the date we're counting down to
  var countDownDate = new Date("Mar 2, 2020 07:45:00").getTime();


  // create Date object for current location
  var date = new Date();

  // convert to milliseconds, add local time zone offset and get UTC time in milliseconds
  var utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);

  // time offset for Nepal is +5.45
  var timeOffset = 5.45;

  // create new Date object for a different timezone using supplied its GMT offset.
  var now = new Date(utcTime + (3600000 * timeOffset));

  // Unix timestamp (in seconds) to count down to
  var twoDaysFromNow = countDownDate / 1000;

  // Set up FlipDown
  var flipdown = new FlipDown(twoDaysFromNow)

    // Start the countdown
    .start()

    // Do something when the countdown ends
    .ifEnded(() => {
      console.log('The countdown has ended!');
    });

  // Toggle theme
  let body = document.body;
  body.classList.toggle('light-theme');
  body.querySelector('#flipdown').classList.toggle('flipdown__theme-light');

  // var interval = setInterval(() => {
  //   let body = document.body;
  //   body.classList.toggle('light-theme');
  //   body.querySelector('#flipdown').classList.toggle('flipdown__theme-dark');
  //   body.querySelector('#flipdown').classList.toggle('flipdown__theme-light');
  // }, 5000);
});
