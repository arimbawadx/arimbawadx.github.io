document.addEventListener("DOMContentLoaded", function () {
  // Set the date we're counting down to
  var countDownDate = new Date("Feb 12, 2024 00:00:00").getTime();

  // Create a countdown element
  var countdownElement = document.getElementById("countdown");
  var countdownElementUtama = document.getElementById("countdown-container");

  // Update the countdown every 1 second
  var x = setInterval(function () {
    // Get the current date and time
    var now = new Date().getTime();

    // Calculate the remaining time
    var distance = countDownDate - now;

    // Check if it's Valentine's Day
    if (distance < 0) {
      // Display the countdown
      clearInterval(x);
    } else {
      displayCountdown(countdownElement, distance);
      // Remove the countdown
      countdownElementUtama.remove();
    }
  }, 1000);

  function displayCountdown(element, distance) {
    // Calculate days, hours, minutes, and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Display the countdown
    element.innerHTML = `
    <div class="container mt-5">
        <h1 class="text-info text-center">Valentine Belum Mulai Sukreniii</h1>
        <h5 class="text-danger">Valentine lagi:</h5>
        <div class="text-danger">${days}hari ${hours}jam ${minutes}menit ${seconds}detik</div>
    </div>
      `;
  }
});
