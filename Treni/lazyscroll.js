document.addEventListener("DOMContentLoaded", function () {
  var lazyContainer = document.getElementById("lazy-container");
  var images = [];

  for (var i = 1; i <= 30; i++) {
    images.push(`media/scroll/img (${i}).jpg`);
  }

  var imageIndex = 0;

  function loadNextImage() {
    if (imageIndex < images.length) {
      var imgElement = document.createElement("img");
      imgElement.src = images[imageIndex];
      imgElement.alt = "Lazy Image " + (imageIndex + 1);
      imgElement.classList.add("lazy-image");

      lazyContainer.appendChild(imgElement);
      imageIndex++;
    }
  }

  function handleScroll() {
    if (
      lazyContainer.getBoundingClientRect().bottom <=
      window.innerHeight + 100
    ) {
      loadNextImage();
    }
  }

  // Initial load
  loadNextImage();

  // Event listener for scrolling
  window.addEventListener("scroll", handleScroll);
});
