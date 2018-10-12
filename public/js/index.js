// Scrape button is clicked...
$("#scrape-button").on("click", function(event) {
  event.preventDefault();

  // Do get request on /scrape, then reload page.
  $.ajax("/scrape", {
    type: "GET"
  })
  .done(function(data) {
    location.reload();
  })
})