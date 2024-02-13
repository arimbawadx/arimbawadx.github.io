document.addEventListener("DOMContentLoaded", function () {
  // Array of image URLs or video URLs
  var mediaList = [
    "1.jpg",
    "2.jpg",
    "3.jpg",
    "4.jpg",
    "5.jpg",
    "6.jpg",
    "7.jpg",
    "8.jpg",
  ];

  var slideshowContainer = document.getElementById("slideshow-container");
  var slideshowElement = document.getElementById("slideshow");

  // Load media items
  mediaList.forEach(function (mediaUrl) {
    var mediaItem = document.createElement("div");
    mediaItem.className = "slideshow-item";
    mediaItem.innerHTML = createMediaElement(mediaUrl);
    slideshowElement.appendChild(mediaItem);
  });

  var currentIndex = 0;
  var totalMedia = mediaList.length;

  // Function to create the appropriate HTML for media element (image or video)
  // Function to create the appropriate HTML for media element (image or video)
  function createMediaElement(url) {
    if (url.endsWith(".mp4") || url.endsWith(".webm")) {
      // Video element
      return `<video controls muted loop class="media-item" style="max-width: 100%; height: auto;"><source src="${url}" type="video/mp4"></video>`;
    } else {
      // Image element
      return `<img src="${url}" alt="Slideshow Image" class="media-item" style="width: 100%; height: auto; object-fit: contain;">`;
    }
  }
  // Function to show the next media item in the slideshow
  function showNextMedia() {
    if (currentIndex < totalMedia - 1) {
      currentIndex++;
    } else {
      currentIndex = 0; // Restart from the beginning
    }
    updateSlideshow();
  }

  // Function to update the slideshow with the current media item
  function updateSlideshow() {
    var translateValue = -currentIndex * 100 + "%";
    slideshowElement.style.transform = `translateX(${translateValue})`;
  }

  // Automatic slideshow every 3 seconds
  setInterval(showNextMedia, 3000);
});
