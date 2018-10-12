$(document).ready(function(){

  // Update all times on comments using Moment, 
  // saying how long ago the comment was posted.
  $(".comment-time").each(function(i, element) {
    const commentTime = $(element).text();
    let ago = moment(commentTime).fromNow();
    $(this).text(ago);
  })


  $("#add-comment").on("submit", function(event) {
    event.preventDefault();

    // Get the path to post to, then post the comment body.
    var url = $("#add-comment").data("url");
    $.ajax(url, {
      type: "POST",
      data: {
        body: $("#comment-body").val().trim()
      }
    }).done(function(data) {
      location.reload();
    })
  })

  // Delete comment button is clicked...
  $(".delete-comment").on("click", function(event) {
    event.preventDefault();

    const commentId = $(this).data("id");

    $.ajax("/comments/" + commentId, {
      type: "DELETE"
    })
    .done(function(data) {
      location.reload();
    })
  })



})