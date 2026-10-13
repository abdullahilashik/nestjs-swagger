<?php
echo "<h1>LEMP Stack is Working!</h1>";

$host = 'mysql';
$db   = 'exampledb';
$user = 'user';
$pass = 'userpassword';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
echo "<p>Connected to MySQL successfully!</p>";

$conn->close();
?>
