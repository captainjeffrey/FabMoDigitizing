


$(document).ready(function () {



 
    $("#PZ_btn").click(function () {
        console.log('M3 1.0...');
        sendCmd("M3, 1.0, 1.0, 9.0");
    });

    $("#cmd_button2").click(function () {
        console.log('got second cmd');
        sendCmd("ZZ");
    });

    

})


