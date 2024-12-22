document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const kvkkCheckbox = document.getElementById('kvkk')
    if(!kvkkCheckbox.checked){
        alert("You must agree to the KVKK terms and conditions to register.")
        return;
    }

    const userData = {
        name: document.getElementById('name').value,
        surname: document.getElementById('surname').value,
        phoneNumber: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        gender: document.getElementById('gender').value,
        bloodType: document.getElementById('bloodType').value,
        birthDate: document.getElementById('birthDate').value,
        TCNumber: document.getElementById('tcNo').value,
        hasUserAppliedKVKK: kvkkCheckbox.checked
    };

    fetch('http://localhost:8090/v1/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);

        alert('Registration successful!');

        // redirect to login page after success
        window.location.href = 'login.html';
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});