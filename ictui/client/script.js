document.addEventListener('DOMContentLoaded', function () {
    var userForm = document.getElementById('userForm');

    userForm.addEventListener('submit', function(event) {
        event.preventDefault();

        var name = document.getElementById('name').value;
        var email = document.getElementById('email').value;
        var age = document.getElementById('age').value;
        var weight = document.getElementById('weight').value;
        var height = document.getElementById('height').value;
        var city = document.getElementById('city').value;
        var district = document.getElementById('district').value;

        localStorage.setItem('userInfo', JSON.stringify({
            name: name,
            email: email,
            age: age,
            weight: weight,
            height: height,
            city: city,
            district: district
        }));

        window.location.href = 'chatbot.html';
    });
});
