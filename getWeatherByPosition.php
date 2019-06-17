<?php
$lat =$_REQUEST['lat'];
$long =$_REQUEST['long'];
$API_KEY="---MY API KEY---"; //https://darksky.net/dev/account
$curl = curl_init();

curl_setopt_array($curl, array(
    CURLOPT_URL => "https://api.darksky.net/forecast/$API_KEY/$lat,$long",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => "",
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => "GET",
    CURLOPT_HTTPHEADER => array(
        "Accept: */*",
        "Cache-Control: no-cache",
        "Connection: keep-alive",
        "Host: api.darksky.net",
        "cache-control: no-cache"
    ),
));

$resp = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
    echo "cURL Error #:" . $err;
} else {
    echo $resp;
}