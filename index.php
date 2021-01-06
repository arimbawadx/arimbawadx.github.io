<!doctype html>
<html lang="en">
  <head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
    <script src='https://kit.fontawesome.com/a076d05399.js'></script>

    <title>Yoga Arimbawa | My Portfolio</title>
    <style>
      /* Stackoverflow preview fix, please ignore */
      .navbar-nav {
        flex-direction: row;
      }
      
      .nav-link {
        padding-right: .5rem !important;
        padding-left: .5rem !important;
      }
      
      /* Fixes dropdown menus placed on the right side */
      .ml-auto .dropdown-menu {
        left: auto !important;
        right: 0px;
      }
    </style>
  </head>
  <body class="p-3 mb-2 bg-dark text-white">
    <!-- navbar -->
    <div class="container">
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <a class="navbar-brand" href="#"><strong>My Portfolio</strong></a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav ml-auto">
            <li class="nav-item active">
              <a class="nav-link" href="#">Project</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">Certificates</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="https://arimbawadx.github.io/myCV">My CV</a>
            </li>
            
          </ul>
          
        </div>
      </nav>
    </div>
    <!-- endnavbar -->

    <!-- jumbotron -->
    <div class="container">
      <div class="jumbotron bg-dark">
        <div class="row">
          <div class="col-md-8">
            <h1 class="display-4">Hi, <?php
                                      date_default_timezone_set('Asia/Jakarta');
                                        /* This sets the $time variable to the current hour in the 24 hour clock format */
                                        $time = date("H");
                                        /* Set the $timezone variable to become the current timezone */
                                        $timezone = date("e");
                                        /* If the time is less than 1200 hours, show good morning */
                                        if ($time < "12") {
                                            echo "Good Morning!";
                                        } else
                                        /* If the time is grater than or equal to 1200 hours, but less than 1700 hours, so good afternoon */
                                        if ($time >= "12" && $time < "17") {
                                            echo "Good Afternoon!";
                                        } else
                                        /* Should the time be between or equal to 1700 and 1900 hours, show good evening */
                                        if ($time >= "17" && $time < "19") {
                                            echo "Good Evening!";
                                        } else
                                        /* Finally, show good night if the time is greater than or equal to 1900 hours */
                                        if ($time >= "19") {
                                            echo "Good Night!";
                                        }
                                        ?> </h1>

                                        <hr style="border: 1px solid white">

            <h2 class="display-8">I'm I Made Yoga Arimbawa</h2>

            <div class="bg-light" style="width: 135px; margin-top: 10px; margin-bottom: 20px; padding: 3px;  padding-left: 20px; padding-right: 20px">
              <a style="text-decoration: none; color: black;" href=""><i style="padding-right: 20px;" class='fab fa-whatsapp fa-1x'></i></a>
              <a style="text-decoration: none; color: black;" href=""><i style="padding-right: 20px" class='far fa-envelope fa-1x'></i></a>  
              <a style="text-decoration: none; color: black;" href=""><i class='fab fa-instagram fa-1x'></i></a>  
            </div>

          </div>

          <div class="col-md-4">
            <img style="border: 1px solid;" class="rounded-circle" width="250px" src="assets/img/profil.png">
          </div>
        </div>
      </div>
    </div>
    <!-- endjumbotron -->

    <!-- Optional JavaScript -->
    <!-- jQuery first, then Popper.js, then Bootstrap JS -->
    <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
  </body>
</html>